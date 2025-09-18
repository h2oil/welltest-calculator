import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  Play, 
  RotateCcw, 
  Download, 
  Upload,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { 
  WellTrajectory, 
  TrajectoryProfile, 
  TrajectoryCalculationParams, 
  TrajectoryPoint
} from '@/types/well-trajectory';
import { wellProfileService, TrajectoryRequest } from '@/services/wellProfileServiceFallback';

interface TrajectoryCalculatorProps {
  onTrajectoryGenerated: (trajectory: WellTrajectory) => void;
  unitSystem: 'metric' | 'field';
}

export const TrajectoryCalculator: React.FC<TrajectoryCalculatorProps> = ({
  onTrajectoryGenerated,
  unitSystem
}) => {
  const [profile, setProfile] = useState<TrajectoryProfile>({
    type: 'J',
    kop: 1000,
    eob: 3000,
    buildAngle: 60,
    targetDepth: 5000
  });
  
  const [startPoint, setStartPoint] = useState({
    north: 0,
    east: 0,
    tvd: 0
  });
  
  const [calculationParams, setCalculationParams] = useState({
    stepSize: 50,
    maxDLS: 3.0
  });
  
  const [generatedTrajectory, setGeneratedTrajectory] = useState<WellTrajectory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateTrajectory = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validate profile parameters
    if (profile.buildAngle && (profile.buildAngle < 0 || profile.buildAngle > 90)) {
      setError('Build angle must be between 0 and 90 degrees');
      setLoading(false);
      return;
    }
    
    if (profile.kop && profile.eob && profile.kop >= profile.eob) {
      setError('Kick-off point must be less than end of build');
      setLoading(false);
      return;
    }
    
    try {
      // Check if backend is available
      await wellProfileService.healthCheck();
      
      const request: TrajectoryRequest = {
        profile: {
          type: profile.type,
          kop: profile.kop,
          eob: profile.eob,
          eod: profile.eod,
          build_angle: profile.buildAngle,
          drop_angle: profile.dropAngle,
          horizontal_length: profile.horizontalLength,
          target_depth: profile.targetDepth,
          target_displacement: profile.targetDisplacement,
          target_azimuth: profile.targetAzimuth
        },
        start_point: {
          north: startPoint.north,
          east: startPoint.east,
          tvd: startPoint.tvd
        },
        unit_system: unitSystem,
        step_size: calculationParams.stepSize,
        max_dls: calculationParams.maxDLS
      };
      
      const trajectory = await wellProfileService.generateTrajectory(request);
      
      // Validate trajectory for extreme values
      const maxInc = Math.max(...trajectory.points.map(p => p.inc));
      if (maxInc > 90) {
        setError(`Invalid trajectory: Maximum inclination of ${maxInc.toFixed(1)}° exceeds 90°. Please check your profile parameters.`);
        setLoading(false);
        return;
      }
      
      setGeneratedTrajectory(trajectory);
      onTrajectoryGenerated(trajectory);
      setSuccess('Trajectory generated successfully using well_profile library');
      
    } catch (err) {
      console.error('Error generating trajectory:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Backend server not available. Please start the Python backend server.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate trajectory');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProfile({
      type: 'J',
      kop: 1000,
      eob: 3000,
      buildAngle: 60,
      targetDepth: 5000
    });
    setStartPoint({ north: 0, east: 0, tvd: 0 });
    setCalculationParams({ stepSize: 50, maxDLS: 3.0 });
    setGeneratedTrajectory(null);
    setError(null);
    setSuccess(null);
  };

  const exportTrajectory = async () => {
    if (!generatedTrajectory) return;
    
    try {
      await wellProfileService.downloadTrajectory(
        generatedTrajectory, 
        `${generatedTrajectory.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_trajectory.xlsx`
      );
      setSuccess('Trajectory exported to Excel successfully');
    } catch (err) {
      console.error('Error exporting trajectory:', err);
      setError(err instanceof Error ? err.message : 'Failed to export trajectory');
    }
  };

  const importTrajectory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if it's an Excel file
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const trajectory = await wellProfileService.loadTrajectory(file);
        setGeneratedTrajectory(trajectory);
        onTrajectoryGenerated(trajectory);
        setSuccess('Trajectory imported from Excel successfully');
      } else {
        // Fallback to JSON import
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.trajectory) {
              setGeneratedTrajectory(data.trajectory);
              onTrajectoryGenerated(data.trajectory);
              setSuccess('Trajectory imported from JSON successfully');
            }
            if (data.profile) setProfile(data.profile);
            if (data.startPoint) setStartPoint(data.startPoint);
            if (data.calculationParams) setCalculationParams(data.calculationParams);
          } catch (err) {
            console.error('Error importing trajectory:', err);
            setError('Failed to import trajectory file');
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error('Error importing trajectory:', err);
      setError(err instanceof Error ? err.message : 'Failed to import trajectory');
    } finally {
      setLoading(false);
    }
  };

  const depthUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const rateUnit = unitSystem === 'metric' ? '30m' : '100ft';

  return (
    <div className="space-y-6">
      {/* Profile Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Trajectory Profile Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="start">Start Point</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile-type">Profile Type</Label>
                  <Select 
                    value={profile.type} 
                    onValueChange={(value: any) => setProfile(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="J">J-Shape</SelectItem>
                      <SelectItem value="S">S-Shape</SelectItem>
                      <SelectItem value="Horizontal">Horizontal</SelectItem>
                      <SelectItem value="Vertical">Vertical</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {profile.type === 'J' && (
                  <>
                    <div>
                      <Label htmlFor="kop">Kick-off Point ({depthUnit})</Label>
                      <Input
                        id="kop"
                        type="number"
                        value={profile.kop || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, kop: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter KOP depth"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eob">End of Build ({depthUnit})</Label>
                      <Input
                        id="eob"
                        type="number"
                        value={profile.eob || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, eob: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter EOB depth"
                      />
                    </div>
                    <div>
                      <Label htmlFor="build-angle">Build Angle (degrees)</Label>
                      <Input
                        id="build-angle"
                        type="number"
                        value={profile.buildAngle || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value >= 0 && value <= 90) {
                            setProfile(prev => ({ ...prev, buildAngle: value }));
                          }
                        }}
                        placeholder="Enter build angle"
                        min="0"
                        max="90"
                      />
                    </div>
                    <div>
                      <Label htmlFor="target-depth">Target Depth ({depthUnit})</Label>
                      <Input
                        id="target-depth"
                        type="number"
                        value={profile.targetDepth || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, targetDepth: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter target depth"
                      />
                    </div>
                  </>
                )}
                
                {profile.type === 'S' && (
                  <>
                    <div>
                      <Label htmlFor="kop">Kick-off Point ({depthUnit})</Label>
                      <Input
                        id="kop"
                        type="number"
                        value={profile.kop || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, kop: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter KOP depth"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eob">End of Build ({depthUnit})</Label>
                      <Input
                        id="eob"
                        type="number"
                        value={profile.eob || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, eob: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter EOB depth"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eod">End of Drop ({depthUnit})</Label>
                      <Input
                        id="eod"
                        type="number"
                        value={profile.eod || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, eod: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter EOD depth"
                      />
                    </div>
                    <div>
                      <Label htmlFor="build-angle">Build Angle (degrees)</Label>
                      <Input
                        id="build-angle"
                        type="number"
                        value={profile.buildAngle || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value >= 0 && value <= 90) {
                            setProfile(prev => ({ ...prev, buildAngle: value }));
                          }
                        }}
                        placeholder="Enter build angle"
                        min="0"
                        max="90"
                      />
                    </div>
                    <div>
                      <Label htmlFor="drop-angle">Drop Angle (degrees)</Label>
                      <Input
                        id="drop-angle"
                        type="number"
                        value={profile.dropAngle || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, dropAngle: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter drop angle"
                      />
                    </div>
                    <div>
                      <Label htmlFor="target-depth">Target Depth ({depthUnit})</Label>
                      <Input
                        id="target-depth"
                        type="number"
                        value={profile.targetDepth || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, targetDepth: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter target depth"
                      />
                    </div>
                  </>
                )}
                
                {profile.type === 'Horizontal' && (
                  <>
                    <div>
                      <Label htmlFor="kop">Kick-off Point ({depthUnit})</Label>
                      <Input
                        id="kop"
                        type="number"
                        value={profile.kop || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, kop: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter KOP depth"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eob">End of Build ({depthUnit})</Label>
                      <Input
                        id="eob"
                        type="number"
                        value={profile.eob || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, eob: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter EOB depth"
                      />
                    </div>
                    <div>
                      <Label htmlFor="build-angle">Build Angle (degrees)</Label>
                      <Input
                        id="build-angle"
                        type="number"
                        value={profile.buildAngle || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value >= 0 && value <= 90) {
                            setProfile(prev => ({ ...prev, buildAngle: value }));
                          }
                        }}
                        placeholder="Enter build angle"
                        min="0"
                        max="90"
                      />
                    </div>
                    <div>
                      <Label htmlFor="horizontal-length">Horizontal Length ({depthUnit})</Label>
                      <Input
                        id="horizontal-length"
                        type="number"
                        value={profile.horizontalLength || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, horizontalLength: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter horizontal length"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="start" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start-north">Start North ({depthUnit})</Label>
                  <Input
                    id="start-north"
                    type="number"
                    value={startPoint.north}
                    onChange={(e) => setStartPoint(prev => ({ ...prev, north: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter North coordinate"
                  />
                </div>
                <div>
                  <Label htmlFor="start-east">Start East ({depthUnit})</Label>
                  <Input
                    id="start-east"
                    type="number"
                    value={startPoint.east}
                    onChange={(e) => setStartPoint(prev => ({ ...prev, east: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter East coordinate"
                  />
                </div>
                <div>
                  <Label htmlFor="start-tvd">Start TVD ({depthUnit})</Label>
                  <Input
                    id="start-tvd"
                    type="number"
                    value={startPoint.tvd}
                    onChange={(e) => setStartPoint(prev => ({ ...prev, tvd: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter TVD"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="step-size">Step Size ({depthUnit})</Label>
                  <Input
                    id="step-size"
                    type="number"
                    value={calculationParams.stepSize}
                    onChange={(e) => setCalculationParams(prev => ({ ...prev, stepSize: parseFloat(e.target.value) || 50 }))}
                    placeholder="Enter step size"
                  />
                </div>
                <div>
                  <Label htmlFor="max-dls">Max DLS (°/{rateUnit})</Label>
                  <Input
                    id="max-dls"
                    type="number"
                    step="0.1"
                    value={calculationParams.maxDLS}
                    onChange={(e) => setCalculationParams(prev => ({ ...prev, maxDLS: parseFloat(e.target.value) || 3.0 }))}
                    placeholder="Enter max DLS"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button onClick={generateTrajectory} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Trajectory
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" onClick={exportTrajectory} disabled={!generatedTrajectory}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('import-trajectory')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input
              id="import-trajectory"
              type="file"
              accept=".json"
              onChange={importTrajectory}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {generatedTrajectory && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Trajectory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{generatedTrajectory.points.length}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{generatedTrajectory.totalDepth.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Depth ({depthUnit})</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{generatedTrajectory.totalDisplacement.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Displacement ({depthUnit})</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{generatedTrajectory.maxInclination.toFixed(1)}°</p>
                <p className="text-sm text-muted-foreground">Max Inclination</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
