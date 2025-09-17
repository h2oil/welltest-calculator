import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, RotateCcw, Info, AlertTriangle, Thermometer, Droplets } from 'lucide-react';

import { calculateAPIGravity } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import type { APIGravityInputs, APIGravityOutputs, UnitSystem } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const APIGravityCalculator = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<APIGravityInputs>({
    specificGravity: 0.85, // SG at 60°F
    temperature: 100, // °F
    referenceTemp: 60 // °F
  });

  const [outputs, setOutputs] = useState<APIGravityOutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('conversion');

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      try {
        const result = calculateAPIGravity(inputs);
        setOutputs(result);
      } catch (error) {
        setOutputs(null);
      }
    }
  }, [inputs]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!inputs.specificGravity || inputs.specificGravity <= 0) {
      newErrors.specificGravity = 'Specific gravity must be greater than 0';
    }

    if (!inputs.temperature || inputs.temperature < -50 || inputs.temperature > 500) {
      newErrors.temperature = 'Temperature must be between -50°F and 500°F';
    }

    if (inputs.referenceTemp && (inputs.referenceTemp < -50 || inputs.referenceTemp > 500)) {
      newErrors.referenceTemp = 'Reference temperature must be between -50°F and 500°F';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof APIGravityInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setInputs({
      specificGravity: 0.85,
      temperature: 100,
      referenceTemp: 60
    });
    setOutputs(null);
    setErrors({});
  };

  const handleCopyResults = async () => {
    if (outputs) {
      const success = await copyResultsToClipboard(outputs, 'API Gravity Calculator');
      if (success) {
        toast({
          title: "Results Copied",
          description: "API gravity calculation results copied to clipboard",
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

  const getAPIClassification = (api: number): string => {
    if (api < 10) return 'Heavy Crude';
    if (api < 22) return 'Medium Heavy Crude';
    if (api < 31) return 'Medium Crude';
    if (api < 40) return 'Light Crude';
    return 'Very Light Crude/Condensate';
  };

  const getAPIColor = (api: number): string => {
    if (api < 10) return 'bg-red-100 text-red-800';
    if (api < 22) return 'bg-orange-100 text-orange-800';
    if (api < 31) return 'bg-yellow-100 text-yellow-800';
    if (api < 40) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            API Gravity Calculator
          </CardTitle>
          <CardDescription>
            Convert specific gravity to API gravity with temperature correction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversion">Conversion</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="conversion" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Input Parameters</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specificGravity" className="flex items-center gap-2">
                      Specific Gravity (60°F)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Specific gravity relative to water at 60°F</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="specificGravity"
                      type="number"
                      step="0.001"
                      value={inputs.specificGravity}
                      onChange={(e) => handleInputChange('specificGravity', parseFloat(e.target.value) || 0)}
                      className={errors.specificGravity ? 'border-red-500' : ''}
                    />
                    {errors.specificGravity && (
                      <p className="text-sm text-red-500">{errors.specificGravity}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature" className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Temperature (°F)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Temperature for API gravity correction</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={inputs.temperature}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                      className={errors.temperature ? 'border-red-500' : ''}
                    />
                    {errors.temperature && (
                      <p className="text-sm text-red-500">{errors.temperature}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referenceTemp" className="flex items-center gap-2">
                      Reference Temperature (°F)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reference temperature for specific gravity measurement (typically 60°F)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="referenceTemp"
                      type="number"
                      step="0.1"
                      value={inputs.referenceTemp}
                      onChange={(e) => handleInputChange('referenceTemp', parseFloat(e.target.value) || 60)}
                      className={errors.referenceTemp ? 'border-red-500' : ''}
                    />
                    {errors.referenceTemp && (
                      <p className="text-sm text-red-500">{errors.referenceTemp}</p>
                    )}
                  </div>
                </div>

                {/* Quick Reference */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Reference</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium text-sm">API Gravity Ranges</h4>
                      <div className="space-y-1 text-xs mt-2">
                        <div className="flex justify-between">
                          <span>Heavy Crude:</span>
                          <span>&lt; 22°API</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Medium Crude:</span>
                          <span>22-31°API</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Light Crude:</span>
                          <span>31-40°API</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Very Light:</span>
                          <span>&gt; 40°API</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium text-sm">Temperature Correction</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        ASTM D1250-08 standard correction factor: 0.00035°API per °F
                      </p>
                    </div>
                  </div>
                </div>
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
                  {/* Main Results */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">API Gravity Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">API Gravity (60°F):</span>
                            <Badge variant="outline" className="text-lg font-mono">
                              {outputs.apiGravity.toFixed(2)}°API
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">API Gravity (Corrected):</span>
                            <Badge className={`text-lg font-mono ${getAPIColor(outputs.apiGravityCorrected)}`}>
                              {outputs.apiGravityCorrected.toFixed(2)}°API
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Classification:</span>
                            <Badge variant="secondary">
                              {getAPIClassification(outputs.apiGravityCorrected)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Specific Gravity Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">SG (60°F):</span>
                            <Badge variant="outline" className="text-lg font-mono">
                              {inputs.specificGravity.toFixed(3)}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">SG (Corrected):</span>
                            <Badge variant="outline" className="text-lg font-mono">
                              {outputs.specificGravityCorrected.toFixed(3)}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Density (60°F):</span>
                            <Badge variant="outline" className="text-lg font-mono">
                              {outputs.density.toFixed(1)} lb/ft³
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Density (Corrected):</span>
                            <Badge variant="outline" className="text-lg font-mono">
                              {outputs.densityCorrected.toFixed(1)} lb/ft³
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Temperature Correction Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Temperature Correction Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {outputs.temperatureCorrection.toFixed(4)}°API
                          </div>
                          <div className="text-sm text-muted-foreground">Correction Factor</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {inputs.temperature}°F
                          </div>
                          <div className="text-sm text-muted-foreground">Current Temperature</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {inputs.referenceTemp}°F
                          </div>
                          <div className="text-sm text-muted-foreground">Reference Temperature</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
                  <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter parameters to calculate API gravity</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIGravityCalculator;
