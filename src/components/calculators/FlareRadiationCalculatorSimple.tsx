import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, RotateCcw, Info, AlertTriangle, Flame, Volume2, Thermometer, 
  Wind, Settings, Download, Upload
} from 'lucide-react';

import { calculateFlareRadiation } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import type { FlareRadiationInputs, FlareRadiationOutputs, UnitSystem, FlareGasComposition } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const FlareRadiationCalculatorSimple = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  
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
  const [isCalculating, setIsCalculating] = useState(false);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      setIsCalculating(true);
      try {
        const result = calculateFlareRadiation(inputs);
        setOutputs(result);
      } catch (error) {
        console.error('Calculation error:', error);
        setOutputs(null);
      } finally {
        setIsCalculating(false);
      }
    }
  }, [inputs]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!inputs.gasRate || inputs.gasRate <= 0) {
      newErrors.gasRate = 'Gas rate must be greater than 0';
    }

    if (!inputs.flareTipHeight || inputs.flareTipHeight <= 0) {
      newErrors.flareTipHeight = 'Flare height must be greater than 0';
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

  const handleExportPNG = () => {
    if (!outputs) {
      toast({
        title: "No Data to Export",
        description: "Please run calculations first to export data",
        variant: "destructive",
      });
      return;
    }
    
    // Create a simple chart representation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Flare Radiation Analysis', canvas.width / 2, 40);
    
    // Draw flare stack
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(350, 100, 100, 200);
    
    // Draw flame
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.arc(400, 100, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw radiation contours
    const colors = ['#ff0000', '#ff8800', '#ffff00'];
    outputs.radiationFootprint.contours.forEach((contour, index) => {
      ctx.strokeStyle = colors[index] || '#ff0000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(400, 300, 50 + index * 30, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    // Add labels
    ctx.fillStyle = '#495057';
    ctx.font = '16px Arial';
    ctx.fillText(`Max Radiation: ${outputs.radiationFootprint.maxRadiation.toFixed(1)} kW/m²`, canvas.width / 2, 500);
    ctx.fillText(`Flame Length: ${outputs.flameLength.toFixed(1)} m`, canvas.width / 2, 530);
    ctx.fillText(`Emissive Fraction: ${outputs.emissiveFraction.toFixed(3)}`, canvas.width / 2, 560);
    
    // Convert to PNG and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flare-radiation-analysis.png';
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "PNG Export",
          description: "Analysis chart exported as PNG",
        });
      }
    });
  };

  const handleExportCSV = () => {
    if (!outputs) {
      toast({
        title: "No Data to Export",
        description: "Please run calculations first to export data",
        variant: "destructive",
      });
      return;
    }
    
    const csvData = [
      ['Parameter', 'Value', 'Unit'],
      ['Emissive Fraction', outputs.emissiveFraction.toFixed(3), ''],
      ['Exit Velocity', outputs.exitVelocity.toFixed(2), 'm/s'],
      ['Flame Length', outputs.flameLength.toFixed(2), 'm'],
      ['Flame Tilt', outputs.flameTilt.toFixed(1), 'degrees'],
      ['Max Radiation', outputs.radiationFootprint.maxRadiation.toFixed(1), 'kW/m²'],
      ['Max Noise', outputs.noiseFootprint.maxNoise.toFixed(1), 'dB(A)'],
      ['Molecular Weight', outputs.molecularWeight.toFixed(1), 'kg/kmol'],
      ['LHV', outputs.lhv.toFixed(1), 'MJ/kg'],
      ['Density', outputs.density.toFixed(2), 'kg/m³']
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flare-radiation-results.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "CSV Export",
      description: "Results exported as CSV",
    });
  };

  const handleExportJSON = () => {
    if (!outputs) {
      toast({
        title: "No Data to Export",
        description: "Please run calculations first to export data",
        variant: "destructive",
      });
      return;
    }
    
    const exportData = {
      version: 'flarecalc-simple-1.0',
      timestamp: new Date().toISOString(),
      inputs: inputs,
      outputs: outputs,
      unitSystem: unitSystem
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flare-radiation-scenario.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON Export",
      description: "Scenario exported as JSON",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Flare Radiation & Noise Calculator (Simple)
          </CardTitle>
          <CardDescription>
            API Standard 521 compliant flare radiation and noise calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
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
                      <Label htmlFor="gasRate">Gas Rate (MMSCFD)</Label>
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
                      <Label htmlFor="flareHeight">Flare Height (m)</Label>
                      <Input
                        id="flareHeight"
                        type="number"
                        step="0.1"
                        value={inputs.flareTipHeight}
                        onChange={(e) => handleInputChange('flareTipHeight', parseFloat(e.target.value) || 0)}
                        className={errors.flareTipHeight ? 'border-red-500' : ''}
                      />
                      {errors.flareTipHeight && <p className="text-sm text-red-500">{errors.flareTipHeight}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="windSpeed">Wind Speed (m/s)</Label>
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
                      <Input
                        id="windDirection"
                        type="number"
                        step="1"
                        value={inputs.windDirection}
                        onChange={(e) => handleInputChange('windDirection', parseFloat(e.target.value) || 0)}
                      />
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
                      <Label htmlFor="tipDiameter">Tip Diameter (m)</Label>
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
                      <Label htmlFor="tipPressure">Tip Pressure (kPa)</Label>
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
                      <Label htmlFor="tipTemperature">Tip Temperature (K)</Label>
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
                  </CardHeader>
                  <CardContent className="space-y-4">
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

            <TabsContent value="export" className="space-y-6">
              <div className="text-center py-8">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Export Options</h3>
                <p className="text-muted-foreground mb-4">
                  Export calculation results and data
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleExportPNG} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PNG
                  </Button>
                  <Button onClick={handleExportCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportJSON} variant="outline">
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

export default FlareRadiationCalculatorSimple;
