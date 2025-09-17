import { useEffect, useRef, useState } from 'react';
// Temporarily disable Three.js to fix blank page issue
// import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, RotateCcw, Eye, EyeOff, Wind, 
  Flame, Zap, Volume2, Layers, Camera
} from 'lucide-react';

interface Flare3DViewerProps {
  flareHeight: number; // m
  tipDiameter: number; // m
  flameLength: number; // m
  flameTilt: number; // degrees
  windSpeed: number; // m/s
  windDirection: number; // degrees
  radiationContours: Array<{
    level: number; // kW/m²
    points: Array<{x: number; y: number; z: number}>;
  }>;
  noiseContours: Array<{
    level: number; // dB(A)
    points: Array<{x: number; y: number; z: number}>;
  }>;
  emissiveFraction: number;
  exitVelocity: number; // m/s
  onExportPNG?: () => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
}

const Flare3DViewer = ({
  flareHeight,
  tipDiameter,
  flameLength,
  flameTilt,
  windSpeed,
  windDirection,
  radiationContours,
  noiseContours,
  emissiveFraction,
  exitVelocity,
  onExportPNG,
  onExportCSV,
  onExportJSON
}: Flare3DViewerProps) => {
  const [layers, setLayers] = useState({
    flame: true,
    radiation: true,
    noise: true,
    contours: true,
    wind: true
  });

  const handleResetView = () => {
    // Placeholder for reset functionality
    console.log('Reset view clicked');
  };

  const handleExportPNG = () => {
    // Placeholder for PNG export
    console.log('Export PNG clicked');
    onExportPNG?.();
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleResetView} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset View
        </Button>
        
        <Button
          onClick={() => toggleLayer('flame')}
          variant={layers.flame ? 'default' : 'outline'}
          size="sm"
        >
          <Flame className="h-4 w-4 mr-2" />
          Flame
        </Button>
        
        <Button
          onClick={() => toggleLayer('radiation')}
          variant={layers.radiation ? 'default' : 'outline'}
          size="sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          Radiation
        </Button>
        
        <Button
          onClick={() => toggleLayer('noise')}
          variant={layers.noise ? 'default' : 'outline'}
          size="sm"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Noise
        </Button>
        
        <Button
          onClick={() => toggleLayer('wind')}
          variant={layers.wind ? 'default' : 'outline'}
          size="sm"
        >
          <Wind className="h-4 w-4 mr-2" />
          Wind
        </Button>
      </div>

      {/* HUD */}
      <Card className="absolute top-4 right-4 z-10 w-64">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Flare Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Emissive Fraction (χ):</span>
            <Badge variant="outline">{emissiveFraction.toFixed(3)}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Exit Velocity:</span>
            <Badge variant="outline">{exitVelocity.toFixed(1)} m/s</Badge>
          </div>
          <div className="flex justify-between">
            <span>Flame Length:</span>
            <Badge variant="outline">{flameLength.toFixed(1)} m</Badge>
          </div>
          <div className="flex justify-between">
            <span>Flame Tilt:</span>
            <Badge variant="outline">{flameTilt.toFixed(1)}°</Badge>
          </div>
          <div className="flex justify-between">
            <span>Wind Speed:</span>
            <Badge variant="outline">{windSpeed.toFixed(1)} m/s</Badge>
          </div>
          <div className="flex justify-between">
            <span>Wind Direction:</span>
            <Badge variant="outline">{windDirection.toFixed(0)}°</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 3D Canvas Placeholder */}
      <div className="w-full h-96 border rounded-lg relative bg-gradient-to-br from-sky-200 to-blue-300 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔥</div>
          <div className="text-lg font-semibold text-gray-700">3D Flare Visualization</div>
          <div className="text-sm text-gray-600">
            Flare Height: {flareHeight.toFixed(1)}m | 
            Tip Diameter: {tipDiameter.toFixed(2)}m | 
            Flame Length: {flameLength.toFixed(1)}m
          </div>
          <div className="text-sm text-gray-600">
            Wind: {windSpeed.toFixed(1)} m/s at {windDirection.toFixed(0)}° | 
            Exit Velocity: {exitVelocity.toFixed(1)} m/s
          </div>
          <div className="text-xs text-gray-500">
            Three.js 3D rendering temporarily disabled for stability
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleExportPNG} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download View (PNG)
        </Button>
        <Button onClick={onExportCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Contours (CSV)
        </Button>
        <Button onClick={onExportJSON} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Scenario (JSON)
        </Button>
      </div>
    </div>
  );
};

export default Flare3DViewer;
