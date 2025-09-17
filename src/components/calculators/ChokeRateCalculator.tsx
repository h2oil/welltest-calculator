import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, RotateCcw, Info, AlertTriangle, CheckCircle } from 'lucide-react';

import { calculateChokeRate } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import type { ChokeInputs, ChokeOutputs, UnitSystem, FluidType } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const ChokeRateCalculator = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<ChokeInputs>({
    chokeDiameter: 0.0254, // 1 inch in meters
    upstreamPressure: 3000, // kPa
    downstreamPressure: 1000, // kPa
    temperature: 60, // °C
    dischargeCoeff: 0.82,
    fluidType: 'gas',
    gasProperties: {
      k: 1.3,
      MW: 18.2,
      Z: 1.0
    },
    liquidDensity: 800, // kg/m³
    liquidViscosity: 0.001 // Pa·s
  });

  const [outputs, setOutputs] = useState<ChokeOutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      try {
        const result = calculateChokeRate(inputs);
        setOutputs(result);
      } catch (error) {
        setOutputs(null);
      }
    }
  }, [inputs]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (inputs.chokeDiameter <= 0) newErrors.chokeDiameter = 'Choke diameter must be positive';
    if (inputs.upstreamPressure <= 0) newErrors.upstreamPressure = 'Upstream pressure must be positive';
    if (inputs.downstreamPressure <= 0) newErrors.downstreamPressure = 'Downstream pressure must be positive';
    if (inputs.downstreamPressure >= inputs.upstreamPressure) {
      newErrors.downstreamPressure = 'Downstream pressure must be less than upstream pressure';
    }
    if (inputs.dischargeCoeff <= 0 || inputs.dischargeCoeff > 1) {
      newErrors.dischargeCoeff = 'Discharge coefficient must be between 0 and 1';
    }

    if (inputs.fluidType === 'liquid') {
      if (!inputs.liquidDensity || inputs.liquidDensity <= 0) {
        newErrors.liquidDensity = 'Liquid density must be positive';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ChokeInputs, value: string | number) => {
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
      const success = await copyResultsToClipboard(outputs, 'Choke Rate Estimates');
      toast({
        title: success ? "Results Copied" : "Copy Failed",
        description: success ? "Results copied to clipboard" : "Failed to copy results",
        variant: success ? "default" : "destructive",
      });
    }
  };

  const handleReset = () => {
    setInputs({
      chokeDiameter: 0.0254,
      upstreamPressure: 3000,
      downstreamPressure: 1000,
      temperature: 60,
      dischargeCoeff: 0.82,
      fluidType: 'gas',
      gasProperties: {
        k: 1.3,
        MW: 18.2,
        Z: 1.0
      },
      liquidDensity: 800,
      liquidViscosity: 0.001
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
        case 'viscosity': return 'Pa·s';
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
        case 'viscosity': return 'cp';
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
        <h2 className="text-2xl font-bold">Choke Rate Estimates</h2>
        <p className="text-muted-foreground">
          Estimate flow across a choke for gas or liquid. Handles choked vs subcritical flow regimes.
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
            {/* Choke Geometry */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Choke Geometry</h4>
              
              <div className="space-y-2">
                <Label htmlFor="chokeDiameter" className="flex items-center space-x-1">
                  <span>Choke Diameter</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Internal diameter of the choke restriction</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <Input
                    id="chokeDiameter"
                    type="number"
                    step="0.001"
                    value={inputs.chokeDiameter}
                    onChange={(e) => handleInputChange('chokeDiameter', parseFloat(e.target.value) || 0)}
                    className={errors.chokeDiameter ? 'border-destructive' : ''}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {getUnitLabel('diameter')}
                  </span>
                </div>
                {errors.chokeDiameter && <p className="text-xs text-destructive">{errors.chokeDiameter}</p>}
              </div>
            </div>

            {/* Pressure Conditions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pressure Conditions</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upstreamPressure">Upstream Pressure (P₀)</Label>
                  <div className="relative">
                    <Input
                      id="upstreamPressure"
                      type="number"
                      step="10"
                      value={inputs.upstreamPressure}
                      onChange={(e) => handleInputChange('upstreamPressure', parseFloat(e.target.value) || 0)}
                      className={errors.upstreamPressure ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {getUnitLabel('pressure')}
                    </span>
                  </div>
                  {errors.upstreamPressure && <p className="text-xs text-destructive">{errors.upstreamPressure}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="downstreamPressure">Downstream Pressure (P₂)</Label>
                  <div className="relative">
                    <Input
                      id="downstreamPressure"
                      type="number"
                      step="10"
                      value={inputs.downstreamPressure}
                      onChange={(e) => handleInputChange('downstreamPressure', parseFloat(e.target.value) || 0)}
                      className={errors.downstreamPressure ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {getUnitLabel('pressure')}
                    </span>
                  </div>
                  {errors.downstreamPressure && <p className="text-xs text-destructive">{errors.downstreamPressure}</p>}
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pressure Ratio (P₂/P₀)</span>
                  <span className="text-sm font-mono">
                    {(inputs.downstreamPressure / inputs.upstreamPressure).toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Flow Conditions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Flow Conditions</h4>
              
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (T₀)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="dischargeCoeff" className="flex items-center space-x-1">
                  <span>Discharge Coefficient (Cd)</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Typical range: 0.8-0.85 for chokes</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="dischargeCoeff"
                  type="number"
                  step="0.01"
                  value={inputs.dischargeCoeff}
                  onChange={(e) => handleInputChange('dischargeCoeff', parseFloat(e.target.value) || 0.82)}
                  className={errors.dischargeCoeff ? 'border-destructive' : ''}
                />
                {errors.dischargeCoeff && <p className="text-xs text-destructive">{errors.dischargeCoeff}</p>}
              </div>
            </div>

            {/* Fluid Properties */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Fluid Properties</h4>
              
              <div className="space-y-2">
                <Label>Flowing Fluid</Label>
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

              {inputs.fluidType === 'liquid' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="liquidDensity">Liquid Density (ρ)</Label>
                    <div className="relative">
                      <Input
                        id="liquidDensity"
                        type="number"
                        step="10"
                        value={inputs.liquidDensity}
                        onChange={(e) => handleInputChange('liquidDensity', parseFloat(e.target.value) || 800)}
                        className={errors.liquidDensity ? 'border-destructive' : ''}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {getUnitLabel('density')}
                      </span>
                    </div>
                    {errors.liquidDensity && <p className="text-xs text-destructive">{errors.liquidDensity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liquidViscosity">Viscosity (μ) - Optional</Label>
                    <div className="relative">
                      <Input
                        id="liquidViscosity"
                        type="number"
                        step="0.0001"
                        value={inputs.liquidViscosity}
                        onChange={(e) => handleInputChange('liquidViscosity', parseFloat(e.target.value) || 0.001)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {getUnitLabel('viscosity')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Flow rate estimates and regime analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outputs ? (
              <>
                {/* Flow Regime Indicator */}
                <div className={`p-4 rounded-lg border-2 ${
                  outputs.flowRegime === 'CHOKED' 
                    ? 'bg-warning/10 border-warning/50' 
                    : 'bg-success/10 border-success/50'
                }`}>
                  <div className="flex items-center space-x-2">
                    {outputs.flowRegime === 'CHOKED' ? (
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    <div>
                      <p className="font-semibold">{outputs.flowRegime} FLOW</p>
                      <p className="text-sm text-muted-foreground">
                        {outputs.flowRegime === 'CHOKED' 
                          ? 'Critical flow conditions - sonic velocity at throat'
                          : 'Subcritical flow conditions'
                        }
                      </p>
                    </div>
                  </div>
                </div>

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

                  {inputs.fluidType === 'gas' && (
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Standard Flow</span>
                        <span className="text-lg font-mono">{outputs.standardFlow.toFixed(3)} {getUnitLabel('flow_std')}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mach Number at Throat</span>
                      <span className="text-sm font-mono">{outputs.machNumber.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

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

export default ChokeRateCalculator;