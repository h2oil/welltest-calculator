import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, Flame, Zap, Volume2, Wind, Compass, Ruler, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Flare2DViewerProps {
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
  unitSystem: 'metric' | 'field';
  onExportPNG?: () => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
}

interface ContourData {
  level: number;
  maxDistance: number;
  points: Array<{x: number; y: number; z: number}>;
  polarRadii?: number[];
}

const Flare2DViewer: React.FC<Flare2DViewerProps> = ({
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
  unitSystem,
  onExportPNG,
  onExportCSV,
  onExportJSON
}) => {
  const topViewRef = useRef<HTMLCanvasElement>(null);
  const sideViewRef = useRef<HTMLCanvasElement>(null);
  const [hoveredContour, setHoveredContour] = useState<{type: 'radiation' | 'noise', level: number, distance: number} | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [topZoom, setTopZoom] = useState(1);
  const [sideZoom, setSideZoom] = useState(1);
  const [topPan, setTopPan] = useState({ x: 0, y: 0 });
  const [sidePan, setSidePan] = useState({ x: 0, y: 0 });
  const { toast } = useToast();

  // Convert units based on system
  const getLengthUnit = () => unitSystem === 'metric' ? 'm' : 'ft';
  const getLengthFactor = () => unitSystem === 'metric' ? 1 : 3.28084;
  const getPowerUnit = () => unitSystem === 'metric' ? 'kW/m²' : 'Btu/hr·ft²';
  const getSoundUnit = () => 'dB(A)';

  // Process contour data for 2D views
  const processContours = useCallback(() => {
    const radiationData: ContourData[] = radiationContours.map(contour => {
      // Use polarRadii if available, otherwise calculate from points
      const maxDistance = (contour as any).polarRadii 
        ? Math.max(...(contour as any).polarRadii)
        : Math.max(...contour.points.map(p => Math.sqrt(p.x*p.x + p.y*p.y)));
      
      return {
        level: contour.level,
        maxDistance,
        points: contour.points,
        polarRadii: (contour as any).polarRadii
      };
    });

    const noiseData: ContourData[] = noiseContours.map(contour => {
      // Use polarRadii if available, otherwise calculate from points
      const maxDistance = (contour as any).polarRadii 
        ? Math.max(...(contour as any).polarRadii)
        : Math.max(...contour.points.map(p => Math.sqrt(p.x*p.x + p.y*p.y)));
      
      return {
        level: contour.level,
        maxDistance,
        points: contour.points,
        polarRadii: (contour as any).polarRadii
      };
    });

    return { radiationData, noiseData };
  }, [radiationContours, noiseContours]);

  // Draw Top View (Plan)
  const drawTopView = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { radiationData, noiseData } = processContours();
    
    // Set high DPI for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    const centerX = displayWidth / 2 + topPan.x;
    const centerY = displayHeight / 2 + topPan.y;
    const scale = Math.min(displayWidth, displayHeight) / 200 * topZoom; // 200m base scale
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    
    // Scale the drawing context so everything will work at the higher ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Set the display size (CSS pixels)
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw grid with meter measurements
    if (showGrid) {
      ctx.strokeStyle = '#e9ecef';
      ctx.lineWidth = 0.5;
      ctx.font = '10px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      
      // Calculate grid spacing based on zoom level - 10m divisions, max 200m
      const baseGridSize = 10; // 10m base grid
      const gridSize = baseGridSize * scale;
      const gridSpacing = Math.max(15, Math.min(60, gridSize)); // Min 15px, max 60px
      
      // Draw vertical grid lines
      for (let x = centerX % gridSpacing; x < displayWidth; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
        ctx.stroke();
        
        // Add distance labels on x-axis
        if (showLabels && x !== centerX) {
          const distance = Math.abs((x - centerX) / scale);
          if (distance > 0 && distance % 20 === 0 && distance <= 200) { // Every 20m, max 200m
            ctx.fillText(
              `${(distance * getLengthFactor()).toFixed(0)}${getLengthUnit()}`,
              x, displayHeight - 5
            );
          }
        }
      }
      
      // Draw horizontal grid lines
      for (let y = centerY % gridSpacing; y < displayHeight; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
        
        // Add distance labels on y-axis
        if (showLabels && y !== centerY) {
          const distance = Math.abs((y - centerY) / scale);
          if (distance > 0 && distance % 20 === 0 && distance <= 200) { // Every 20m, max 200m
            ctx.save();
            ctx.translate(10, y);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(
              `${(distance * getLengthFactor()).toFixed(0)}${getLengthUnit()}`,
              0, 0
            );
            ctx.restore();
          }
        }
      }
      
      // Draw center crosshairs
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, displayHeight);
      ctx.moveTo(0, centerY);
      ctx.lineTo(displayWidth, centerY);
      ctx.stroke();
    }

    // Draw radiation contours
    radiationData.forEach((contour, index) => {
      const color = index === 0 ? 'rgba(255, 0, 0, 0.3)' : 
                   index === 1 ? 'rgba(255, 136, 0, 0.3)' : 
                   'rgba(255, 255, 0, 0.3)';
      
      ctx.fillStyle = color;
      ctx.strokeStyle = color.replace('0.3', '0.8');
      ctx.lineWidth = 2;
      
      // Draw contour using polar radii for wind effects
      if (contour.polarRadii && contour.polarRadii.length > 0) {
        ctx.beginPath();
        const numPoints = contour.polarRadii.length;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i * 2 * Math.PI) / numPoints;
          const distance = contour.polarRadii[i] * scale;
          const x = centerX + distance * Math.cos(angle);
          const y = centerY + distance * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Fallback to circular contour
        const radius = contour.maxDistance * scale;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Draw distance labels
      if (showLabels) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const radius = contour.maxDistance * scale;
        ctx.fillText(
          `${(contour.maxDistance * getLengthFactor()).toFixed(0)} ${getLengthUnit()}`,
          centerX, centerY - radius - 10
        );
        ctx.fillText(
          `${contour.level.toFixed(1)} ${getPowerUnit()}`,
          centerX, centerY - radius - 25
        );
      }
    });

    // Draw noise contours
    noiseData.forEach((contour, index) => {
      const color = index === 0 ? 'rgba(0, 102, 255, 0.2)' : 
                   index === 1 ? 'rgba(0, 170, 255, 0.2)' : 
                   'rgba(0, 255, 255, 0.2)';
      
      ctx.fillStyle = color;
      ctx.strokeStyle = color.replace('0.2', '0.6');
      ctx.lineWidth = 1;
      
      // Draw contour using polar radii for wind effects
      if (contour.polarRadii && contour.polarRadii.length > 0) {
        ctx.beginPath();
        const numPoints = contour.polarRadii.length;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i * 2 * Math.PI) / numPoints;
          const distance = contour.polarRadii[i] * scale;
          const x = centerX + distance * Math.cos(angle);
          const y = centerY + distance * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Fallback to circular contour
        const radius = contour.maxDistance * scale;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Draw distance labels
      if (showLabels) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const radius = contour.maxDistance * scale;
        ctx.fillText(
          `${(contour.maxDistance * getLengthFactor()).toFixed(0)} ${getLengthUnit()}`,
          centerX, centerY + radius + 20
        );
        ctx.fillText(
          `${contour.level.toFixed(0)} ${getSoundUnit()}`,
          centerX, centerY + radius + 35
        );
      }
    });

    // Draw flare stack center
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw wind direction arrow
    if (windSpeed > 0) {
      const arrowLength = 30;
      const arrowHead = 8;
      const arrowX = centerX + Math.cos(windDirection * Math.PI / 180) * arrowLength;
      const arrowY = centerY + Math.sin(windDirection * Math.PI / 180) * arrowLength;

      ctx.strokeStyle = '#87ceeb';
      ctx.fillStyle = '#87ceeb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(arrowX, arrowY);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowHead * Math.cos((windDirection - 30) * Math.PI / 180),
        arrowY - arrowHead * Math.sin((windDirection - 30) * Math.PI / 180)
      );
      ctx.lineTo(
        arrowX - arrowHead * Math.cos((windDirection + 30) * Math.PI / 180),
        arrowY - arrowHead * Math.sin((windDirection + 30) * Math.PI / 180)
      );
      ctx.closePath();
      ctx.fill();
    }

    // Draw compass
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // N, S, E, W labels
    ctx.fillText('N', centerX, centerY - 60);
    ctx.fillText('S', centerX, centerY + 70);
    ctx.fillText('E', centerX + 60, centerY);
    ctx.fillText('W', centerX - 60, centerY);
    
    // Compass lines
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 50);
    ctx.lineTo(centerX, centerY + 50);
    ctx.moveTo(centerX - 50, centerY);
    ctx.lineTo(centerX + 50, centerY);
    ctx.stroke();
    
    // Add max range indicator
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Max Range: 200${getLengthUnit()}`, centerX, displayHeight - 5);
  }, [processContours, topPan, topZoom, showGrid, showLabels, windSpeed, windDirection, getLengthFactor, getLengthUnit, getPowerUnit, getSoundUnit]);

  // Draw Side View (Elevation)
  const drawSideView = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { radiationData, noiseData } = processContours();
    
    // Set high DPI for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    const centerX = displayWidth / 2 + sidePan.x;
    const groundY = displayHeight - 50 + sidePan.y;
    const scale = Math.min(displayWidth, displayHeight) / 200 * sideZoom;
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    
    // Scale the drawing context so everything will work at the higher ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Set the display size (CSS pixels)
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw grid with meter measurements
    if (showGrid) {
      ctx.strokeStyle = '#e9ecef';
      ctx.lineWidth = 0.5;
      ctx.font = '10px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      
      // Calculate grid spacing based on zoom level - 10m divisions, max 200m
      const baseGridSize = 10; // 10m base grid
      const gridSize = baseGridSize * scale;
      const gridSpacing = Math.max(15, Math.min(60, gridSize)); // Min 15px, max 60px
      
      // Draw vertical grid lines
      for (let x = centerX % gridSpacing; x < displayWidth; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
        ctx.stroke();
        
        // Add distance labels on x-axis
        if (showLabels && x !== centerX) {
          const distance = Math.abs((x - centerX) / scale);
          if (distance > 0 && distance % 20 === 0 && distance <= 200) { // Every 20m, max 200m
            ctx.fillText(
              `${(distance * getLengthFactor()).toFixed(0)}${getLengthUnit()}`,
              x, displayHeight - 5
            );
          }
        }
      }
      
      // Draw horizontal grid lines
      for (let y = 0; y < displayHeight; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
        
        // Add height labels on y-axis
        if (showLabels) {
          const height = Math.abs((groundY - y) / scale);
          if (height > 0 && height % 10 === 0 && height <= 200) { // Every 10m height, max 200m
            ctx.save();
            ctx.translate(10, y);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(
              `${(height * getLengthFactor()).toFixed(0)}${getLengthUnit()}`,
              0, 0
            );
            ctx.restore();
          }
        }
      }
      
      // Draw center crosshairs
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, displayHeight);
      ctx.moveTo(0, groundY);
      ctx.lineTo(displayWidth, groundY);
      ctx.stroke();
    }

    // Draw ground
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, groundY, displayWidth, 50);

    // Draw flare stack
    const stackHeight = flareHeight * scale;
    const stackWidth = tipDiameter * scale * 10; // Exaggerate for visibility
    ctx.fillStyle = '#666';
    ctx.fillRect(centerX - stackWidth / 2, groundY - stackHeight, stackWidth, stackHeight);

    // Draw flame
    const flameBaseX = centerX;
    const flameBaseY = groundY - stackHeight;
    const flameTipX = flameBaseX + flameLength * scale * Math.sin(flameTilt * Math.PI / 180);
    const flameTipY = flameBaseY - flameLength * scale * Math.cos(flameTilt * Math.PI / 180);

    ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(flameBaseX - stackWidth / 2, flameBaseY);
    ctx.lineTo(flameBaseX + stackWidth / 2, flameBaseY);
    ctx.lineTo(flameTipX, flameTipY);
    ctx.closePath();
    ctx.fill();

    // Draw radiation contours (vertical cross-section)
    radiationData.forEach((contour, index) => {
      const color = index === 0 ? 'rgba(255, 0, 0, 0.3)' : 
                   index === 1 ? 'rgba(255, 136, 0, 0.3)' : 
                   'rgba(255, 255, 0, 0.3)';
      
      ctx.fillStyle = color;
      ctx.strokeStyle = color.replace('0.3', '0.8');
      ctx.lineWidth = 2;
      
      // Draw contour as vertical curve
      const maxDist = contour.maxDistance * scale;
      ctx.beginPath();
      ctx.arc(centerX, groundY, maxDist, 0, Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw distance labels
      if (showLabels) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${(contour.maxDistance * getLengthFactor()).toFixed(0)} ${getLengthUnit()}`,
          centerX + maxDist / 2, groundY - 20
        );
        ctx.fillText(
          `${contour.level.toFixed(1)} ${getPowerUnit()}`,
          centerX + maxDist / 2, groundY - 35
        );
      }
    });

    // Draw noise contours (vertical cross-section)
    noiseData.forEach((contour, index) => {
      const color = index === 0 ? 'rgba(0, 102, 255, 0.2)' : 
                   index === 1 ? 'rgba(0, 170, 255, 0.2)' : 
                   'rgba(0, 255, 255, 0.2)';
      
      ctx.fillStyle = color;
      ctx.strokeStyle = color.replace('0.2', '0.6');
      ctx.lineWidth = 1;
      
      // Draw contour as vertical curve
      const maxDist = contour.maxDistance * scale;
      ctx.beginPath();
      ctx.arc(centerX, groundY, maxDist, 0, Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw distance labels
      if (showLabels) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${(contour.maxDistance * getLengthFactor()).toFixed(0)} ${getLengthUnit()}`,
          centerX + maxDist / 2, groundY + 20
        );
        ctx.fillText(
          `${contour.level.toFixed(0)} ${getSoundUnit()}`,
          centerX + maxDist / 2, groundY + 35
        );
      }
    });

    // Draw scale reference
    const scaleLength = 50 * scale;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, groundY - 20);
    ctx.lineTo(20 + scaleLength, groundY - 20);
    ctx.stroke();
    
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${50 * getLengthFactor()} ${getLengthUnit()}`, 20, groundY - 25);
    
    // Add max range indicator
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Max Range: 200${getLengthUnit()}`, displayWidth / 2, groundY - 5);
  }, [processContours, sidePan, sideZoom, showGrid, showLabels, flareHeight, tipDiameter, flameLength, flameTilt, getLengthFactor, getLengthUnit, getPowerUnit, getSoundUnit]);

  // Handle mouse events for interactivity
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>, viewType: 'top' | 'side') => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate distance from center
    const centerX = canvas.width / 2;
    const centerY = viewType === 'top' ? canvas.height / 2 : canvas.height - 50;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    // Check if hovering over a contour
    const { radiationData, noiseData } = processContours();
    const currentZoom = viewType === 'top' ? topZoom : sideZoom;
    const scale = Math.min(canvas.clientWidth, canvas.clientHeight) / 200 * currentZoom;
    
    // Check radiation contours
    for (const contour of radiationData) {
      const radius = contour.maxDistance * scale;
      if (Math.abs(distance - radius) < 10) {
        setHoveredContour({
          type: 'radiation',
          level: contour.level,
          distance: contour.maxDistance * getLengthFactor()
        });
        return;
      }
    }
    
    // Check noise contours
    for (const contour of noiseData) {
      const radius = contour.maxDistance * scale;
      if (Math.abs(distance - radius) < 10) {
        setHoveredContour({
          type: 'noise',
          level: contour.level,
          distance: contour.maxDistance * getLengthFactor()
        });
        return;
      }
    }
    
    setHoveredContour(null);
  }, [processContours, topZoom, sideZoom, getLengthFactor]);

  // Redraw canvases when data changes
  useEffect(() => {
    const topCanvas = topViewRef.current;
    const sideCanvas = sideViewRef.current;
    
    if (topCanvas) {
      const ctx = topCanvas.getContext('2d');
      if (ctx) drawTopView(ctx, topCanvas);
    }
    
    if (sideCanvas) {
      const ctx = sideCanvas.getContext('2d');
      if (ctx) drawSideView(ctx, sideCanvas);
    }
  }, [drawTopView, drawSideView]);

  // Handle zoom and pan for Top View
  const handleTopWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setTopZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  const handleTopMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const startX = event.clientX;
    const startY = event.clientY;
    const startPan = { ...topPan };

    const handleMouseMove = (e: MouseEvent) => {
      setTopPan({
        x: startPan.x + (e.clientX - startX),
        y: startPan.y + (e.clientY - startY)
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [topPan]);

  // Handle zoom and pan for Side View
  const handleSideWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setSideZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  const handleSideMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const startX = event.clientX;
    const startY = event.clientY;
    const startPan = { ...sidePan };

    const handleMouseMove = (e: MouseEvent) => {
      setSidePan({
        x: startPan.x + (e.clientX - startX),
        y: startPan.y + (e.clientY - startY)
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidePan]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => setShowGrid(!showGrid)}
            variant={showGrid ? 'default' : 'outline'}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            onClick={() => setShowLabels(!showLabels)}
            variant={showLabels ? 'default' : 'outline'}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Labels
          </Button>
          <Button
            onClick={() => { 
              setTopZoom(1); setTopPan({ x: 0, y: 0 });
              setSideZoom(1); setSidePan({ x: 0, y: 0 });
            }}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Both Views
          </Button>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Top View:</span>
            <Button
              onClick={() => setTopZoom(prev => Math.max(0.1, prev * 0.8))}
              variant="outline"
              size="sm"
            >
              -
            </Button>
            <span className="text-sm font-mono w-16 text-center">
              {(topZoom * 100).toFixed(0)}%
            </span>
            <Button
              onClick={() => setTopZoom(prev => Math.min(5, prev * 1.25))}
              variant="outline"
              size="sm"
            >
              +
            </Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Side View:</span>
            <Button
              onClick={() => setSideZoom(prev => Math.max(0.1, prev * 0.8))}
              variant="outline"
              size="sm"
            >
              -
            </Button>
            <span className="text-sm font-mono w-16 text-center">
              {(sideZoom * 100).toFixed(0)}%
            </span>
            <Button
              onClick={() => setSideZoom(prev => Math.min(5, prev * 1.25))}
              variant="outline"
              size="sm"
            >
              +
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onExportPNG} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
          <Button onClick={onExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onExportJSON} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Hover Info */}
      {hoveredContour && (
        <Card className="absolute top-20 right-4 z-10 w-64">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {hoveredContour.type === 'radiation' ? (
                <Zap className="h-4 w-4 text-red-500" />
              ) : (
                <Volume2 className="h-4 w-4 text-blue-500" />
              )}
              <span className="font-semibold">
                {hoveredContour.type === 'radiation' ? 'Radiation' : 'Noise'} Contour
              </span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Level:</span>
                <Badge variant="outline">
                  {hoveredContour.level.toFixed(1)} {hoveredContour.type === 'radiation' ? getPowerUnit() : getSoundUnit()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Distance:</span>
                <Badge variant="outline">
                  {hoveredContour.distance.toFixed(0)} {getLengthUnit()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="text-sm text-blue-800">
            <strong>Navigation:</strong> Mouse wheel to zoom • Click and drag to pan • Hover over contours for details
          </div>
        </CardContent>
      </Card>

      {/* Two View Layout - Stacked Vertically */}
      <div className="space-y-6">
        {/* Top View */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Compass className="h-5 w-5" />
              Top View – Heat & Noise Footprints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[500px] border rounded-lg relative overflow-hidden">
              <canvas
                ref={topViewRef}
                className="w-full h-full cursor-move"
                onMouseMove={(e) => handleMouseMove(e, 'top')}
                onWheel={handleTopWheel}
                onMouseDown={handleTopMouseDown}
              />
            </div>
          </CardContent>
        </Card>

        {/* Side View */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Side View – Vertical Section
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[500px] border rounded-lg relative overflow-hidden">
              <canvas
                ref={sideViewRef}
                className="w-full h-full cursor-move"
                onMouseMove={(e) => handleMouseMove(e, 'side')}
                onWheel={handleSideWheel}
                onMouseDown={handleSideMouseDown}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Contour Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Radiation Levels
              </h4>
              <div className="space-y-1">
                {radiationContours.map((contour, index) => {
                  const colors = ['#ff0000', '#ff8800', '#ffff00'];
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2"
                        style={{ backgroundColor: colors[index] + '40', borderColor: colors[index] }}
                      />
                      <span className="text-sm">
                        {contour.level.toFixed(1)} {getPowerUnit()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Noise Levels
              </h4>
              <div className="space-y-1">
                {noiseContours.map((contour, index) => {
                  const colors = ['#0066ff', '#00aaff', '#00ffff'];
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2"
                        style={{ backgroundColor: colors[index] + '40', borderColor: colors[index] }}
                      />
                      <span className="text-sm">
                        {contour.level.toFixed(0)} {getSoundUnit()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Flare2DViewer;
