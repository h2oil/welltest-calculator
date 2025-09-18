import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings
} from 'lucide-react';

import { OpenProsperEngine } from '@/lib/open-prosper-engine';
import type { IPRModel, Fluid, UnitSystem, IPRResult } from '@/types/open-prosper';

interface IPRModuleProps {
  ipr: IPRModel | undefined;
  fluid: Fluid | undefined;
  unitSystem: UnitSystem;
  onUpdate: (ipr: IPRModel) => void;
}

export const IPRModule: React.FC<IPRModuleProps> = ({
  ipr,
  fluid,
  unitSystem,
  onUpdate
}) => {
  const [localIPR, setLocalIPR] = useState<IPRModel>(
    ipr || {
      type: 'vogel',
      parameters: {
        reservoir_pressure: 2000,
        skin: 0,
        permeability: 100,
        thickness: 50,
        drainage_radius: 1000,
        wellbore_radius: 0.25,
        bubble_point_pressure: 1000,
        pi: 1.0
      }
    }
  );

  const [iprResult, setIPRResult] = useState<IPRResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (ipr) {
      setLocalIPR(ipr);
    }
  }, [ipr]);

  const handleIPRUpdate = (updates: Partial<IPRModel>) => {
    const updatedIPR = { ...localIPR, ...updates };
    setLocalIPR(updatedIPR);
    onUpdate(updatedIPR);
  };

  const handleParameterUpdate = (parameter: string, value: number) => {
    const updatedParameters = { ...localIPR.parameters, [parameter]: value };
    handleIPRUpdate({ parameters: updatedParameters });
  };

  const calculateIPR = async () => {
    if (!fluid) {
      setErrors(['Fluid properties are required for IPR calculation']);
      return;
    }

    setIsCalculating(true);
    setErrors([]);

    try {
      const { IPRCalculator } = OpenProsperEngine;
      
      // Generate rate array
      const maxRate = 1000; // m³/d
      const rates = Array.from({ length: 50 }, (_, i) => (i / 49) * maxRate);
      
      const result = IPRCalculator.calculateIPR(localIPR, fluid, rates, unitSystem);
      setIPRResult(result);
    } catch (error) {
      setErrors([`IPR calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsCalculating(false);
    }
  };

  const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psi';
  const getLengthUnit = () => unitSystem === 'metric' ? 'm' : 'ft';
  const getPermeabilityUnit = () => 'md';
  const getFlowRateUnit = () => unitSystem === 'metric' ? 'm³/d' : 'bbl/d';
  const getProductivityUnit = () => unitSystem === 'metric' ? 'm³/d/kPa' : 'bbl/d/psi';

  const getIPRDescription = (type: string) => {
    const descriptions: { [key: string]: string } = {
      'vogel': 'Vogel IPR - For undersaturated oil wells with bubble point pressure',
      'fetkovich': 'Fetkovich IPR - For oil wells with back-pressure equation',
      'darcy-linear': 'Darcy Linear IPR - For linear flow in oil wells',
      'jones': 'Jones IPR - For oil wells with turbulence effects',
      'standing': 'Standing IPR - For oil wells with modified Vogel equation',
      'gas-deliverability': 'Gas Deliverability - For gas wells with back-pressure equation',
      'cullender-smith': 'Cullender-Smith - For gas wells with pseudo-pressure',
      'back-pressure': 'Back-Pressure - For gas wells with simplified equation'
    };
    return descriptions[type] || 'Unknown IPR model';
  };

  const getRequiredParameters = (type: string) => {
    const required: { [key: string]: string[] } = {
      'vogel': ['reservoir_pressure', 'bubble_point_pressure', 'pi'],
      'fetkovich': ['reservoir_pressure', 'pi', 'n'],
      'darcy-linear': ['reservoir_pressure', 'pi'],
      'jones': ['reservoir_pressure', 'pi', 'n'],
      'standing': ['reservoir_pressure', 'bubble_point_pressure', 'pi'],
      'gas-deliverability': ['reservoir_pressure', 'a', 'b', 'c', 'n'],
      'cullender-smith': ['reservoir_pressure', 'a', 'b', 'c', 'n'],
      'back-pressure': ['reservoir_pressure', 'a', 'b', 'c', 'n']
    };
    return required[type] || [];
  };

  const requiredParams = getRequiredParameters(localIPR.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            IPR Models (Reservoir Inflow)
          </h2>
          <p className="text-muted-foreground">
            Define inflow performance relationship models
          </p>
        </div>
        <Button onClick={calculateIPR} disabled={isCalculating || !fluid}>
          <Calculator className="h-4 w-4 mr-2" />
          {isCalculating ? 'Calculating...' : 'Calculate IPR'}
        </Button>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="model" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="model">Model Selection</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Model Selection */}
        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                IPR Model Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ipr-type">IPR Model Type</Label>
                <Select
                  value={localIPR.type}
                  onValueChange={(value: any) => handleIPRUpdate({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vogel">Vogel (Oil)</SelectItem>
                    <SelectItem value="fetkovich">Fetkovich (Oil)</SelectItem>
                    <SelectItem value="darcy-linear">Darcy Linear (Oil)</SelectItem>
                    <SelectItem value="jones">Jones (Oil)</SelectItem>
                    <SelectItem value="standing">Standing (Oil)</SelectItem>
                    <SelectItem value="gas-deliverability">Gas Deliverability</SelectItem>
                    <SelectItem value="cullender-smith">Cullender-Smith (Gas)</SelectItem>
                    <SelectItem value="back-pressure">Back-Pressure (Gas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Model Description</h4>
                <p className="text-sm text-muted-foreground">
                  {getIPRDescription(localIPR.type)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">Required Parameters</h4>
                <div className="flex flex-wrap gap-2">
                  {requiredParams.map((param) => (
                    <Badge key={param} variant="secondary">
                      {param.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parameters */}
        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                IPR Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Common Parameters */}
                <div className="space-y-2">
                  <Label htmlFor="reservoir-pressure">Reservoir Pressure</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reservoir-pressure"
                      type="number"
                      value={localIPR.parameters.reservoir_pressure}
                      onChange={(e) => handleParameterUpdate('reservoir_pressure', parseFloat(e.target.value) || 0)}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getPressureUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skin">Skin Factor</Label>
                  <Input
                    id="skin"
                    type="number"
                    value={localIPR.parameters.skin}
                    onChange={(e) => handleParameterUpdate('skin', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permeability">Permeability</Label>
                  <div className="flex gap-2">
                    <Input
                      id="permeability"
                      type="number"
                      value={localIPR.parameters.permeability}
                      onChange={(e) => handleParameterUpdate('permeability', parseFloat(e.target.value) || 0)}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getPermeabilityUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thickness">Formation Thickness</Label>
                  <div className="flex gap-2">
                    <Input
                      id="thickness"
                      type="number"
                      value={localIPR.parameters.thickness}
                      onChange={(e) => handleParameterUpdate('thickness', parseFloat(e.target.value) || 0)}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getLengthUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drainage-radius">Drainage Radius</Label>
                  <div className="flex gap-2">
                    <Input
                      id="drainage-radius"
                      type="number"
                      value={localIPR.parameters.drainage_radius}
                      onChange={(e) => handleParameterUpdate('drainage_radius', parseFloat(e.target.value) || 0)}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getLengthUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wellbore-radius">Wellbore Radius</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wellbore-radius"
                      type="number"
                      step="0.01"
                      value={localIPR.parameters.wellbore_radius}
                      onChange={(e) => handleParameterUpdate('wellbore_radius', parseFloat(e.target.value) || 0)}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getLengthUnit()}
                    </Badge>
                  </div>
                </div>

                {/* Oil-specific parameters */}
                {(localIPR.type === 'vogel' || localIPR.type === 'standing') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bubble-point">Bubble Point Pressure</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bubble-point"
                          type="number"
                          value={localIPR.parameters.bubble_point_pressure || 0}
                          onChange={(e) => handleParameterUpdate('bubble_point_pressure', parseFloat(e.target.value) || 0)}
                        />
                        <Badge variant="outline" className="px-3 py-2">
                          {getPressureUnit()}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pi">Productivity Index</Label>
                      <div className="flex gap-2">
                        <Input
                          id="pi"
                          type="number"
                          step="0.1"
                          value={localIPR.parameters.pi || 0}
                          onChange={(e) => handleParameterUpdate('pi', parseFloat(e.target.value) || 0)}
                        />
                        <Badge variant="outline" className="px-3 py-2">
                          {getProductivityUnit()}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}

                {/* Gas-specific parameters */}
                {(localIPR.type === 'gas-deliverability' || localIPR.type === 'cullender-smith' || localIPR.type === 'back-pressure') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="a-coefficient">A Coefficient</Label>
                      <Input
                        id="a-coefficient"
                        type="number"
                        step="0.01"
                        value={localIPR.parameters.a || 0}
                        onChange={(e) => handleParameterUpdate('a', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="b-coefficient">B Coefficient</Label>
                      <Input
                        id="b-coefficient"
                        type="number"
                        step="0.01"
                        value={localIPR.parameters.b || 0}
                        onChange={(e) => handleParameterUpdate('b', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="c-coefficient">C Coefficient</Label>
                      <Input
                        id="c-coefficient"
                        type="number"
                        step="0.01"
                        value={localIPR.parameters.c || 0}
                        onChange={(e) => handleParameterUpdate('c', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="n-exponent">N Exponent</Label>
                      <Input
                        id="n-exponent"
                        type="number"
                        step="0.01"
                        value={localIPR.parameters.n || 0}
                        onChange={(e) => handleParameterUpdate('n', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </>
                )}

                {/* Fetkovich/Jones parameters */}
                {(localIPR.type === 'fetkovich' || localIPR.type === 'jones') && (
                  <div className="space-y-2">
                    <Label htmlFor="n-exponent">N Exponent</Label>
                    <Input
                      id="n-exponent"
                      type="number"
                      step="0.01"
                      value={localIPR.parameters.n || 0}
                      onChange={(e) => handleParameterUpdate('n', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                IPR Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {iprResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{iprResult.max_rate.toFixed(1)}</div>
                      <p className="text-sm text-muted-foreground">Max Rate ({getFlowRateUnit()})</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{iprResult.max_pressure.toFixed(0)}</div>
                      <p className="text-sm text-muted-foreground">Max Pressure ({getPressureUnit()})</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{iprResult.rates.length}</div>
                      <p className="text-sm text-muted-foreground">Data Points</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-900">IPR Curve Generated</h4>
                    <p className="text-sm text-green-700">
                      Successfully calculated IPR curve with {iprResult.rates.length} points.
                      Maximum flow rate: {iprResult.max_rate.toFixed(1)} {getFlowRateUnit()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Click "Calculate IPR" to generate the inflow performance relationship curve
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Status */}
      {errors.length === 0 && fluid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            IPR model is ready for calculation
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
