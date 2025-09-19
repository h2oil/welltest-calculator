import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  AlertTriangle,
  Layers,
  Download,
  RefreshCw
} from 'lucide-react';

import { config } from '@/lib/config';
import type { Completion, UnitSystem } from '@/types/open-prosper';

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

export const WellSchematicViewer: React.FC<WellSchematicViewerProps> = React.memo(({
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

    // Validate inputs
    if (!wellName.trim()) {
      setError('Well name is required');
      setLoading(false);
      return;
    }

    if (totalDepth <= 0) {
      setError('Total depth must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      // Try backend first
      try {
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

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSchematicImage(`data:image/png;base64,${result.image_base64}`);
            return;
          }
        }
      } catch (backendError) {
        // Silently fall back to local generation
      }

      // Fallback: Generate simple schematic using SVG
      generateSVGSchematic();
      
    } catch (err) {
      setError(`Error generating schematic: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSVGSchematic = () => {
    try {
      // Create SVG using DOM methods to avoid CSP violations
      const svgWidth = 1000;
      const svgHeight = 800;
    
    // Wellbore dimensions
    const wellX = 150;
    const wellWidth = 40;
    const wellTop = 80;
    const wellBottom = svgHeight - 80;
    const wellHeight = wellBottom - wellTop;

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth.toString());
    svg.setAttribute('height', svgHeight.toString());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', '#f8f9fa');
    svg.appendChild(background);

    // Depth scale line
    const depthLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    depthLine.setAttribute('x1', (wellX - 50).toString());
    depthLine.setAttribute('y1', wellTop.toString());
    depthLine.setAttribute('x2', (wellX - 50).toString());
    depthLine.setAttribute('y2', wellBottom.toString());
    depthLine.setAttribute('stroke', '#374151');
    depthLine.setAttribute('stroke-width', '3');
    svg.appendChild(depthLine);

    // Depth markers
    for (let i = 0; i <= 10; i++) {
      const y = wellTop + (wellHeight * i / 10);
      const depth = Math.round(totalDepth * i / 10);
      
      // Tick mark
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', (wellX - 60).toString());
      tick.setAttribute('y1', y.toString());
      tick.setAttribute('x2', (wellX - 40).toString());
      tick.setAttribute('y2', y.toString());
      tick.setAttribute('stroke', '#374151');
      tick.setAttribute('stroke-width', '2');
      svg.appendChild(tick);
      
      // Depth label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (wellX - 120).toString());
      text.setAttribute('y', (y + 4).toString());
      text.setAttribute('font-family', 'monospace');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#374151');
      text.textContent = `${depth} ${getLengthUnit}`;
      svg.appendChild(text);
    }

    // Wellbore background
    const wellbore = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    wellbore.setAttribute('x', wellX.toString());
    wellbore.setAttribute('y', wellTop.toString());
    wellbore.setAttribute('width', wellWidth.toString());
    wellbore.setAttribute('height', wellHeight.toString());
    wellbore.setAttribute('fill', '#e5e7eb');
    wellbore.setAttribute('stroke', '#374151');
    wellbore.setAttribute('stroke-width', '2');
    svg.appendChild(wellbore);

    // Casings
    casings.forEach((casing, index) => {
      const topDepth = casing.top_depth || 0;
      const bottomDepth = casing.bottom_depth || topDepth + 100;
      
      const topY = wellTop + (wellHeight * topDepth / totalDepth);
      const bottomY = wellTop + (wellHeight * bottomDepth / totalDepth);
      
      const casingWidth = Math.max(8, wellWidth * 0.8);
      const casingX = wellX + (wellWidth - casingWidth) / 2;
      
      // Casing rectangle
      const casingRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      casingRect.setAttribute('x', casingX.toString());
      casingRect.setAttribute('y', topY.toString());
      casingRect.setAttribute('width', casingWidth.toString());
      casingRect.setAttribute('height', (bottomY - topY).toString());
      casingRect.setAttribute('fill', '#6b7280');
      casingRect.setAttribute('stroke', '#374151');
      casingRect.setAttribute('stroke-width', '1');
      svg.appendChild(casingRect);
      
      // Casing label
      const casingLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      casingLabel.setAttribute('x', (wellX + wellWidth + 20).toString());
      casingLabel.setAttribute('y', (topY + 15).toString());
      casingLabel.setAttribute('font-family', 'sans-serif');
      casingLabel.setAttribute('font-size', '10');
      casingLabel.setAttribute('font-weight', 'bold');
      casingLabel.setAttribute('fill', '#000');
      casingLabel.textContent = casing.name || `Casing ${index + 1}`;
      svg.appendChild(casingLabel);
    });

    // Completions
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    completions.forEach((completion, index: number) => {
      const topDepth = completion.top_depth || 0;
      const bottomDepth = completion.bottom_depth || topDepth + 50;
      
      const topY = wellTop + (wellHeight * topDepth / totalDepth);
      const bottomY = wellTop + (wellHeight * bottomDepth / totalDepth);
      
      const deviceWidth = Math.max(6, wellWidth * 0.6);
      const deviceX = wellX + (wellWidth - deviceWidth) / 2;
      
      // Completion rectangle
      const completionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      completionRect.setAttribute('x', deviceX.toString());
      completionRect.setAttribute('y', topY.toString());
      completionRect.setAttribute('width', deviceWidth.toString());
      completionRect.setAttribute('height', (bottomY - topY).toString());
      completionRect.setAttribute('fill', colors[index % colors.length] || '#3b82f6');
      completionRect.setAttribute('stroke', '#000');
      completionRect.setAttribute('stroke-width', '1');
      svg.appendChild(completionRect);
      
      // Completion label
      const completionLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      completionLabel.setAttribute('x', (wellX + wellWidth + 20).toString());
      completionLabel.setAttribute('y', (topY + 15).toString());
      completionLabel.setAttribute('font-family', 'sans-serif');
      completionLabel.setAttribute('font-size', '10');
      completionLabel.setAttribute('fill', '#000');
      completionLabel.textContent = completion.name || `Device ${index + 1}`;
      svg.appendChild(completionLabel);
    });

    // Well name and title
    const wellNameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    wellNameText.setAttribute('x', wellX.toString());
    wellNameText.setAttribute('y', '50');
    wellNameText.setAttribute('font-family', 'sans-serif');
    wellNameText.setAttribute('font-size', '18');
    wellNameText.setAttribute('font-weight', 'bold');
    wellNameText.setAttribute('fill', '#000');
    wellNameText.textContent = wellName;
    svg.appendChild(wellNameText);

    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', wellX.toString());
    titleText.setAttribute('y', '70');
    titleText.setAttribute('font-family', 'sans-serif');
    titleText.setAttribute('font-size', '14');
    titleText.setAttribute('fill', '#000');
    titleText.textContent = 'Well Schematic';
    svg.appendChild(titleText);

    // Legend
    const legendTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    legendTitle.setAttribute('x', (wellX + wellWidth + 200).toString());
    legendTitle.setAttribute('y', wellTop.toString());
    legendTitle.setAttribute('font-family', 'sans-serif');
    legendTitle.setAttribute('font-size', '12');
    legendTitle.setAttribute('font-weight', 'bold');
    legendTitle.setAttribute('fill', '#000');
    legendTitle.textContent = 'Legend:';
    svg.appendChild(legendTitle);

    // Casing legend
    const casingLegendRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    casingLegendRect.setAttribute('x', (wellX + wellWidth + 200).toString());
    casingLegendRect.setAttribute('y', (wellTop + 15).toString());
    casingLegendRect.setAttribute('width', '15');
    casingLegendRect.setAttribute('height', '8');
    casingLegendRect.setAttribute('fill', '#6b7280');
    svg.appendChild(casingLegendRect);

    const casingLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    casingLegendText.setAttribute('x', (wellX + wellWidth + 220).toString());
    casingLegendText.setAttribute('y', (wellTop + 25).toString());
    casingLegendText.setAttribute('font-family', 'sans-serif');
    casingLegendText.setAttribute('font-size', '10');
    casingLegendText.setAttribute('fill', '#000');
    casingLegendText.textContent = 'Casing';
    svg.appendChild(casingLegendText);

    // Completion legend
    completions.forEach((completion, index: number) => {
      const legendRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      legendRect.setAttribute('x', (wellX + wellWidth + 200).toString());
      legendRect.setAttribute('y', (wellTop + 35 + index * 20).toString());
      legendRect.setAttribute('width', '15');
      legendRect.setAttribute('height', '8');
      legendRect.setAttribute('fill', colors[index % colors.length] || '#3b82f6');
      svg.appendChild(legendRect);

      const legendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      legendText.setAttribute('x', (wellX + wellWidth + 220).toString());
      legendText.setAttribute('y', (wellTop + 45 + index * 20).toString());
      legendText.setAttribute('font-family', 'sans-serif');
      legendText.setAttribute('font-size', '10');
      legendText.setAttribute('fill', '#000');
      legendText.textContent = completion.name || `Device ${index + 1}`;
      svg.appendChild(legendText);
    });

      // Convert SVG to data URL
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
      setSchematicImage(svgDataUrl);
    } catch (svgError) {
      setError(`Error generating SVG schematic: ${svgError instanceof Error ? svgError.message : 'Unknown error'}`);
    }
  };

  const addCasing = useCallback(() => {
    setCasings(prev => [...prev, {
      name: `Casing-${prev.length + 1}`,
      top_depth: 0,
      bottom_depth: 1000,
      outer_diameter: 9.625,
      inner_diameter: 8.535,
      weight: 40
    }]);
  }, []);

  const removeCasing = useCallback((index: number) => {
    setCasings(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateCasing = useCallback((index: number, field: keyof CasingData, value: string | number) => {
    setCasings(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  }, []);

  const getLengthUnit = useMemo(() => unitSystem === 'metric' ? 'm' : 'ft', [unitSystem]);
  const getDiameterUnit = useMemo(() => unitSystem === 'metric' ? 'm' : 'in', [unitSystem]);

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
                  <Label htmlFor="total-depth">Total Depth ({getLengthUnit})</Label>
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
                          <Label>Top Depth ({getLengthUnit})</Label>
                          <Input
                            type="number"
                            value={casing.top_depth}
                            onChange={(e) => updateCasing(index, 'top_depth', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Bottom Depth ({getLengthUnit})</Label>
                          <Input
                            type="number"
                            value={casing.bottom_depth}
                            onChange={(e) => updateCasing(index, 'bottom_depth', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>OD ({getDiameterUnit})</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={casing.outer_diameter}
                            onChange={(e) => updateCasing(index, 'outer_diameter', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>ID ({getDiameterUnit})</Label>
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
});
