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

export const kelvinToCelsius = (kelvin: number): number => 
  kelvin - 273.15;

export const fahrenheitToKelvin = (fahrenheit: number): number => 
  (fahrenheit - 32) * 5/9 + 273.15;

export const kelvinToFahrenheit = (kelvin: number): number => 
  (kelvin - 273.15) * 9/5 + 32;

export const fahrenheitToRankine = (fahrenheit: number): number => 
  fahrenheit + 459.67;

export const rankineToFahrenheit = (rankine: number): number => 
  rankine - 459.67;

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

// Extended Pressure Conversions
export const psiaToInwg = (psia: number): number => 
  psia * 27.7076;

export const inwgToPsia = (inwg: number): number => 
  inwg / 27.7076;

export const psigToPsia = (psig: number): number => 
  psig + 14.7;

export const psiaToPsig = (psia: number): number => 
  psia - 14.7;

export const barToInwg = (bar: number): number => 
  bar * 401.865;

export const inwgToBar = (inwg: number): number => 
  inwg / 401.865;

export const kPaToInwg = (kPa: number): number => 
  kPa * 4.01865;

export const inwgToKPa = (inwg: number): number => 
  inwg / 4.01865;

// Atmospheric pressure conversions
export const atmToPsia = (atm: number): number => 
  atm * 14.696;

export const psiaToAtm = (psia: number): number => 
  psia / 14.696;

export const atmToBar = (atm: number): number => 
  atm * 1.01325;

export const barToAtm = (bar: number): number => 
  bar / 1.01325;

export const atmToKPa = (atm: number): number => 
  atm * 101.325;

export const kPaToAtm = (kPa: number): number => 
  kPa / 101.325;

// Additional volume flow conversions
export const m3sToSm3d = (m3s: number): number => 
  m3s * 86400;

export const sm3dToM3s = (sm3d: number): number => 
  sm3d / 86400;

export const cfsToCfm = (cfs: number): number => 
  cfs * 60;

export const cfmToCfs = (cfm: number): number => 
  cfm / 60;

export const m3hToSm3h = (m3h: number): number => 
  m3h; // No conversion needed for same standard conditions

export const scfhToScfm = (scfh: number): number => 
  scfh / 60;

export const scfmToScfh = (scfm: number): number => 
  scfm * 60;

// Mass flow conversions  
export const kgsTolbmh = (kgs: number): number => 
  kgs * 7936.64;

export const lbmhToKgs = (lbmh: number): number => 
  lbmh / 7936.64;

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
      'degC_to_degF': celsiusToFahrenheit,
      'degF_to_degC': fahrenheitToCelsius,
      'degC_to_K': celsiusToKelvin,
      'K_to_degC': kelvinToCelsius,
      'degF_to_K': fahrenheitToKelvin,
      'K_to_degF': kelvinToFahrenheit,
    },
    pressure: {
      'psia_to_kPa': psiaToKPa,
      'kPa_to_psia': kPaToPsia,
      'psia_to_bar': psiaToBar,
      'bar_to_psia': barToPsia,
      'psia_to_inwg': psiaToInwg,
      'inwg_to_psia': inwgToPsia,
      'psig_to_psia': psigToPsia,
      'psia_to_psig': psiaToPsig,
      'bar_to_inwg': barToInwg,
      'inwg_to_bar': inwgToBar,
      'kPa_to_inwg': kPaToInwg,
      'inwg_to_kPa': inwgToKPa,
      'atm_to_psia': atmToPsia,
      'psia_to_atm': psiaToAtm,
      'atm_to_bar': atmToBar,
      'bar_to_atm': barToAtm,
      'atm_to_kPa': atmToKPa,
      'kPa_to_atm': kPaToAtm,
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
      'SCFM_to_Sm3h': scfmToSm3h,
      'Sm3h_to_SCFM': sm3hToScfm,
      'm3s_to_Sm3d': m3sToSm3d,
      'Sm3d_to_m3s': sm3dToM3s,
      'cfs_to_cfm': cfsToCfm,
      'cfm_to_cfs': cfmToCfs,
    },
    mass_flow: {
      'kgs_to_lbmh': kgsTolbmh,
      'lbmh_to_kgs': lbmhToKgs,
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