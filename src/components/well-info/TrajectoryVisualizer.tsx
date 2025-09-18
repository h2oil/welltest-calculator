import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Settings,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { WellTrajectory, TrajectoryVisualizationOptions, TrajectoryAnalysis } from '@/types/well-trajectory';
import { wellProfileService, TrajectoryAnalysis as ServiceAnalysis, PlotStyle } from '@/services/wellProfileServiceFallback';

interface TrajectoryVisualizerProps {
  trajectory: WellTrajectory | null;
  onTrajectoryChange: (trajectory: WellTrajectory | null) => void;
  unitSystem: 'metric' | 'field';
}

export const TrajectoryVisualizer: React.FC<TrajectoryVisualizerProps> = ({
  trajectory,
  onTrajectoryChange,
  unitSystem
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizationOptions, setVisualizationOptions] = useState<TrajectoryVisualizationOptions>({
    colorBy: 'dls',
    size: 5,
    darkMode: false,
    showGrid: true,
    showLabels: true,
    showStartPoint: true,
    showEndPoint: true,
    showDLS: true,
    showBuildRate: false,
    showTurnRate: false
  });
  const [analysis, setAnalysis] = useState<ServiceAnalysis | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [plotData, setPlotData] = useState<any>(null);
  const [camera, setCamera] = useState({
    x: 0,
    y: 0,
    z: 0,
    rotationX: 0,
    rotationY: 0,
    zoom: 1
  });

  useEffect(() => {
    if (trajectory) {
      loadAnalysis();
      load3DPlot();
    }
  }, [trajectory, visualizationOptions]);

  const loadAnalysis = async () => {
    if (!trajectory) return;
    
    try {
      const analysisResult = await wellProfileService.analyzeTrajectory(trajectory);
      setAnalysis(analysisResult);
    } catch (err) {
      console.error('Error loading analysis:', err);
    }
  };

  const load3DPlot = async () => {
    if (!trajectory) return;
    
    try {
      const style: PlotStyle = {
        color: visualizationOptions.colorBy,
        size: visualizationOptions.size,
        darkMode: visualizationOptions.darkMode
      };
      
      const plotResult = await wellProfileService.create3DPlot(trajectory, style);
      setPlotData(plotResult.plot_data);
    } catch (err) {
      console.error('Error loading 3D plot:', err);
    }
  };

  const drawTrajectory = () => {
    const canvas = canvasRef.current;
    if (!canvas || !trajectory) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = visualizationOptions.darkMode ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate bounds
    const points = trajectory.points;
    if (points.length === 0) return;

    const northValues = points.map(p => p.north);
    const eastValues = points.map(p => p.east);
    const tvdValues = points.map(p => p.tvd);

    const minNorth = Math.min(...northValues);
    const maxNorth = Math.max(...northValues);
    const minEast = Math.min(...eastValues);
    const maxEast = Math.max(...eastValues);
    const minTVD = Math.min(...tvdValues);
    const maxTVD = Math.max(...tvdValues);

    const rangeNorth = maxNorth - minNorth;
    const rangeEast = maxEast - minEast;
    const rangeTVD = maxTVD - minTVD;
    const maxRange = Math.max(rangeNorth, rangeEast, rangeTVD);

    // Calculate scale
    const scale = Math.min(canvas.width, canvas.height) / (maxRange * 1.2) * camera.zoom;

    // Center the trajectory
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw grid
    if (visualizationOptions.showGrid) {
      drawGrid(ctx, canvas, minNorth, maxNorth, minEast, maxEast, minTVD, maxTVD, scale, centerX, centerY);
    }

    // Draw trajectory
    drawTrajectoryLine(ctx, points, minNorth, minEast, minTVD, scale, centerX, centerY);

    // Draw start and end points
    if (visualizationOptions.showStartPoint) {
      drawPoint(ctx, points[0], minNorth, minEast, minTVD, scale, centerX, centerY, '#00ff00', 8);
    }
    if (visualizationOptions.showEndPoint) {
      drawPoint(ctx, points[points.length - 1], minNorth, minEast, minTVD, scale, centerX, centerY, '#ff0000', 8);
    }

    // Draw labels
    if (visualizationOptions.showLabels) {
      drawLabels(ctx, trajectory, minNorth, minEast, minTVD, scale, centerX, centerY);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, 
                   minNorth: number, maxNorth: number, minEast: number, maxEast: number,
                   minTVD: number, maxTVD: number, scale: number, centerX: number, centerY: number) => {
    ctx.strokeStyle = visualizationOptions.darkMode ? '#333333' : '#cccccc';
    ctx.lineWidth = 1;

    // Draw horizontal lines (North-South)
    const northSteps = 10;
    for (let i = 0; i <= northSteps; i++) {
      const north = minNorth + (i / northSteps) * (maxNorth - minNorth);
      const x = centerX + (north - minNorth) * scale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw vertical lines (East-West)
    const eastSteps = 10;
    for (let i = 0; i <= eastSteps; i++) {
      const east = minEast + (i / eastSteps) * (maxEast - minEast);
      const y = centerY + (east - minEast) * scale;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const drawTrajectoryLine = (ctx: CanvasRenderingContext2D, points: any[], 
                             minNorth: number, minEast: number, minTVD: number, 
                             scale: number, centerX: number, centerY: number) => {
    ctx.lineWidth = visualizationOptions.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < points.length; i++) {
      const point1 = points[i - 1];
      const point2 = points[i];

      // Calculate color based on visualization option
      const color = getPointColor(point2, visualizationOptions.colorBy);
      ctx.strokeStyle = color;

      // Calculate positions
      const x1 = centerX + (point1.north - minNorth) * scale;
      const y1 = centerY + (point1.east - minEast) * scale;
      const x2 = centerX + (point2.north - minNorth) * scale;
      const y2 = centerY + (point2.east - minEast) * scale;

      // Draw line segment
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const drawPoint = (ctx: CanvasRenderingContext2D, point: any, 
                    minNorth: number, minEast: number, minTVD: number, 
                    scale: number, centerX: number, centerY: number, 
                    color: string, size: number) => {
    const x = centerX + (point.north - minNorth) * scale;
    const y = centerY + (point.east - minEast) * scale;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, trajectory: WellTrajectory, 
                     minNorth: number, minEast: number, minTVD: number, 
                     scale: number, centerX: number, centerY: number) => {
    ctx.fillStyle = visualizationOptions.darkMode ? '#ffffff' : '#000000';
    ctx.font = '12px Arial';

    // Draw trajectory name
    ctx.fillText(trajectory.name, 10, 20);

    // Draw depth labels
    const depthUnit = unitSystem === 'metric' ? 'm' : 'ft';
    ctx.fillText(`Total Depth: ${trajectory.totalDepth.toFixed(1)} ${depthUnit}`, 10, 40);
    ctx.fillText(`Total Displacement: ${trajectory.totalDisplacement.toFixed(1)} ${depthUnit}`, 10, 60);
  };

  const getPointColor = (point: any, colorBy: string): string => {
    switch (colorBy) {
      case 'dls':
        const dls = point.dls || 0;
        return getColorFromValue(dls, 0, 10); // 0-10 degrees/100ft
      case 'inc':
        return getColorFromValue(point.inc, 0, 90);
      case 'azi':
        return getColorFromValue(point.azi, 0, 360);
      case 'tvd':
        return getColorFromValue(point.tvd, 0, 10000);
      case 'md':
        return getColorFromValue(point.md, 0, 10000);
      default:
        return '#3b82f6';
    }
  };

  const getColorFromValue = (value: number, min: number, max: number): string => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const hue = (1 - normalized) * 240; // Blue to red
    return `hsl(${hue}, 100%, 50%)`;
  };

  const handleCameraControl = (action: string) => {
    switch (action) {
      case 'reset':
        setCamera({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, zoom: 1 });
        break;
      case 'zoomIn':
        setCamera(prev => ({ ...prev, zoom: prev.zoom * 1.2 }));
        break;
      case 'zoomOut':
        setCamera(prev => ({ ...prev, zoom: prev.zoom / 1.2 }));
        break;
      case 'toggle3D':
        setIs3D(!is3D);
        break;
    }
  };

  const exportTrajectory = () => {
    if (!trajectory) return;
    
    const exportData = {
      trajectory,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trajectory.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_trajectory.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTrajectory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.trajectory) {
          onTrajectoryChange(data.trajectory);
        }
      } catch (err) {
        console.error('Error importing trajectory:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Trajectory Visualization Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Color By</label>
              <Select 
                value={visualizationOptions.colorBy} 
                onValueChange={(value: any) => setVisualizationOptions(prev => ({ ...prev, colorBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dls">Dog Leg Severity</SelectItem>
                  <SelectItem value="inc">Inclination</SelectItem>
                  <SelectItem value="azi">Azimuth</SelectItem>
                  <SelectItem value="tvd">True Vertical Depth</SelectItem>
                  <SelectItem value="md">Measured Depth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Size</label>
              <Select 
                value={visualizationOptions.size.toString()} 
                onValueChange={(value) => setVisualizationOptions(prev => ({ ...prev, size: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1px</SelectItem>
                  <SelectItem value="3">3px</SelectItem>
                  <SelectItem value="5">5px</SelectItem>
                  <SelectItem value="8">8px</SelectItem>
                  <SelectItem value="10">10px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisualizationOptions(prev => ({ ...prev, darkMode: !prev.darkMode }))}
              >
                {visualizationOptions.darkMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {visualizationOptions.darkMode ? 'Light' : 'Dark'} Mode
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCameraControl('reset')}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCameraControl('zoomIn')}>
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCameraControl('zoomOut')}>
              <ZoomOut className="h-4 w-4 mr-2" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCameraControl('toggle3D')}>
              <Maximize className="h-4 w-4 mr-2" />
              {is3D ? '2D' : '3D'} View
            </Button>
            <Button variant="outline" size="sm" onClick={exportTrajectory} disabled={!trajectory}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById('import-trajectory')?.click()}>
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

      {/* Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>3D Well Trajectory Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-96 border rounded-lg bg-gray-50 dark:bg-gray-900"
              style={{ minHeight: '400px' }}
            />
            {!trajectory && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">No trajectory data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Trajectory Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="geometry">Geometry</TabsTrigger>
                <TabsTrigger value="rates">Rates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.totalLength.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Total Length ({unitSystem === 'metric' ? 'm' : 'ft'})</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.totalDisplacement.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Displacement ({unitSystem === 'metric' ? 'm' : 'ft'})</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.maxInclination.toFixed(1)}°</p>
                    <p className="text-sm text-muted-foreground">Max Inclination</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.maxDLS.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Max DLS (°/100{unitSystem === 'metric' ? 'm' : 'ft'})</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="geometry" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.verticalSection.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Vertical Section ({unitSystem === 'metric' ? 'm' : 'ft'})</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.closureDistance.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Closure Distance ({unitSystem === 'metric' ? 'm' : 'ft'})</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.closureAzimuth.toFixed(1)}°</p>
                    <p className="text-sm text-muted-foreground">Closure Azimuth</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="rates" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.avgDLS.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Avg DLS (°/100{unitSystem === 'metric' ? 'm' : 'ft'})</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.maxBuildRate.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Max Build Rate</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.maxTurnRate.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Max Turn Rate</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{analysis.avgBuildRate.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Avg Build Rate</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
