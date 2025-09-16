import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, RotateCcw, Info, AlertTriangle, CheckCircle } from 'lucide-react';

import { calculateCriticalFlow } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import type { CriticalFlowInputs, CriticalFlowOutputs, UnitSystem } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const CriticalFlowCalculator = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<CriticalFlowInputs>({
    k: 1.3,
    upstreamPressure: 3000, // kPa  
    downstreamPressure: 1000, // kPa
    temperature: 60, // °C
    Z: 1.0,
    MW: 18.2, // kg/kmol
    throatArea: 0.000507, // m² (1 inch diameter)
    dischargeCoeff: 0.82,
    guessedVelocity: undefined
  });

  const [outputs, setOutputs] = useState<CriticalFlowOutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      try {
        const result = calculateCriticalFlow(inputs);
        setOutputs(result);
      } catch (error) {
        setOutputs(null);
      }
    }
  }, [inputs]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (inputs.k <= 1.0) newErrors.k = 'Heat capacity ratio must be greater than 1.0';
    if (inputs.upstreamPressure <= 0) newErrors.upstreamPressure = 'Upstream pressure must be positive';
    if (inputs.downstreamPressure <= 0) newErrors.downstreamPressure = 'Downstream pressure must be positive';
    if (inputs.downstreamPressure >= inputs.upstreamPressure) {
      newErrors.downstreamPressure = 'Downstream pressure must be less than upstream pressure';
    }
    if (inputs.Z <= 0) newErrors.Z = 'Compressibility factor must be positive';
    if (inputs.MW <= 0) newErrors.MW = 'Molecular weight must be positive';
    if (inputs.throatArea <= 0) newErrors.throatArea = 'Throat area must be positive';
    if (inputs.dischargeCoeff <= 0 || inputs.dischargeCoeff > 1) {
      newErrors.dischargeCoeff = 'Discharge coefficient must be between 0 and 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CriticalFlowInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyResults = async () => {
    if (outputs) {
      const success = await copyResultsToClipboard(outputs, 'Critical Flow');
      toast({
        title: success ? "Results Copied" : "Copy Failed",
        description: success ? "Results copied to clipboard" : "Failed to copy results",
        variant: success ? "default" : "destructive",
      });
    }
  };

  const handleReset = () => {
    setInputs({
      k: 1.3,
      upstreamPressure: 3000,
      downstreamPressure: 1000,
      temperature: 60,
      Z: 1.0,
      MW: 18.2,
      throatArea: 0.000507,
      dischargeCoeff: 0.82,
      guessedVelocity: undefined
    });
    setOutputs(null);
    setErrors({});
  };

  // Unit labels based on system
  const getUnitLabel = (type: string) => {
    if (unitSystem === 'metric') {
      switch (type) {
        case 'pressure': return 'kPa';
        case 'temperature': return '°C';
        case 'area': return 'm²';
        case 'velocity': return 'm/s';
        case 'flow_mass': return 'kg/s';
        case 'flow_vol': return 'm³/s';
        case 'flow_std': return 'MMSCFD';
        default: return '';
      }
    } else {
      switch (type) {
        case 'pressure': return 'psia';
        case 'temperature': return '°F';
        case 'area': return 'in²';
        case 'velocity': return 'ft/s';
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
        <h2 className="text-2xl font-bold">Critical Flow Calculator</h2>
        <p className="text-muted-foreground">
          Quick critical-flow and pressure-ratio checks for gases
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
            {/* Gas Properties */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Gas Properties</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="k" className="flex items-center space-x-1">
                    <span>k (Cp/Cv)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Heat capacity ratio (specific heat ratio)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="k"
                    type="number"
                    step="0.01"
                    value={inputs.k}
                    onChange={(e) => handleInputChange('k', parseFloat(e.target.value) || 1.3)}
                    className={errors.k ? 'border-destructive' : ''}
                  />
                  {errors.k && <p className="text-xs text-destructive">{errors.k}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="MW">Molecular Weight</Label>
                  <div className="relative">
                    <Input
                      id="MW"
                      type="number"
                      step="0.1"
                      value={inputs.MW}
                      onChange={(e) => handleInputChange('MW', parseFloat(e.target.value) || 18.2)}
                      className={errors.MW ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      kg/kmol
                    </span>
                  </div>
                  {errors.MW && <p className="text-xs text-destructive">{errors.MW}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="Z">Z Factor</Label>
                  <Input
                    id="Z"
                    type="number"
                    step="0.01"
                    value={inputs.Z}
                    onChange={(e) => handleInputChange('Z', parseFloat(e.target.value) || 1.0)}
                    className={errors.Z ? 'border-destructive' : ''}
                  />
                  {errors.Z && <p className="text-xs text-destructive">{errors.Z}</p>}
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="throatArea" className="flex items-center space-x-1">
                    <span>Throat Area</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cross-sectional area at the throat (minimum area)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="relative">
                    <Input
                      id="throatArea"
                      type="number"
                      step="0.000001"
                      value={inputs.throatArea}
                      onChange={(e) => handleInputChange('throatArea', parseFloat(e.target.value) || 0)}
                      className={errors.throatArea ? 'border-destructive' : ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {getUnitLabel('area')}
                    </span>
                  </div>
                  {errors.throatArea && <p className="text-xs text-destructive">{errors.throatArea}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dischargeCoeff">Discharge Coefficient</Label>
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

              <div className="space-y-2">
                <Label htmlFor="guessedVelocity" className="flex items-center space-x-1">
                  <span>Guessed Velocity (Optional)</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>For Mach number calculation in subcritical flow</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <Input
                    id="guessedVelocity"
                    type="number"
                    step="1"
                    value={inputs.guessedVelocity || ''}
                    onChange={(e) => handleInputChange('guessedVelocity', parseFloat(e.target.value) || undefined)}
                    placeholder="Optional"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {getUnitLabel('velocity')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Critical flow analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outputs ? (
              <>
                {/* Critical Ratio */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Critical Ratio (r*)</span>
                    <span className="text-lg font-mono">{outputs.criticalRatio.toFixed(4)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Theoretical critical pressure ratio for this gas
                  </p>
                </div>

                {/* Flow Regime Indicator */}
                <div className={`p-4 rounded-lg border-2 ${
                  outputs.regime === 'CHOKED' 
                    ? 'bg-warning/10 border-warning/50' 
                    : 'bg-success/10 border-success/50'
                }`}>
                  <div className="flex items-center space-x-2">
                    {outputs.regime === 'CHOKED' ? (
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    <div>
                      <p className="font-semibold">{outputs.regime} FLOW</p>
                      <p className="text-sm text-muted-foreground">
                        P₂/P₀ = {(inputs.downstreamPressure / inputs.upstreamPressure).toFixed(4)} 
                        {outputs.regime === 'CHOKED' ? ' ≤ ' : ' > '}
                        {outputs.criticalRatio.toFixed(4)}
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

                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Standard Flow</span>
                      <span className="text-lg font-mono">{outputs.standardFlow.toFixed(3)} {getUnitLabel('flow_std')}</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Speed of Sound</span>
                      <span className="text-sm font-mono">{outputs.speedOfSound.toFixed(1)} {getUnitLabel('velocity')}</span>
                    </div>
                  </div>

                  {outputs.machNumber !== undefined && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mach Number</span>
                        <span className="text-sm font-mono">{outputs.machNumber.toFixed(3)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Analysis</h5>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Gas properties: k={inputs.k}, MW={inputs.MW} kg/kmol, Z={inputs.Z}</li>
                    <li>• Discharge coefficient: {inputs.dischargeCoeff}</li>
                    <li>• Throat area: {inputs.throatArea.toExponential(3)} {getUnitLabel('area')}</li>
                    {outputs.regime === 'CHOKED' && <li>• Flow is sonic at throat (M = 1.0)</li>}
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

export default CriticalFlowCalculator;