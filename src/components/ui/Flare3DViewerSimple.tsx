import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, RotateCcw, Eye, EyeOff, Wind, 
  Flame, Zap, Volume2, Layers, Camera
} from 'lucide-react';
import * as THREE from 'three';

interface Flare3DViewerSimpleProps {
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

const Flare3DViewerSimple = ({
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
}: Flare3DViewerSimpleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(80, 60, 80);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

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

    // Flare stack
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
    scene.add(stack);

    // Flame
    const flameGeometry = new THREE.ConeGeometry(tipDiameter / 2, flameLength, 16);
    const flameMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xff4500, 
      transparent: true, 
      opacity: 0.8 
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = flareHeight;
    flame.rotation.z = -flameTilt * Math.PI / 180;
    flame.castShadow = true;
    scene.add(flame);

    // Wind arrow
    if (windSpeed > 0) {
      const windGeometry = new THREE.ConeGeometry(2, 10, 8);
      const windMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
      const windArrow = new THREE.Mesh(windGeometry, windMaterial);
      windArrow.position.set(20, 5, 0);
      windArrow.rotation.y = windDirection * Math.PI / 180;
      scene.add(windArrow);
    }

    // Radiation contours
    radiationContours.forEach((contour, index) => {
      const colors = [0xff0000, 0xff8800, 0xffff00];
      const color = colors[index] || 0xff0000;
      
      contour.points.forEach((point) => {
        const sphereGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
          color, 
          transparent: true, 
          opacity: 0.6 
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(point.x, point.z, point.y);
        scene.add(sphere);
      });
    });

    // Noise contours
    noiseContours.forEach((contour, index) => {
      const colors = [0x0066ff, 0x00aaff, 0x00ffff];
      const color = colors[index] || 0x0066ff;
      
      contour.points.forEach((point) => {
        const boxGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const boxMaterial = new THREE.MeshBasicMaterial({ 
          color, 
          transparent: true, 
          opacity: 0.4 
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(point.x, point.z, point.y);
        scene.add(box);
      });
    });

    // Simple orbit controls
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetX += deltaX * 0.01;
      targetY += deltaY * 0.01;

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event: WheelEvent) => {
      const delta = event.deltaY * 0.01;
      camera.position.multiplyScalar(1 + delta);
    };

    canvasRef.current.addEventListener('mousedown', onMouseDown);
    canvasRef.current.addEventListener('mouseup', onMouseUp);
    canvasRef.current.addEventListener('mousemove', onMouseMove);
    canvasRef.current.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Update camera position
      const radius = Math.sqrt(
        camera.position.x ** 2 + 
        camera.position.z ** 2
      );
      camera.position.x = radius * Math.cos(targetX);
      camera.position.z = radius * Math.sin(targetX);
      camera.position.y = Math.max(10, camera.position.y + targetY * 0.1);
      camera.lookAt(0, 0, 0);

      targetY *= 0.95; // Damping

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', onMouseDown);
        canvasRef.current.removeEventListener('mouseup', onMouseUp);
        canvasRef.current.removeEventListener('mousemove', onMouseMove);
        canvasRef.current.removeEventListener('wheel', onWheel);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [
    flareHeight, tipDiameter, flameLength, flameTilt, 
    windSpeed, windDirection, radiationContours, noiseContours
  ]);

  const handleResetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(80, 60, 80);
      cameraRef.current.lookAt(0, 0, 0);
    }
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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleResetView} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset View
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
          style={{ width: '100%', height: '100%', cursor: 'grab' }}
        />
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

export default Flare3DViewerSimple;
