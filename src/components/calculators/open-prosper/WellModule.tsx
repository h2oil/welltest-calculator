import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Download, 
  Upload,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MapPin,
  Calculator
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

import type { DeviationSurvey, DeviationPoint, UnitSystem } from '@/types/open-prosper';
import { TrajectoryCalculator } from '@/components/well-info/TrajectoryCalculator';
import { TrajectoryVisualizer } from '@/components/well-info/TrajectoryVisualizer';
import { WellTrajectory } from '@/types/well-trajectory';

interface WellModuleProps {
  deviation: DeviationSurvey | undefined;
  unitSystem: UnitSystem;
  onUpdate: (deviation: DeviationSurvey) => void;
}

export const WellModule: React.FC<WellModuleProps> = ({
  deviation,
  unitSystem,
  onUpdate
}) => {
  const [localDeviation, setLocalDeviation] = useState<DeviationSurvey>(
    deviation || [
      { md: 0, tvd: 0, inc: 0, azi: 0 },
      { md: 1000, tvd: 1000, inc: 0, azi: 0 },
      { md: 2000, tvd: 2000, inc: 0, azi: 0 }
    ]
  );
  
  const [currentTrajectory, setCurrentTrajectory] = useState<WellTrajectory | null>(null);
  const [activeTab, setActiveTab] = useState('deviation');

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newPoint, setNewPoint] = useState<DeviationPoint>({
    md: 0,
    tvd: 0,
    inc: 0,
    azi: 0
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (deviation) {
      setLocalDeviation(deviation);
    }
  }, [deviation]);

  const validateDeviation = (dev: DeviationSurvey): string[] => {
    const errors: string[] = [];
    
    if (dev.length < 2) {
      errors.push('At least 2 deviation points are required');
      return errors;
    }

    // Check for increasing MD
    for (let i = 1; i < dev.length; i++) {
      if (dev[i].md <= dev[i-1].md) {
        errors.push(`MD must be increasing (row ${i+1})`);
      }
    }

    // Check for reasonable values
    for (let i = 0; i < dev.length; i++) {
      const point = dev[i];
      if (point.md < 0) errors.push(`MD must be positive (row ${i+1})`);
      if (point.tvd < 0) errors.push(`TVD must be positive (row ${i+1})`);
      if (point.inc < 0 || point.inc > 90) errors.push(`Inclination must be 0-90° (row ${i+1})`);
      if (point.azi < 0 || point.azi >= 360) errors.push(`Azimuth must be 0-360° (row ${i+1})`);
    }

    return errors;
  };

  const handleDeviationUpdate = (newDeviation: DeviationSurvey) => {
    const validationErrors = validateDeviation(newDeviation);
    setErrors(validationErrors);
    
    if (validationErrors.length === 0) {
      setLocalDeviation(newDeviation);
      onUpdate(newDeviation);
    }
  };

  // Calculate deviation profile for visualization
  const deviationProfile = useMemo(() => {
    if (!localDeviation || localDeviation.length < 2) return [];

    const profile = [];
    let x = 0;
    let y = 0;

    for (let i = 0; i < localDeviation.length; i++) {
      const point = localDeviation[i];
      
      if (i === 0) {
        // First point starts at origin
        profile.push({
          md: point.md,
          tvd: point.tvd,
          x: 0,
          y: 0,
          inc: point.inc,
          azi: point.azi
        });
      } else {
        const prevPoint = localDeviation[i - 1];
        const deltaMD = point.md - prevPoint.md;
        const avgInc = (point.inc + prevPoint.inc) / 2;
        const avgAzi = (point.azi + prevPoint.azi) / 2;
        
        // Convert to radians
        const incRad = (avgInc * Math.PI) / 180;
        const aziRad = (avgAzi * Math.PI) / 180;
        
        // Calculate horizontal displacement
        const deltaX = deltaMD * Math.sin(incRad) * Math.cos(aziRad);
        const deltaY = deltaMD * Math.sin(incRad) * Math.sin(aziRad);
        
        x += deltaX;
        y += deltaY;
        
        profile.push({
          md: point.md,
          tvd: point.tvd,
          x: x,
          y: y,
          inc: point.inc,
          azi: point.azi
        });
      }
    }

    return profile;
  }, [localDeviation]);

  // Get unit labels
  const getDepthUnit = () => unitSystem === 'metric' ? 'm' : 'ft';
  const getDistanceUnit = () => unitSystem === 'metric' ? 'm' : 'ft';

  const addPoint = () => {
    const lastPoint = localDeviation[localDeviation.length - 1];
    const newPointData = {
      ...newPoint,
      md: newPoint.md || lastPoint.md + 100
    };
    
    const newDeviation = [...localDeviation, newPointData].sort((a, b) => a.md - b.md);
    handleDeviationUpdate(newDeviation);
    setNewPoint({ md: 0, tvd: 0, inc: 0, azi: 0 });
  };

  const updatePoint = (index: number, field: keyof DeviationPoint, value: number) => {
    const newDeviation = [...localDeviation];
    newDeviation[index] = { ...newDeviation[index], [field]: value };
    handleDeviationUpdate(newDeviation);
  };

  const deletePoint = (index: number) => {
    if (localDeviation.length <= 2) {
      setErrors(['At least 2 deviation points are required']);
      return;
    }
    
    const newDeviation = localDeviation.filter((_, i) => i !== index);
    handleDeviationUpdate(newDeviation);
  };

  const importDeviation = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const importedDeviation: DeviationPoint[] = [];

        for (const line of lines) {
          const values = line.split(',').map(v => parseFloat(v.trim()));
          if (values.length >= 4 && values.every(v => !isNaN(v))) {
            importedDeviation.push({
              md: values[0],
              tvd: values[1],
              inc: values[2],
              azi: values[3]
            });
          }
        }

        if (importedDeviation.length >= 2) {
          handleDeviationUpdate(importedDeviation);
        } else {
          setErrors(['Invalid file format or insufficient data points']);
        }
      } catch (error) {
        setErrors(['Failed to import deviation data']);
      }
    };
    reader.readAsText(file);
  };

  const exportDeviation = () => {
    const csvContent = localDeviation
      .map(point => `${point.md},${point.tvd},${point.inc},${point.azi}`)
      .join('\n');
    
    const blob = new Blob([`MD,TVD,Inc,Azi\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deviation-survey.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLengthUnit = () => unitSystem === 'metric' ? 'm' : 'ft';
  const getAngleUnit = () => '°';

  const calculateWellPath = () => {
    // Calculate well path statistics
    if (!localDeviation || localDeviation.length === 0) {
      return { totalMD: 0, totalTVD: 0, maxInc: 0, dogleg: 0 };
    }
    
    const totalMD = Math.max(...localDeviation.map(p => p?.md || 0));
    const totalTVD = Math.max(...localDeviation.map(p => p?.tvd || 0));
    const maxInc = Math.max(...localDeviation.map(p => p?.inc || 0));
    const dogleg = calculateDogleg();
    
    return { 
      totalMD: isFinite(totalMD) ? totalMD : 0, 
      totalTVD: isFinite(totalTVD) ? totalTVD : 0, 
      maxInc: isFinite(maxInc) ? maxInc : 0, 
      dogleg: isFinite(dogleg) ? dogleg : 0 
    };
  };

  const calculateDogleg = () => {
    let maxDogleg = 0;
    for (let i = 1; i < localDeviation.length; i++) {
      const prev = localDeviation[i-1];
      const curr = localDeviation[i];
      
      const deltaMD = curr.md - prev.md;
      const deltaInc = curr.inc - prev.inc;
      const deltaAzi = curr.azi - prev.azi;
      
      const dogleg = Math.acos(
        Math.cos(deltaInc * Math.PI / 180) * Math.cos(prev.inc * Math.PI / 180) * Math.cos(curr.inc * Math.PI / 180) +
        Math.sin(prev.inc * Math.PI / 180) * Math.sin(curr.inc * Math.PI / 180) * Math.cos(deltaAzi * Math.PI / 180)
      ) * 180 / Math.PI;
      
      maxDogleg = Math.max(maxDogleg, dogleg);
    }
    return maxDogleg;
  };

  const wellPathStats = calculateWellPath();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Well Trajectory & Deviation Survey
          </h2>
          <p className="text-muted-foreground">
            Define well trajectory, generate 3D paths, and manage deviation survey data
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deviation" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Deviation Survey
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Trajectory Calculator
          </TabsTrigger>
          <TabsTrigger value="visualizer" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            3D Visualization
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="deviation" className="space-y-6">
          {/* Deviation Survey Content */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Deviation Survey Data</h3>
              <p className="text-sm text-muted-foreground">
                Input and manage well deviation survey points
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportDeviation}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={importDeviation}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
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

      {/* Well Path Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{wellPathStats.totalMD?.toFixed(0) ?? '0'}</div>
            <p className="text-sm text-muted-foreground">Total MD ({getLengthUnit()})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{wellPathStats.totalTVD?.toFixed(0) ?? '0'}</div>
            <p className="text-sm text-muted-foreground">Total TVD ({getLengthUnit()})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{wellPathStats.maxInc?.toFixed(1) ?? '0.0'}</div>
            <p className="text-sm text-muted-foreground">Max Inclination ({getAngleUnit()})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{wellPathStats.dogleg?.toFixed(1) ?? '0.0'}</div>
            <p className="text-sm text-muted-foreground">Max Dogleg ({getAngleUnit()})</p>
          </CardContent>
        </Card>
      </div>

      {/* Deviation Profile Chart */}
      {deviationProfile.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Well Deviation Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deviationProfile}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    name="East-West Displacement"
                    label={{ value: `East-West Displacement (${getDistanceUnit()})`, position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="y" 
                    name="North-South Displacement"
                    label={{ value: `North-South Displacement (${getDistanceUnit()})`, angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value?.toFixed(2) ?? '0.00', name === 'x' ? 'East-West' : 'North-South']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return `MD: ${data.md?.toFixed(1) ?? '0.0'} ${getDepthUnit()}, TVD: ${data.tvd?.toFixed(1) ?? '0.0'} ${getDepthUnit()}`;
                      }
                      return '';
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="x" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="East-West Displacement"
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="North-South Displacement"
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This chart shows the horizontal displacement of the wellbore from the surface location.</p>
              <p>• <span className="text-blue-600">Blue line</span>: East-West displacement (positive = East)</p>
              <p>• <span className="text-green-600">Green line</span>: North-South displacement (positive = North)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deviation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deviation Survey Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Point</TableHead>
                  <TableHead>MD ({getLengthUnit()})</TableHead>
                  <TableHead>TVD ({getLengthUnit()})</TableHead>
                  <TableHead>Inclination ({getAngleUnit()})</TableHead>
                  <TableHead>Azimuth ({getAngleUnit()})</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localDeviation.map((point, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={point.md}
                        onChange={(e) => updatePoint(index, 'md', parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={point.tvd}
                        onChange={(e) => updatePoint(index, 'tvd', parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={point.inc}
                        onChange={(e) => updatePoint(index, 'inc', parseFloat(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                        max="90"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={point.azi}
                        onChange={(e) => updatePoint(index, 'azi', parseFloat(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                        max="360"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePoint(index)}
                        disabled={localDeviation.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Add New Point */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="new-md">MD:</Label>
                  <Input
                    id="new-md"
                    type="number"
                    value={newPoint.md}
                    onChange={(e) => setNewPoint(prev => ({ ...prev, md: parseFloat(e.target.value) || 0 }))}
                    className="w-20"
                    placeholder="MD"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="new-tvd">TVD:</Label>
                  <Input
                    id="new-tvd"
                    type="number"
                    value={newPoint.tvd}
                    onChange={(e) => setNewPoint(prev => ({ ...prev, tvd: parseFloat(e.target.value) || 0 }))}
                    className="w-20"
                    placeholder="TVD"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="new-inc">Inc:</Label>
                  <Input
                    id="new-inc"
                    type="number"
                    value={newPoint.inc}
                    onChange={(e) => setNewPoint(prev => ({ ...prev, inc: parseFloat(e.target.value) || 0 }))}
                    className="w-20"
                    placeholder="Inc"
                    min="0"
                    max="90"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="new-azi">Azi:</Label>
                  <Input
                    id="new-azi"
                    type="number"
                    value={newPoint.azi}
                    onChange={(e) => setNewPoint(prev => ({ ...prev, azi: parseFloat(e.target.value) || 0 }))}
                    className="w-20"
                    placeholder="Azi"
                    min="0"
                    max="360"
                  />
                </div>
                <Button onClick={addPoint}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Point
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Validation Status */}
          {errors.length === 0 && localDeviation.length >= 2 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Deviation survey is valid with {localDeviation.length} points
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="calculator" className="space-y-6">
          <TrajectoryCalculator
            onTrajectoryGenerated={setCurrentTrajectory}
            unitSystem={unitSystem}
          />
        </TabsContent>
        
        <TabsContent value="visualizer" className="space-y-6">
          <TrajectoryVisualizer
            trajectory={currentTrajectory}
            onTrajectoryChange={setCurrentTrajectory}
            unitSystem={unitSystem}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
