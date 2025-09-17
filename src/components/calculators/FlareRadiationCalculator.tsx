import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Copy, RotateCcw, Info, AlertTriangle, Flame, Volume2, Thermometer, Wind, Settings, Download } from 'lucide-react';

import { calculateFlareRadiation } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import type { FlareRadiationInputs, FlareRadiationOutputs, UnitSystem, FlareGasComposition } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const FlareRadiationCalculator = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [inputs, setInputs] = useState<FlareRadiationInputs>({
    // Operating data
    gasRate: 10, // MMSCFD
    flareTipHeight: 30, // m
    windSpeed: 5, // m/s
    windDirection: 0, // degrees
    
    // Flare geometry
    tipDiameter: 0.5, // m
    tipPressure: 101.325, // kPa
    tipTemperature: 288, // K
    
    // Gas properties
    gasComposition: {
      ch4: 85, c2h6: 8, c3h8: 4, iC4: 1, nC4: 1, c5Plus: 0.5,
      h2: 0, n2: 0.3, co2: 0.2, h2s: 0
    },
    
    // Optional parameters
    atmosphericHumidity: 60, // %
    ambientTemperature: 288, // K
    noiseReferenceDistance: 30, // m
    
    // Contour customization
    radiationContours: [4.73, 6.3, 12.6], // kW/m²
    noiseContours: [70, 85, 100] // dB(A)
  });

  const [outputs, setOutputs] = useState<FlareRadiationOutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('inputs');
  const [show3D, setShow3D] = useState(true);
  const [viewMode, setViewMode] = useState<'radiation' | 'noise' | 'both'>('both');

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      try {
        const result = calculateFlareRadiation(inputs);
        setOutputs(result);
        if (show3D) {
          render3DScene(result);
        }
      } catch (error) {
        setOutputs(null);
      }
    }
  }, [inputs, show3D]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!inputs.gasRate || inputs.gasRate <= 0) {
      newErrors.gasRate = 'Gas rate must be greater than 0';
    }

    if (!inputs.tipDiameter || inputs.tipDiameter <= 0) {
      newErrors.tipDiameter = 'Tip diameter must be greater than 0';
    }

    if (!inputs.tipPressure || inputs.tipPressure <= 0) {
      newErrors.tipPressure = 'Tip pressure must be greater than 0';
    }

    if (!inputs.tipTemperature || inputs.tipTemperature <= 0) {
      newErrors.tipTemperature = 'Tip temperature must be greater than 0';
    }

    // Validate gas composition sums to 100%
    const totalMoles = Object.values(inputs.gasComposition).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalMoles - 100) > 0.1) {
      newErrors.gasComposition = 'Gas composition must sum to 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FlareRadiationInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleGasCompositionChange = (component: keyof FlareGasComposition, value: number) => {
    setInputs(prev => ({
      ...prev,
      gasComposition: {
        ...prev.gasComposition,
        [component]: value
      }
    }));
  };

  const handleContourChange = (type: 'radiation' | 'noise', index: number, value: number) => {
    setInputs(prev => ({
      ...prev,
      [type === 'radiation' ? 'radiationContours' : 'noiseContours']: 
        prev[type === 'radiation' ? 'radiationContours' : 'noiseContours'].map((val, i) => 
          i === index ? value : val
        )
    }));
  };

  const handleReset = () => {
    setInputs({
      gasRate: 10,
      flareTipHeight: 30,
      windSpeed: 5,
      windDirection: 0,
      tipDiameter: 0.5,
      tipPressure: 101.325,
      tipTemperature: 288,
      gasComposition: {
        ch4: 85, c2h6: 8, c3h8: 4, iC4: 1, nC4: 1, c5Plus: 0.5,
        h2: 0, n2: 0.3, co2: 0.2, h2s: 0
      },
      atmosphericHumidity: 60,
      ambientTemperature: 288,
      noiseReferenceDistance: 30,
      radiationContours: [4.73, 6.3, 12.6],
      noiseContours: [70, 85, 100]
    });
    setOutputs(null);
    setErrors({});
  };

  const handleCopyResults = async () => {
    if (outputs) {
      const success = await copyResultsToClipboard(outputs, 'Flare Radiation Calculator');
      if (success) {
        toast({
          title: "Results Copied",
          description: "Flare radiation calculation results copied to clipboard",
        });
      } else {
        toast({
          title: "Copy Failed",
          description: "Failed to copy results to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const render3DScene = (results: FlareRadiationOutputs) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up coordinate system
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 2; // Scale factor for visualization

    // Draw flare stack
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - inputs.flareTipHeight * scale);
    ctx.stroke();

    // Draw flame
    if (results) {
      const flameLength = results.flameLength * scale;
      const flameTilt = results.flameTilt;
      
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - inputs.flareTipHeight * scale);
      
      const flameEndX = centerX + flameLength * Math.sin(flameTilt * Math.PI / 180);
      const flameEndY = centerY - inputs.flareTipHeight * scale - flameLength * Math.cos(flameTilt * Math.PI / 180);
      
      ctx.lineTo(flameEndX, flameEndY);
      ctx.stroke();

      // Draw radiation contours
      if (viewMode === 'radiation' || viewMode === 'both') {
        results.radiationFootprint.contours.forEach((contour, index) => {
          const colors = ['#ff0000', '#ff8800', '#ffff00'];
          ctx.strokeStyle = colors[index] || '#ff0000';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          
          ctx.beginPath();
          contour.points.forEach((point, i) => {
            const x = centerX + point.x * scale;
            const y = centerY - point.y * scale;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.closePath();
          ctx.stroke();
        });
      }

      // Draw noise contours
      if (viewMode === 'noise' || viewMode === 'both') {
        results.noiseFootprint.contours.forEach((contour, index) => {
          const colors = ['#0066ff', '#00aaff', '#00ffff'];
          ctx.strokeStyle = colors[index] || '#0066ff';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          
          ctx.beginPath();
          contour.points.forEach((point, i) => {
            const x = centerX + point.x * scale;
            const y = centerY - point.y * scale;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.closePath();
          ctx.stroke();
        });
      }
    }

    ctx.setLineDash([]);
  };

  const getGasCompositionPresets = () => ({
    'Natural Gas': { ch4: 95, c2h6: 3, c3h8: 1, iC4: 0.5, nC4: 0.5, c5Plus: 0, h2: 0, n2: 0, co2: 0, h2s: 0 },
    'Associated Gas': { ch4: 70, c2h6: 15, c3h8: 8, iC4: 3, nC4: 3, c5Plus: 1, h2: 0, n2: 0, co2: 0, h2s: 0 },
    'Sour Gas': { ch4: 80, c2h6: 10, c3h8: 5, iC4: 2, nC4: 2, c5Plus: 0.5, h2: 0, n2: 0, co2: 0.5, h2s: 0.5 },
    'Refinery Gas': { ch4: 60, c2h6: 20, c3h8: 10, iC4: 5, nC4: 5, c5Plus: 0, h2: 0, n2: 0, co2: 0, h2s: 0 }
  });

  const applyPreset = (preset: FlareGasComposition) => {
    setInputs(prev => ({
      ...prev,
      gasComposition: preset
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Flare Radiation & Noise Calculator
          </CardTitle>
          <CardDescription>
            API Standard 521 compliant thermal radiation and acoustic noise analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="3d">3D Model</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="inputs" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Operating Data */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wind className="h-4 w-4" />
                      Operating Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gasRate">Gas Rate ({unitSystem === 'metric' ? 'MSCMD' : 'MMSCFD'})</Label>
                      <Input
                        id="gasRate"
                        type="number"
                        step="0.1"
                        value={inputs.gasRate}
                        onChange={(e) => handleInputChange('gasRate', parseFloat(e.target.value) || 0)}
                        className={errors.gasRate ? 'border-red-500' : ''}
                      />
                      {errors.gasRate && <p className="text-sm text-red-500">{errors.gasRate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flareTipHeight">Flare Tip Height ({unitSystem === 'metric' ? 'm' : 'ft'})</Label>
                      <Input
                        id="flareTipHeight"
                        type="number"
                        step="0.1"
                        value={inputs.flareTipHeight}
                        onChange={(e) => handleInputChange('flareTipHeight', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="windSpeed">Wind Speed ({unitSystem === 'metric' ? 'm/s' : 'mph'})</Label>
                      <Input
                        id="windSpeed"
                        type="number"
                        step="0.1"
                        value={inputs.windSpeed}
                        onChange={(e) => handleInputChange('windSpeed', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="windDirection">Wind Direction (degrees)</Label>
                      <Slider
                        value={[inputs.windDirection]}
                        onValueChange={([value]) => handleInputChange('windDirection', value)}
                        max={360}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-muted-foreground">
                        {inputs.windDirection}°
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Flare Geometry */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Flare Geometry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipDiameter">Tip Diameter ({unitSystem === 'metric' ? 'm' : 'ft'})</Label>
                      <Input
                        id="tipDiameter"
                        type="number"
                        step="0.01"
                        value={inputs.tipDiameter}
                        onChange={(e) => handleInputChange('tipDiameter', parseFloat(e.target.value) || 0)}
                        className={errors.tipDiameter ? 'border-red-500' : ''}
                      />
                      {errors.tipDiameter && <p className="text-sm text-red-500">{errors.tipDiameter}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipPressure">Tip Pressure ({unitSystem === 'metric' ? 'kPa' : 'psia'})</Label>
                      <Input
                        id="tipPressure"
                        type="number"
                        step="0.1"
                        value={inputs.tipPressure}
                        onChange={(e) => handleInputChange('tipPressure', parseFloat(e.target.value) || 0)}
                        className={errors.tipPressure ? 'border-red-500' : ''}
                      />
                      {errors.tipPressure && <p className="text-sm text-red-500">{errors.tipPressure}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipTemperature">Tip Temperature ({unitSystem === 'metric' ? 'K' : '°F'})</Label>
                      <Input
                        id="tipTemperature"
                        type="number"
                        step="0.1"
                        value={inputs.tipTemperature}
                        onChange={(e) => handleInputChange('tipTemperature', parseFloat(e.target.value) || 0)}
                        className={errors.tipTemperature ? 'border-red-500' : ''}
                      />
                      {errors.tipTemperature && <p className="text-sm text-red-500">{errors.tipTemperature}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Gas Composition */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Gas Composition (Mole %)</CardTitle>
                    <CardDescription>
                      Select a preset or manually adjust composition
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preset buttons */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(getGasCompositionPresets()).map(([name, preset]) => (
                        <Button
                          key={name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>

                    {/* Composition inputs */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(inputs.gasComposition).map(([component, value]) => (
                        <div key={component} className="space-y-2">
                          <Label htmlFor={component} className="text-xs">
                            {component.toUpperCase()}
                          </Label>
                          <Input
                            id={component}
                            type="number"
                            step="0.1"
                            value={value}
                            onChange={(e) => handleGasCompositionChange(component as keyof FlareGasComposition, parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {errors.gasComposition && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{errors.gasComposition}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Atmospheric Conditions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Atmospheric Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="humidity">Relative Humidity (%)</Label>
                      <Slider
                        value={[inputs.atmosphericHumidity]}
                        onValueChange={([value]) => handleInputChange('atmosphericHumidity', value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-muted-foreground">
                        {inputs.atmosphericHumidity}%
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ambientTemp">Ambient Temperature ({unitSystem === 'metric' ? 'K' : '°F'})</Label>
                      <Input
                        id="ambientTemp"
                        type="number"
                        step="0.1"
                        value={inputs.ambientTemperature}
                        onChange={(e) => handleInputChange('ambientTemperature', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contour Customization */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Contour Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label>Radiation Contours (kW/m²)</Label>
                      {inputs.radiationContours.map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={level}
                            onChange={(e) => handleContourChange('radiation', index, parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">kW/m²</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Noise Contours (dB(A))</Label>
                      {inputs.noiseContours.map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="1"
                            value={level}
                            onChange={(e) => handleContourChange('noise', index, parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">dB(A)</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {outputs ? (
                <div className="space-y-6">
                  {/* Key Results */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Flare Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Emissive Fraction:</span>
                          <Badge variant="outline">{outputs.emissiveFraction.toFixed(3)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Exit Velocity:</span>
                          <Badge variant="outline">{outputs.exitVelocity.toFixed(1)} m/s</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Flame Length:</span>
                          <Badge variant="outline">{outputs.flameLength.toFixed(1)} m</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Flame Tilt:</span>
                          <Badge variant="outline">{outputs.flameTilt.toFixed(1)}°</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Gas Properties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Molecular Weight:</span>
                          <Badge variant="outline">{outputs.molecularWeight.toFixed(1)} kg/kmol</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">LHV:</span>
                          <Badge variant="outline">{outputs.lhv.toFixed(1)} MJ/kg</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">C/H Ratio:</span>
                          <Badge variant="outline">{outputs.chRatio.toFixed(2)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Density:</span>
                          <Badge variant="outline">{outputs.density.toFixed(2)} kg/m³</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Footprint Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Max Radiation:</span>
                          <Badge variant="outline">{outputs.radiationFootprint.maxRadiation.toFixed(1)} kW/m²</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Max Noise:</span>
                          <Badge variant="outline">{outputs.noiseFootprint.maxNoise.toFixed(1)} dB(A)</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Radiation Range:</span>
                          <Badge variant="outline">{outputs.radiationFootprint.maxDistance.toFixed(0)} m</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Noise Range:</span>
                          <Badge variant="outline">{outputs.noiseFootprint.maxDistance.toFixed(0)} m</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Warnings and Notes */}
                  {(outputs.warnings.length > 0 || outputs.notes.length > 0) && (
                    <div className="space-y-4">
                      {outputs.warnings.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Warnings:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {outputs.warnings.map((warning, index) => (
                                  <li key={index} className="text-sm">{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {outputs.notes.length > 0 && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Notes:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {outputs.notes.map((note, index) => (
                                  <li key={index} className="text-sm">{note}</li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleCopyResults} size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Results
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter parameters to calculate flare radiation and noise</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="3d" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">3D Visualization</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'radiation' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('radiation')}
                    >
                      Radiation
                    </Button>
                    <Button
                      variant={viewMode === 'noise' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('noise')}
                    >
                      Noise
                    </Button>
                    <Button
                      variant={viewMode === 'both' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('both')}
                    >
                      Both
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/20">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-auto border rounded"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>

                {outputs && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-red-600">Radiation Contours</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {outputs.radiationFootprint.contours.map((contour, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: ['#ff0000', '#ff8800', '#ffff00'][index] }}
                              />
                              <span className="text-sm">
                                {contour.level} kW/m² - Max distance: {contour.maxDistance.toFixed(0)} m
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-blue-600">Noise Contours</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {outputs.noiseFootprint.contours.map((contour, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: ['#0066ff', '#00aaff', '#00ffff'][index] }}
                              />
                              <span className="text-sm">
                                {contour.level} dB(A) - Max distance: {contour.maxDistance.toFixed(0)} m
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div className="text-center py-8">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Export Options</h3>
                <p className="text-muted-foreground mb-4">
                  Export calculation results and 3D model data
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PNG
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlareRadiationCalculator;
