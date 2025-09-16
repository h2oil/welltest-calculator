import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, RotateCcw, FileDown, Info, AlertTriangle } from 'lucide-react';

import { calculateDanielOrifice } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import type { DanielOrificeInputs, DanielOrificeOutputs, UnitSystem, FluidType } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const DanielOrificeCalculator = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<DanielOrificeInputs>({
    pipeID: 0.1016, // 4 inches in meters
    orificeD: 0.0508, // 2 inches in meters
    deltaP: 10, // kPa
    density: 1.2, // kg/m³
    pressure: 3000, // kPa
    temperature: 20, // °C
    dischargeCoeff: 0.6,
    fluidType: 'gas',
    autoCalculateDensity: true,
    gasProperties: {
      k: 1.3,
      MW: 18.2,
      Z: 1.0
    }
  });

  const [outputs, setOutputs] = useState<DanielOrificeOutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate beta when diameters change
  useEffect(() => {
    if (inputs.pipeID > 0 && inputs.orificeD > 0) {
      const beta = inputs.orificeD / inputs.pipeID;
      setInputs(prev => ({ ...prev, beta }));
    }
  }, [inputs.pipeID, inputs.orificeD]);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      try {
        const result = calculateDanielOrifice(inputs);
        setOutputs(result);
      } catch (error) {
        setOutputs(null);
      }
    }
  }, [inputs]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (inputs.pipeID <= 0) newErrors.pipeID = 'Pipe ID must be positive';
    if (inputs.orificeD <= 0) newErrors.orificeD = 'Orifice diameter must be positive';
    if (inputs.orificeD >= inputs.pipeID) newErrors.orificeD = 'Orifice diameter must be less than pipe ID';
    if (inputs.deltaP <= 0) newErrors.deltaP = 'Differential pressure must be positive';
    if (inputs.pressure <= 0) newErrors.pressure = 'Line pressure must be positive';
    if (inputs.dischargeCoeff <= 0 || inputs.dischargeCoeff > 1) newErrors.dischargeCoeff = 'Discharge coefficient must be between 0 and 1';

    if (!inputs.autoCalculateDensity && (!inputs.density || inputs.density <= 0)) {
      newErrors.density = 'Density must be positive when not auto-calculated';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof DanielOrificeInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleGasPropertyChange = (field: keyof typeof inputs.gasProperties, value: number) => {
    setInputs(prev => ({
      ...prev,
      gasProperties: { ...prev.gasProperties, [field]: value }
    }));
  };

  const handleCopyResults = async () => {
    if (outputs) {
      const success = await copyResultsToClipboard(outputs, 'Daniel Orifice Calc');
      toast({
        title: success ? "Results Copied" : "Copy Failed",
        description: success ? "Results copied to clipboard" : "Failed to copy results",
        variant: success ? "default" : "destructive",
      });
    }
  };

  const handleReset = () => {
    setInputs({
      pipeID: 0.1016,
      orificeD: 0.0508,
      deltaP: 10,
      density: 1.2,
      pressure: 3000,
      temperature: 20,
      dischargeCoeff: 0.6,
      fluidType: 'gas',
      autoCalculateDensity: true,
      gasProperties: {
        k: 1.3,
        MW: 18.2,
        Z: 1.0
      }
    });
    setOutputs(null);
    setErrors({});
  };

  // Unit labels based on system
  const getUnitLabel = (type: string) => {
    if (unitSystem === 'metric') {
      switch (type) {
        case 'diameter': return 'mm';
        case 'pressure': return 'kPa';
        case 'temperature': return '°C';
        case 'density': return 'kg/m³';
        case 'flow_mass': return 'kg/s';
        case 'flow_vol': return 'm³/s';
        case 'flow_std': return 'MMSCFD';
        default: return '';
      }
    } else {
      switch (type) {
        case 'diameter': return 'in';
        case 'pressure': return 'psia';
        case 'temperature': return '°F';
        case 'density': return 'lbm/ft³';
        case 'flow_mass': return 'lbm/s';
        case 'flow_vol': return 'ft³/s';
        case 'flow_std': return 'MMSCFD';
        default: return '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Daniel Orifice Calculator</h2>
        <p className="text-muted-foreground">
          Compute mass flow through an orifice plate per ISO-style equation
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
            {/* Pipe Geometry */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pipe Geometry</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pipeID" className="flex items-center space-x-1">
                    <span>Pipe ID</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Internal diameter of the pipe</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="relative">
                    <Input
                      id="pipeID"
                      type="number"
                      step="0.001"
                      value={inputs.pipeID}
                      onChange={(e) => handleInputChange('pipeID', parseFloat(e.target.value) || 0)}
                      className={errors.pipeID ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {getUnitLabel('diameter')}
                    </span>
                  </div>
                  {errors.pipeID && <p className="text-xs text-destructive">{errors.pipeID}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orificeD" className="flex items-center space-x-1">
                    <span>Orifice d</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Diameter of the orifice opening</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="relative">
                    <Input
                      id="orificeD"
                      type="number"
                      step="0.001"
                      value={inputs.orificeD}
                      onChange={(e) => handleInputChange('orificeD', parseFloat(e.target.value) || 0)}
                      className={errors.orificeD ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {getUnitLabel('diameter')}
                    </span>
                  </div>
                  {errors.orificeD && <p className="text-xs text-destructive">{errors.orificeD}</p>}
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Beta Ratio (β)</span>
                  <span className="text-sm font-mono">{inputs.beta?.toFixed(4) || '0.0000'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Auto-calculated: d/D</p>
              </div>
            </div>

            {/* Flow Conditions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Flow Conditions</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deltaP">Differential Pressure (ΔP)</Label>
                  <div className="relative">
                    <Input
                      id="deltaP"
                      type="number"
                      step="0.1"
                      value={inputs.deltaP}
                      onChange={(e) => handleInputChange('deltaP', parseFloat(e.target.value) || 0)}
                      className={errors.deltaP ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {getUnitLabel('pressure')}
                    </span>
                  </div>
                  {errors.deltaP && <p className="text-xs text-destructive">{errors.deltaP}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pressure">Line Pressure (P₁)</Label>
                  <div className="relative">
                    <Input
                      id="pressure"
                      type="number"
                      step="10"
                      value={inputs.pressure}
                      onChange={(e) => handleInputChange('pressure', parseFloat(e.target.value) || 0)}
                      className={errors.pressure ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {getUnitLabel('pressure')}
                    </span>
                  </div>
                  {errors.pressure && <p className="text-xs text-destructive">{errors.pressure}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <div className="relative">
                  <Input
                    id="temperature"
                    type="number"
                    step="1"
                    value={inputs.temperature}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {getUnitLabel('temperature')}
                  </span>
                </div>
              </div>
            </div>

            {/* Fluid Properties */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Fluid Properties</h4>
              
              <div className="space-y-2">
                <Label>Fluid Type</Label>
                <Select value={inputs.fluidType} onValueChange={(value: FluidType) => handleInputChange('fluidType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="liquid">Liquid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inputs.fluidType === 'gas' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={inputs.autoCalculateDensity}
                      onCheckedChange={(checked) => handleInputChange('autoCalculateDensity', checked)}
                    />
                    <Label className="text-sm">Auto-calculate density from gas properties</Label>
                  </div>

                  {inputs.autoCalculateDensity && (
                    <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-xs">k (Cp/Cv)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={inputs.gasProperties.k}
                          onChange={(e) => handleGasPropertyChange('k', parseFloat(e.target.value) || 1.3)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">MW (kg/kmol)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={inputs.gasProperties.MW}
                          onChange={(e) => handleGasPropertyChange('MW', parseFloat(e.target.value) || 18.2)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Z Factor</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={inputs.gasProperties.Z}
                          onChange={(e) => handleGasPropertyChange('Z', parseFloat(e.target.value) || 1.0)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {!inputs.autoCalculateDensity && (
                <div className="space-y-2">
                  <Label htmlFor="density">Fluid Density</Label>
                  <div className="relative">
                    <Input
                      id="density"
                      type="number"
                      step="0.1"
                      value={inputs.density}
                      onChange={(e) => handleInputChange('density', parseFloat(e.target.value) || 0)}
                      className={errors.density ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {getUnitLabel('density')}
                    </span>
                  </div>
                  {errors.density && <p className="text-xs text-destructive">{errors.density}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dischargeCoeff" className="flex items-center space-x-1">
                  <span>Discharge Coefficient (C)</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Typical range: 0.595-0.61 for standard orifice plates</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="dischargeCoeff"
                  type="number"
                  step="0.001"
                  value={inputs.dischargeCoeff}
                  onChange={(e) => handleInputChange('dischargeCoeff', parseFloat(e.target.value) || 0.6)}
                  className={errors.dischargeCoeff ? 'border-destructive' : ''}
                />
                {errors.dischargeCoeff && <p className="text-xs text-destructive">{errors.dischargeCoeff}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Calculated flow parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outputs ? (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Mass Flow Rate</span>
                      <span className="text-lg font-mono">{outputs.massFlow.toFixed(3)} {getUnitLabel('flow_mass')}</span>
                    </div>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Volumetric Flow (Actual)</span>
                      <span className="text-lg font-mono">{outputs.volumetricFlow.toFixed(3)} {getUnitLabel('flow_vol')}</span>
                    </div>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Standard Flow</span>
                      <span className="text-lg font-mono">{outputs.standardFlow.toFixed(3)} {getUnitLabel('flow_std')}</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reynolds Number</span>
                      <span className="text-sm font-mono">{outputs.reynoldsNumber.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

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

                {/* Assumptions */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Assumptions</h5>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {outputs.assumptions.map((assumption, index) => (
                      <li key={index}>• {assumption}</li>
                    ))}
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

export default DanielOrificeCalculator;