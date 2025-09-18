import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Plus, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Wrench,
  Target,
  Layers,
  Circle,
  Square,
  Triangle,
  Download,
  RefreshCw
} from 'lucide-react';

import { config } from '@/lib/config';
import type { Completion, Device, PerforationInterval, DeviceType, UnitSystem } from '@/types/open-prosper';

interface WellSchematicViewerProps {
  completion: Completion | undefined;
  unitSystem: UnitSystem;
  onUpdate: (completion: Completion) => void;
}

interface CasingData {
  name: string;
  top_depth: number;
  bottom_depth: number;
  outer_diameter: number;
  inner_diameter: number;
  weight: number;
}

interface CompletionData {
  name: string;
  top_depth: number;
  bottom_depth: number;
  outer_diameter: number;
  inner_diameter: number;
  completion_type: string;
}

export const WellSchematicViewer: React.FC<WellSchematicViewerProps> = ({
  completion,
  unitSystem,
  onUpdate
}) => {
  const [wellName, setWellName] = useState('Well-001');
  const [totalDepth, setTotalDepth] = useState(5000);
  const [casings, setCasings] = useState<CasingData[]>([]);
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [schematicImage, setSchematicImage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Convert completion data to well schematics format
  useEffect(() => {
    if (completion) {
      // Convert devices to completions
      const completionData: CompletionData[] = completion.devices.map(device => ({
        name: device.id,
        top_depth: device.md_start,
        bottom_depth: device.md_end,
        outer_diameter: device.id_outer || 0,
        inner_diameter: device.id_inner || 0,
        completion_type: device.type
      }));

      // Convert perforations to completions
      const perforationData: CompletionData[] = completion.perforations.map(perf => ({
        name: perf.id,
        top_depth: perf.md_start,
        bottom_depth: perf.md_end,
        outer_diameter: 0.5, // Default perforation diameter
        inner_diameter: 0.5,
        completion_type: 'perforation'
      }));

      setCompletions([...completionData, ...perforationData]);
      
      // Set total depth based on completion data
      const maxDepth = Math.max(
        ...completion.devices.map(d => d.md_end),
        ...completion.perforations.map(p => p.md_end)
      );
      if (maxDepth > 0) {
        setTotalDepth(maxDepth + 1000); // Add 1000ft below
      }
    }
  }, [completion]);

  const generateSchematic = async () => {
    setLoading(true);
    setError('');

    try {
      // Try backend first
      try {
        console.log('Attempting to connect to backend:', `${config.backendUrl}/well-schematics/generate-schematic`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${config.backendUrl}/well-schematics/generate-schematic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            well_name: wellName,
            total_depth: totalDepth,
            casings: casings,
            completions: completions,
            open_holes: []
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('Backend response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSchematicImage(`data:image/png;base64,${result.image_base64}`);
            return;
          } else {
            console.warn('Backend returned error:', result.message);
          }
        } else {
          console.warn('Backend returned non-OK status:', response.status, response.statusText);
        }
      } catch (backendError) {
        if (backendError.name === 'AbortError') {
          console.warn('Backend request timed out, using fallback');
        } else {
          console.warn('Backend connection failed, using fallback:', backendError);
        }
        // Don't set error here, just use fallback
      }

      // Fallback: Generate simple schematic using SVG
      console.log('Using SVG fallback schematic generation');
      generateSVGSchematic();
      
      // Show a subtle notification that we're using fallback
      console.info('Backend unavailable - using local schematic generation');
      
    } catch (err) {
      console.error('Schematic generation error:', err);
      setError(`Error generating schematic: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSVGSchematic = () => {
    // Create SVG schematic
    const svgWidth = 1000;
    const svgHeight = 800;
    
    // Wellbore dimensions
    const wellX = 150;
    const wellWidth = 40;
    const wellTop = 80;
    const wellBottom = svgHeight - 80;
    const wellHeight = wellBottom - wellTop;

    // Generate depth markers
    const depthMarkers = [];
    for (let i = 0; i <= 10; i++) {
      const y = wellTop + (wellHeight * i / 10);
      const depth = Math.round(totalDepth * i / 10);
      depthMarkers.push({
        y,
        depth,
        id: `depth-${i}`
      });
    }

    // Generate casing elements
    const casingElements = casings.map((casing, index) => {
      const topDepth = casing.top_depth || 0;
      const bottomDepth = casing.bottom_depth || topDepth + 100;
      
      const topY = wellTop + (wellHeight * topDepth / totalDepth);
      const bottomY = wellTop + (wellHeight * bottomDepth / totalDepth);
      
      const casingWidth = Math.max(8, wellWidth * 0.8);
      const casingX = wellX + (wellWidth - casingWidth) / 2;
      
      return {
        x: casingX,
        y: topY,
        width: casingWidth,
        height: bottomY - topY,
        name: casing.name || `Casing ${index + 1}`,
        id: `casing-${index}`
      };
    });

    // Generate completion elements
    const completionElements = completions.map((completion, index) => {
      const topDepth = completion.top_depth || 0;
      const bottomDepth = completion.bottom_depth || topDepth + 50;
      
      const topY = wellTop + (wellHeight * topDepth / totalDepth);
      const bottomY = wellTop + (wellHeight * bottomDepth / totalDepth);
      
      const deviceWidth = Math.max(6, wellWidth * 0.6);
      const deviceX = wellX + (wellWidth - deviceWidth) / 2;
      
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      
      return {
        x: deviceX,
        y: topY,
        width: deviceWidth,
        height: bottomY - topY,
        name: completion.name || `Device ${index + 1}`,
        color: colors[index % colors.length],
        id: `completion-${index}`
      };
    });

    // Create SVG string
    const svgContent = `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        
        <!-- Depth scale line -->
        <line x1="${wellX - 50}" y1="${wellTop}" x2="${wellX - 50}" y2="${wellBottom}" 
              stroke="#374151" stroke-width="3"/>
        
        <!-- Depth markers -->
        ${depthMarkers.map(marker => `
          <line x1="${wellX - 60}" y1="${marker.y}" x2="${wellX - 40}" y2="${marker.y}" 
                stroke="#374151" stroke-width="2"/>
          <text x="${wellX - 120}" y="${marker.y + 4}" font-family="monospace" font-size="12" 
                fill="#374151">${marker.depth} ${getLengthUnit()}</text>
        `).join('')}
        
        <!-- Wellbore background -->
        <rect x="${wellX}" y="${wellTop}" width="${wellWidth}" height="${wellHeight}" 
              fill="#e5e7eb" stroke="#374151" stroke-width="2"/>
        
        <!-- Casings -->
        ${casingElements.map(casing => `
          <rect x="${casing.x}" y="${casing.y}" width="${casing.width}" height="${casing.height}" 
                fill="#6b7280" stroke="#374151" stroke-width="1"/>
          <text x="${wellX + wellWidth + 20}" y="${casing.y + 15}" font-family="sans-serif" 
                font-size="10" font-weight="bold" fill="#000">${casing.name}</text>
        `).join('')}
        
        <!-- Completions -->
        ${completionElements.map(completion => `
          <rect x="${completion.x}" y="${completion.y}" width="${completion.width}" 
                height="${completion.height}" fill="${completion.color}" stroke="#000" stroke-width="1"/>
          <text x="${wellX + wellWidth + 20}" y="${completion.y + 15}" font-family="sans-serif" 
                font-size="10" fill="#000">${completion.name}</text>
        `).join('')}
        
        <!-- Well name and title -->
        <text x="${wellX}" y="50" font-family="sans-serif" font-size="18" font-weight="bold" fill="#000">${wellName}</text>
        <text x="${wellX}" y="70" font-family="sans-serif" font-size="14" fill="#000">Well Schematic</text>
        
        <!-- Legend -->
        <text x="${wellX + wellWidth + 200}" y="${wellTop}" font-family="sans-serif" 
              font-size="12" font-weight="bold" fill="#000">Legend:</text>
        
        <!-- Casing legend -->
        <rect x="${wellX + wellWidth + 200}" y="${wellTop + 15}" width="15" height="8" fill="#6b7280"/>
        <text x="${wellX + wellWidth + 220}" y="${wellTop + 25}" font-family="sans-serif" 
              font-size="10" fill="#000">Casing</text>
        
        <!-- Completion legend -->
        ${completionElements.map((completion, index) => `
          <rect x="${wellX + wellWidth + 200}" y="${wellTop + 35 + index * 20}" width="15" height="8" 
                fill="${completion.color}"/>
          <text x="${wellX + wellWidth + 220}" y="${wellTop + 45 + index * 20}" font-family="sans-serif" 
                font-size="10" fill="#000">${completion.name}</text>
        `).join('')}
      </svg>
    `;

    // Convert SVG to data URL
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    setSchematicImage(svgDataUrl);
  };

  const addCasing = () => {
    setCasings([...casings, {
      name: `Casing-${casings.length + 1}`,
      top_depth: 0,
      bottom_depth: 1000,
      outer_diameter: 9.625,
      inner_diameter: 8.535,
      weight: 40
    }]);
  };

  const removeCasing = (index: number) => {
    setCasings(casings.filter((_, i) => i !== index));
  };

  const updateCasing = (index: number, field: keyof CasingData, value: any) => {
    const updated = [...casings];
    updated[index] = { ...updated[index], [field]: value };
    setCasings(updated);
  };

  const getLengthUnit = () => unitSystem === 'metric' ? 'm' : 'ft';
  const getDiameterUnit = () => unitSystem === 'metric' ? 'm' : 'in';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Well Schematic Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="configuration" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="casings">Casings</TabsTrigger>
              <TabsTrigger value="schematic">Schematic</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuration" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="well-name">Well Name</Label>
                  <Input
                    id="well-name"
                    value={wellName}
                    onChange={(e) => setWellName(e.target.value)}
                    placeholder="Enter well name"
                  />
                </div>
                <div>
                  <Label htmlFor="total-depth">Total Depth ({getLengthUnit()})</Label>
                  <Input
                    id="total-depth"
                    type="number"
                    value={totalDepth}
                    onChange={(e) => setTotalDepth(Number(e.target.value))}
                    placeholder="Enter total depth"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Button onClick={generateSchematic} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Schematic...
                    </>
                  ) : (
                    <>
                      <Layers className="h-4 w-4 mr-2" />
                      Generate Well Schematic
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="casings" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Casing Strings</h3>
                <Button onClick={addCasing}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Casing
                </Button>
              </div>
              
              <div className="space-y-4">
                {casings.map((casing, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={casing.name}
                            onChange={(e) => updateCasing(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Top Depth ({getLengthUnit()})</Label>
                          <Input
                            type="number"
                            value={casing.top_depth}
                            onChange={(e) => updateCasing(index, 'top_depth', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Bottom Depth ({getLengthUnit()})</Label>
                          <Input
                            type="number"
                            value={casing.bottom_depth}
                            onChange={(e) => updateCasing(index, 'bottom_depth', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>OD ({getDiameterUnit()})</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={casing.outer_diameter}
                            onChange={(e) => updateCasing(index, 'outer_diameter', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>ID ({getDiameterUnit()})</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={casing.inner_diameter}
                            onChange={(e) => updateCasing(index, 'inner_diameter', Number(e.target.value))}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeCasing(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="schematic" className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {schematicImage ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Generated Well Schematic</h3>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = schematicImage;
                        link.download = `${wellName}-schematic.png`;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-white">
                    <img
                      src={schematicImage}
                      alt="Well Schematic"
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No schematic generated yet. Configure your well and click "Generate Well Schematic".</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
