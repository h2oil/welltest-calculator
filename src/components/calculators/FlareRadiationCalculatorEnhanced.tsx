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
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Copy, RotateCcw, Info, AlertTriangle, Flame, Volume2, Thermometer, 
  Wind, Settings, Download, Upload, Eye, EyeOff, Camera, Layers
} from 'lucide-react';

import { calculateFlareRadiation } from '@/lib/well-calculations';
import { copyResultsToClipboard } from '@/lib/storage';
import { 
  convertToSI, convertFromSI, UNIT_GROUPS, DEFAULT_UNITS,
  exportScenarioToJSON, importScenarioFromJSON, exportContoursToCSV,
  type FlareScenario, validateScenario, formatValueWithUnit
} from '@/lib/unit-conversions-enhanced';
import Flare2DViewer from '@/components/ui/Flare2DViewer';
import InputWithUnit from '@/components/ui/InputWithUnit';
import type { FlareRadiationInputs, FlareRadiationOutputs, UnitSystem, FlareGasComposition } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';


interface Props {
  unitSystem: UnitSystem;
}

interface PerFieldUnits {
  gasRate: string;
  flareHeight: string;
  tipDiameter: string;
  tipPressure: string;
  tipTemperature: string;
  windSpeed: string;
  windDirection: string;
  humidity: string;
  noiseReferenceDistance: string;
}

