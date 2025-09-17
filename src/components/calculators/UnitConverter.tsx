import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Copy } from 'lucide-react';
import { convertValue } from '@/lib/unit-conversions';
import { useToast } from '@/hooks/use-toast';
import {
  PRESSURE_UNITS,
  TEMPERATURE_UNITS,
  LENGTH_UNITS,
  FLOW_UNITS,
  MASS_FLOW_UNITS,
  DENSITY_UNITS,
  VELOCITY_UNITS,
  AREA_UNITS,
  VOLUME_UNITS
} from '@/components/ui/unit-selector';

type ConversionCategory = 'pressure' | 'temperature' | 'length' | 'flow' | 'mass_flow' | 'density' | 'velocity' | 'area' | 'volume';

const CATEGORY_UNITS = {
  pressure: PRESSURE_UNITS,
  temperature: TEMPERATURE_UNITS,
  length: LENGTH_UNITS,
  flow: FLOW_UNITS,
  mass_flow: MASS_FLOW_UNITS,
  density: DENSITY_UNITS,
  velocity: VELOCITY_UNITS,
  area: AREA_UNITS,
  volume: VOLUME_UNITS,
};

const CATEGORY_LABELS = {
  pressure: 'Pressure',
  temperature: 'Temperature',
  length: 'Length',
  flow: 'Flow Rate',
  mass_flow: 'Mass Flow',
  density: 'Density',
  velocity: 'Velocity',
  area: 'Area',
  volume: 'Volume',
};

const UnitConverter = () => {
  const { toast } = useToast();
  const [category, setCategory] = useState<ConversionCategory>('pressure');
  const [fromUnit, setFromUnit] = useState(CATEGORY_UNITS.pressure[0].value);
  const [toUnit, setToUnit] = useState(CATEGORY_UNITS.pressure[1].value);
  const [inputValue, setInputValue] = useState<string>('');
  const [outputValue, setOutputValue] = useState<string>('');

  const handleCategoryChange = (newCategory: ConversionCategory) => {
    setCategory(newCategory);
    const units = CATEGORY_UNITS[newCategory];
    setFromUnit(units[0].value);
    setToUnit(units[1].value);
    setInputValue('');
    setOutputValue('');
  };

  const handleConversion = () => {
    if (!inputValue || isNaN(parseFloat(inputValue))) {
      setOutputValue('');
      return;
    }

    try {
      const result = convertValue(parseFloat(inputValue), fromUnit, toUnit);
      setOutputValue(result.toString());
    } catch (error) {
      setOutputValue('Conversion not available');
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value && !isNaN(parseFloat(value))) {
      try {
        const result = convertValue(parseFloat(value), fromUnit, toUnit);
        setOutputValue(result.toString());
      } catch (error) {
        setOutputValue('Conversion not available');
      }
    } else {
      setOutputValue('');
    }
  };

  const handleSwapUnits = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setInputValue(outputValue);
    setOutputValue(inputValue);
  };

  const handleCopyResult = () => {
    if (outputValue) {
      navigator.clipboard.writeText(outputValue);
      toast({
        title: "Result Copied",
        description: "Conversion result copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Unit Converter</h2>
        <p className="text-muted-foreground">
          Convert between different units for oil & gas calculations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Settings */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle>Conversion Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Conversion Category</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Unit</Label>
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_UNITS[category].map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Unit</Label>
                <Select value={toUnit} onValueChange={setToUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_UNITS[category].map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSwapUnits} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Swap Units
            </Button>
          </CardContent>
        </Card>

        {/* Conversion Interface */}
        <Card className="bg-gradient-surface border-border/50">
          <CardHeader>
            <CardTitle>Convert Values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Input Value</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="any"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Enter value to convert"
                    className="pr-20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {CATEGORY_UNITS[category].find(u => u.value === fromUnit)?.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <Label>Result</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={outputValue}
                    readOnly
                    className="bg-secondary/50 pr-20"
                    placeholder="Result will appear here"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {CATEGORY_UNITS[category].find(u => u.value === toUnit)?.label}
                  </span>
                </div>
              </div>

              {outputValue && outputValue !== 'Conversion not available' && (
                <Button 
                  onClick={handleCopyResult}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Result
                </Button>
              )}
            </div>

            {/* Quick Conversions */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium mb-3">Common {CATEGORY_LABELS[category]} Conversions</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {category === 'pressure' && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 bar = 14.504 psia</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 atm = 14.696 psia</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 psia = 6.895 kPa</span>
                    </div>
                  </>
                )}
                {category === 'temperature' && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0°C = 32°F = 273.15K</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>100°C = 212°F = 373.15K</span>
                    </div>
                  </>
                )}
                {category === 'length' && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 in = 25.4 mm</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 ft = 0.3048 m</span>
                    </div>
                  </>
                )}
                {category === 'flow' && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 MSCFD = 28.32 Sm³/d</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 SCFM = 1.699 Sm³/h</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnitConverter;