import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings
} from 'lucide-react';

import type { 
  OpenProsperCase, 
  NodalResult, 
  UnitSystem, 
  SensitivityResult 
} from '@/types/open-prosper';

interface SensitivityModuleProps {
  case_: OpenProsperCase | null;
  nodalResult: NodalResult | null;
  unitSystem: UnitSystem;
}

export const SensitivityModule: React.FC<SensitivityModuleProps> = ({
  case_,
  nodalResult,
  unitSystem
}) => {
  const [selectedParameter, setSelectedParameter] = useState<string>('tubing_id');
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const sensitivityParameters = [
    { id: 'tubing_id', name: 'Tubing ID', unit: unitSystem === 'metric' ? 'm' : 'in' },
    { id: 'reservoir_pressure', name: 'Reservoir Pressure', unit: unitSystem === 'metric' ? 'kPa' : 'psi' },
    { id: 'skin', name: 'Skin Factor', unit: 'dimensionless' },
    { id: 'permeability', name: 'Permeability', unit: 'md' },
    { id: 'thickness', name: 'Formation Thickness', unit: unitSystem === 'metric' ? 'm' : 'ft' },
    { id: 'gor', name: 'Gas-Oil Ratio', unit: 'scf/stb' },
    { id: 'wct', name: 'Water Cut', unit: '%' },
    { id: 'whp', name: 'Wellhead Pressure', unit: unitSystem === 'metric' ? 'kPa' : 'psi' }
  ];

  const performSensitivityAnalysis = async () => {
    if (!case_ || !nodalResult) {
      setErrors(['Case data and nodal results are required for sensitivity analysis']);
      return;
    }

    setIsCalculating(true);
    setErrors([]);

    try {
      // Simulate sensitivity analysis
      const baseValue = getParameterValue(case_, selectedParameter);
      const values = generateSensitivityValues(baseValue);
      const operatingPoints = values.map(value => ({
        rate: nodalResult.operating_point.rate * (1 + (value - baseValue) / baseValue * 0.1),
        pwf: nodalResult.operating_point.pwf * (1 + (value - baseValue) / baseValue * 0.05),
        whp: nodalResult.operating_point.whp * (1 + (value - baseValue) / baseValue * 0.05)
      }));

      const result: SensitivityResult = {
        parameter: selectedParameter,
        values,
        operating_points: operatingPoints
      };

      setSensitivityResult(result);
    } catch (error) {
      setErrors([`Sensitivity analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsCalculating(false);
    }
  };

  const getParameterValue = (case_: OpenProsperCase, parameter: string): number => {
    switch (parameter) {
      case 'tubing_id':
        return case_.completion.tubing_id;
      case 'reservoir_pressure':
        return case_.ipr.parameters.reservoir_pressure;
      case 'skin':
        return case_.ipr.parameters.skin;
      case 'permeability':
        return case_.ipr.parameters.permeability;
      case 'thickness':
        return case_.ipr.parameters.thickness;
      case 'gor':
        return case_.fluid.gor || 0;
      case 'wct':
        return case_.fluid.wct || 0;
      case 'whp':
        return case_.constraints?.whp_limit || 0;
      default:
        return 0;
    }
  };

  const generateSensitivityValues = (baseValue: number): number[] => {
    const range = baseValue * 0.5; // ±50% range
    const step = range / 10; // 11 points
    const values: number[] = [];
    
    for (let i = -5; i <= 5; i++) {
      values.push(baseValue + i * step);
    }
    
    return values;
  };

  const getFlowRateUnit = () => unitSystem === 'metric' ? 'm³/d' : 'bbl/d';
  const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psi';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Sensitivity Analysis
          </h2>
          <p className="text-muted-foreground">
            Analyze sensitivity of operating point to parameter changes
          </p>
        </div>
        <Button onClick={performSensitivityAnalysis} disabled={isCalculating || !case_ || !nodalResult}>
          <Calculator className="h-4 w-4 mr-2" />
          {isCalculating ? 'Analyzing...' : 'Run Sensitivity'}
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

      {/* Parameter Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sensitivity Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sensitivity-parameter">Parameter to Analyze</Label>
            <Select
              value={selectedParameter}
              onValueChange={setSelectedParameter}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sensitivityParameters.map((param) => (
                  <SelectItem key={param.id} value={param.id}>
                    {param.name} ({param.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Analysis Range</h4>
            <p className="text-sm text-muted-foreground">
              ±50% around base value with 11 data points
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity Results */}
      {sensitivityResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sensitivity Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-900">
                {sensitivityParameters.find(p => p.id === sensitivityResult.parameter)?.name} Sensitivity
              </h4>
              <p className="text-sm text-blue-700">
                Analysis of {sensitivityResult.values.length} parameter values
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {sensitivityResult.operating_points.length}
                </div>
                <p className="text-sm text-muted-foreground">Data Points</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {Math.min(...sensitivityResult.operating_points.map(p => p.rate)).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Min Rate ({getFlowRateUnit()})</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {Math.max(...sensitivityResult.operating_points.map(p => p.rate)).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Max Rate ({getFlowRateUnit()})</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Sensitivity Table</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Parameter Value</th>
                      <th className="text-left p-2">Flow Rate ({getFlowRateUnit()})</th>
                      <th className="text-left p-2">BHP ({getPressureUnit()})</th>
                      <th className="text-left p-2">WHP ({getPressureUnit()})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivityResult.values.map((value, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{value.toFixed(2)}</td>
                        <td className="p-2">{sensitivityResult.operating_points[index].rate.toFixed(1)}</td>
                        <td className="p-2">{sensitivityResult.operating_points[index].pwf.toFixed(0)}</td>
                        <td className="p-2">{sensitivityResult.operating_points[index].whp.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-900">Sensitivity Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Rate Range:</span>
                  <span className="ml-2">
                    {Math.min(...sensitivityResult.operating_points.map(p => p.rate)).toFixed(1)} - 
                    {Math.max(...sensitivityResult.operating_points.map(p => p.rate)).toFixed(1)} {getFlowRateUnit()}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Rate Variation:</span>
                  <span className="ml-2">
                    {((Math.max(...sensitivityResult.operating_points.map(p => p.rate)) - 
                       Math.min(...sensitivityResult.operating_points.map(p => p.rate))) / 
                     Math.min(...sensitivityResult.operating_points.map(p => p.rate)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      {!case_ || !nodalResult ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Complete the nodal analysis first to perform sensitivity analysis
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Ready to perform sensitivity analysis on {sensitivityParameters.find(p => p.id === selectedParameter)?.name}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
