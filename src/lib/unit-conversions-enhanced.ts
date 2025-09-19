// Enhanced Unit Conversion System for Flare Calculator

export interface UnitValue {
  value: number;
  unit: string;
}

export interface UnitDefinition {
  name: string;
  symbol: string;
  factor: number; // Conversion factor to SI base unit
  offset?: number; // For temperature conversions
}

export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Length
  'm': { name: 'Meters', symbol: 'm', factor: 1 },
  'ft': { name: 'Feet', symbol: 'ft', factor: 0.3048 },
  'in': { name: 'Inches', symbol: 'in', factor: 0.0254 },
  
  // Pressure
  'Pa': { name: 'Pascals', symbol: 'Pa', factor: 1 },
  'kPa': { name: 'Kilopascals', symbol: 'kPa', factor: 1000 },
  'bar': { name: 'Bar', symbol: 'bar', factor: 100000 },
  'psia': { name: 'PSI Absolute', symbol: 'psia', factor: 6894.76 },
  'psig': { name: 'PSI Gauge', symbol: 'psig', factor: 6894.76, offset: 101325 },
  
  // Temperature
  'K': { name: 'Kelvin', symbol: 'K', factor: 1 },
  'C': { name: 'Celsius', symbol: '°C', factor: 1, offset: 273.15 },
  'F': { name: 'Fahrenheit', symbol: '°F', factor: 5/9, offset: 459.67 },
  
  // Flow Rate
  'm3s': { name: 'Cubic Meters per Second', symbol: 'm³/s', factor: 1 },
  'ft3s': { name: 'Cubic Feet per Second', symbol: 'ft³/s', factor: 0.0283168 },
  'MMSCFD': { name: 'Million Standard Cubic Feet per Day', symbol: 'MMSCFD', factor: 0.32774128 },
  'MSCFD': { name: 'Thousand Standard Cubic Feet per Day', symbol: 'MSCFD', factor: 0.00032774128 },
  'MSCMD': { name: 'Million Standard Cubic Meters per Day', symbol: 'MSCMD', factor: 11.574074 },
  
  // Velocity
  'ms': { name: 'Meters per Second', symbol: 'm/s', factor: 1 },
  'fts': { name: 'Feet per Second', symbol: 'ft/s', factor: 0.3048 },
  'mph': { name: 'Miles per Hour', symbol: 'mph', factor: 0.44704 },
  
  // Power
  'W': { name: 'Watts', symbol: 'W', factor: 1 },
  'kW': { name: 'Kilowatts', symbol: 'kW', factor: 1000 },
  'MW': { name: 'Megawatts', symbol: 'MW', factor: 1000000 },
  
  // Sound Level
  'dB': { name: 'Decibels', symbol: 'dB', factor: 1 },
  'dBA': { name: 'A-Weighted Decibels', symbol: 'dB(A)', factor: 1 },
  
  // Angle
  'rad': { name: 'Radians', symbol: 'rad', factor: 1 },
  'deg': { name: 'Degrees', symbol: '°', factor: Math.PI / 180 },
  
  // Dimensionless
  'fraction': { name: 'Fraction', symbol: '', factor: 1 },
  'percent': { name: 'Percent', symbol: '%', factor: 0.01 },
};

export const UNIT_GROUPS = {
  length: ['m', 'ft', 'in'],
  pressure: ['Pa', 'kPa', 'bar', 'psia', 'psig'],
  temperature: ['K', 'C', 'F'],
  flowRate: ['m3s', 'ft3s', 'MMSCFD', 'MSCFD', 'MSCMD'],
  velocity: ['ms', 'fts', 'mph'],
  power: ['W', 'kW', 'MW'],
  soundLevel: ['dB', 'dBA'],
  angle: ['rad', 'deg'],
  dimensionless: ['fraction', 'percent']
};

export const DEFAULT_UNITS = {
  metric: {
    length: 'm',
    pressure: 'kPa',
    temperature: 'C',
    flowRate: 'MSCMD',
    velocity: 'ms',
    power: 'kW',
    soundLevel: 'dBA',
    angle: 'deg',
    dimensionless: 'fraction'
  },
  field: {
    length: 'ft',
    pressure: 'psia',
    temperature: 'F',
    flowRate: 'MMSCFD',
    velocity: 'fts',
    power: 'kW',
    soundLevel: 'dBA',
    angle: 'deg',
    dimensionless: 'fraction'
  },
  // Legacy support
  SI: {
    length: 'm',
    pressure: 'kPa',
    temperature: 'C',
    flowRate: 'MSCMD',
    velocity: 'ms',
    power: 'kW',
    soundLevel: 'dBA',
    angle: 'deg',
    dimensionless: 'fraction'
  },
  Field: {
    length: 'ft',
    pressure: 'psia',
    temperature: 'F',
    flowRate: 'MMSCFD',
    velocity: 'fts',
    power: 'kW',
    soundLevel: 'dBA',
    angle: 'deg',
    dimensionless: 'fraction'
  }
};

