// Unit Conversion Utilities

export const STANDARD_CONDITIONS = {
  temperature_F: 60, // °F
  temperature_C: 15.56, // °C
  pressure_psia: 14.7, // psia
  pressure_kPa: 101.325, // kPa
  pressure_bar: 1.01325, // bar
};

export const GAS_CONSTANT = {
  SI: 8314.472, // J/(kmol·K)
  USC: 1545.35, // ft·lbf/(lbmol·°R)
};

// Temperature Conversions
export const celsiusToFahrenheit = (celsius: number): number => 
  (celsius * 9/5) + 32;

export const fahrenheitToCelsius = (fahrenheit: number): number => 
  (fahrenheit - 32) * 5/9;

export const celsiusToKelvin = (celsius: number): number => 
  celsius + 273.15;

export const fahrenheitToRankine = (fahrenheit: number): number => 
  fahrenheit + 459.67;

// Pressure Conversions
export const psiaToKPa = (psia: number): number => 
  psia * 6.89476;

export const kPaToPsia = (kPa: number): number => 
  kPa / 6.89476;

export const psiaToBar = (psia: number): number => 
  psia * 0.0689476;

export const barToPsia = (bar: number): number => 
  bar / 0.0689476;

export const kPaToBar = (kPa: number): number => 
  kPa / 100;

export const barToKPa = (bar: number): number => 
  bar * 100;

// Length Conversions
export const inchesToMm = (inches: number): number => 
  inches * 25.4;

export const mmToInches = (mm: number): number => 
  mm / 25.4;

export const feetToMeters = (feet: number): number => 
  feet * 0.3048;

export const metersToFeet = (meters: number): number => 
  meters / 0.3048;

// Area Conversions
export const sqInchesToSqMeters = (sqInches: number): number => 
  sqInches * 0.00064516;

export const sqMetersToSqInches = (sqMeters: number): number => 
  sqMeters / 0.00064516;

// Flow Rate Conversions
export const mscfdToSm3d = (mscfd: number): number => 
  mscfd * 28.3168;

export const sm3dToMscfd = (sm3d: number): number => 
  sm3d / 28.3168;

export const mmscfdToSm3d = (mmscfd: number): number => 
  mmscfd * 28316.8;

export const sm3dToMmscfd = (sm3d: number): number => 
  sm3d / 28316.8;

export const scfmToSm3h = (scfm: number): number => 
  scfm * 1.699;

export const sm3hToScfm = (sm3h: number): number => 
  sm3h / 1.699;

// Density Conversions
export const lbmPerFt3ToKgPerM3 = (lbmFt3: number): number => 
  lbmFt3 * 16.0185;

export const kgPerM3ToLbmPerFt3 = (kgM3: number): number => 
  kgM3 / 16.0185;

// Velocity Conversions
export const msToFtS = (ms: number): number => 
  ms * 3.28084;

export const ftSToMs = (fts: number): number => 
  fts / 3.28084;

// Calculate pipe area from diameter
export const calculatePipeArea = (diameter: number): number => 
  Math.PI * Math.pow(diameter, 2) / 4;

// Standard to actual volumetric flow conversion
export const standardToActualFlow = (
  qStd: number,
  pressure: number,
  temperature: number,
  Z: number,
  standardConditions: { pressure: number; temperature: number }
): number => {
  const tempK = temperature + 273.15;
  const tempStdK = standardConditions.temperature + 273.15;
  
  return qStd * (standardConditions.pressure / pressure) * (tempK / tempStdK) * Z;
};

// Gas density calculation
export const calculateGasDensity = (
  pressure: number, // Pa
  temperature: number, // K
  MW: number, // kg/kmol
  Z: number = 1.0
): number => {
  return (pressure * MW) / (GAS_CONSTANT.SI * temperature * Z);
};

// Unit system conversion helper
export const convertValue = (
  value: number,
  fromUnit: string,
  toUnit: string
): number => {
  const conversions: Record<string, Record<string, (val: number) => number>> = {
    temperature: {
      'C_to_F': celsiusToFahrenheit,
      'F_to_C': fahrenheitToCelsius,
    },
    pressure: {
      'psia_to_kPa': psiaToKPa,
      'kPa_to_psia': kPaToPsia,
      'psia_to_bar': psiaToBar,
      'bar_to_psia': barToPsia,
    },
    length: {
      'in_to_mm': inchesToMm,
      'mm_to_in': mmToInches,
      'ft_to_m': feetToMeters,
      'm_to_ft': metersToFeet,
    },
    flow: {
      'MSCFD_to_Sm3d': mscfdToSm3d,
      'Sm3d_to_MSCFD': sm3dToMscfd,
      'MMSCFD_to_Sm3d': mmscfdToSm3d,
      'Sm3d_to_MMSCFD': sm3dToMmscfd,
    },
    velocity: {
      'ms_to_fts': msToFtS,
      'fts_to_ms': ftSToMs,
    },
  };

  const category = Object.keys(conversions).find(cat => 
    conversions[cat][`${fromUnit}_to_${toUnit}`]
  );

  if (category && conversions[category][`${fromUnit}_to_${toUnit}`]) {
    return conversions[category][`${fromUnit}_to_${toUnit}`](value);
  }

  return value; // No conversion found, return original value
};