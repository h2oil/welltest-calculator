import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, RotateCcw, Eye, EyeOff, Wind, 
  Flame, Zap, Volume2, Layers, Camera
} from 'lucide-react';

interface Flare3DViewerCanvasProps {
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

const Flare3DViewerCanvas = ({
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
}: Flare3DViewerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewAngle, setViewAngle] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState({
    flame: true,
    radiation: true,
    noise: true,
    wind: true
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Scale factor
    const scale = zoom * 2;

    // Draw ground plane
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, centerY + 100, canvas.width, canvas.height - centerY - 100);

    // Draw flare stack
    const stackWidth = tipDiameter * scale * 10;
    const stackHeight = flareHeight * scale;
    const stackX = centerX - stackWidth / 2;
    const stackY = centerY - stackHeight;

    ctx.fillStyle = '#666666';
    ctx.fillRect(stackX, stackY, stackWidth, stackHeight);

    // Draw flame
    if (showLayers.flame) {
      const flameWidth = tipDiameter * scale * 8;
      const flameHeight = flameLength * scale;
      const flameX = centerX - flameWidth / 2;
      const flameY = stackY - flameHeight;

      // Apply tilt
      const tiltRad = (flameTilt * Math.PI) / 180;
      const tiltOffset = Math.sin(tiltRad) * flameHeight * 0.3;

      ctx.save();
      ctx.translate(centerX, stackY);
      ctx.rotate(tiltRad);
      ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
      ctx.beginPath();
      ctx.ellipse(0, -flameHeight / 2, flameWidth / 2, flameHeight / 2, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // Draw radiation contours
    if (showLayers.radiation) {
      radiationContours.forEach((contour, index) => {
        const colors = ['#ff0000', '#ff8800', '#ffff00'];
        const color = colors[index] || '#ff0000';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        
        contour.points.forEach((point, pointIndex) => {
          const x = centerX + point.x * scale;
          const y = centerY - point.z * scale;
          
          if (pointIndex === 0) {
            ctx.beginPath();
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    // Draw noise contours
    if (showLayers.noise) {
      noiseContours.forEach((contour, index) => {
        const colors = ['#0066ff', '#00aaff', '#00ffff'];
        const color = colors[index] || '#0066ff';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([5, 5]);
        
        contour.points.forEach((point, pointIndex) => {
          const x = centerX + point.x * scale;
          const y = centerY - point.z * scale;
          
          if (pointIndex === 0) {
            ctx.beginPath();
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // Draw wind arrow
    if (showLayers.wind && windSpeed > 0) {
      const arrowLength = windSpeed * scale * 2;
      const arrowX = centerX + 200;
      const arrowY = centerY - 100;
      const windRad = (windDirection * Math.PI) / 180;

      ctx.strokeStyle = '#87ceeb';
      ctx.fillStyle = '#87ceeb';
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX + Math.cos(windRad) * arrowLength,
        arrowY + Math.sin(windRad) * arrowLength
      );
      ctx.stroke();

      // Arrow head
      const headSize = 10;
      const headX = arrowX + Math.cos(windRad) * arrowLength;
      const headY = arrowY + Math.sin(windRad) * arrowLength;
      
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(
        headX - Math.cos(windRad - 0.3) * headSize,
        headY - Math.sin(windRad - 0.3) * headSize
      );
      ctx.lineTo(
        headX - Math.cos(windRad + 0.3) * headSize,
        headY - Math.sin(windRad + 0.3) * headSize
      );
      ctx.closePath();
      ctx.fill();
    }

    // Draw labels
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Flare Stack', centerX, centerY + 20);
    
    ctx.font = '12px Arial';
    ctx.fillText(`Height: ${flareHeight.toFixed(1)}m`, centerX, centerY + 40);
    ctx.fillText(`Tip Diameter: ${tipDiameter.toFixed(2)}m`, centerX, centerY + 55);
    ctx.fillText(`Flame Length: ${flameLength.toFixed(1)}m`, centerX, centerY + 70);
    ctx.fillText(`Tilt: ${flameTilt.toFixed(1)}°`, centerX, centerY + 85);

  }, [flareHeight, tipDiameter, flameLength, flameTilt, windSpeed, windDirection, 
      radiationContours, noiseContours, showLayers, zoom, viewAngle]);

  const handleResetView = () => {
    setViewAngle(0);
    setZoom(1);
  };

  const handleExportPNGInternal = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'flare-3d-view.png';
      link.href = dataURL;
      link.click();
    }
    onExportPNG?.();
  };

  const toggleLayer = (layer: keyof typeof showLayers) => {
    setShowLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
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

      {/* 3D Canvas */}
      <div className="w-full h-96 border rounded-lg relative" style={{ minHeight: '400px' }}>
        <canvas 
          ref={canvasRef} 
          className="w-full h-full cursor-move"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleExportPNGInternal} variant="outline" size="sm">
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

export default Flare3DViewerCanvas;
