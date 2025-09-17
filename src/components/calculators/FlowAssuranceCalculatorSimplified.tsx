import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, RotateCcw, Info, AlertTriangle, Settings, Download, 
  Droplets, Thermometer, Gauge, Zap, Filter, Flame, 
  ChevronRight, ChevronDown, Play, Pause, Save, Upload
} from 'lucide-react';

import { calculateFlowAssurance } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import { EQUIPMENT_LIBRARY, getEquipmentByType, PIPE_SIZES } from '@/lib/equipment-library';
import { convertToSI, convertFromSI, DEFAULT_UNITS } from '@/lib/unit-conversions-enhanced';
import ProcessFlowDiagram from '@/components/ui/ProcessFlowDiagram';
import type { FlowAssuranceInputs, FlowAssuranceOutputs, UnitSystem, Segment } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  unitSystem: UnitSystem;
}

const FlowAssuranceCalculatorSimplified = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  
  const [inputs, setInputs] = useState<FlowAssuranceInputs>({
    // Wellhead conditions
    wellheadPressure: unitSystem === 'metric' ? 50 : 725, // 50 bar or 725 psi
    wellheadTemperature: unitSystem === 'metric' ? 60 : 140, // 60°C or 140°F
    
    // Flow rates (will be converted based on unit system)
    gasRate: unitSystem === 'metric' ? 8640 : 10, // m³/d or MMSCFD
    oilRate: unitSystem === 'metric' ? 4320 : 1000, // m³/d or bbl/day
    waterRate: unitSystem === 'metric' ? 1728 : 100, // m³/d or bbl/day
    
    // Phase properties
    gasSpecificGravity: 0.7,
    oilSpecificGravity: 0.85,
    waterSpecificGravity: 1.0,
    
    // Velocity limits
    maxHoseVelocity: 10, // m/s
    maxPipeVelocity: 15, // m/s
    
    // Ambient conditions
    ambientTemperature: unitSystem === 'metric' ? 15 : 59, // 15°C or 59°F
    ambientPressure: unitSystem === 'metric' ? 1 : 14.7, // 1 bar or 14.7 psi
    
    // Equipment selections (simplified - no user selection)
    equipmentSelections: {
      esd: 'esd_001',
      filter: 'filter_001',
      choke: 'choke_001',
      heater: 'heater_001',
      separator: 'separator_001',
      flare: 'flare_001'
    },
    
    // Separator settings
    separatorSetPressure: unitSystem === 'metric' ? 2 : 29, // 2 bar or 29 psi
    separatorType: '3-phase',
    separatorOperatingMode: 'pressured',
    
    // Choke settings - User-controlled choke size
    chokeSize64ths: unitSystem === 'metric' ? 12.7 : 32, // 12.7 mm or 32/64 inch (0.5 inch)
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

  // Convert input values when unit system changes
  useEffect(() => {
    setInputs(prevInputs => ({
      ...prevInputs,
      wellheadPressure: convertPressureToSI(convertPressureFromSI(prevInputs.wellheadPressure)),
      wellheadTemperature: convertTemperatureToSI(convertTemperatureFromSI(prevInputs.wellheadTemperature)),
      gasRate: convertGasRateFromSI(convertGasRateToSI(prevInputs.gasRate)),
      oilRate: convertOilWaterRateFromSI(convertOilWaterRateToSI(prevInputs.oilRate)),
      waterRate: convertOilWaterRateFromSI(convertOilWaterRateToSI(prevInputs.waterRate)),
      ambientTemperature: convertTemperatureToSI(convertTemperatureFromSI(prevInputs.ambientTemperature)),
      ambientPressure: convertPressureToSI(convertPressureFromSI(prevInputs.ambientPressure)),
      separatorSetPressure: convertPressureToSI(convertPressureFromSI(prevInputs.separatorSetPressure)),
      chokeSize64ths: unitSystem === 'metric' ? prevInputs.chokeSize64ths * 25.4 : prevInputs.chokeSize64ths / 25.4
    }));
  }, [unitSystem]);

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

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const handleReset = () => {
    setInputs({
      wellheadPressure: unitSystem === 'metric' ? 50 : 725, // 50 bar or 725 psi
      wellheadTemperature: unitSystem === 'metric' ? 60 : 140, // 60°C or 140°F
      gasRate: unitSystem === 'metric' ? 8640 : 10, // m³/d or MMSCFD
      oilRate: unitSystem === 'metric' ? 4320 : 1000, // m³/d or bbl/day
      waterRate: unitSystem === 'metric' ? 1728 : 100, // m³/d or bbl/day
      gasSpecificGravity: 0.7,
      oilSpecificGravity: 0.85,
      waterSpecificGravity: 1.0,
      maxHoseVelocity: 10,
      maxPipeVelocity: 15,
      ambientTemperature: unitSystem === 'metric' ? 15 : 59, // 15°C or 59°F
      ambientPressure: unitSystem === 'metric' ? 1 : 14.7, // 1 bar or 14.7 psi
      equipmentSelections: {
        esd: 'esd_001',
        filter: 'filter_001',
        choke: 'choke_001',
        heater: 'heater_001',
        separator: 'separator_001',
        flare: 'flare_001'
      },
      separatorSetPressure: unitSystem === 'metric' ? 2 : 29, // 2 bar or 29 psi
      separatorType: '3-phase',
      separatorOperatingMode: 'pressured',
      chokeSize64ths: unitSystem === 'metric' ? 12.7 : 32, // 12.7 mm or 32/64 inch (0.5 inch)
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
  };

  const handleExportPNG = () => {
    // Export PNG functionality
    toast({
      title: "Export PNG",
      description: "PNG export functionality will be implemented",
    });
  };

  const handleCopyResults = async () => {
    if (!outputs) return;
    
    try {
      await copyResultsToClipboard(outputs, 'flow-assurance');
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
  const convertGasRateToSI = (value: number) => {
    return unitSystem === 'metric' ? value / 86400 : value * 0.0283168; // m³/d to m³/s or MMSCFD to m³/s
  };

  const convertGasRateFromSI = (value: number) => {
    return unitSystem === 'metric' ? value * 86400 : value / 0.0283168; // m³/s to m³/d or m³/s to MMSCFD
  };

  const convertOilWaterRateToSI = (value: number) => {
    return unitSystem === 'metric' ? value / 86400 : value * 0.00000184; // m³/d to m³/s or bbl/day to m³/s
  };

  const convertOilWaterRateFromSI = (value: number) => {
    return unitSystem === 'metric' ? value * 86400 : value / 0.00000184; // m³/s to m³/d or m³/s to bbl/day
  };

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

  const getPressureUnit = () => unitSystem === 'metric' ? 'bar' : 'psi';
  const getTemperatureUnit = () => unitSystem === 'metric' ? '°C' : '°F';
  const getGasFlowUnit = () => unitSystem === 'metric' ? 'm³/d' : 'MMSCFD';
  const getOilWaterFlowUnit = () => unitSystem === 'metric' ? 'm³/d' : 'bbl/day';
  const getVelocityUnit = () => unitSystem === 'metric' ? 'm/s' : 'ft/s';
  const getChokeSizeUnit = () => unitSystem === 'metric' ? 'mm' : '64ths inch';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Well Testing Package Flow Assurance Model
          </CardTitle>
          <CardDescription className="text-center">
            Node-based process model with real-time calculations and user-controlled choke sizing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Always visible schematic */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Process Flow Diagram</h3>
              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={handleExportPNG} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PNG
                </Button>
              </div>
            </div>
            <ProcessFlowDiagram
              outputs={outputs}
              isCalculating={isCalculating}
              onNodeClick={handleNodeClick}
              selectedNode={selectedNode}
            />
          </div>

          {/* Input Parameters */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Input Parameters</h3>
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
                      step="0.1"
                      value={convertPressureFromSI(inputs.wellheadPressure)}
                      onChange={(e) => handleInputChange('wellheadPressure', convertPressureToSI(parseFloat(e.target.value) || 0))}
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
                      value={convertTemperatureFromSI(inputs.wellheadTemperature)}
                      onChange={(e) => handleInputChange('wellheadTemperature', convertTemperatureToSI(parseFloat(e.target.value) || 0))}
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
                    <Zap className="h-4 w-4" />
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

              {/* Choke Settings - NEW */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Choke Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="chokeSize64ths">Choke Size ({getChokeSizeUnit()})</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="chokeSize64ths"
                        type="number"
                        min={unitSystem === 'metric' ? 1 : 1}
                        max={unitSystem === 'metric' ? 100 : 64}
                        step="0.1"
                        value={inputs.chokeSize64ths}
                        onChange={(e) => handleInputChange('chokeSize64ths', parseFloat(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {unitSystem === 'metric' 
                          ? `= ${(inputs.chokeSize64ths / 25.4).toFixed(3)} inch`
                          : `= ${(inputs.chokeSize64ths / 64).toFixed(3)} inch`
                        }
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {unitSystem === 'metric' 
                        ? 'Range: 1-100 mm'
                        : 'Range: 1/64" to 64/64" (1 inch)'
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="separatorSetPressure">Separator Set Pressure ({getPressureUnit()})</Label>
                    <Input
                      id="separatorSetPressure"
                      type="number"
                      step="0.1"
                      value={convertPressureFromSI(inputs.separatorSetPressure)}
                      onChange={(e) => handleInputChange('separatorSetPressure', convertPressureToSI(parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlowAssuranceCalculatorSimplified;
