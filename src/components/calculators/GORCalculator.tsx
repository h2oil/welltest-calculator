import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, RotateCcw, Info, AlertTriangle } from 'lucide-react';

import { calculateGOR } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import type { GORInputs, GOROutputs, UnitSystem } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const GORCalculator = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<GORInputs>({
    // Produced GOR
    gasRate: 1000000, // MSCFD
    oilRate: 1000, // STB/D
    
    // Standing correlation
    apiGravity: 35, // °API
    gasSpecificGravity: 0.7, // relative to air
    reservoirTemp: 200, // °F
    reservoirPressure: 3000 // psia
  });

  const [outputs, setOutputs] = useState<GOROutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('produced');

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      try {
        const result = calculateGOR(inputs);
        setOutputs(result);
      } catch (error) {
        setOutputs(null);
      }
    }
  }, [inputs]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Produced GOR validation
    if (activeTab === 'produced' || (inputs.gasRate && inputs.oilRate)) {
      if (!inputs.gasRate || inputs.gasRate <= 0) newErrors.gasRate = 'Gas rate must be positive';
      if (!inputs.oilRate || inputs.oilRate <= 0) newErrors.oilRate = 'Oil rate must be positive';
    }

    // Standing correlation validation
    if (activeTab === 'standing' || (inputs.apiGravity && inputs.gasSpecificGravity && inputs.reservoirTemp && inputs.reservoirPressure)) {
      if (!inputs.apiGravity || inputs.apiGravity <= 0 || inputs.apiGravity > 60) {
        newErrors.apiGravity = 'API gravity must be between 0 and 60';
      }
      if (!inputs.gasSpecificGravity || inputs.gasSpecificGravity <= 0 || inputs.gasSpecificGravity > 2) {
        newErrors.gasSpecificGravity = 'Gas specific gravity must be between 0 and 2';
      }
      if (!inputs.reservoirTemp || inputs.reservoirTemp <= 0) {
        newErrors.reservoirTemp = 'Reservoir temperature must be positive';
      }
      if (!inputs.reservoirPressure || inputs.reservoirPressure <= 0) {
        newErrors.reservoirPressure = 'Reservoir pressure must be positive';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof GORInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyResults = async () => {
    if (outputs) {
      const success = await copyResultsToClipboard(outputs, 'GOR² Calcs');
      toast({
        title: success ? "Results Copied" : "Copy Failed", 
        description: success ? "Results copied to clipboard" : "Failed to copy results",
        variant: success ? "default" : "destructive",
      });
    }
  };

  const handleReset = () => {
    setInputs({
      gasRate: 1000000,
      oilRate: 1000,
      apiGravity: 35,
      gasSpecificGravity: 0.7,
      reservoirTemp: 200,
      reservoirPressure: 3000
    });
    setOutputs(null);
    setErrors({});
  };

  // Unit labels based on system
  const getUnitLabel = (type: string) => {
    if (unitSystem === 'metric') {
      switch (type) {
        case 'gas_rate': return 'Sm³/d';
        case 'oil_rate': return 'Sm³/d';
        case 'temperature': return '°C';
        case 'pressure': return 'kPa';
        case 'gor': return 'Sm³/Sm³';
        default: return '';
      }
    } else {
      switch (type) {
        case 'gas_rate': return 'MSCFD';
        case 'oil_rate': return 'STB/D';
        case 'temperature': return '°F';
        case 'pressure': return 'psia';
        case 'gor': return 'scf/STB';
        default: return '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">GOR² Calculator</h2>
        <p className="text-muted-foreground">
          Calculate produced GOR and estimate solution GOR using Standing correlation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Inputs</span>
              <Badge variant="outline">{unitSystem === 'metric' ? 'Metric' : 'Field'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="produced">Produced GOR</TabsTrigger>
                <TabsTrigger value="standing">Standing Correlation</TabsTrigger>
              </TabsList>

              <TabsContent value="produced" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Production Rates</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gasRate" className="flex items-center space-x-1">
                      <span>Gas Rate (Q<sub>g,std</sub>)</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Standard gas production rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="relative">
                      <Input
                        id="gasRate"
                        type="number"
                        step="1000"
                        value={inputs.gasRate || ''}
                        onChange={(e) => handleInputChange('gasRate', parseFloat(e.target.value) || undefined)}
                        className={errors.gasRate ? 'border-destructive' : ''}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {getUnitLabel('gas_rate')}
                      </span>
                    </div>
                    {errors.gasRate && <p className="text-xs text-destructive">{errors.gasRate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oilRate" className="flex items-center space-x-1">
                      <span>Oil Rate (Q<sub>o,std</sub>)</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Standard oil production rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="relative">
                      <Input
                        id="oilRate"
                        type="number"
                        step="10"
                        value={inputs.oilRate || ''}
                        onChange={(e) => handleInputChange('oilRate', parseFloat(e.target.value) || undefined)}
                        className={errors.oilRate ? 'border-destructive' : ''}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {getUnitLabel('oil_rate')}
                      </span>
                    </div>
                    {errors.oilRate && <p className="text-xs text-destructive">{errors.oilRate}</p>}
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Formula:</strong> GOR = Q<sub>g,std</sub> / Q<sub>o,std</sub>
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="standing" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Reservoir Properties</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiGravity" className="flex items-center space-x-1">
                        <span>API Gravity</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>API gravity of the oil (degrees API)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="relative">
                        <Input
                          id="apiGravity"
                          type="number"
                          step="0.1"
                          value={inputs.apiGravity || ''}
                          onChange={(e) => handleInputChange('apiGravity', parseFloat(e.target.value) || undefined)}
                          className={errors.apiGravity ? 'border-destructive' : ''}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          °API
                        </span>
                      </div>
                      {errors.apiGravity && <p className="text-xs text-destructive">{errors.apiGravity}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gasSpecificGravity" className="flex items-center space-x-1">
                        <span>Gas Specific Gravity</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gas specific gravity relative to air (γ<sub>g</sub>)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="relative">
                        <Input
                          id="gasSpecificGravity"
                          type="number"
                          step="0.01"
                          value={inputs.gasSpecificGravity || ''}
                          onChange={(e) => handleInputChange('gasSpecificGravity', parseFloat(e.target.value) || undefined)}
                          className={errors.gasSpecificGravity ? 'border-destructive' : ''}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          (air=1)
                        </span>
                      </div>
                      {errors.gasSpecificGravity && <p className="text-xs text-destructive">{errors.gasSpecificGravity}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reservoirTemp">Reservoir Temperature</Label>
                      <div className="relative">
                        <Input
                          id="reservoirTemp"
                          type="number"
                          step="1"
                          value={inputs.reservoirTemp || ''}
                          onChange={(e) => handleInputChange('reservoirTemp', parseFloat(e.target.value) || undefined)}
                          className={errors.reservoirTemp ? 'border-destructive' : ''}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {getUnitLabel('temperature')}
                        </span>
                      </div>
                      {errors.reservoirTemp && <p className="text-xs text-destructive">{errors.reservoirTemp}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reservoirPressure">Reservoir Pressure</Label>
                      <div className="relative">
                        <Input
                          id="reservoirPressure"
                          type="number"
                          step="10"
                          value={inputs.reservoirPressure || ''}
                          onChange={(e) => handleInputChange('reservoirPressure', parseFloat(e.target.value) || undefined)}
                          className={errors.reservoirPressure ? 'border-destructive' : ''}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {getUnitLabel('pressure')}
                        </span>
                      </div>
                      {errors.reservoirPressure && <p className="text-xs text-destructive">{errors.reservoirPressure}</p>}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Standing Correlation:</strong>
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
                      Rs = γg × (P/18.2 + 1.4) × 10^(0.0125×API - 0.00091×T)
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>GOR calculations and analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outputs ? (
              <>
                {/* Produced GOR */}
                {outputs.producedGOR !== undefined && (
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Produced GOR</span>
                      <span className="text-lg font-mono">{outputs.producedGOR.toFixed(1)} {getUnitLabel('gor')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gas-to-oil ratio from production rates
                    </p>
                  </div>
                )}

                {/* Solution GOR */}
                {outputs.solutionGOR !== undefined && (
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Solution GOR (Rs)</span>
                      <span className="text-lg font-mono">{outputs.solutionGOR.toFixed(1)} {getUnitLabel('gor')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Standing correlation estimate
                    </p>
                  </div>
                )}

                {/* Bubble Point Pressure */}
                {outputs.bubblePointPressure !== undefined && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estimated Bubble Point Pressure</span>
                      <span className="text-sm font-mono">{outputs.bubblePointPressure.toFixed(1)} {getUnitLabel('pressure')}</span>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {outputs.warnings.length > 0 && (
                  <Alert className="border-warning/50 bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {outputs.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Notes */}
                {outputs.notes.length > 0 && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Notes</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {outputs.notes.map((note, index) => (
                        <li key={index}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Information */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Assumptions</h5>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Units: {unitSystem === 'metric' ? 'Metric (Sm³/Sm³)' : 'Field (scf/STB)'}</li>
                    {activeTab === 'standing' && (
                      <>
                        <li>• Standing correlation valid for undersaturated oil</li>
                        <li>• Temperature range: 74-240°F (23-116°C)</li>
                        <li>• Pressure range: 130-7000 psia (900-48,300 kPa)</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4 border-t border-border">
                  <Button onClick={handleCopyResults} size="sm" variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Results
                  </Button>
                  <Button onClick={handleReset} size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Enter valid inputs to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GORCalculator;