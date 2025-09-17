import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, RotateCcw, Info, AlertTriangle, Settings, Download, 
  Droplets, Thermometer, Gauge, Zap, Filter, Flame, 
  ChevronRight, ChevronDown, Play, Pause, Save, Upload
} from 'lucide-react';

import { calculateFlowAssurance } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import { EQUIPMENT_LIBRARY, getEquipmentByType, PIPE_SIZES } from '@/lib/equipment-library';
import ProcessFlowDiagram from '@/components/ui/ProcessFlowDiagram';
import type { FlowAssuranceInputs, FlowAssuranceOutputs, UnitSystem, Segment } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const FlowAssuranceCalculator = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  
  const [inputs, setInputs] = useState<FlowAssuranceInputs>({
    // Wellhead conditions
    wellheadPressure: 5000000, // 50 bar
    wellheadTemperature: 333, // 60°C
    
    // Flow rates (will be converted based on unit system)
    gasRate: unitSystem === 'metric' ? 0.1 : 10, // m³/s or MMSCFD
    oilRate: unitSystem === 'metric' ? 0.05 : 1000, // m³/s or bbl/day
    waterRate: unitSystem === 'metric' ? 0.02 : 100, // m³/s or bbl/day
    
    // Phase properties
    gasSpecificGravity: 0.7,
    oilSpecificGravity: 0.85,
    waterSpecificGravity: 1.0,
    
    // Velocity limits
    maxHoseVelocity: 10, // m/s
    maxPipeVelocity: 15, // m/s
    
    // Ambient conditions
    ambientTemperature: 288, // 15°C
    ambientPressure: 101325, // 1 atm
    
    // Equipment selections
    equipmentSelections: {
      esd: 'esd_001',
      filter: 'filter_001',
      choke: 'choke_001',
      heater: 'heater_001',
      separator: 'separator_001',
      flare: 'flare_001'
    },
    
    // Separator settings
    separatorSetPressure: 200000, // 2 bar
    separatorType: '3-phase',
    separatorOperatingMode: 'pressured',
    
    // Choke settings
    chokeOpening: 50, // %
    chokeType: 'adjustable',
    
    // Line segments
    segments: [
      {
        id: 'seg_1',
        fromNode: 'wellhead',
        toNode: 'esd_outlet',
        lineId: 102.3,
        schedule: 'Sch 40',
        length: 10,
        roughness: 0.045,
        fittings: { elbows: 2, tees: 0, reducers: 1, other: 0 },
        kFactor: 0,
        pressureDrop: 0,
        velocity: 0,
        reynoldsNumber: 0,
        frictionFactor: 0
      }
    ]
  });

  const [outputs, setOutputs] = useState<FlowAssuranceOutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('schematic');
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      setIsCalculating(true);
      try {
        // Convert flow rates to SI units for calculation
        const siInputs = {
          ...inputs,
          gasRate: convertGasRateToSI(inputs.gasRate),
          oilRate: convertOilWaterRateToSI(inputs.oilRate),
          waterRate: convertOilWaterRateToSI(inputs.waterRate)
        };
        const result = calculateFlowAssurance(siInputs);
        setOutputs(result);
      } catch (error) {
        setOutputs(null);
      } finally {
        setIsCalculating(false);
      }
    }
  }, [inputs, unitSystem]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!inputs.wellheadPressure || inputs.wellheadPressure <= 0) {
      newErrors.wellheadPressure = 'Wellhead pressure must be greater than 0';
    }

    if (!inputs.wellheadTemperature || inputs.wellheadTemperature <= 0) {
      newErrors.wellheadTemperature = 'Wellhead temperature must be greater than 0';
    }

    if (!inputs.gasRate || inputs.gasRate < 0) {
      newErrors.gasRate = 'Gas rate must be non-negative';
    }

    if (!inputs.oilRate || inputs.oilRate < 0) {
      newErrors.oilRate = 'Oil rate must be non-negative';
    }

    if (!inputs.waterRate || inputs.waterRate < 0) {
      newErrors.waterRate = 'Water rate must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FlowAssuranceInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleEquipmentChange = (equipmentType: string, equipmentId: string) => {
    setInputs(prev => ({
      ...prev,
      equipmentSelections: {
        ...prev.equipmentSelections,
        [equipmentType]: equipmentId
      }
    }));
  };

  const handleReset = () => {
    setInputs({
      wellheadPressure: 5000000,
      wellheadTemperature: 333,
      gasRate: unitSystem === 'metric' ? 0.1 : 10, // m³/s or MMSCFD
      oilRate: unitSystem === 'metric' ? 0.05 : 1000, // m³/s or bbl/day
      waterRate: unitSystem === 'metric' ? 0.02 : 100, // m³/s or bbl/day
      gasSpecificGravity: 0.7,
      oilSpecificGravity: 0.85,
      waterSpecificGravity: 1.0,
      maxHoseVelocity: 10,
      maxPipeVelocity: 15,
      ambientTemperature: 288,
      ambientPressure: 101325,
      equipmentSelections: {
        esd: 'esd_001',
        filter: 'filter_001',
        choke: 'choke_001',
        heater: 'heater_001',
        separator: 'separator_001',
        flare: 'flare_001'
      },
      separatorSetPressure: 200000,
      separatorType: '3-phase',
      separatorOperatingMode: 'pressured',
      chokeOpening: 50,
      chokeType: 'adjustable',
      segments: [
        {
          id: 'seg_1',
          fromNode: 'wellhead',
          toNode: 'esd_outlet',
          lineId: 102.3,
          schedule: 'Sch 40',
          length: 10,
          roughness: 0.045,
          fittings: { elbows: 2, tees: 0, reducers: 1, other: 0 },
          kFactor: 0,
          pressureDrop: 0,
          velocity: 0,
          reynoldsNumber: 0,
          frictionFactor: 0
        }
      ]
    });
    setOutputs(null);
    setErrors({});
  };

  const handleCopyResults = async () => {
    if (outputs) {
      const success = await copyResultsToClipboard(outputs, 'Flow Assurance Calculator');
      if (success) {
        toast({
          title: "Results Copied",
          description: "Flow assurance calculation results copied to clipboard",
        });
      } else {
        toast({
          title: "Copy Failed",
          description: "Failed to copy results to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const getEquipmentOptions = (type: string) => {
    return getEquipmentByType(type).map(equipment => ({
      value: equipment.id,
      label: `${equipment.manufacturer} ${equipment.model}`
    }));
  };

  const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psia';
  const getTemperatureUnit = () => unitSystem === 'metric' ? '°C' : '°F';
  const getGasFlowUnit = () => unitSystem === 'metric' ? 'm³/s' : 'MMSCFD';
  const getOilWaterFlowUnit = () => unitSystem === 'metric' ? 'm³/s' : 'bbl/day';
  const getVelocityUnit = () => unitSystem === 'metric' ? 'm/s' : 'ft/s';

  // Unit conversion functions
  const convertGasRateToSI = (value: number): number => {
    if (unitSystem === 'metric') {
      return value; // Already in m³/s
    } else {
      // Convert MMSCFD to m³/s
      return value * 28316.8 / 86400; // MMSCFD to m³/s
    }
  };

  const convertOilWaterRateToSI = (value: number): number => {
    if (unitSystem === 'metric') {
      return value; // Already in m³/s
    } else {
      // Convert bbl/day to m³/s
      return value * 0.158987 / 86400; // bbl/day to m³/s
    }
  };

  const convertGasRateFromSI = (value: number): number => {
    if (unitSystem === 'metric') {
      return value; // Already in m³/s
    } else {
      // Convert m³/s to MMSCFD
      return value * 86400 / 28316.8; // m³/s to MMSCFD
    }
  };

  const convertOilWaterRateFromSI = (value: number): number => {
    if (unitSystem === 'metric') {
      return value; // Already in m³/s
    } else {
      // Convert m³/s to bbl/day
      return value * 86400 / 0.158987; // m³/s to bbl/day
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Well Testing Package Flow Assurance Model
          </CardTitle>
          <CardDescription>
            Node-based process model with interactive equipment selection and real-time calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
              <TabsTrigger value="schematic">Schematic</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="schematic" className="space-y-6">
              <ProcessFlowDiagram
                outputs={outputs}
                isCalculating={isCalculating}
                onNodeClick={handleNodeClick}
                selectedNode={selectedNode}
              />
            </TabsContent>

            <TabsContent value="inputs" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wellhead Conditions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Wellhead Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wellheadPressure">Wellhead Pressure ({getPressureUnit()})</Label>
                      <Input
                        id="wellheadPressure"
                        type="number"
                        step="1000"
                        value={inputs.wellheadPressure / 1000}
                        onChange={(e) => handleInputChange('wellheadPressure', parseFloat(e.target.value) * 1000 || 0)}
                        className={errors.wellheadPressure ? 'border-red-500' : ''}
                      />
                      {errors.wellheadPressure && <p className="text-sm text-red-500">{errors.wellheadPressure}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wellheadTemperature">Wellhead Temperature ({getTemperatureUnit()})</Label>
                      <Input
                        id="wellheadTemperature"
                        type="number"
                        step="0.1"
                        value={inputs.wellheadTemperature - 273.15}
                        onChange={(e) => handleInputChange('wellheadTemperature', parseFloat(e.target.value) + 273.15 || 0)}
                        className={errors.wellheadTemperature ? 'border-red-500' : ''}
                      />
                      {errors.wellheadTemperature && <p className="text-sm text-red-500">{errors.wellheadTemperature}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Flow Rates */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Flow Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gasRate">Gas Rate ({getGasFlowUnit()})</Label>
                      <Input
                        id="gasRate"
                        type="number"
                        step="0.001"
                        value={inputs.gasRate}
                        onChange={(e) => handleInputChange('gasRate', parseFloat(e.target.value) || 0)}
                        className={errors.gasRate ? 'border-red-500' : ''}
                      />
                      {errors.gasRate && <p className="text-sm text-red-500">{errors.gasRate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="oilRate">Oil Rate ({getOilWaterFlowUnit()})</Label>
                      <Input
                        id="oilRate"
                        type="number"
                        step="0.001"
                        value={inputs.oilRate}
                        onChange={(e) => handleInputChange('oilRate', parseFloat(e.target.value) || 0)}
                        className={errors.oilRate ? 'border-red-500' : ''}
                      />
                      {errors.oilRate && <p className="text-sm text-red-500">{errors.oilRate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="waterRate">Water Rate ({getOilWaterFlowUnit()})</Label>
                      <Input
                        id="waterRate"
                        type="number"
                        step="0.001"
                        value={inputs.waterRate}
                        onChange={(e) => handleInputChange('waterRate', parseFloat(e.target.value) || 0)}
                        className={errors.waterRate ? 'border-red-500' : ''}
                      />
                      {errors.waterRate && <p className="text-sm text-red-500">{errors.waterRate}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Phase Properties */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Phase Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gasSG">Gas Specific Gravity</Label>
                      <Input
                        id="gasSG"
                        type="number"
                        step="0.01"
                        value={inputs.gasSpecificGravity}
                        onChange={(e) => handleInputChange('gasSpecificGravity', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="oilSG">Oil Specific Gravity</Label>
                      <Input
                        id="oilSG"
                        type="number"
                        step="0.01"
                        value={inputs.oilSpecificGravity}
                        onChange={(e) => handleInputChange('oilSpecificGravity', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="waterSG">Water Specific Gravity</Label>
                      <Input
                        id="waterSG"
                        type="number"
                        step="0.01"
                        value={inputs.waterSpecificGravity}
                        onChange={(e) => handleInputChange('waterSpecificGravity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Velocity Limits */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Velocity Limits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxHoseVel">Max Hose Velocity ({getVelocityUnit()})</Label>
                      <Input
                        id="maxHoseVel"
                        type="number"
                        step="0.1"
                        value={inputs.maxHoseVelocity}
                        onChange={(e) => handleInputChange('maxHoseVelocity', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxPipeVel">Max Pipe Velocity ({getVelocityUnit()})</Label>
                      <Input
                        id="maxPipeVel"
                        type="number"
                        step="0.1"
                        value={inputs.maxPipeVelocity}
                        onChange={(e) => handleInputChange('maxPipeVelocity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Equipment Selections */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Equipment Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {['esd', 'filter', 'choke', 'heater', 'separator', 'flare'].map((type) => (
                        <div key={type} className="space-y-2">
                          <Label className="text-sm font-medium capitalize">
                            {type === 'esd' ? 'ESD/SSV' : 
                             type === 'filter' ? 'Sand Filter' :
                             type === 'choke' ? 'Choke' :
                             type === 'heater' ? 'Heater' :
                             type === 'separator' ? 'Separator' :
                             type === 'flare' ? 'Flare Stack' : type}
                          </Label>
                          <Select
                            value={inputs.equipmentSelections[type as keyof typeof inputs.equipmentSelections]}
                            onValueChange={(value) => handleEquipmentChange(type, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getEquipmentOptions(type).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {outputs ? (
                <div className="space-y-6">
                  {/* System Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">System Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Total ΔP:</span>
                          <Badge variant="outline">{(outputs.totalSystemPressureDrop / 1000).toFixed(0)} kPa</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Efficiency:</span>
                          <Badge variant="outline">{outputs.overallEfficiency.toFixed(1)}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Energy:</span>
                          <Badge variant="outline">{outputs.energyConsumption.toFixed(1)} kW</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Back Pressure</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Required:</span>
                          <Badge variant="outline">{(outputs.requiredBackPressure / 1000).toFixed(0)} kPa</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">BPV Opening:</span>
                          <Badge variant="outline">{outputs.backPressureValveOpening.toFixed(1)}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Limiting:</span>
                          <Badge variant="outline">{outputs.limitingElement}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Warnings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">System:</span>
                          <Badge variant={outputs.systemWarnings.length > 0 ? 'destructive' : 'secondary'}>
                            {outputs.systemWarnings.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Critical:</span>
                          <Badge variant={outputs.criticalAlerts.length > 0 ? 'destructive' : 'secondary'}>
                            {outputs.criticalAlerts.length}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Node States</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Nodes:</span>
                          <Badge variant="outline">{outputs.nodes.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Pressure Recovery:</span>
                          <Badge variant="outline">{outputs.pressureRecovery.toFixed(1)}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Node Details Table */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Node States</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Node</th>
                              <th className="text-left p-2">Pressure (kPa)</th>
                              <th className="text-left p-2">Temperature (°C)</th>
                              <th className="text-left p-2">Velocity (m/s)</th>
                              <th className="text-left p-2">ΔP (kPa)</th>
                              <th className="text-left p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {outputs.nodes.map((node, index) => (
                              <tr key={node.nodeId} className="border-b">
                                <td className="p-2 font-medium">{node.nodeId}</td>
                                <td className="p-2">{(node.pressure / 1000).toFixed(1)}</td>
                                <td className="p-2">{(node.temperature - 273.15).toFixed(1)}</td>
                                <td className="p-2">{node.velocity.toFixed(2)}</td>
                                <td className="p-2">{(node.pressureDrop / 1000).toFixed(1)}</td>
                                <td className="p-2">
                                  {node.warnings.length > 0 ? (
                                    <Badge variant="destructive">Warning</Badge>
                                  ) : (
                                    <Badge variant="secondary">Normal</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warnings and Alerts */}
                  {(outputs.systemWarnings.length > 0 || outputs.criticalAlerts.length > 0) && (
                    <div className="space-y-4">
                      {outputs.criticalAlerts.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Critical Alerts:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {outputs.criticalAlerts.map((alert, index) => (
                                  <li key={index} className="text-sm">{alert}</li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {outputs.systemWarnings.length > 0 && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">System Warnings:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {outputs.systemWarnings.map((warning, index) => (
                                  <li key={index} className="text-sm">{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleCopyResults} size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Results
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter parameters to calculate flow assurance</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div className="text-center py-8">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Export Options</h3>
                <p className="text-muted-foreground mb-4">
                  Export calculation results and schematic data
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PNG
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlowAssuranceCalculator;
