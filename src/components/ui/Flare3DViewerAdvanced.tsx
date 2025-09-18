import { useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, RotateCcw, Eye, EyeOff, Wind, 
  Flame, Zap, Volume2, Layers, Camera
} from 'lucide-react';
import * as THREE from 'three';

interface Flare3DViewerAdvancedProps {
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

// Flare Stack Component
function FlareStack({ height, diameter }: { height: number; diameter: number }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[diameter / 2, diameter / 2, height, 16]} />
        <meshLambertMaterial color="#666666" />
      </mesh>
    </group>
  );
}

// Flame Component
function Flame({ 
  length, 
  diameter, 
  tilt, 
  height 
}: { 
  length: number; 
  diameter: number; 
  tilt: number; 
  height: number; 
}) {
  return (
    <group position={[0, height, 0]} rotation={[0, 0, -tilt * Math.PI / 180]}>
      <mesh castShadow>
        <coneGeometry args={[diameter / 2, length, 16]} />
        <meshLambertMaterial color="#ff4500" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Radiation Contour Component
function RadiationContour({ 
  contour, 
  index 
}: { 
  contour: { level: number; points: Array<{x: number; y: number; z: number}> }; 
  index: number; 
}) {
  const colors = ['#ff0000', '#ff8800', '#ffff00'];
  const color = colors[index] || '#ff0000';
  
  const points = contour.points.map(p => new THREE.Vector3(p.x, p.z, p.y));
  
  return (
    <group>
      {points.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Noise Contour Component
function NoiseContour({ 
  contour, 
  index 
}: { 
  contour: { level: number; points: Array<{x: number; y: number; z: number}> }; 
  index: number; 
}) {
  const colors = ['#0066ff', '#00aaff', '#00ffff'];
  const color = colors[index] || '#0066ff';
  
  const points = contour.points.map(p => new THREE.Vector3(p.x, p.z, p.y));
  
  return (
    <group>
      {points.map((point, i) => (
        <mesh key={i} position={point}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Wind Arrow Component
function WindArrow({ 
  speed, 
  direction 
}: { 
  speed: number; 
  direction: number; 
}) {
  if (speed <= 0) return null;
  
  return (
    <group position={[20, 5, 0]} rotation={[0, direction * Math.PI / 180, 0]}>
      <mesh>
        <coneGeometry args={[2, 10, 8]} />
        <meshLambertMaterial color="#87CEEB" />
      </mesh>
    </group>
  );
}

// Ground Plane Component
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshLambertMaterial color="#90EE90" />
    </mesh>
  );
}

// Scene Component
function Scene({
  flareHeight,
  tipDiameter,
  flameLength,
  flameTilt,
  windSpeed,
  windDirection,
  radiationContours,
  noiseContours,
  layers
}: {
  flareHeight: number;
  tipDiameter: number;
  flameLength: number;
  flameTilt: number;
  windSpeed: number;
  windDirection: number;
  radiationContours: Array<{ level: number; points: Array<{x: number; y: number; z: number}> }>;
  noiseContours: Array<{ level: number; points: Array<{x: number; y: number; z: number}> }>;
  layers: {
    flame: boolean;
    radiation: boolean;
    noise: boolean;
    contours: boolean;
    wind: boolean;
  };
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 50, 50]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <GroundPlane />
      
      <Grid
        args={[200, 50]}
        position={[0, 0, 0]}
        cellSize={4}
        cellThickness={0.5}
        cellColor="#888888"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#888888"
        fadeDistance={100}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
      
      {layers.flame && (
        <>
          <FlareStack height={flareHeight} diameter={tipDiameter} />
          <Flame 
            length={flameLength} 
            diameter={tipDiameter} 
            tilt={flameTilt} 
            height={flareHeight} 
          />
        </>
      )}
      
      {layers.radiation && radiationContours.map((contour, index) => (
        <RadiationContour key={`rad-${index}`} contour={contour} index={index} />
      ))}
      
      {layers.noise && noiseContours.map((contour, index) => (
        <NoiseContour key={`noise-${index}`} contour={contour} index={index} />
      ))}
      
      {layers.wind && (
        <WindArrow speed={windSpeed} direction={windDirection} />
      )}
    </>
  );
}

const Flare3DViewerAdvanced = ({
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
}: Flare3DViewerAdvancedProps) => {
  const [layers, setLayers] = useState({
    flame: true,
    radiation: true,
    noise: true,
    contours: true,
    wind: true
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleResetView = () => {
    // Reset camera position - this will be handled by OrbitControls
    // Reset view functionality
  };

  const handleExportPNG = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'flare-3d-view.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
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

      {/* 3D Canvas */}
      <div className="w-full h-96 border rounded-lg relative" style={{ minHeight: '400px' }}>
        <Canvas
          ref={canvasRef}
          shadows
          camera={{ position: [80, 60, 80], fov: 75 }}
          style={{ width: '100%', height: '100%' }}
        >
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={500}
            target={[0, 0, 0]}
          />
          
          <Scene
            flareHeight={flareHeight}
            tipDiameter={tipDiameter}
            flameLength={flameLength}
            flameTilt={flameTilt}
            windSpeed={windSpeed}
            windDirection={windDirection}
            radiationContours={radiationContours}
            noiseContours={noiseContours}
            layers={layers}
          />
        </Canvas>
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

export default Flare3DViewerAdvanced;
