import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// Note: OrbitControls would need to be imported from three/examples/jsm/controls/OrbitControls
// For now, we'll implement a basic camera control system
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
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [layers, setLayers] = useState({
    flame: true,
    radiation: true,
    noise: true,
    contours: true,
    wind: true
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(80, 60, 80);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Store camera reference
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(200, 50, 0x888888, 0x888888);
    scene.add(gridHelper);

    // Render function
    const render = () => {
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing flare objects
    const scene = sceneRef.current;
    const objectsToRemove = scene.children.filter(child => 
      child.userData.type === 'flare' || 
      child.userData.type === 'flame' || 
      child.userData.type === 'radiation' || 
      child.userData.type === 'noise' ||
      child.userData.type === 'wind'
    );
    objectsToRemove.forEach(obj => scene.remove(obj));

    // Draw flare stack
    if (layers.flame) {
      const stackGeometry = new THREE.CylinderGeometry(
        tipDiameter / 2,
        tipDiameter / 2,
        flareHeight,
        16
      );
      const stackMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const stack = new THREE.Mesh(stackGeometry, stackMaterial);
      stack.position.y = flareHeight / 2;
      stack.castShadow = true;
      stack.userData.type = 'flare';
      scene.add(stack);

      // Draw flame
      const flameGeometry = new THREE.ConeGeometry(
        tipDiameter / 2,
        flameLength,
        16
      );
      const flameMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xff4500,
        transparent: true,
        opacity: 0.8
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.y = flareHeight;
      flame.rotation.z = -flameTilt * Math.PI / 180;
      flame.userData.type = 'flame';
      scene.add(flame);
    }

    // Draw radiation shells
    if (layers.radiation) {
      radiationContours.forEach((contour, index) => {
        const colors = [0xff0000, 0xff8800, 0xffff00];
        const color = colors[index] || 0xff0000;
        
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        contour.points.forEach((point, i) => {
          vertices.push(point.x, point.z, point.y);
          if (i > 0) {
            indices.push(i - 1, i);
          }
        });
        
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const material = new THREE.LineBasicMaterial({ 
          color,
          transparent: true,
          opacity: 0.6
        });
        const line = new THREE.Line(geometry, material);
        line.userData.type = 'radiation';
        scene.add(line);
      });
    }

    // Draw noise shells
    if (layers.noise) {
      noiseContours.forEach((contour, index) => {
        const colors = [0x0066ff, 0x00aaff, 0x00ffff];
        const color = colors[index] || 0x0066ff;
        
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        contour.points.forEach((point, i) => {
          vertices.push(point.x, point.z, point.y);
          if (i > 0) {
            indices.push(i - 1, i);
          }
        });
        
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const material = new THREE.LineBasicMaterial({ 
          color,
          transparent: true,
          opacity: 0.4
        });
        const line = new THREE.Line(geometry, material);
        line.userData.type = 'noise';
        scene.add(line);
      });
    }

    // Draw wind arrow
    if (layers.wind && windSpeed > 0) {
      const windGeometry = new THREE.ConeGeometry(2, 10, 8);
      const windMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
      const windArrow = new THREE.Mesh(windGeometry, windMaterial);
      windArrow.position.set(20, 5, 0);
      windArrow.rotation.y = windDirection * Math.PI / 180;
      windArrow.userData.type = 'wind';
      scene.add(windArrow);
    }

  }, [
    flareHeight, tipDiameter, flameLength, flameTilt, windSpeed, windDirection,
    radiationContours, noiseContours, layers
  ]);

  const handleResetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(80, 60, 80);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleExportPNG = () => {
    if (rendererRef.current) {
      const canvas = rendererRef.current.domElement;
      const link = document.createElement('a');
      link.download = 'flare-3d-view.png';
      link.href = canvas.toDataURL();
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
      <div 
        ref={mountRef} 
        className="w-full h-96 border rounded-lg relative"
        style={{ minHeight: '400px' }}
      />

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
