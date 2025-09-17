import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, RotateCcw, Info, AlertTriangle, Settings, Download, 
  Droplets, Thermometer, Gauge, Zap, Filter, Flame, 
  ChevronRight, ChevronDown, Play, Pause, Save, Upload,
  Plus, Minus, Move, BarChart3, TrendingUp, Activity
} from 'lucide-react';

import { 
  solveNetwork, createDefaultNetwork, createDefaultFluidSpec,
  type NodeSpec, type SegmentSpec, type FluidSpec, type NetworkResult
} from '@/lib/flow-assurance-engine';
import { copyResultsToClipboard } from '@/lib/storage';
import { convertToSI, convertFromSI, DEFAULT_UNITS } from '@/lib/unit-conversions-enhanced';
import ProcessFlowDiagram from '@/components/ui/ProcessFlowDiagram';
import type { UnitSystem, FluidKind, NodeKind } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const FlowAssuranceEnhanced = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  
  // Network configuration
  const [nodes, setNodes] = useState<NodeSpec[]>([]);
  const [segments, setSegments] = useState<SegmentSpec[]>([]);
  const [fluidSpec, setFluidSpec] = useState<FluidSpec>(createDefaultFluidSpec());
  
  // Results
  const [networkResult, setNetworkResult] = useState<NetworkResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('network');

  // Initialize with default network
  useEffect(() => {
    const defaultNetwork = createDefaultNetwork();
    setNodes(defaultNetwork.nodes);
    setSegments(defaultNetwork.segments);
  }, []);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (nodes.length > 0 && segments.length > 0) {
      calculateNetwork();
    }
  }, [nodes, segments, fluidSpec, unitSystem]);

  const calculateNetwork = async () => {
    setIsCalculating(true);
    try {
      const result = solveNetwork(nodes, segments, fluidSpec);
      setNetworkResult(result);
    } catch (error) {
      console.error('Network calculation error:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate network. Check your inputs.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleNodeChange = (nodeId: string, field: keyof NodeSpec, value: any) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, [field]: value } : node
    ));
  };

  const handleSegmentChange = (segmentId: string, field: keyof SegmentSpec, value: any) => {
    setSegments(prev => prev.map(segment => 
      segment.id === segmentId ? { ...segment, [field]: value } : segment
    ));
  };

  const handleFluidSpecChange = (field: keyof FluidSpec, value: any) => {
    setFluidSpec(prev => ({ ...prev, [field]: value }));
  };

  const addNode = () => {
    const newNodeId = `node_${Date.now()}`;
    const newNode: NodeSpec = {
      id: newNodeId,
      kind: 'custom',
      label: 'New Node'
    };
    setNodes(prev => [...prev, newNode]);
  };

  const removeNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setSegments(prev => prev.filter(segment => 
      segment.from !== nodeId && segment.to !== nodeId
    ));
  };

  const addSegment = () => {
    if (nodes.length < 2) return;
    
    const newSegmentId = `seg_${Date.now()}`;
    const newSegment: SegmentSpec = {
      id: newSegmentId,
      from: nodes[0].id,
      to: nodes[1].id,
      length_m: 10,
      id_inner_m: 0.1023, // 4" pipe
      roughness_m: 4.6e-5,
      fittingsK: 0,
      elevation_change_m: 0
    };
    setSegments(prev => [...prev, newSegment]);
  };

  const removeSegment = (segmentId: string) => {
    setSegments(prev => prev.filter(segment => segment.id !== segmentId));
  };

  const handleReset = () => {
    const defaultNetwork = createDefaultNetwork();
    setNodes(defaultNetwork.nodes);
    setSegments(defaultNetwork.segments);
    setFluidSpec(createDefaultFluidSpec());
    setNetworkResult(null);
  };

  const handleExportPNG = () => {
    toast({
      title: "Export PNG",
      description: "PNG export functionality will be implemented",
    });
  };

  const handleExportCSV = () => {
    if (!networkResult) return;
    
    const csvData = [
      ['Node', 'Pressure (kPa)', 'Temperature (K)', 'Velocity (m/s)', 'Density (kg/m³)', 'Warnings'],
      ...networkResult.nodes.map(node => [
        node.label,
        node.pressure_kPa.toFixed(2),
        node.temperature_K.toFixed(2),
        node.velocity_m_s?.toFixed(2) || 'N/A',
        node.density_kg_m3.toFixed(2),
        node.warnings.join('; ')
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow_assurance_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!networkResult) return;
    
    const jsonData = {
      timestamp: new Date().toISOString(),
      nodes,
      segments,
      fluidSpec,
      results: networkResult
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow_assurance_network.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyResults = async () => {
    if (!networkResult) return;
    
    try {
      await copyResultsToClipboard(networkResult, 'flow-assurance');
      toast({
        title: "Results Copied",
        description: "Flow assurance results copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy results to clipboard",
        variant: "destructive",
      });
    }
  };

  // Unit conversion functions
  const getPressureUnit = () => unitSystem === 'metric' ? 'bar' : 'psi';
  const getTemperatureUnit = () => unitSystem === 'metric' ? '°C' : '°F';
  const getLengthUnit = () => unitSystem === 'metric' ? 'm' : 'ft';
  const getDiameterUnit = () => unitSystem === 'metric' ? 'mm' : 'in';
  const getFlowUnit = () => unitSystem === 'metric' ? 'm³/d' : 'MSCFD';

  const convertPressureToSI = (value: number) => {
    return unitSystem === 'metric' ? value * 100000 : value * 6894.76; // bar to Pa or psi to Pa
  };

  const convertPressureFromSI = (value: number) => {
    return unitSystem === 'metric' ? value / 100000 : value / 6894.76; // Pa to bar or Pa to psi
  };

  const convertTemperatureToSI = (value: number) => {
    return unitSystem === 'metric' ? value + 273.15 : (value - 32) * 5/9 + 273.15; // °C to K or °F to K
  };

  const convertTemperatureFromSI = (value: number) => {
    return unitSystem === 'metric' ? value - 273.15 : (value - 273.15) * 9/5 + 32; // K to °C or K to °F
  };

  const convertLengthToSI = (value: number) => {
    return unitSystem === 'metric' ? value : value * 0.3048; // ft to m
  };

  const convertLengthFromSI = (value: number) => {
    return unitSystem === 'metric' ? value : value / 0.3048; // m to ft
  };

  const convertDiameterToSI = (value: number) => {
    return unitSystem === 'metric' ? value / 1000 : value * 0.0254; // mm to m or in to m
  };

  const convertDiameterFromSI = (value: number) => {
    return unitSystem === 'metric' ? value * 1000 : value / 0.0254; // m to mm or m to in
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Flow Assurance Network with Pressure Profile & Choke Setting
          </CardTitle>
          <CardDescription className="text-center">
            Advanced pressure drop analysis with configurable nodes, segments, and choke modeling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="fluid">Fluid Properties</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="network" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Node Configuration */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Network Nodes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {nodes.length} nodes configured
                      </span>
                      <Button onClick={addNode} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Node
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {nodes.map((node, index) => (
                        <div key={node.id} className="flex items-center gap-2 p-2 border rounded">
                          <span className="text-sm font-mono w-8">{index + 1}</span>
                          <Input
                            value={node.label}
                            onChange={(e) => handleNodeChange(node.id, 'label', e.target.value)}
                            className="flex-1"
                          />
                          <Select
                            value={node.kind}
                            onValueChange={(value: NodeKind) => handleNodeChange(node.id, 'kind', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="wellhead">Wellhead</SelectItem>
                              <SelectItem value="esd">ESD</SelectItem>
                              <SelectItem value="sand_filter">Sand Filter</SelectItem>
                              <SelectItem value="choke">Choke</SelectItem>
                              <SelectItem value="separator">Separator</SelectItem>
                              <SelectItem value="heater">Heater</SelectItem>
                              <SelectItem value="manifold">Manifold</SelectItem>
                              <SelectItem value="valve">Valve</SelectItem>
                              <SelectItem value="meter">Meter</SelectItem>
                              <SelectItem value="flare">Flare</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => removeNode(node.id)}
                            variant="outline"
                            size="sm"
                            disabled={nodes.length <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Segment Configuration */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Pipe Segments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {segments.length} segments configured
                      </span>
                      <Button onClick={addSegment} size="sm" disabled={nodes.length < 2}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Segment
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {segments.map((segment, index) => (
                        <div key={segment.id} className="p-3 border rounded space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono w-8">{index + 1}</span>
                            <Select
                              value={segment.from}
                              onValueChange={(value) => handleSegmentChange(segment.id, 'from', value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {nodes.map(node => (
                                  <SelectItem key={node.id} value={node.id}>
                                    {node.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <ChevronRight className="h-4 w-4" />
                            <Select
                              value={segment.to}
                              onValueChange={(value) => handleSegmentChange(segment.id, 'to', value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {nodes.map(node => (
                                  <SelectItem key={node.id} value={node.id}>
                                    {node.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => removeSegment(segment.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Length ({getLengthUnit()})</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={convertLengthFromSI(segment.length_m)}
                                onChange={(e) => handleSegmentChange(segment.id, 'length_m', convertLengthToSI(parseFloat(e.target.value) || 0))}
                                className="text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Pipe ID ({getDiameterUnit()})</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={convertDiameterFromSI(segment.id_inner_m)}
                                onChange={(e) => handleSegmentChange(segment.id, 'id_inner_m', convertDiameterToSI(parseFloat(e.target.value) || 0))}
                                className="text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Fittings K</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={segment.fittingsK || 0}
                                onChange={(e) => handleSegmentChange(segment.id, 'fittingsK', parseFloat(e.target.value) || 0)}
                                className="text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Elevation ({getLengthUnit()})</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={convertLengthFromSI(segment.elevation_change_m || 0)}
                                onChange={(e) => handleSegmentChange(segment.id, 'elevation_change_m', convertLengthToSI(parseFloat(e.target.value) || 0))}
                                className="text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Process Flow Diagram */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Process Flow Diagram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProcessFlowDiagram
                    outputs={networkResult}
                    isCalculating={isCalculating}
                    onNodeClick={setSelectedNode}
                    selectedNode={selectedNode}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fluid" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fluid Properties */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Fluid Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Fluid Type</Label>
                      <Select
                        value={fluidSpec.kind}
                        onValueChange={(value: FluidKind) => handleFluidSpecChange('kind', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gas">Gas</SelectItem>
                          <SelectItem value="liquid">Liquid</SelectItem>
                          <SelectItem value="two-phase">Two-Phase</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Wellhead Pressure ({getPressureUnit()})</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={convertPressureFromSI(fluidSpec.P_in_kPa * 1000)}
                        onChange={(e) => handleFluidSpecChange('P_in_kPa', convertPressureToSI(parseFloat(e.target.value) || 0) / 1000)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Wellhead Temperature ({getTemperatureUnit()})</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={convertTemperatureFromSI(fluidSpec.T_K)}
                        onChange={(e) => handleFluidSpecChange('T_K', convertTemperatureToSI(parseFloat(e.target.value) || 0))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Standard Flow Rate ({getFlowUnit()})</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={fluidSpec.q_std.value}
                        onChange={(e) => handleFluidSpecChange('q_std', {
                          ...fluidSpec.q_std,
                          value: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Gas Properties */}
                {fluidSpec.kind === 'gas' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        Gas Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Compressibility Factor (Z)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fluidSpec.Z || 1.0}
                          onChange={(e) => handleFluidSpecChange('Z', parseFloat(e.target.value) || 1.0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Specific Heat Ratio (k)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fluidSpec.k || 1.30}
                          onChange={(e) => handleFluidSpecChange('k', parseFloat(e.target.value) || 1.30)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Molecular Weight (kg/kmol)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={fluidSpec.MW_kg_per_kmol || 18.2}
                          onChange={(e) => handleFluidSpecChange('MW_kg_per_kmol', parseFloat(e.target.value) || 18.2)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Gas Specific Gravity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={fluidSpec.gamma_g || 0.7}
                          onChange={(e) => handleFluidSpecChange('gamma_g', parseFloat(e.target.value) || 0.7)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Liquid Properties */}
                {(fluidSpec.kind === 'liquid' || fluidSpec.kind === 'two-phase') && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Liquid Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Liquid Density (kg/m³)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={fluidSpec.rho_liq_kg_per_m3 || 850}
                          onChange={(e) => handleFluidSpecChange('rho_liq_kg_per_m3', parseFloat(e.target.value) || 850)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Viscosity (Pa·s)</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={fluidSpec.mu_Pa_s || 0.001}
                          onChange={(e) => handleFluidSpecChange('mu_Pa_s', parseFloat(e.target.value) || 0.001)}
                        />
                      </div>

                      {fluidSpec.kind === 'two-phase' && (
                        <div className="space-y-2">
                          <Label>Water Cut (fraction)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={fluidSpec.watercut_frac || 0.1}
                            onChange={(e) => handleFluidSpecChange('watercut_frac', parseFloat(e.target.value) || 0.1)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {networkResult ? (
                <div className="space-y-6">
                  {/* Convergence Status */}
                  <Alert className={networkResult.convergence.converged ? "border-green-500" : "border-red-500"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {networkResult.convergence.converged ? (
                        `Converged after ${networkResult.convergence.iterations} iterations`
                      ) : (
                        `Did not converge after ${networkResult.convergence.iterations} iterations`
                      )}
                    </AlertDescription>
                  </Alert>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Total Drawdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {convertPressureFromSI(networkResult.total_drawdown_kPa * 1000).toFixed(1)} {getPressureUnit()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Wellhead Pressure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {convertPressureFromSI(networkResult.nodes[0]?.pressure_kPa * 1000 || 0).toFixed(1)} {getPressureUnit()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Final Pressure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {convertPressureFromSI(networkResult.nodes[networkResult.nodes.length - 1]?.pressure_kPa * 1000 || 0).toFixed(1)} {getPressureUnit()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Erosional Warnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                          {networkResult.nodes.filter(n => n.erosional_check.is_erosional).length + 
                           networkResult.segments.filter(s => s.erosional_check.is_erosional).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Results Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Node Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Node</th>
                              <th className="text-left p-2">Pressure ({getPressureUnit()})</th>
                              <th className="text-left p-2">Temperature ({getTemperatureUnit()})</th>
                              <th className="text-left p-2">Velocity (m/s)</th>
                              <th className="text-left p-2">Density (kg/m³)</th>
                              <th className="text-left p-2">Warnings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {networkResult.nodes.map((node, index) => (
                              <tr key={node.id} className="border-b">
                                <td className="p-2 font-medium">{node.label}</td>
                                <td className="p-2">{convertPressureFromSI(node.pressure_kPa * 1000).toFixed(2)}</td>
                                <td className="p-2">{convertTemperatureFromSI(node.temperature_K).toFixed(1)}</td>
                                <td className="p-2">{node.velocity_m_s?.toFixed(2) || 'N/A'}</td>
                                <td className="p-2">{node.density_kg_m3.toFixed(2)}</td>
                                <td className="p-2">
                                  {node.warnings.length > 0 ? (
                                    <Badge variant="destructive" className="text-xs">
                                      {node.warnings.length} warning{node.warnings.length > 1 ? 's' : ''}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">OK</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Segment Results Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Segment Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Segment</th>
                              <th className="text-left p-2">ΔP Total ({getPressureUnit()})</th>
                              <th className="text-left p-2">Velocity (m/s)</th>
                              <th className="text-left p-2">Mach</th>
                              <th className="text-left p-2">Reynolds</th>
                              <th className="text-left p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {networkResult.segments.map((segment, index) => (
                              <tr key={segment.id} className="border-b">
                                <td className="p-2 font-medium">Segment {index + 1}</td>
                                <td className="p-2">{convertPressureFromSI(segment.deltaP_total_kPa * 1000).toFixed(2)}</td>
                                <td className="p-2">{segment.velocity_m_s.toFixed(2)}</td>
                                <td className="p-2">{segment.mach.toFixed(3)}</td>
                                <td className="p-2">{segment.reynolds.toFixed(0)}</td>
                                <td className="p-2">
                                  {segment.erosional_check.is_erosional || segment.erosional_check.mach_limit_exceeded ? (
                                    <Badge variant="destructive" className="text-xs">
                                      {segment.erosional_check.is_erosional ? 'Erosional' : 'Mach > 0.3'}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">OK</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure network and fluid properties to see results</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div className="text-center py-8">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Export Options</h3>
                <p className="text-muted-foreground mb-4">
                  Export calculation results and network configuration
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleExportPNG} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PNG
                  </Button>
                  <Button onClick={handleExportCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportJSON} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button onClick={handleCopyResults} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Results
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlowAssuranceEnhanced;
