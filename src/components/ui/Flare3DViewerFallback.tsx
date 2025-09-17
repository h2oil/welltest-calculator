import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, RotateCcw, Eye, EyeOff, Wind, 
  Flame, Zap, Volume2, Layers, Camera
} from 'lucide-react';

interface Flare3DViewerFallbackProps {
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

const Flare3DViewerFallback = ({
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
}: Flare3DViewerFallbackProps) => {
  const [showLayers, setShowLayers] = useState({
    flame: true,
    radiation: true,
    noise: true,
    wind: true
  });

  const handleExportPNGInternal = () => {
    // Create a simple SVG representation
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" stroke-width="1"/>
          </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="600" fill="#f0f0f0"/>
        <rect width="800" height="600" fill="url(#grid)"/>
        
        <!-- Ground -->
        <rect x="0" y="400" width="800" height="200" fill="#90ee90"/>
        
        <!-- Flare Stack -->
        <rect x="350" y="${300 - flareHeight * 2}" width="${tipDiameter * 20}" height="${flareHeight * 2}" fill="#666666"/>
        
        <!-- Flame -->
        <ellipse cx="400" cy="${300 - flareHeight * 2}" rx="${tipDiameter * 8}" ry="${flameLength * 2}" 
                fill="rgba(255, 69, 0, 0.8)" transform="rotate(${flameTilt} 400 ${300 - flareHeight * 2})"/>
        
        <!-- Radiation Contours -->
        ${radiationContours.map((contour, index) => {
          const colors = ['#ff0000', '#ff8800', '#ffff00'];
          const color = colors[index] || '#ff0000';
          const radius = 50 + index * 30;
          return `<circle cx="400" cy="300" r="${radius}" fill="none" stroke="${color}" stroke-width="3" opacity="0.6"/>`;
        }).join('')}
        
        <!-- Noise Contours -->
        ${noiseContours.map((contour, index) => {
          const colors = ['#0066ff', '#00aaff', '#00ffff'];
          const color = colors[index] || '#0066ff';
          const radius = 60 + index * 25;
          return `<circle cx="400" cy="300" r="${radius}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5,5" opacity="0.4"/>`;
        }).join('')}
        
        <!-- Wind Arrow -->
        <line x1="200" y1="200" x2="${200 + Math.cos(windDirection * Math.PI / 180) * windSpeed * 10}" 
              y2="${200 + Math.sin(windDirection * Math.PI / 180) * windSpeed * 10}" 
              stroke="#87ceeb" stroke-width="3"/>
        
        <!-- Labels -->
        <text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">Flare Stack</text>
        <text x="400" y="340" text-anchor="middle" font-family="Arial" font-size="12">Height: ${flareHeight.toFixed(1)}m</text>
        <text x="400" y="355" text-anchor="middle" font-family="Arial" font-size="12">Tip Diameter: ${tipDiameter.toFixed(2)}m</text>
        <text x="400" y="370" text-anchor="middle" font-family="Arial" font-size="12">Flame Length: ${flameLength.toFixed(1)}m</text>
        <text x="400" y="385" text-anchor="middle" font-family="Arial" font-size="12">Tilt: ${flameTilt.toFixed(1)}°</text>
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flare-3d-view.svg';
    link.click();
    URL.revokeObjectURL(url);
    
    onExportPNG?.();
  };

  const toggleLayer = (layer: keyof typeof showLayers) => {
    setShowLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset View
        </Button>
        
        <Button
          onClick={() => toggleLayer('flame')}
          variant={showLayers.flame ? 'default' : 'outline'}
          size="sm"
        >
          <Flame className="h-4 w-4 mr-2" />
          Flame
        </Button>
        
        <Button
          onClick={() => toggleLayer('radiation')}
          variant={showLayers.radiation ? 'default' : 'outline'}
          size="sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          Radiation
        </Button>
        
        <Button
          onClick={() => toggleLayer('noise')}
          variant={showLayers.noise ? 'default' : 'outline'}
          size="sm"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Noise
        </Button>
        
        <Button
          onClick={() => toggleLayer('wind')}
          variant={showLayers.wind ? 'default' : 'outline'}
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

      {/* 3D Visualization */}
      <div className="w-full h-96 border rounded-lg relative bg-gradient-to-b from-sky-200 to-green-200" style={{ minHeight: '400px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔥</div>
            <div className="text-lg font-semibold">Flare 3D Visualization</div>
            <div className="text-sm text-muted-foreground">
              Height: {flareHeight.toFixed(1)}m | Diameter: {tipDiameter.toFixed(2)}m
            </div>
            <div className="text-sm text-muted-foreground">
              Flame: {flameLength.toFixed(1)}m | Tilt: {flameTilt.toFixed(1)}°
            </div>
            
            {/* Radiation Contours */}
            {showLayers.radiation && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Radiation Contours (kW/m²)</div>
                {radiationContours.map((contour, index) => (
                  <div key={index} className="flex items-center justify-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-xs">{contour.level.toFixed(1)} kW/m²</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Noise Contours */}
            {showLayers.noise && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Noise Contours (dB(A))</div>
                {noiseContours.map((contour, index) => (
                  <div key={index} className="flex items-center justify-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-blue-400' : 'bg-cyan-400'}`}></div>
                    <span className="text-xs">{contour.level.toFixed(0)} dB(A)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleExportPNGInternal} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download View (SVG)
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

export default Flare3DViewerFallback;