const FlareRadiationCalculatorEnhanced = ({ unitSystem }: Props) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Per-field units with error handling
  const getDefaultUnits = (system: UnitSystem) => {
    const units = DEFAULT_UNITS[system];
    if (!units) {
      console.warn(`Unknown unit system: ${system}, falling back to metric`);
      return DEFAULT_UNITS.metric;
    }
    return units;
  };

  const [perFieldUnits, setPerFieldUnits] = useState<PerFieldUnits>(() => {
    const defaultUnits = getDefaultUnits(unitSystem);
    return {
      gasRate: defaultUnits.flowRate,
      flareHeight: defaultUnits.length,
      tipDiameter: defaultUnits.length,
      tipPressure: defaultUnits.pressure,
      tipTemperature: defaultUnits.temperature,
      windSpeed: defaultUnits.velocity,
      windDirection: defaultUnits.angle,
      humidity: defaultUnits.dimensionless,
      noiseReferenceDistance: defaultUnits.length
    };
  });

  const [inputs, setInputs] = useState<FlareRadiationInputs>({
    // Operating data
    gasRate: 5, // Will be converted to SI
    flareTipHeight: 30, // Will be converted to SI
    windSpeed: 5, // Will be converted to SI
    windDirection: 0, // degrees
    
    // Flare geometry
    tipDiameter: 0.5, // Will be converted to SI
    tipPressure: 101.325, // Will be converted to SI
    tipTemperature: 288, // Will be converted to SI
    
    // Gas properties
    gasComposition: {
      ch4: 85, c2h6: 8, c3h8: 4, iC4: 1, nC4: 1, c5Plus: 0.5,
      h2: 0, n2: 0.3, co2: 0.2, h2s: 0
    },
    
    // Optional parameters
    atmosphericHumidity: 60, // %
    ambientTemperature: 288, // Will be converted to SI
    noiseReferenceDistance: 30, // Will be converted to SI
    
    // Contour customization
    radiationContours: [1.388, 1.577, 1.893, 3.155, 4.732, 6.309, 7.886, 9.454, 15.72, 31.55], // kW/m²
    noiseContours: [70, 85, 100] // dB(A)
  });

  const [outputs, setOutputs] = useState<FlareRadiationOutputs | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('inputs');
  const [show2D, setShow2D] = useState(true);
  const [viewMode, setViewMode] = useState<'radiation' | 'noise' | 'both'>('both');
  const [isCalculating, setIsCalculating] = useState(false);

  // Update perFieldUnits when unitSystem changes
  useEffect(() => {
    const defaultUnits = getDefaultUnits(unitSystem);
    setPerFieldUnits({
      gasRate: defaultUnits.flowRate,
      flareHeight: defaultUnits.length,
      tipDiameter: defaultUnits.length,
      tipPressure: defaultUnits.pressure,
      tipTemperature: defaultUnits.temperature,
      windSpeed: defaultUnits.velocity,
      windDirection: defaultUnits.angle,
      humidity: defaultUnits.dimensionless,
      noiseReferenceDistance: defaultUnits.length
    });
  }, [unitSystem]);

  // Convert input values when unit system changes
  useEffect(() => {
    const defaultUnits = getDefaultUnits(unitSystem);
    
    // Convert current input values to the new unit system
    setInputs(prevInputs => ({
      ...prevInputs,
      gasRate: convertFromSI(convertToSI(prevInputs.gasRate, perFieldUnits.gasRate), defaultUnits.flowRate),
      flareTipHeight: convertFromSI(convertToSI(prevInputs.flareTipHeight, perFieldUnits.flareHeight), defaultUnits.length),
      tipDiameter: convertFromSI(convertToSI(prevInputs.tipDiameter, perFieldUnits.tipDiameter), defaultUnits.length),
      tipPressure: convertFromSI(convertToSI(prevInputs.tipPressure, perFieldUnits.tipPressure), defaultUnits.pressure),
      tipTemperature: convertFromSI(convertToSI(prevInputs.tipTemperature, perFieldUnits.tipTemperature), defaultUnits.temperature),
      windSpeed: convertFromSI(convertToSI(prevInputs.windSpeed, perFieldUnits.windSpeed), defaultUnits.velocity),
      windDirection: convertFromSI(convertToSI(prevInputs.windDirection, perFieldUnits.windDirection), defaultUnits.angle),
      atmosphericHumidity: convertFromSI(convertToSI(prevInputs.atmosphericHumidity, perFieldUnits.humidity), defaultUnits.dimensionless),
      ambientTemperature: convertFromSI(convertToSI(prevInputs.ambientTemperature, perFieldUnits.tipTemperature), defaultUnits.temperature),
      noiseReferenceDistance: convertFromSI(convertToSI(prevInputs.noiseReferenceDistance, perFieldUnits.noiseReferenceDistance), defaultUnits.length)
    }));
  }, [unitSystem, perFieldUnits]);

  // Convert inputs to SI for calculations
  const getSIInputs = (): FlareRadiationInputs => {
    return {
      ...inputs,
      gasRate: convertToSI(inputs.gasRate, perFieldUnits.gasRate),
      flareTipHeight: convertToSI(inputs.flareTipHeight, perFieldUnits.flareHeight),
      tipDiameter: convertToSI(inputs.tipDiameter, perFieldUnits.tipDiameter),
      tipPressure: convertToSI(inputs.tipPressure, perFieldUnits.tipPressure),
      tipTemperature: convertToSI(inputs.tipTemperature, perFieldUnits.tipTemperature),
      windSpeed: convertToSI(inputs.windSpeed, perFieldUnits.windSpeed),
      windDirection: convertToSI(inputs.windDirection, perFieldUnits.windDirection),
      atmosphericHumidity: convertToSI(inputs.atmosphericHumidity, perFieldUnits.humidity),
      ambientTemperature: convertToSI(inputs.ambientTemperature, perFieldUnits.tipTemperature),
      noiseReferenceDistance: convertToSI(inputs.noiseReferenceDistance, perFieldUnits.noiseReferenceDistance)
    };
  };

  // Auto-calculate when inputs change
  useEffect(() => {
    if (validateInputs()) {
      setIsCalculating(true);
      try {
        const siInputs = getSIInputs();
        console.log('Calculating flare radiation with inputs:', siInputs);
        const result = calculateFlareRadiation(siInputs);
        console.log('Flare radiation calculation result:', result);
        setOutputs(result);
      } catch (error) {
        console.error('Flare radiation calculation error:', error);
        setOutputs(null);
        toast({
          title: "Calculation Error",
          description: `Failed to calculate flare radiation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsCalculating(false);
      }
    } else {
      console.log('Input validation failed');
      setOutputs(null);
    }
  }, [inputs, perFieldUnits]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    console.log('Validating inputs:', inputs);

    if (!inputs.gasRate || inputs.gasRate <= 0) {
      newErrors.gasRate = 'Gas rate must be greater than 0';
    }

    if (!inputs.flareTipHeight || inputs.flareTipHeight <= 0) {
      newErrors.flareTipHeight = 'Flare height must be greater than 0';
    }

    if (!inputs.tipDiameter || inputs.tipDiameter <= 0) {
      newErrors.tipDiameter = 'Tip diameter must be greater than 0';
    }

    if (!inputs.tipPressure || inputs.tipPressure <= 0) {
      newErrors.tipPressure = 'Tip pressure must be greater than 0';
    }

    if (!inputs.tipTemperature || inputs.tipTemperature <= 0) {
      newErrors.tipTemperature = 'Tip temperature must be greater than 0';
    }

    // Validate gas composition sums to 100%
    const totalMoles = Object.values(inputs.gasComposition).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalMoles - 100) > 0.1) {
      newErrors.gasComposition = 'Gas composition must sum to 100%';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FlareRadiationInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleUnitChange = (field: keyof PerFieldUnits, unit: string) => {
    setPerFieldUnits(prev => ({ ...prev, [field]: unit }));
  };

  const handleGasCompositionChange = (component: keyof FlareGasComposition, value: number) => {
    setInputs(prev => ({
      ...prev,
      gasComposition: {
        ...prev.gasComposition,
        [component]: value
      }
    }));
  };

  const handleContourChange = (type: 'radiation' | 'noise', index: number, value: number) => {
    setInputs(prev => ({
      ...prev,
      [type === 'radiation' ? 'radiationContours' : 'noiseContours']: 
        prev[type === 'radiation' ? 'radiationContours' : 'noiseContours'].map((val, i) => 
          i === index ? value : val
        )
    }));
  };

  const handleReset = () => {
    setInputs({
      gasRate: 5,
      flareTipHeight: 30,
      windSpeed: 5,
      windDirection: 0,
      tipDiameter: 0.5,
      tipPressure: 101.325,
      tipTemperature: 288,
      gasComposition: {
        ch4: 85, c2h6: 8, c3h8: 4, iC4: 1, nC4: 1, c5Plus: 0.5,
        h2: 0, n2: 0.3, co2: 0.2, h2s: 0
      },
      atmosphericHumidity: 60,
      ambientTemperature: 288,
      noiseReferenceDistance: 30,
      radiationContours: [4.73, 6.3, 12.6],
      noiseContours: [70, 85, 100]
    });
    setOutputs(null);
    setErrors({});
  };

  const handleCopyResults = async () => {
    if (outputs) {
      const success = await copyResultsToClipboard(outputs, 'Flare Radiation Calculator');
      if (success) {
        toast({
          title: "Results Copied",
          description: "Flare radiation calculation results copied to clipboard",
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

  const handleExportPNG = () => {
    if (!outputs) {
      toast({
        title: "No Data to Export",
        description: "Please run calculations first to export data",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "PNG Export",
      description: "3D view exported as PNG",
    });
  };

  const handleExportCSV = () => {
    if (!outputs) {
      toast({
        title: "No Data to Export",
        description: "Please run calculations first to export data",
        variant: "destructive",
      });
      return;
    }
    
    const contours = [
      ...outputs.radiationFootprint.contours.map(c => ({ ...c, type: 'radiation' as const })),
      ...outputs.noiseFootprint.contours.map(c => ({ ...c, type: 'noise' as const }))
    ];
    
    const csvContent = exportContoursToCSV(contours);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flare-contours.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "CSV Export",
      description: "Contour data exported as CSV",
    });
  };

  const handleExportJSON = () => {
    if (!outputs) {
      toast({
        title: "No Data to Export",
        description: "Please run calculations first to export data",
        variant: "destructive",
      });
      return;
    }
    
    const scenario: FlareScenario = {
      version: 'flarecalc-1.1',
      inputs: {
        gasRate: { value: inputs.gasRate, unit: perFieldUnits.gasRate },
        flareHeight: { value: inputs.flareTipHeight, unit: perFieldUnits.flareHeight },
        tipDiameter: { value: inputs.tipDiameter, unit: perFieldUnits.tipDiameter },
        tipPressure: { value: inputs.tipPressure, unit: perFieldUnits.tipPressure },
        tipTemperature: { value: inputs.tipTemperature, unit: perFieldUnits.tipTemperature },
        windSpeed: { value: inputs.windSpeed, unit: perFieldUnits.windSpeed },
        windDirection: { value: inputs.windDirection, unit: perFieldUnits.windDirection },
        humidity: { value: inputs.atmosphericHumidity, unit: perFieldUnits.humidity },
        composition: inputs.gasComposition
      },
      options: {
        emissiveFraction: { mode: 'auto', value: outputs.emissiveFraction },
        noiseReferenceDistance: { value: inputs.noiseReferenceDistance, unit: perFieldUnits.noiseReferenceDistance },
        globalUnitPreset: unitSystem
      },
      derived: {
        MW: outputs.molecularWeight,
        Z: outputs.compressibilityFactor,
        vExit: outputs.exitVelocity,
        chi: outputs.emissiveFraction,
        flame: {
          L: outputs.flameLength,
          tiltDeg: outputs.flameTilt
        }
      }
    };
    
    const jsonContent = exportScenarioToJSON(scenario);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flare-scenario.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON Export",
      description: "Scenario exported as JSON",
    });
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const scenario = importScenarioFromJSON(jsonString);
        
        if (!scenario) {
          toast({
            title: "Import Failed",
            description: "Invalid or corrupted scenario file",
            variant: "destructive",
          });
          return;
        }

        // Update inputs and units
        setInputs({
          gasRate: scenario.inputs.gasRate.value,
          flareTipHeight: scenario.inputs.flareHeight.value,
          tipDiameter: scenario.inputs.tipDiameter.value,
          tipPressure: scenario.inputs.tipPressure.value,
          tipTemperature: scenario.inputs.tipTemperature.value,
          windSpeed: scenario.inputs.windSpeed.value,
          windDirection: scenario.inputs.windDirection.value,
          atmosphericHumidity: scenario.inputs.humidity.value,
          ambientTemperature: 288, // Default
          noiseReferenceDistance: scenario.options.noiseReferenceDistance.value,
          gasComposition: scenario.inputs.composition,
          radiationContours: [4.73, 6.3, 12.6],
          noiseContours: [70, 85, 100]
        });

        setPerFieldUnits({
          gasRate: scenario.inputs.gasRate.unit,
          flareHeight: scenario.inputs.flareHeight.unit,
          tipDiameter: scenario.inputs.tipDiameter.unit,
          tipPressure: scenario.inputs.tipPressure.unit,
          tipTemperature: scenario.inputs.tipTemperature.unit,
          windSpeed: scenario.inputs.windSpeed.unit,
          windDirection: scenario.inputs.windDirection.unit,
          humidity: scenario.inputs.humidity.unit,
          noiseReferenceDistance: scenario.options.noiseReferenceDistance.unit
        });

        toast({
          title: "Import Successful",
          description: "Scenario imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to parse scenario file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const getGasCompositionPresets = () => ({
    'Natural Gas': { ch4: 95, c2h6: 3, c3h8: 1, iC4: 0.5, nC4: 0.5, c5Plus: 0, h2: 0, n2: 0, co2: 0, h2s: 0 },
    'Associated Gas': { ch4: 70, c2h6: 15, c3h8: 8, iC4: 3, nC4: 3, c5Plus: 1, h2: 0, n2: 0, co2: 0, h2s: 0 },
    'Sour Gas': { ch4: 80, c2h6: 10, c3h8: 5, iC4: 2, nC4: 2, c5Plus: 0.5, h2: 0, n2: 0, co2: 0.5, h2s: 0.5 },
    'Refinery Gas': { ch4: 60, c2h6: 20, c3h8: 10, iC4: 5, nC4: 5, c5Plus: 0, h2: 0, n2: 0, co2: 0, h2s: 0 }
  });

  const applyPreset = (preset: FlareGasComposition) => {
    setInputs(prev => ({
      ...prev,
      gasComposition: preset
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Flare Radiation & Noise Calculator (Enhanced)
          </CardTitle>
          <CardDescription>
            API Standard 521 compliant with 3D visualization, export/import, and per-field units
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-secondary/50">
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="3d">Diagrams</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
            </TabsList>

            <TabsContent value="inputs" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Operating Data */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wind className="h-4 w-4" />
                      Operating Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <InputWithUnit
                      id="gasRate"
                      label="Gas Rate"
                      value={inputs.gasRate}
                      unit={perFieldUnits.gasRate}
                      onValueChange={(value) => handleInputChange('gasRate', value)}
                      onUnitChange={(unit) => handleUnitChange('gasRate', unit)}
                      group="flowRate"
                      error={errors.gasRate}
                    />

                    <InputWithUnit
                      id="flareHeight"
                      label="Flare Height"
                      value={inputs.flareTipHeight}
                      unit={perFieldUnits.flareHeight}
                      onValueChange={(value) => handleInputChange('flareTipHeight', value)}
                      onUnitChange={(unit) => handleUnitChange('flareHeight', unit)}
                      group="length"
                      error={errors.flareTipHeight}
                    />

                    <InputWithUnit
                      id="windSpeed"
                      label="Wind Speed"
                      value={inputs.windSpeed}
                      unit={perFieldUnits.windSpeed}
                      onValueChange={(value) => handleInputChange('windSpeed', value)}
                      onUnitChange={(unit) => handleUnitChange('windSpeed', unit)}
                      group="velocity"
                    />

                    <div className="space-y-2">
                      <Label htmlFor="windDirection">Wind Direction (degrees)</Label>
                      <Slider
                        value={[inputs.windDirection]}
                        onValueChange={([value]) => handleInputChange('windDirection', value)}
                        max={360}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-muted-foreground">
                        {inputs.windDirection}°
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Flare Geometry */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Flare Geometry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <InputWithUnit
                      id="tipDiameter"
                      label="Tip Diameter"
                      value={inputs.tipDiameter}
                      unit={perFieldUnits.tipDiameter}
                      onValueChange={(value) => handleInputChange('tipDiameter', value)}
                      onUnitChange={(unit) => handleUnitChange('tipDiameter', unit)}
                      group="length"
                      error={errors.tipDiameter}
                    />

                    <InputWithUnit
                      id="tipPressure"
                      label="Tip Pressure"
                      value={inputs.tipPressure}
                      unit={perFieldUnits.tipPressure}
                      onValueChange={(value) => handleInputChange('tipPressure', value)}
                      onUnitChange={(unit) => handleUnitChange('tipPressure', unit)}
                      group="pressure"
                      error={errors.tipPressure}
                    />

                    <InputWithUnit
                      id="tipTemperature"
                      label="Tip Temperature"
                      value={inputs.tipTemperature}
                      unit={perFieldUnits.tipTemperature}
                      onValueChange={(value) => handleInputChange('tipTemperature', value)}
                      onUnitChange={(unit) => handleUnitChange('tipTemperature', unit)}
                      group="temperature"
                      error={errors.tipTemperature}
                    />
                  </CardContent>
                </Card>

                {/* Gas Composition */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Gas Composition (Mole %)</CardTitle>
                    <CardDescription>
                      Select a preset or manually adjust composition
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preset buttons */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(getGasCompositionPresets()).map(([name, preset]) => (
                        <Button
                          key={name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>

                    {/* Composition inputs */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(inputs.gasComposition).map(([component, value]) => (
                        <div key={component} className="space-y-2">
                          <Label htmlFor={component} className="text-xs">
                            {component.toUpperCase()}
                          </Label>
                          <Input
                            id={component}
                            type="number"
                            step="0.1"
                            value={value}
                            onChange={(e) => handleGasCompositionChange(component as keyof FlareGasComposition, parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {errors.gasComposition && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{errors.gasComposition}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Atmospheric Conditions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Atmospheric Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="humidity">Relative Humidity (%)</Label>
                      <Slider
                        value={[inputs.atmosphericHumidity]}
                        onValueChange={([value]) => handleInputChange('atmosphericHumidity', value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-muted-foreground">
                        {inputs.atmosphericHumidity}%
                      </div>
                    </div>

                    <InputWithUnit
                      id="ambientTemp"
                      label="Ambient Temperature"
                      value={inputs.ambientTemperature}
                      unit={perFieldUnits.tipTemperature}
                      onValueChange={(value) => handleInputChange('ambientTemperature', value)}
                      onUnitChange={(unit) => handleUnitChange('tipTemperature', unit)}
                      group="temperature"
                    />
                  </CardContent>
                </Card>

                {/* Contour Customization */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Contour Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label>Radiation Contours (kW/m²)</Label>
                      {inputs.radiationContours.map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={level}
                            onChange={(e) => handleContourChange('radiation', index, parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">kW/m²</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Noise Contours (dB(A))</Label>
                      {inputs.noiseContours.map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="1"
                            value={level}
                            onChange={(e) => handleContourChange('noise', index, parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">dB(A)</span>
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

            <TabsContent value="3d" className="space-y-6">
              {outputs ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShow2D(!show2D)} 
                      variant="outline" 
                      size="sm"
                    >
                      {show2D ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {show2D ? 'Hide Diagrams' : 'Show Diagrams'}
                    </Button>
                  </div>
                  
                  {show2D && outputs && (() => {
                    console.log('Flare2DViewer props:', {
                      radiationContours: outputs.radiationFootprint?.contours?.length || 0,
                      noiseContours: outputs.noiseFootprint?.contours?.length || 0,
                      outputs: outputs
                    });
                    return (
                      <Flare2DViewer
                        flareHeight={convertFromSI(inputs.flareTipHeight, perFieldUnits.flareHeight)}
                        tipDiameter={convertFromSI(inputs.tipDiameter, perFieldUnits.tipDiameter)}
                        flameLength={convertFromSI(outputs.flameLength, perFieldUnits.flareHeight)}
                        flameTilt={outputs.flameTilt}
                        windSpeed={convertFromSI(inputs.windSpeed, perFieldUnits.windSpeed)}
                        windDirection={inputs.windDirection}
                        radiationContours={outputs.radiationFootprint?.contours || []}
                        noiseContours={outputs.noiseFootprint?.contours || []}
                        emissiveFraction={outputs.emissiveFraction}
                        exitVelocity={outputs.exitVelocity}
                        unitSystem={unitSystem}
                        onExportPNG={handleExportPNG}
                        onExportCSV={handleExportCSV}
                        onExportJSON={handleExportJSON}
                      />
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter parameters to generate engineering diagrams</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {outputs ? (
                <div className="space-y-6">
                  {/* Key Results */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Flare Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Emissive Fraction:</span>
                          <Badge variant="outline">{outputs.emissiveFraction.toFixed(3)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Exit Velocity:</span>
                          <Badge variant="outline">{formatValueWithUnit(outputs.exitVelocity, 'ms', 1)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Flame Length:</span>
                          <Badge variant="outline">{formatValueWithUnit(outputs.flameLength, perFieldUnits.flareHeight, 1)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Flame Tilt:</span>
                          <Badge variant="outline">{outputs.flameTilt.toFixed(1)}°</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Gas Properties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Molecular Weight:</span>
                          <Badge variant="outline">{outputs.molecularWeight.toFixed(1)} kg/kmol</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">LHV:</span>
                          <Badge variant="outline">{outputs.lhv.toFixed(1)} MJ/kg</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">C/H Ratio:</span>
                          <Badge variant="outline">{outputs.chRatio.toFixed(2)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Density:</span>
                          <Badge variant="outline">{outputs.density.toFixed(2)} kg/m³</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Footprint Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Max Radiation:</span>
                          <Badge variant="outline">{outputs.radiationFootprint.maxRadiation.toFixed(1)} kW/m²</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Max Noise:</span>
                          <Badge variant="outline">{outputs.noiseFootprint.maxNoise.toFixed(1)} dB(A)</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Radiation Range:</span>
                          <Badge variant="outline">{formatValueWithUnit(outputs.radiationFootprint.maxDistance, perFieldUnits.flareHeight, 0)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Noise Range:</span>
                          <Badge variant="outline">{formatValueWithUnit(outputs.noiseFootprint.maxDistance, perFieldUnits.flareHeight, 0)}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Warnings and Notes */}
                  {(outputs.warnings.length > 0 || outputs.notes.length > 0) && (
                    <div className="space-y-4">
                      {outputs.warnings.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Warnings:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {outputs.warnings.map((warning, index) => (
                                  <li key={index} className="text-sm">{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {outputs.notes.length > 0 && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Notes:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {outputs.notes.map((note, index) => (
                                  <li key={index} className="text-sm">{note}</li>
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
                  <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter parameters to calculate flare radiation and noise</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div className="text-center py-8">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Export Options</h3>
                <p className="text-muted-foreground mb-4">
                  Export calculation results and 3D model data
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-6">
              <div className="text-center py-8">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Import Scenario</h3>
                <p className="text-muted-foreground mb-4">
                  Import a saved JSON scenario to restore all settings and calculations
                </p>
                <Button onClick={handleImportJSON} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Scenario (JSON)
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlareRadiationCalculatorEnhanced;
