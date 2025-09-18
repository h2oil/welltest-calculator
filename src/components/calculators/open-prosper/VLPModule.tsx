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
  TrendingUp, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
  Thermometer
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { H2OilCompleteEngine } from '@/lib/open-prosper-engine';
import type { VLPSettings, Fluid, DeviationSurvey, Completion, UnitSystem, VLPResult } from '@/types/open-prosper';

interface VLPModuleProps {
  vlp: VLPSettings | undefined;
  fluid: Fluid | undefined;
  deviation: DeviationSurvey | undefined;
  completion: Completion | undefined;
  unitSystem: UnitSystem;
  onUpdate: (vlp: VLPSettings) => void;
}

export const VLPModule: React.FC<VLPModuleProps> = ({
  vlp,
  fluid,
  deviation,
  completion,
  unitSystem,
  onUpdate
}) => {
  const [localVLP, setLocalVLP] = useState<VLPSettings>(
    vlp || {
      correlation: 'beggs-brill',
      temperature_model: 'simple',
      temperature_gradient: 0.02,
      roughness_factor: 1.0,
      holdup_tuning: 1.0
    }
  );

  const [vlpResult, setVLPResult] = useState<VLPResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (vlp) {
      setLocalVLP(vlp);
    }
  }, [vlp]);

  const handleVLPUpdate = (updates: Partial<VLPSettings>) => {
    const updatedVLP = { ...localVLP, ...updates };
    setLocalVLP(updatedVLP);
    onUpdate(updatedVLP);
  };

  const calculateVLP = async () => {
    if (!fluid || !deviation || !completion) {
      setErrors(['Fluid, deviation, and completion data are required for VLP calculation']);
      return;
    }

    setIsCalculating(true);
    setErrors([]);

    try {
      const { VLPCalculator } = H2OilCompleteEngine;
      
      // Generate rate array
      const maxRate = 1000; // m³/d
      const rates = Array.from({ length: 50 }, (_, i) => (i / 49) * maxRate);
      
      const result = VLPCalculator.calculateVLP(localVLP, fluid, deviation, completion, rates, unitSystem);
      setVLPResult(result);
    } catch (error) {
      setErrors([`VLP calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsCalculating(false);
    }
  };

  const getTemperatureUnit = () => unitSystem === 'metric' ? '°C/m' : '°F/ft';
  const getFlowRateUnit = () => unitSystem === 'metric' ? 'm³/d' : 'bbl/d';
  const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psi';

  const getCorrelationDescription = (correlation: string) => {
    const descriptions: { [key: string]: string } = {
      'beggs-brill': 'Beggs-Brill - General purpose correlation for all flow patterns',
      'hagedorn-brown': 'Hagedorn-Brown - For vertical and near-vertical wells',
      'duns-ros': 'Duns-Ros - For vertical wells with high gas-liquid ratios',
      'ansari': 'Ansari - For horizontal and deviated wells',
      'gray': 'Gray - For gas wells with liquid loading',
      'single-phase': 'Single-Phase - For single-phase flow calculations'
    };
    return descriptions[correlation] || 'Unknown correlation';
  };

  const getCorrelationValidity = (correlation: string) => {
    const validity: { [key: string]: string } = {
      'beggs-brill': 'Valid for all flow patterns, GOR 0-5000 scf/stb',
      'hagedorn-brown': 'Valid for vertical wells, GOR 0-5000 scf/stb',
      'duns-ros': 'Valid for vertical wells, high GOR',
      'ansari': 'Valid for horizontal/deviated wells',
      'gray': 'Valid for gas wells with liquid loading',
      'single-phase': 'Valid for single-phase flow only'
    };
    return validity[correlation] || 'Unknown validity range';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            VLP / Tubing Performance
          </h2>
          <p className="text-muted-foreground">
            Define vertical lift performance and multiphase flow correlations
          </p>
        </div>
        <Button onClick={calculateVLP} disabled={isCalculating || !fluid || !deviation || !completion}>
          <Calculator className="h-4 w-4 mr-2" />
          {isCalculating ? 'Calculating...' : 'Calculate VLP'}
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

      <Tabs defaultValue="correlation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Correlation Selection */}
        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Multiphase Flow Correlation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="correlation">Correlation Type</Label>
                <Select
                  value={localVLP.correlation}
                  onValueChange={(value: any) => handleVLPUpdate({ correlation: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beggs-brill">Beggs-Brill</SelectItem>
                    <SelectItem value="hagedorn-brown">Hagedorn-Brown</SelectItem>
                    <SelectItem value="duns-ros">Duns-Ros</SelectItem>
                    <SelectItem value="ansari">Ansari</SelectItem>
                    <SelectItem value="gray">Gray (Gas Wells)</SelectItem>
                    <SelectItem value="single-phase">Single-Phase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Correlation Description</h4>
                <p className="text-sm text-muted-foreground">
                  {getCorrelationDescription(localVLP.correlation)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">Validity Range</h4>
                <p className="text-sm text-blue-700">
                  {getCorrelationValidity(localVLP.correlation)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roughness-factor">Roughness Factor</Label>
                  <Input
                    id="roughness-factor"
                    type="number"
                    step="0.1"
                    value={localVLP.roughness_factor}
                    onChange={(e) => handleVLPUpdate({ roughness_factor: parseFloat(e.target.value) || 1.0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Multiplier for pipe roughness (1.0 = default)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holdup-tuning">Holdup Tuning</Label>
                  <Input
                    id="holdup-tuning"
                    type="number"
                    step="0.1"
                    value={localVLP.holdup_tuning}
                    onChange={(e) => handleVLPUpdate({ holdup_tuning: parseFloat(e.target.value) || 1.0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tuning factor for holdup calculation (1.0 = default)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temperature Model */}
        <TabsContent value="temperature" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Temperature Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temperature-model">Temperature Model</Label>
                <Select
                  value={localVLP.temperature_model}
                  onValueChange={(value: 'simple' | 'table') => handleVLPUpdate({ temperature_model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Gradient</SelectItem>
                    <SelectItem value="table">Temperature Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {localVLP.temperature_model === 'simple' && (
                <div className="space-y-2">
                  <Label htmlFor="temperature-gradient">Temperature Gradient</Label>
                  <div className="flex gap-2">
                    <Input
                      id="temperature-gradient"
                      type="number"
                      step="0.001"
                      value={localVLP.temperature_gradient || 0}
                      onChange={(e) => handleVLPUpdate({ temperature_gradient: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getTemperatureUnit()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Temperature change per unit depth
                  </p>
                </div>
              )}

              {localVLP.temperature_model === 'table' && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-yellow-900">Temperature Table</h4>
                    <p className="text-sm text-yellow-700">
                      Temperature table input will be implemented in future versions.
                      Currently using simple gradient model.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                VLP Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vlpResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{vlpResult?.max_rate?.toFixed(1) ?? 'N/A'}</div>
                      <p className="text-sm text-muted-foreground">Max Rate ({getFlowRateUnit()})</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{vlpResult?.max_pressure?.toFixed(0) ?? 'N/A'}</div>
                      <p className="text-sm text-muted-foreground">Max Pressure ({getPressureUnit()})</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{vlpResult.rates.length}</div>
                      <p className="text-sm text-muted-foreground">Data Points</p>
                    </div>
                  </div>

                  {/* VLP Curve Graph */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">VLP Curve</h4>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={vlpResult.rates.map((rate, index) => ({
                            rate: rate?.toFixed(1) ?? '0.0',
                            pressure: vlpResult?.pressures?.[index]?.toFixed(0) ?? '0',
                            name: `Point ${index + 1}`
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="rate" 
                            label={{ value: `Flow Rate (${getFlowRateUnit()})`, position: 'insideBottom', offset: -10 }}
                          />
                          <YAxis 
                            label={{ value: `Pressure (${getPressureUnit()})`, angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [value, name === 'pressure' ? 'Pressure' : 'Rate']}
                            labelFormatter={(label) => `Flow Rate: ${label} ${getFlowRateUnit()}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="pressure" 
                            stroke="#82ca9d" 
                            strokeWidth={2}
                            dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                            name="Wellhead Pressure"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-900">VLP Curve Generated</h4>
                    <p className="text-sm text-green-700">
                      Successfully calculated VLP curve using {localVLP.correlation} correlation.
                      Maximum flow rate: {vlpResult?.max_rate?.toFixed(1) ?? 'N/A'} {getFlowRateUnit()}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-900">Correlation Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Correlation:</span>
                        <span className="ml-2">{localVLP.correlation}</span>
                      </div>
                      <div>
                        <span className="font-medium">Roughness Factor:</span>
                        <span className="ml-2">{localVLP.roughness_factor}</span>
                      </div>
                      <div>
                        <span className="font-medium">Holdup Tuning:</span>
                        <span className="ml-2">{localVLP.holdup_tuning}</span>
                      </div>
                      <div>
                        <span className="font-medium">Temperature Model:</span>
                        <span className="ml-2">{localVLP.temperature_model}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Click "Calculate VLP" to generate the vertical lift performance curve
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Status */}
      {errors.length === 0 && fluid && deviation && completion && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            VLP model is ready for calculation
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
