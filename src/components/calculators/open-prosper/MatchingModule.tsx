import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  Target,
  TrendingUp
} from 'lucide-react';

import { H2OilCompleteEngine } from '@/lib/open-prosper-engine';
import type { 
  TestPoint, 
  VLPSettings, 
  Fluid, 
  DeviationSurvey, 
  Completion, 
  UnitSystem, 
  MatchingResult 
} from '@/types/open-prosper';

interface MatchingModuleProps {
  testPoints: TestPoint[];
  vlp: VLPSettings | undefined;
  fluid: Fluid | undefined;
  deviation: DeviationSurvey | undefined;
  completion: Completion | undefined;
  unitSystem: UnitSystem;
  onUpdate: (testPoints: TestPoint[]) => void;
}

export const MatchingModule: React.FC<MatchingModuleProps> = ({
  testPoints,
  vlp,
  fluid,
  deviation,
  completion,
  unitSystem,
  onUpdate
}) => {
  const [localTestPoints, setLocalTestPoints] = useState<TestPoint[]>(testPoints);
  const [newTestPoint, setNewTestPoint] = useState<TestPoint>({
    id: '',
    q: 0,
    pwf: 0,
    whp: 0,
    gor: 0,
    wct: 0,
    date: new Date(),
    notes: ''
  });
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setLocalTestPoints(testPoints);
  }, [testPoints]);

  const handleTestPointsUpdate = (newTestPoints: TestPoint[]) => {
    setLocalTestPoints(newTestPoints);
    onUpdate(newTestPoints);
  };

  const addTestPoint = () => {
    if (!newTestPoint.id || newTestPoint.q <= 0) {
      setErrors(['Test point ID and flow rate are required']);
      return;
    }

    const updatedTestPoints = [...localTestPoints, { ...newTestPoint }];
    handleTestPointsUpdate(updatedTestPoints);
    setNewTestPoint({
      id: '',
      q: 0,
      pwf: 0,
      whp: 0,
      gor: 0,
      wct: 0,
      date: new Date(),
      notes: ''
    });
    setErrors([]);
  };

  const removeTestPoint = (index: number) => {
    const updatedTestPoints = localTestPoints.filter((_, i) => i !== index);
    handleTestPointsUpdate(updatedTestPoints);
  };

  const performMatching = async () => {
    if (!vlp || !fluid || !deviation || !completion) {
      setErrors(['VLP, fluid, deviation, and completion data are required for matching']);
      return;
    }

    if (localTestPoints.length === 0) {
      setErrors(['At least one test point is required for matching']);
      return;
    }

    setIsCalculating(true);
    setErrors([]);

    try {
      const { DataMatcher } = H2OilCompleteEngine;
      
      const result = DataMatcher.matchVLPToTestPoints(
        vlp,
        fluid,
        deviation,
        completion,
        localTestPoints,
        unitSystem
      );
      
      setMatchingResult(result);
    } catch (error) {
      setErrors([`Matching error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsCalculating(false);
    }
  };

  const getFlowRateUnit = () => unitSystem === 'metric' ? 'm³/d' : 'bbl/d';
  const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psi';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Data Matching & Calibration
          </h2>
          <p className="text-muted-foreground">
            Match VLP correlation to field test data
          </p>
        </div>
        <Button onClick={performMatching} disabled={isCalculating || localTestPoints.length === 0}>
          <Calculator className="h-4 w-4 mr-2" />
          {isCalculating ? 'Matching...' : 'Perform Matching'}
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

      {/* Test Points Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Test Points ({localTestPoints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Q ({getFlowRateUnit()})</TableHead>
                  <TableHead>Pwf ({getPressureUnit()})</TableHead>
                  <TableHead>WHP ({getPressureUnit()})</TableHead>
                  <TableHead>GOR (scf/stb)</TableHead>
                  <TableHead>WCT (%)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localTestPoints.map((point, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{point.id}</TableCell>
                    <TableCell>{point.q.toFixed(1)}</TableCell>
                    <TableCell>{point.pwf.toFixed(0)}</TableCell>
                    <TableCell>{point.whp.toFixed(0)}</TableCell>
                    <TableCell>{point.gor?.toFixed(0) || '-'}</TableCell>
                    <TableCell>{point.wct?.toFixed(1) || '-'}</TableCell>
                    <TableCell>{point.date?.toLocaleDateString() || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestPoint(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Add New Test Point */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-id">Test Point ID</Label>
                  <Input
                    id="test-id"
                    value={newTestPoint.id}
                    onChange={(e) => setNewTestPoint(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="Test point identifier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-q">Flow Rate</Label>
                  <div className="flex gap-2">
                    <Input
                      id="test-q"
                      type="number"
                      value={newTestPoint.q}
                      onChange={(e) => setNewTestPoint(prev => ({ ...prev, q: parseFloat(e.target.value) || 0 }))}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getFlowRateUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-pwf">Bottomhole Pressure</Label>
                  <div className="flex gap-2">
                    <Input
                      id="test-pwf"
                      type="number"
                      value={newTestPoint.pwf}
                      onChange={(e) => setNewTestPoint(prev => ({ ...prev, pwf: parseFloat(e.target.value) || 0 }))}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getPressureUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-whp">Wellhead Pressure</Label>
                  <div className="flex gap-2">
                    <Input
                      id="test-whp"
                      type="number"
                      value={newTestPoint.whp}
                      onChange={(e) => setNewTestPoint(prev => ({ ...prev, whp: parseFloat(e.target.value) || 0 }))}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getPressureUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-gor">Gas-Oil Ratio</Label>
                  <Input
                    id="test-gor"
                    type="number"
                    value={newTestPoint.gor || 0}
                    onChange={(e) => setNewTestPoint(prev => ({ ...prev, gor: parseFloat(e.target.value) || 0 }))}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-wct">Water Cut</Label>
                  <Input
                    id="test-wct"
                    type="number"
                    value={newTestPoint.wct || 0}
                    onChange={(e) => setNewTestPoint(prev => ({ ...prev, wct: parseFloat(e.target.value) || 0 }))}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-notes">Notes</Label>
                  <Input
                    id="test-notes"
                    value={newTestPoint.notes || ''}
                    onChange={(e) => setNewTestPoint(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={addTestPoint} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Point
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching Results */}
      {matchingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Matching Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{matchingResult.rmse.toFixed(3)}</div>
                <p className="text-sm text-muted-foreground">RMSE</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{matchingResult.ape.toFixed(3)}</div>
                <p className="text-sm text-muted-foreground">APE</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{matchingResult.r_squared.toFixed(3)}</div>
                <p className="text-sm text-muted-foreground">R²</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{matchingResult.test_points.length}</div>
                <p className="text-sm text-muted-foreground">Test Points</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-900">Bias Factors</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Friction:</span>
                  <span className="ml-2">{matchingResult.bias_factors.friction.toFixed(3)}</span>
                </div>
                <div>
                  <span className="font-medium">Holdup:</span>
                  <span className="ml-2">{matchingResult.bias_factors.holdup.toFixed(3)}</span>
                </div>
                <div>
                  <span className="font-medium">Temperature:</span>
                  <span className="ml-2">{matchingResult.bias_factors.temperature.toFixed(3)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-900">Correlation: {matchingResult.correlation}</h4>
              <p className="text-sm text-green-700">
                Successfully matched VLP correlation to {matchingResult.test_points.length} test points.
                R² = {matchingResult.r_squared.toFixed(3)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      {localTestPoints.length > 0 && !matchingResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {localTestPoints.length} test points ready for matching
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
