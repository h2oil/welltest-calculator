import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, RotateCcw, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

import { calculateGasVelocityWithUnits } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import { UnitSelector, PRESSURE_UNITS, TEMPERATURE_UNITS, LENGTH_UNITS, FLOW_UNITS, DENSITY_UNITS } from '@/components/ui/unit-selector';
import type { VelocityInputs, VelocityOutputs } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

const GasVelocityCalculatorV2 = () => {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<VelocityInputs>({
    pipeID: 4, // 4 inches
    gasRateStd: 10, // 10 MMSCFD
    pressure: 1000, // psia
    temperature: 60, // °F
    Z: 1.0,
    k: 1.3,
    MW: 18.2, // kg/kmol
    erosionalConstant: 100, // API RP 14E constant
    fluidDensity: undefined // Auto-calculate from gas properties
  });

  const [units, setUnits] = useState({
    pipeID: 'in',
    gasRate: 'MMSCFD',
    pressure: 'psia',
    temperature: 'degF',
    density: 'kgm3'
  });

  const [outputs, setOutputs] = useState<VelocityOutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      try {
        const result = calculateGasVelocityWithUnits(inputs, units);
        setOutputs(result);
      } catch (error) {
        setOutputs(null);
      }
    }
  }, [inputs, units]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (inputs.pipeID <= 0) newErrors.pipeID = 'Pipe ID must be positive';
    if (inputs.gasRateStd <= 0) newErrors.gasRateStd = 'Gas rate must be positive';
    if (inputs.pressure <= 0) newErrors.pressure = 'Pressure must be positive';
    if (inputs.Z <= 0) newErrors.Z = 'Z factor must be positive';
    if (inputs.k <= 1.0) newErrors.k = 'Heat capacity ratio must be greater than 1.0';
    if (inputs.MW <= 0) newErrors.MW = 'Molecular weight must be positive';
    if (inputs.erosionalConstant <= 0) newErrors.erosionalConstant = 'Erosional constant must be positive';

    if (inputs.fluidDensity !== undefined && inputs.fluidDensity <= 0) {
      newErrors.fluidDensity = 'Fluid density must be positive if provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof VelocityInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleUnitChange = (field: string, unit: string) => {
    setUnits(prev => ({ ...prev, [field]: unit }));
  };

  const handleCopyResults = async () => {
    if (outputs) {
      const success = await copyResultsToClipboard(outputs, 'Gas Velocity');
      toast({
        title: success ? "Results Copied" : "Copy Failed",
        description: success ? "Results copied to clipboard" : "Failed to copy results",
        variant: success ? "default" : "destructive",
      });
    }
  };

  const handleReset = () => {
    setInputs({
      pipeID: 4,
      gasRateStd: 10,
      pressure: 1000,
      temperature: 60,
      Z: 1.0,
      k: 1.3,
      MW: 18.2,
      erosionalConstant: 100,
      fluidDensity: undefined
    });
    setUnits({
      pipeID: 'in',
      gasRate: 'MMSCFD',
      pressure: 'psia',
      temperature: 'degF',
      density: 'kgm3'
    });
    setOutputs(null);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Gas Velocity Calculator</h2>
        <p className="text-muted-foreground">
          Pipe gas velocity and erosional-velocity checks per API RP 14E
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Inputs</span>
              <Badge variant="outline">Custom Units</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pipe Geometry */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pipe Geometry</h4>
              
              <div className="space-y-2">
                <Label htmlFor="pipeID" className="flex items-center space-x-1">
                  <span>Pipe Internal Diameter</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Internal diameter of the pipe</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="pipeID"
                    type="number"
                    step="0.001"
                    value={inputs.pipeID}
                    onChange={(e) => handleInputChange('pipeID', parseFloat(e.target.value) || 0)}
                    className={`flex-1 ${errors.pipeID ? 'border-destructive' : ''}`}
                  />
                  <UnitSelector
                    label=""
                    value={units.pipeID}
                    onValueChange={(value) => handleUnitChange('pipeID', value)}
                    options={LENGTH_UNITS}
                    className="min-w-fit"
                  />
                </div>
                {errors.pipeID && <p className="text-xs text-destructive">{errors.pipeID}</p>}
              </div>
            </div>

            {/* Flow Conditions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Flow Conditions</h4>
              
              <div className="space-y-2">
                <Label htmlFor="gasRateStd" className="flex items-center space-x-1">
                  <span>Standard Gas Rate</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Standard volumetric flow rate</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="gasRateStd"
                    type="number"
                    step="0.1"
                    value={inputs.gasRateStd}
                    onChange={(e) => handleInputChange('gasRateStd', parseFloat(e.target.value) || 0)}
                    className={`flex-1 ${errors.gasRateStd ? 'border-destructive' : ''}`}
                  />
                  <UnitSelector
                    label=""
                    value={units.gasRate}
                    onValueChange={(value) => handleUnitChange('gasRate', value)}
                    options={FLOW_UNITS}
                    className="min-w-fit"
                  />
                </div>
                {errors.gasRateStd && <p className="text-xs text-destructive">{errors.gasRateStd}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pressure">Line Pressure</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="pressure"
                      type="number"
                      step="10"
                      value={inputs.pressure}
                      onChange={(e) => handleInputChange('pressure', parseFloat(e.target.value) || 0)}
                      className={`flex-1 ${errors.pressure ? 'border-destructive' : ''}`}
                    />
                    <UnitSelector
                      label=""
                      value={units.pressure}
                      onValueChange={(value) => handleUnitChange('pressure', value)}
                      options={PRESSURE_UNITS}
                      className="min-w-fit"
                    />
                  </div>
                  {errors.pressure && <p className="text-xs text-destructive">{errors.pressure}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="temperature"
                      type="number"
                      step="1"
                      value={inputs.temperature}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <UnitSelector
                      label=""
                      value={units.temperature}
                      onValueChange={(value) => handleUnitChange('temperature', value)}
                      options={TEMPERATURE_UNITS}
                      className="min-w-fit"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gas Properties */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Gas Properties</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="k" className="text-xs">k (Cp/Cv)</Label>
                  <Input
                    id="k"
                    type="number"
                    step="0.01"
                    value={inputs.k}
                    onChange={(e) => handleInputChange('k', parseFloat(e.target.value) || 1.3)}
                    className={`text-sm ${errors.k ? 'border-destructive' : ''}`}
                  />
                  {errors.k && <p className="text-xs text-destructive">{errors.k}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="MW" className="text-xs">MW (kg/kmol)</Label>
                  <Input
                    id="MW"
                    type="number"
                    step="0.1"
                    value={inputs.MW}
                    onChange={(e) => handleInputChange('MW', parseFloat(e.target.value) || 18.2)}
                    className={`text-sm ${errors.MW ? 'border-destructive' : ''}`}
                  />
                  {errors.MW && <p className="text-xs text-destructive">{errors.MW}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="Z" className="text-xs">Z Factor</Label>
                  <Input
                    id="Z"
                    type="number"
                    step="0.01"
                    value={inputs.Z}
                    onChange={(e) => handleInputChange('Z', parseFloat(e.target.value) || 1.0)}
                    className={`text-sm ${errors.Z ? 'border-destructive' : ''}`}
                  />
                  {errors.Z && <p className="text-xs text-destructive">{errors.Z}</p>}
                </div>
              </div>
            </div>

            {/* Erosional Analysis */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Erosional Analysis</h4>
              
              <div className="space-y-2">
                <Label htmlFor="erosionalConstant" className="flex items-center space-x-1">
                  <span>API RP 14E Constant (C)</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>100 for continuous service, 125-200 for intermittent</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="erosionalConstant"
                  type="number"
                  step="25"
                  value={inputs.erosionalConstant}
                  onChange={(e) => handleInputChange('erosionalConstant', parseFloat(e.target.value) || 100)}
                  className={errors.erosionalConstant ? 'border-destructive' : ''}
                />
                {errors.erosionalConstant && <p className="text-xs text-destructive">{errors.erosionalConstant}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fluidDensity" className="flex items-center space-x-1">
                  <span>Fluid Density (Optional)</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Leave empty to auto-calculate from gas properties</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="fluidDensity"
                    type="number"
                    step="0.1"
                    value={inputs.fluidDensity || ''}
                    onChange={(e) => handleInputChange('fluidDensity', parseFloat(e.target.value) || undefined)}
                    placeholder="Auto-calculated"
                    className={`flex-1 ${errors.fluidDensity ? 'border-destructive' : ''}`}
                  />
                  <UnitSelector
                    label=""
                    value={units.density}
                    onValueChange={(value) => handleUnitChange('density', value)}
                    options={DENSITY_UNITS}
                    className="min-w-fit"
                  />
                </div>
                {errors.fluidDensity && <p className="text-xs text-destructive">{errors.fluidDensity}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Velocity analysis and erosional checks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outputs ? (
              <>
                {/* Velocity Results */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Gas Velocity</span>
                      <span className="text-lg font-mono">{outputs.velocity.toFixed(2)} m/s</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actual velocity in pipe
                    </p>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Mach Number</span>
                      <span className="text-lg font-mono">{outputs.machNumber.toFixed(3)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Velocity relative to speed of sound
                    </p>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Erosional Velocity Limit</span>
                      <span className="text-lg font-mono">{outputs.erosionalVelocity.toFixed(2)} m/s</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      API RP 14E erosional velocity limit
                    </p>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Speed of Sound</span>
                      <span className="text-sm font-mono">{outputs.speedOfSound.toFixed(1)} m/s</span>
                    </div>
                  </div>
                </div>

                {/* Pass/Fail Indicators */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium">Safety Checks</h5>
                  
                  <div className={`p-3 rounded-lg border flex items-center space-x-3 ${
                    outputs.passFailFlags.erosionalVelocity 
                      ? 'bg-success/10 border-success/50' 
                      : 'bg-destructive/10 border-destructive/50'
                  }`}>
                    {outputs.passFailFlags.erosionalVelocity ? (
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Erosional Velocity Check: {outputs.passFailFlags.erosionalVelocity ? 'PASS' : 'FAIL'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {outputs.velocity.toFixed(2)} {outputs.passFailFlags.erosionalVelocity ? '≤' : '>'} {outputs.erosionalVelocity.toFixed(2)} m/s
                      </p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border flex items-center space-x-3 ${
                    outputs.passFailFlags.machNumber 
                      ? 'bg-success/10 border-success/50' 
                      : 'bg-warning/10 border-warning/50'
                  }`}>
                    {outputs.passFailFlags.machNumber ? (
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Mach Number Check: {outputs.passFailFlags.machNumber ? 'PASS' : 'CAUTION'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {outputs.machNumber.toFixed(3)} {outputs.passFailFlags.machNumber ? '≤' : '>'} 0.300 (recommended limit)
                      </p>
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

export default GasVelocityCalculatorV2;