// Conversion functions
export const convertToSI = (value: number, unit: string): number => {
  const definition = UNIT_DEFINITIONS[unit];
  if (!definition) throw new Error(`Unknown unit: ${unit}`);
  
  if (definition.offset !== undefined) {
    // Temperature conversion
    return (value + definition.offset) * definition.factor;
  }
  
  return value * definition.factor;
};

export const convertFromSI = (value: number, unit: string): number => {
  const definition = UNIT_DEFINITIONS[unit];
  if (!definition) throw new Error(`Unknown unit: ${unit}`);
  
  if (definition.offset !== undefined) {
    // Temperature conversion
    return (value / definition.factor) - definition.offset;
  }
  
  return value / definition.factor;
};

export const convertBetweenUnits = (value: number, fromUnit: string, toUnit: string): number => {
  const siValue = convertToSI(value, fromUnit);
  return convertFromSI(siValue, toUnit);
};

// Unit selector component props
export interface UnitSelectorProps {
  value: string;
  onChange: (unit: string) => void;
  group: keyof typeof UNIT_GROUPS;
  className?: string;
}

// Scenario JSON structure
export interface FlareScenario {
  version: string;
  inputs: {
    gasRate: UnitValue;
    flareHeight: UnitValue;
    tipDiameter: UnitValue;
    tipPressure: UnitValue;
    tipTemperature: UnitValue;
    windSpeed: UnitValue;
    windDirection: UnitValue;
    humidity: UnitValue;
    composition: Record<string, number>;
  };
  options: {
    emissiveFraction: { mode: 'auto' | 'manual'; value: number };
    noiseReferenceDistance: UnitValue;
    globalUnitPreset: 'SI' | 'Field';
  };
  derived?: {
    MW: number;
    Z: number;
    vExit: number;
    chi: number;
    flame: {
      L: number;
      tiltDeg: number;
    };
  };
  camera?: {
    target: [number, number, number];
    position: [number, number, number];
  };
}

// Validation functions
export const validateScenario = (scenario: any): scenario is FlareScenario => {
  if (!scenario || typeof scenario !== 'object') return false;
  if (scenario.version !== 'flarecalc-1.1') return false;
  if (!scenario.inputs || !scenario.options) return false;
  
  // Validate required input fields
  const requiredInputs = ['gasRate', 'flareHeight', 'tipDiameter', 'tipPressure', 'tipTemperature', 'windSpeed', 'windDirection', 'humidity'];
  for (const input of requiredInputs) {
    if (!scenario.inputs[input] || typeof scenario.inputs[input].value !== 'number' || typeof scenario.inputs[input].unit !== 'string') {
      return false;
    }
  }
  
  return true;
};

// Export functions
export const exportScenarioToJSON = (scenario: FlareScenario): string => {
  return JSON.stringify(scenario, null, 2);
};

export const importScenarioFromJSON = (jsonString: string): FlareScenario | null => {
  try {
    const scenario = JSON.parse(jsonString);
    if (validateScenario(scenario)) {
      return scenario as FlareScenario;
    }
    return null;
  } catch {
    return null;
  }
};

// CSV export functions
export const exportContoursToCSV = (contours: Array<{
  level: number;
  points: Array<{x: number; y: number; z: number}>;
  type: 'radiation' | 'noise';
}>): string => {
  const lines = ['layer,level,vertex_index,x,y'];
  
  contours.forEach(contour => {
    const layerName = `${contour.type}_${contour.level}`;
    contour.points.forEach((point, index) => {
      lines.push(`${layerName},${contour.level},${index},${point.x.toFixed(3)},${point.y.toFixed(3)}`);
    });
  });
  
  return lines.join('\n');
};

// Unit display helpers
export const formatValueWithUnit = (value: number, unit: string, decimals: number = 2): string => {
  const definition = UNIT_DEFINITIONS[unit];
  if (!definition) return `${value.toFixed(decimals)} ${unit}`;
  
  return `${value.toFixed(decimals)} ${definition.symbol}`;
};

export const getUnitSymbol = (unit: string): string => {
  const definition = UNIT_DEFINITIONS[unit];
  return definition ? definition.symbol : unit;
};
