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
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSchematicImage(`data:image/png;base64,${result.image_base64}`);
            return;
          }
        }
      } catch (backendError) {
        console.warn('Backend not available, using fallback:', backendError);
      }

      // Fallback: Generate simple schematic using Canvas API
      generateFallbackSchematic();
      
    } catch (err) {
      setError(`Error generating schematic: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackSchematic = () => {
    // Create a simple schematic using HTML5 Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 800;

    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wellbore dimensions
    const wellX = 150;
    const wellWidth = 40;
    const wellTop = 80;
    const wellBottom = canvas.height - 80;

    // Draw depth scale (left side)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wellX - 50, wellTop);
    ctx.lineTo(wellX - 50, wellBottom);
    ctx.stroke();

    // Add depth markers
    ctx.fillStyle = '#374151';
    ctx.font = '12px monospace';
    for (let i = 0; i <= 10; i++) {
      const y = wellTop + (wellBottom - wellTop) * (i / 10);
      const depth = totalDepth * (i / 10);
      
      // Depth tick marks
      ctx.beginPath();
      ctx.moveTo(wellX - 60, y);
      ctx.lineTo(wellX - 40, y);
      ctx.stroke();
      
      // Depth labels
      ctx.fillText(`${Math.round(depth)} ${getLengthUnit()}`, wellX - 120, y + 4);
    }

    // Draw wellbore (background)
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(wellX, wellTop, wellWidth, wellBottom - wellTop);

    // Draw wellbore outline
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(wellX, wellTop, wellWidth, wellBottom - wellTop);

    // Draw casings first (behind everything)
    casings.forEach((casing, index) => {
      const topDepth = casing.top_depth || 0;
      const bottomDepth = casing.bottom_depth || topDepth + 100;
      
      const topY = wellTop + (wellBottom - wellTop) * (topDepth / totalDepth);
      const bottomY = wellTop + (wellBottom - wellTop) * (bottomDepth / totalDepth);
      
      // Casing (thicker, darker)
      const casingWidth = Math.max(8, wellWidth * 0.8);
      const casingX = wellX + (wellWidth - casingWidth) / 2;
      
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(casingX, topY, casingWidth, bottomY - topY);
      
      // Casing outline
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.strokeRect(casingX, topY, casingWidth, bottomY - topY);
      
      // Casing label
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(casing.name || `Casing ${index + 1}`, wellX + wellWidth + 20, topY + 15);
    });

    // Draw completions/devices inside the wellbore
    completions.forEach((completion, index) => {
      const topDepth = completion.top_depth || 0;
      const bottomDepth = completion.bottom_depth || topDepth + 50;
      
      const topY = wellTop + (wellBottom - wellTop) * (topDepth / totalDepth);
      const bottomY = wellTop + (wellBottom - wellTop) * (bottomDepth / totalDepth);
      
      // Device inside wellbore
      const deviceWidth = Math.max(6, wellWidth * 0.6);
      const deviceX = wellX + (wellWidth - deviceWidth) / 2;
      
      // Different colors for different completion types
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(deviceX, topY, deviceWidth, bottomY - topY);
      
      // Device outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(deviceX, topY, deviceWidth, bottomY - topY);
      
      // Device label
      ctx.fillStyle = '#000';
      ctx.font = '10px sans-serif';
      ctx.fillText(completion.name || `Device ${index + 1}`, wellX + wellWidth + 20, topY + 15);
    });

    // Draw well name and title
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(wellName, wellX, 50);
    
    ctx.font = '14px sans-serif';
    ctx.fillText('Well Schematic', wellX, 70);

    // Add legend
    const legendX = wellX + wellWidth + 200;
    const legendY = wellTop;
    
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Legend:', legendX, legendY);
    
    let legendItemY = legendY + 25;
    
    // Casing legend
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(legendX, legendItemY - 10, 15, 8);
    ctx.fillStyle = '#000';
    ctx.font = '10px sans-serif';
    ctx.fillText('Casing', legendX + 20, legendItemY);
    legendItemY += 20;
    
    // Completion legend
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    colors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendItemY - 10, 15, 8);
      ctx.fillStyle = '#000';
      ctx.fillText(`Completion ${index + 1}`, legendX + 20, legendItemY);
      legendItemY += 20;
    });

    // Convert to base64
    const dataURL = canvas.toDataURL('image/png');
    setSchematicImage(dataURL);
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
