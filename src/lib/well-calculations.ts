// Well Testing Calculation Functions

import { 
  calculatePipeArea, 
  calculateGasDensity, 
  standardToActualFlow,
  GAS_CONSTANT,
  STANDARD_CONDITIONS 
} from './unit-conversions';
import type {
  DanielOrificeInputs,
  DanielOrificeOutputs,
  ChokeInputs,
  ChokeOutputs,
  CriticalFlowInputs,
  CriticalFlowOutputs,
  GORInputs,
  GOROutputs,
  VelocityInputs,
  VelocityOutputs,
  APIGravityInputs,
  APIGravityOutputs,
  FlareRadiationInputs,
  FlareRadiationOutputs,
  FlareGasComposition,
  FlowAssuranceInputs,
  FlowAssuranceOutputs,
  NodeState,
  Segment,
  PhaseProperties,
  EquipmentModel,
} from '@/types/well-testing';

// Daniel Orifice Calculations
export const calculateDanielOrifice = (inputs: DanielOrificeInputs): DanielOrificeOutputs => {
  const {
    pipeID,
    orificeD,
    deltaP,
    pressure,
    temperature,
    dischargeCoeff,
    fluidType,
    gasProperties,
    autoCalculateDensity
  } = inputs;

  // Calculate beta ratio
  const beta = orificeD / pipeID;
  
  // Calculate density
  let density = inputs.density || 0;
  if (fluidType === 'gas' && autoCalculateDensity) {
    const tempK = temperature + 273.15;
    const pressurePa = pressure * 6895; // psia to Pa
    density = calculateGasDensity(pressurePa, tempK, gasProperties.MW, gasProperties.Z);
  }

  // Calculate gas expansibility factor for gas
  let expansibility = 1.0;
  if (fluidType === 'gas') {
    const deltaP_P1 = deltaP / pressure;
    expansibility = 1 - (0.351 + 0.256 * Math.pow(beta, 4) + 0.93 * Math.pow(beta, 8)) * deltaP_P1;
  }

  // Calculate orifice area
  const orificeArea = calculatePipeArea(orificeD);

  // Mass flow calculation
  const massFlow = dischargeCoeff * expansibility * orificeArea * 
    Math.sqrt((2 * density * deltaP * 6895) / (1 - Math.pow(beta, 4))); // Convert deltaP to Pa

  // Volumetric flow
  const volumetricFlow = massFlow / density;

  // Standard flow (convert to MMSCFD for gas)
  let standardFlow = 0;
  if (fluidType === 'gas') {
    standardFlow = standardToActualFlow(
      volumetricFlow,
      pressure * 6895,
      temperature + 273.15,
      gasProperties.Z,
      { pressure: STANDARD_CONDITIONS.pressure_kPa * 1000, temperature: STANDARD_CONDITIONS.temperature_C + 273.15 }
    ) * 86400 / 28316.8; // Convert to MMSCFD
  }

  // Reynolds number estimation (simplified)
  const velocity = volumetricFlow / calculatePipeArea(pipeID);
  const viscosity = fluidType === 'gas' ? 1.8e-5 : 1e-3; // Rough estimates
  const reynoldsNumber = (density * velocity * pipeID) / viscosity;

  // Warnings
  const warnings: string[] = [];
  if (reynoldsNumber < 10000) {
    warnings.push('Reynolds number below 10,000 - discharge coefficient may be inaccurate');
  }
  if (beta > 0.75) {
    warnings.push('Beta ratio > 0.75 - results may be less accurate');
  }
  if (deltaP / pressure > 0.1 && fluidType === 'gas') {
    warnings.push('High differential pressure ratio - consider compressibility effects');
  }

  const assumptions = [
    `Discharge coefficient: ${dischargeCoeff}`,
    `Gas properties: k=${gasProperties.k}, MW=${gasProperties.MW} kg/kmol, Z=${gasProperties.Z}`,
    `Expansibility factor: ${expansibility.toFixed(4)}`,
    fluidType === 'gas' && autoCalculateDensity ? 'Density auto-calculated from gas properties' : 'Density user-provided'
  ];

  return {
    massFlow,
    volumetricFlow,
    standardFlow,
    reynoldsNumber,
    warnings,
    assumptions
  };
};

// Choke Rate Calculations
export const calculateChokeRate = (inputs: ChokeInputs): ChokeOutputs => {
  const {
    chokeDiameter,
    upstreamPressure,
    downstreamPressure,
    temperature,
    dischargeCoeff,
    fluidType,
    gasProperties,
    liquidDensity = 800
  } = inputs;

  const chokeArea = calculatePipeArea(chokeDiameter);
  const tempK = temperature + 273.15;
  const upstreamPa = upstreamPressure * 6895;
  const downstreamPa = downstreamPressure * 6895;

  let massFlow = 0;
  let flowRegime: 'CHOKED' | 'SUBCRITICAL' = 'SUBCRITICAL';
  let machNumber = 0;

  if (fluidType === 'gas') {
    const { k, MW, Z } = gasProperties;
    
    // Critical pressure ratio
    const criticalRatio = Math.pow(2 / (k + 1), k / (k - 1));
    const pressureRatio = downstreamPressure / upstreamPressure;
    
    if (pressureRatio <= criticalRatio) {
      // Choked flow
      flowRegime = 'CHOKED';
      machNumber = 1.0;
      
      const chokedMassFlow = dischargeCoeff * chokeArea * upstreamPa * 
        Math.sqrt(k / (Z * GAS_CONSTANT.SI * tempK)) * 
        Math.pow(2 / (k + 1), (k + 1) / (2 * (k - 1)));
      
      massFlow = chokedMassFlow;
    } else {
      // Subcritical flow
      flowRegime = 'SUBCRITICAL';
      
      const subcriticalMassFlow = dischargeCoeff * chokeArea * upstreamPa * 
        Math.sqrt((2 * k) / (Z * GAS_CONSTANT.SI * tempK * (k - 1)) * 
        (Math.pow(pressureRatio, 2/k) - Math.pow(pressureRatio, (k+1)/k)));
      
      massFlow = subcriticalMassFlow;
      
      // Estimate Mach number
      const density = calculateGasDensity(upstreamPa, tempK, MW, Z);
      const velocity = massFlow / (density * chokeArea);
      const speedOfSound = Math.sqrt(k * GAS_CONSTANT.SI * tempK / MW);
      machNumber = velocity / speedOfSound;
    }
  } else {
    // Liquid flow (non-cavitating)
    const volumetricFlow = dischargeCoeff * chokeArea * 
      Math.sqrt(2 * (upstreamPa - downstreamPa) / liquidDensity);
    
    massFlow = volumetricFlow * liquidDensity;
    machNumber = 0; // Not applicable for liquids
  }

  // Calculate outputs
  const density = fluidType === 'gas' ? 
    calculateGasDensity(upstreamPa, tempK, gasProperties.MW, gasProperties.Z) : 
    liquidDensity;
  
  const volumetricFlow = massFlow / density;
  
  let standardFlow = 0;
  if (fluidType === 'gas') {
    standardFlow = standardToActualFlow(
      volumetricFlow,
      upstreamPa,
      tempK,
      gasProperties.Z,
      { pressure: STANDARD_CONDITIONS.pressure_kPa * 1000, temperature: STANDARD_CONDITIONS.temperature_C + 273.15 }
    ) * 86400 / 28316.8; // Convert to MMSCFD
  }

  const notes = [
    `Flow regime: ${flowRegime}`,
    `Discharge coefficient: ${dischargeCoeff}`,
    fluidType === 'gas' ? `Critical pressure ratio: ${Math.pow(2 / (gasProperties.k + 1), gasProperties.k / (gasProperties.k - 1)).toFixed(4)}` : '',
    fluidType === 'liquid' ? 'Assumes non-cavitating flow' : ''
  ].filter(Boolean);

  return {
    massFlow,
    volumetricFlow,
    standardFlow,
    flowRegime,
    machNumber,
    notes
  };
};

// Critical Flow Calculations
export const calculateCriticalFlow = (inputs: CriticalFlowInputs): CriticalFlowOutputs => {
  const {
    k,
    upstreamPressure,
    downstreamPressure,
    temperature,
    Z,
    MW,
    throatArea,
    dischargeCoeff,
    guessedVelocity
  } = inputs;

  const criticalRatio = Math.pow(2 / (k + 1), k / (k - 1));
  const pressureRatio = downstreamPressure / upstreamPressure;
  const regime: 'CHOKED' | 'SUBCRITICAL' = pressureRatio <= criticalRatio ? 'CHOKED' : 'SUBCRITICAL';

  const tempK = temperature + 273.15;
  const upstreamPa = upstreamPressure * 6895;
  const speedOfSound = Math.sqrt(k * GAS_CONSTANT.SI * tempK / MW);

  let massFlow = 0;
  let machNumber: number | undefined;

  if (regime === 'CHOKED') {
    massFlow = dischargeCoeff * throatArea * upstreamPa * 
      Math.sqrt(k / (Z * GAS_CONSTANT.SI * tempK)) * 
      Math.pow(2 / (k + 1), (k + 1) / (2 * (k - 1)));
    machNumber = 1.0;
  } else {
    massFlow = dischargeCoeff * throatArea * upstreamPa * 
      Math.sqrt((2 * k) / (Z * GAS_CONSTANT.SI * tempK * (k - 1)) * 
      (Math.pow(pressureRatio, 2/k) - Math.pow(pressureRatio, (k+1)/k)));
  }

  if (guessedVelocity && !machNumber) {
    machNumber = guessedVelocity / speedOfSound;
  }

  const density = calculateGasDensity(upstreamPa, tempK, MW, Z);
  const volumetricFlow = massFlow / density;
  
  const standardFlow = standardToActualFlow(
    volumetricFlow,
    upstreamPa,
    tempK,
    Z,
    { pressure: STANDARD_CONDITIONS.pressure_kPa * 1000, temperature: STANDARD_CONDITIONS.temperature_C + 273.15 }
  ) * 86400 / 28316.8; // Convert to MMSCFD

  return {
    criticalRatio,
    regime,
    massFlow,
    volumetricFlow,
    standardFlow,
    speedOfSound,
    machNumber
  };
};

// GOR Calculations
export const calculateGOR = (inputs: GORInputs): GOROutputs => {
  const {
    gasRate,
    oilRate,
    apiGravity,
    gasSpecificGravity,
    reservoirTemp,
    reservoirPressure
  } = inputs;

  let producedGOR: number | undefined;
  let solutionGOR: number | undefined;
  let bubblePointPressure: number | undefined;
  const warnings: string[] = [];
  const notes: string[] = [];

  // Produced GOR calculation
  if (gasRate && oilRate) {
    producedGOR = gasRate / oilRate;
    notes.push(`Produced GOR calculated from gas rate ${gasRate} and oil rate ${oilRate}`);
  }

  // Standing correlation for solution GOR
  if (apiGravity && gasSpecificGravity && reservoirTemp && reservoirPressure) {
    const tempF = reservoirTemp; // Assuming input is in °F
    const pressurePsia = reservoirPressure; // Assuming input is in psia
    
    // Standing correlation
    solutionGOR = gasSpecificGravity * (pressurePsia / 18.2 + 1.4) * 
      Math.pow(10, (0.0125 * apiGravity - 0.00091 * tempF));
    
    // Bubble point pressure estimation (Standing)
    bubblePointPressure = 18.2 * ((solutionGOR / gasSpecificGravity) - 1.4);
    
    notes.push('Solution GOR calculated using Standing correlation');
    notes.push(`Estimated bubble point pressure: ${bubblePointPressure?.toFixed(1)} psia`);
    
    if (pressurePsia < bubblePointPressure) {
      warnings.push('Reservoir pressure below estimated bubble point - two-phase conditions likely');
    }
  }

  return {
    producedGOR,
    solutionGOR,
    bubblePointPressure,
    warnings,
    notes
  };
};

// Gas Velocity Calculations with proper unit handling
export const calculateGasVelocityWithUnits = (
  inputs: VelocityInputs,
  units: {
    pipeID: string;
    gasRate: string;
    pressure: string;
    temperature: string;
    density?: string;
  }
): VelocityOutputs => {
  const {
    pipeID,
    gasRateStd,
    pressure,
    temperature,
    Z,
    k,
    MW,
    erosionalConstant,
    fluidDensity
  } = inputs;

  // Convert all inputs to SI units for calculations
  let pipeID_m = pipeID;
  if (units.pipeID === 'in') pipeID_m = pipeID * 0.0254;
  if (units.pipeID === 'mm') pipeID_m = pipeID / 1000;

  let gasRate_m3s = gasRateStd;
  if (units.gasRate === 'MSCFD') gasRate_m3s = gasRateStd * 28.3168 / 86400;
  if (units.gasRate === 'MMSCFD') gasRate_m3s = gasRateStd * 28316.8 / 86400;
  if (units.gasRate === 'Sm3d') gasRate_m3s = gasRateStd / 86400;
  if (units.gasRate === 'Sm3h') gasRate_m3s = gasRateStd / 3600;
  if (units.gasRate === 'SCFM') gasRate_m3s = gasRateStd * 0.02832 / 60;

  let pressure_Pa = pressure;
  if (units.pressure === 'psia') pressure_Pa = pressure * 6895;
  if (units.pressure === 'psig') pressure_Pa = (pressure + 14.7) * 6895;
  if (units.pressure === 'bar') pressure_Pa = pressure * 100000;
  if (units.pressure === 'kPa') pressure_Pa = pressure * 1000;
  if (units.pressure === 'atm') pressure_Pa = pressure * 101325;
  if (units.pressure === 'inwg') pressure_Pa = pressure * 248.84;

  let temperature_K = temperature;
  if (units.temperature === 'degC') temperature_K = temperature + 273.15;
  if (units.temperature === 'degF') temperature_K = (temperature - 32) * 5/9 + 273.15;

  // Convert standard to actual flow
  const actualFlow = standardToActualFlow(
    gasRate_m3s,
    pressure_Pa,
    temperature_K,
    Z,
    { pressure: STANDARD_CONDITIONS.pressure_kPa * 1000, temperature: STANDARD_CONDITIONS.temperature_C + 273.15 }
  );

  // Calculate velocity
  const pipeArea = calculatePipeArea(pipeID_m);
  const velocity = actualFlow / pipeArea;

  // Speed of sound and Mach number
  const speedOfSound = Math.sqrt(k * GAS_CONSTANT.SI * temperature_K / MW);
  const machNumber = velocity / speedOfSound;

  // Calculate erosional velocity
  let density = fluidDensity;
  if (!density) {
    density = calculateGasDensity(pressure_Pa, temperature_K, MW, Z);
  } else if (units.density === 'lbmft3') {
    density = density * 16.0185; // Convert to kg/m³
  }
  
  const erosionalVelocity = erosionalConstant / Math.sqrt(density);

  // Warnings and pass/fail flags
  const warnings: string[] = [];
  const passFailFlags = {
    erosionalVelocity: velocity <= erosionalVelocity,
    machNumber: machNumber <= 0.3
  };

  if (!passFailFlags.erosionalVelocity) {
    warnings.push(`Velocity ${velocity.toFixed(2)} m/s exceeds erosional limit ${erosionalVelocity.toFixed(2)} m/s`);
  }
  
  if (!passFailFlags.machNumber) {
    warnings.push(`Mach number ${machNumber.toFixed(3)} exceeds recommended limit of 0.3`);
  }

  return {
    velocity,
    machNumber,
    erosionalVelocity,
    speedOfSound,
    warnings,
    passFailFlags
  };
};

// Backward compatibility
export const calculateGasVelocity = (inputs: VelocityInputs): VelocityOutputs => {
  return calculateGasVelocityWithUnits(inputs, {
    pipeID: 'm',
    gasRate: 'm3s',
    pressure: 'kPa',
    temperature: 'degC'
  });
};

// API Gravity Calculations
export const calculateAPIGravity = (inputs: APIGravityInputs): APIGravityOutputs => {
  const {
    specificGravity,
    temperature,
    referenceTemp = 60
  } = inputs;

  const warnings: string[] = [];
  const notes: string[] = [];

  // Validate inputs
  if (specificGravity <= 0) {
    throw new Error('Specific gravity must be greater than 0');
  }
  
  if (specificGravity > 2.0) {
    warnings.push('Specific gravity > 2.0 is unusual for petroleum liquids');
  }
  
  if (specificGravity < 0.5) {
    warnings.push('Specific gravity < 0.5 is unusual for petroleum liquids');
  }

  // Calculate API gravity at reference temperature (60°F)
  const apiGravity = (141.5 / specificGravity) - 131.5;

  // Temperature correction factor for API gravity
  // ASTM D1250-08 Table 5A - Temperature Correction for API Gravity
  const tempDiff = temperature - referenceTemp;
  const temperatureCorrection = tempDiff * 0.00035; // °API per °F

  // Apply temperature correction
  const apiGravityCorrected = apiGravity + temperatureCorrection;

  // Calculate corrected specific gravity
  const specificGravityCorrected = 141.5 / (apiGravityCorrected + 131.5);

  // Calculate density at reference temperature (water = 62.4 lb/ft³ at 60°F)
  const waterDensity = 62.4; // lb/ft³ at 60°F
  const density = specificGravity * waterDensity;
  const densityCorrected = specificGravityCorrected * waterDensity;

  // Add notes and warnings
  if (apiGravity < 10) {
    warnings.push('API gravity < 10°API indicates very heavy crude oil');
  } else if (apiGravity > 50) {
    warnings.push('API gravity > 50°API indicates very light crude oil or condensate');
  }

  if (Math.abs(temperatureCorrection) > 5) {
    warnings.push('Large temperature correction applied - verify temperature range validity');
  }

  notes.push(`Temperature correction: ${temperatureCorrection.toFixed(4)} °API`);
  notes.push(`Reference temperature: ${referenceTemp}°F`);
  notes.push(`API gravity range: ${apiGravity < 10 ? 'Heavy' : apiGravity > 50 ? 'Light' : 'Medium'} crude`);

  return {
    apiGravity,
    apiGravityCorrected,
    specificGravityCorrected,
    density,
    densityCorrected,
    temperatureCorrection,
    warnings,
    notes
  };
};

// Flare Radiation and Noise Calculations (API Standard 521)
export const calculateFlareRadiation = (inputs: FlareRadiationInputs): FlareRadiationOutputs => {
  const warnings: string[] = [];
  const notes: string[] = [];

  // Validate inputs
  if (inputs.gasRate <= 0) {
    throw new Error('Gas rate must be greater than 0');
  }
  if (inputs.tipDiameter <= 0) {
    throw new Error('Tip diameter must be greater than 0');
  }
  if (inputs.tipPressure <= 0) {
    throw new Error('Tip pressure must be greater than 0');
  }
  if (inputs.tipTemperature <= 0) {
    throw new Error('Tip temperature must be greater than 0');
  }

  // Calculate derived gas properties
  const gasProps = calculateGasProperties(inputs.gasComposition);
  
  // Calculate density at tip conditions
  const R = 8314.47; // Universal gas constant J/(kmol·K)
  gasProps.density = (inputs.tipPressure * 1000 * gasProps.molecularWeight) / 
    (R * inputs.tipTemperature * gasProps.compressibilityFactor);
  
  // Calculate emissive fraction
  const emissiveFraction = inputs.emissiveFraction || calculateEmissiveFraction(inputs.gasComposition);
  
  // Calculate exit velocity and momentum
  const exitVelocity = calculateExitVelocity(inputs, gasProps);
  const momentumFlux = gasProps.density * exitVelocity * exitVelocity;
  const buoyancyParameter = calculateBuoyancyParameter(inputs, gasProps);
  
  // Calculate flame geometry
  const flameGeometry = calculateFlameGeometry(inputs, exitVelocity, momentumFlux, buoyancyParameter);
  
  // Calculate atmospheric conditions
  const atmosphericTransmissivity = calculateAtmosphericTransmissivity(inputs);
  const airAbsorption = calculateAirAbsorption(inputs);
  
  // Calculate radiation footprint
  const radiationFootprint = calculateRadiationFootprint(
    inputs, 
    flameGeometry, 
    emissiveFraction, 
    atmosphericTransmissivity,
    gasProps
  );
  
  // Calculate noise footprint
  const noiseFootprint = calculateNoiseFootprint(
    inputs, 
    exitVelocity, 
    gasProps, 
    airAbsorption
  );

  // Add warnings and notes
  if (emissiveFraction > 0.4) {
    warnings.push('High emissive fraction - verify gas composition and soot formation');
  }
  if (exitVelocity > 200) {
    warnings.push('High exit velocity - check for potential noise issues');
  }
  if (flameGeometry.length > 100) {
    warnings.push('Very long flame - verify flame stability and radiation calculations');
  }

  notes.push(`Emissive fraction calculated from gas composition: ${emissiveFraction.toFixed(3)}`);
  notes.push(`Flame length: ${flameGeometry.length.toFixed(1)} m, Tilt: ${flameGeometry.tilt.toFixed(1)}°`);
  notes.push(`Maximum radiation: ${radiationFootprint.maxRadiation.toFixed(1)} kW/m²`);
  notes.push(`Maximum noise: ${noiseFootprint.maxNoise.toFixed(1)} dB(A)`);

  return {
    // Derived properties
    molecularWeight: gasProps.molecularWeight,
    lhv: gasProps.lhv,
    hhv: gasProps.hhv,
    gamma: gasProps.gamma,
    compressibilityFactor: gasProps.compressibilityFactor,
    density: gasProps.density,
    viscosity: gasProps.viscosity,
    chRatio: gasProps.chRatio,
    sootIndex: gasProps.sootIndex,
    
    // Flare performance
    emissiveFraction,
    exitVelocity,
    momentumFlux,
    buoyancyParameter,
    
    // Flame geometry
    flameLength: flameGeometry.length,
    flameTilt: flameGeometry.tilt,
    radiantCenter: flameGeometry.radiantCenter,
    
    // Results
    radiationFootprint,
    noiseFootprint,
    
    // Atmospheric conditions
    atmosphericTransmissivity,
    airAbsorption,
    
    warnings,
    notes
  };
};

// Helper functions for flare calculations
const calculateGasProperties = (composition: FlareGasComposition) => {
  // Molecular weights (kg/kmol)
  const mw = {
    ch4: 16.04, c2h6: 30.07, c3h8: 44.10, iC4: 58.12, nC4: 58.12,
    c5Plus: 72.15, h2: 2.02, n2: 28.01, co2: 44.01, h2s: 34.08
  };
  
  // LHV values (MJ/kg)
  const lhv = {
    ch4: 50.0, c2h6: 47.5, c3h8: 46.4, iC4: 45.6, nC4: 45.6,
    c5Plus: 44.8, h2: 120.0, n2: 0, co2: 0, h2s: 15.4
  };
  
  // HHV values (MJ/kg)
  const hhv = {
    ch4: 55.5, c2h6: 51.9, c3h8: 50.4, iC4: 49.5, nC4: 49.5,
    c5Plus: 48.6, h2: 142.0, n2: 0, co2: 0, h2s: 16.5
  };
  
  // Calculate mixture properties
  const totalMoles = Object.values(composition).reduce((sum, val) => sum + val, 0);
  if (Math.abs(totalMoles - 100) > 0.1) {
    throw new Error('Gas composition must sum to 100%');
  }
  
  const molecularWeight = Object.entries(composition).reduce((sum, [key, mol]) => 
    sum + (mol / 100) * mw[key as keyof typeof mw], 0);
  
  const lhvMix = Object.entries(composition).reduce((sum, [key, mol]) => 
    sum + (mol / 100) * lhv[key as keyof typeof lhv], 0);
  
  const hhvMix = Object.entries(composition).reduce((sum, [key, mol]) => 
    sum + (mol / 100) * hhv[key as keyof typeof hhv], 0);
  
  // Calculate C/H ratio
  const carbonAtoms = (composition.ch4 * 1 + composition.c2h6 * 2 + composition.c3h8 * 3 + 
    composition.iC4 * 4 + composition.nC4 * 4 + composition.c5Plus * 5) / 100;
  
  const hydrogenAtoms = (composition.ch4 * 4 + composition.c2h6 * 6 + composition.c3h8 * 8 + 
    composition.iC4 * 10 + composition.nC4 * 10 + composition.c5Plus * 12 + 
    composition.h2 * 2) / 100;
  
  const chRatio = carbonAtoms / hydrogenAtoms;
  
  // Soot index surrogate (higher for heavier hydrocarbons)
  const sootIndex = (composition.c2h6 * 0.1 + composition.c3h8 * 0.2 + 
    composition.iC4 * 0.3 + composition.nC4 * 0.3 + composition.c5Plus * 0.4) / 100;
  
  // Estimate gamma (Cp/Cv) - simplified correlation
  const gamma = 1.3 + 0.1 * (composition.h2 / 100) - 0.05 * (composition.co2 / 100);
  
  // Estimate compressibility factor Z - simplified correlation
  const z = 0.9 + 0.1 * (composition.h2 / 100) - 0.05 * (composition.co2 / 100);
  
  return {
    molecularWeight,
    lhv: lhvMix,
    hhv: hhvMix,
    gamma,
    compressibilityFactor: z,
    density: 1.0, // Will be calculated with pressure/temperature
    viscosity: 1.8e-5, // Will be calculated with pressure/temperature
    chRatio,
    sootIndex
  };
};

const calculateEmissiveFraction = (composition: FlareGasComposition): number => {
  const gasProps = calculateGasProperties(composition);
  
  // Base emissive fraction from C/H ratio
  const chBase = Math.max(0.10, Math.min(0.40, 0.10 + 0.20 * (gasProps.chRatio - 0.25)));
  
  // Correction for CO2 and H2S
  const co2Correction = 0.15 * (composition.co2 / 100);
  const h2sCorrection = 0.10 * (composition.h2s / 100);
  
  const emissiveFraction = Math.max(0.15, Math.min(0.45, chBase * (1 + co2Correction + h2sCorrection)));
  
  return emissiveFraction;
};

const calculateExitVelocity = (inputs: FlareRadiationInputs, gasProps: any): number => {
  // Convert standard flow to actual flow
  const standardFlow = inputs.gasRate * 1e6; // Convert MMSCFD to SCFD
  const actualFlow = standardFlow * (STANDARD_CONDITIONS.pressure_psia / inputs.tipPressure) * 
    (inputs.tipTemperature / STANDARD_CONDITIONS.temperature_F) * gasProps.compressibilityFactor;
  
  // Calculate tip area
  const tipArea = Math.PI * Math.pow(inputs.tipDiameter / 2, 2);
  
  // Calculate exit velocity (convert SCFD to m/s)
  const exitVelocity = (actualFlow * 0.0283168) / (tipArea * 86400); // Convert SCFD to m³/s, then to m/s
  
  return exitVelocity;
};

const calculateBuoyancyParameter = (inputs: FlareRadiationInputs, gasProps: any): number => {
  // Calculate density at tip conditions
  const R = 8314.47; // Universal gas constant J/(kmol·K)
  const density = (inputs.tipPressure * 1000 * gasProps.molecularWeight) / 
    (R * inputs.tipTemperature * gasProps.compressibilityFactor);
  
  // Air density at ambient conditions (simplified)
  const airDensity = 1.225; // kg/m³ at 15°C, 1 atm
  
  // Buoyancy parameter
  const buoyancyParam = (density - airDensity) / airDensity;
  
  return buoyancyParam;
};

const calculateFlameGeometry = (inputs: FlareRadiationInputs, exitVelocity: number, momentumFlux: number, buoyancyParam: number) => {
  // Flame length correlation (API 521)
  const flameLength = 0.2 * Math.pow(momentumFlux / 1000, 0.5) * Math.pow(1 + buoyancyParam, 0.5);
  
  // Flame tilt correlation
  const windEffect = Math.pow(inputs.windSpeed / exitVelocity, 0.5);
  const flameTilt = Math.min(45, 30 * windEffect);
  
  // Radiant center location (simplified)
  const radiantCenter = {
    x: (flameLength / 2) * Math.sin(flameTilt * Math.PI / 180),
    y: (flameLength / 2) * Math.cos(flameTilt * Math.PI / 180),
    z: inputs.flareTipHeight + (flameLength / 2) * Math.cos(flameTilt * Math.PI / 180)
  };
  
  return {
    length: flameLength,
    tilt: flameTilt,
    radiantCenter
  };
};

const calculateAtmosphericTransmissivity = (inputs: FlareRadiationInputs): number => {
  // Simplified atmospheric transmissivity calculation
  const humidity = inputs.atmosphericHumidity / 100;
  const temperature = inputs.ambientTemperature;
  
  // Basic correlation for atmospheric transmissivity
  const transmissivity = 0.9 - 0.1 * humidity - 0.05 * Math.max(0, (temperature - 288) / 50);
  
  return Math.max(0.5, Math.min(1.0, transmissivity));
};

const calculateAirAbsorption = (inputs: FlareRadiationInputs): number => {
  // Air absorption coefficient (dB/m) - simplified
  const humidity = inputs.atmosphericHumidity / 100;
  const temperature = inputs.ambientTemperature;
  
  const absorption = 0.01 + 0.005 * humidity + 0.002 * Math.max(0, (temperature - 288) / 50);
  
  return absorption;
};

const calculateRadiationFootprint = (
  inputs: FlareRadiationInputs, 
  flameGeometry: any, 
  emissiveFraction: number, 
  transmissivity: number,
  gasProps: any
) => {
  const contours = inputs.radiationContours.map(level => {
    const points: Array<{x: number; y: number; z: number}> = [];
    
    // Calculate polar radii for wind-affected contours
    const polarRadii = calculatePolarRadii(level, flameGeometry, emissiveFraction, transmissivity, gasProps, inputs);
    
    // Generate contour points using polar coordinates
    const numPoints = 72; // Higher resolution for better accuracy
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const distance = polarRadii[i];
      
      // Convert polar to Cartesian coordinates
      const x = flameGeometry.radiantCenter.x + distance * Math.cos(angle);
      const y = flameGeometry.radiantCenter.y + distance * Math.sin(angle);
      
      points.push({
        x,
        y,
        z: 0 // Ground level
      });
    }
    
    const maxDistance = Math.max(...polarRadii);
    
    return {
      level,
      points,
      maxDistance,
      polarRadii
    };
  });
  
  const maxRadiation = Math.max(...contours.map(c => c.level));
  const maxDistance = Math.max(...contours.map(c => c.maxDistance));
  
  return {
    contours,
    maxRadiation,
    maxDistance
  };
};

const calculatePolarRadii = (
  level: number, 
  flameGeometry: any, 
  emissiveFraction: number, 
  transmissivity: number, 
  gasProps: any,
  inputs: FlareRadiationInputs
): number[] => {
  const numPoints = 72;
  const radii: number[] = [];
  
  // Base radiation intensity (kW)
  const radiantIntensity = emissiveFraction * gasProps.lhv * 1000;
  
  // Wind parameters
  const windSpeed = inputs.windSpeed;
  const windDirection = inputs.windDirection * Math.PI / 180; // Convert to radians
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    
    // Calculate wind effect on radiation pattern per API 521
    // Wind stretches the contour downwind and compresses it upwind
    const windAngle = angle - windDirection;
    
    // API 521 wind effect calculation
    const windFactor = Math.cos(windAngle); // -1 to 1, where 1 is downwind
    const windStretchFactor = 1 + (windSpeed / 10) * windFactor; // Wind speed effect
    const windCompressionFactor = 1 - (windSpeed / 20) * Math.abs(windFactor); // Upwind compression
    
    // Base distance calculation (API 521 method)
    const baseDistance = Math.sqrt(radiantIntensity * transmissivity / (4 * Math.PI * level));
    
    // Apply wind effects
    let adjustedDistance = baseDistance;
    
    if (windFactor > 0) {
      // Downwind: stretch the contour
      adjustedDistance = baseDistance * windStretchFactor;
    } else {
      // Upwind: compress the contour
      adjustedDistance = baseDistance * Math.max(0.3, windCompressionFactor);
    }
    
    // Apply flame tilt effect
    const flameTiltEffect = 1 + 0.2 * Math.sin(windAngle) * (flameGeometry.tilt / 45);
    adjustedDistance *= flameTiltEffect;
    
    // Ensure minimum distance for stability
    radii.push(Math.max(adjustedDistance, baseDistance * 0.5));
  }
  
  return radii;
};

const calculateMaxRadiationDistance = (level: number, flameGeometry: any, emissiveFraction: number, transmissivity: number, gasProps: any): number => {
  // Simplified radiation calculation
  const radiantIntensity = emissiveFraction * gasProps.lhv * 1000; // Convert to kW
  const distance = Math.sqrt(radiantIntensity * transmissivity / (4 * Math.PI * level));
  
  return distance;
};

const calculateNoiseFootprint = (
  inputs: FlareRadiationInputs, 
  exitVelocity: number, 
  gasProps: any, 
  airAbsorption: number
) => {
  // Sound power level calculation (simplified)
  const soundPowerLevel = 120 + 10 * Math.log10(gasProps.density * Math.pow(exitVelocity, 4) / 1e12);
  
  const contours = inputs.noiseContours.map(level => {
    const points: Array<{x: number; y: number; z: number}> = [];
    
    // Calculate polar radii for wind-affected noise contours
    const polarRadii = calculateNoisePolarRadii(level, soundPowerLevel, airAbsorption, inputs);
    
    // Generate contour points using polar coordinates
    const numPoints = 72; // Higher resolution for better accuracy
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const distance = polarRadii[i];
      
      // Convert polar to Cartesian coordinates
      const x = distance * Math.cos(angle);
      const y = distance * Math.sin(angle);
      
      points.push({
        x,
        y,
        z: 0 // Ground level
      });
    }
    
    const maxDistance = Math.max(...polarRadii);
    
    return {
      level,
      points,
      maxDistance,
      polarRadii
    };
  });
  
  const maxNoise = Math.max(...contours.map(c => c.level));
  const maxDistance = Math.max(...contours.map(c => c.maxDistance));
  
  return {
    contours,
    maxNoise,
    maxDistance
  };
};

const calculateNoisePolarRadii = (
  level: number, 
  soundPowerLevel: number, 
  airAbsorption: number,
  inputs: FlareRadiationInputs
): number[] => {
  const numPoints = 72;
  const radii: number[] = [];
  
  // Wind parameters
  const windSpeed = inputs.windSpeed;
  const windDirection = inputs.windDirection * Math.PI / 180; // Convert to radians
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    
    // Calculate wind effect on noise propagation per API 521
    // Wind carries sound downwind and reduces it upwind
    const windAngle = angle - windDirection;
    
    // API 521 noise wind effect calculation
    const windFactor = Math.cos(windAngle); // -1 to 1, where 1 is downwind
    const windNoiseFactor = 1 + (windSpeed / 15) * windFactor; // Wind speed effect on noise
    
    // Base distance calculation (spherical spreading with air absorption)
    const baseDistance = Math.pow(10, (soundPowerLevel - level - 20 * Math.log10(4 * Math.PI)) / 20);
    
    // Apply wind effect
    let adjustedDistance = baseDistance;
    
    if (windFactor > 0) {
      // Downwind: noise travels further
      adjustedDistance = baseDistance * windNoiseFactor;
    } else {
      // Upwind: noise is reduced
      adjustedDistance = baseDistance * Math.max(0.4, 1 - (windSpeed / 25) * Math.abs(windFactor));
    }
    
    // Ensure minimum distance for stability
    radii.push(Math.max(adjustedDistance, baseDistance * 0.3));
  }
  
  return radii;
};

const calculateMaxNoiseDistance = (level: number, soundPowerLevel: number, airAbsorption: number): number => {
  // Spherical spreading with air absorption
  const distance = Math.pow(10, (soundPowerLevel - level - 20 * Math.log10(4 * Math.PI)) / 20);
  
  return distance;
};

// Flow Assurance Calculations
export const calculateFlowAssurance = (inputs: FlowAssuranceInputs): FlowAssuranceOutputs => {
  const warnings: string[] = [];
  const criticalAlerts: string[] = [];
  
  // Initialize node states
  const nodes: NodeState[] = [];
  
  // Calculate phase properties
  const phaseProperties = calculatePhaseProperties(inputs);
  
  // Calculate initial node (wellhead)
  const wellheadNode: NodeState = {
    nodeId: 'wellhead',
    pressure: inputs.wellheadPressure,
    temperature: inputs.wellheadTemperature,
    gasRate: inputs.gasRate,
    oilRate: inputs.oilRate,
    waterRate: inputs.waterRate,
    velocity: 0,
    reynoldsNumber: 0,
    pressureDrop: 0,
    phaseProperties,
    warnings: [],
    notes: ['Wellhead conditions']
  };
  nodes.push(wellheadNode);
  
  // Process each equipment block and segments
  let currentPressure = inputs.wellheadPressure;
  let currentTemperature = inputs.wellheadTemperature;
  let totalPressureDrop = 0;
  
  // Equipment processing order
  const equipmentOrder = ['esd', 'filter', 'choke', 'heater', 'separator', 'flare'];
  
  for (let i = 0; i < equipmentOrder.length; i++) {
    const equipmentType = equipmentOrder[i];
    const equipmentId = inputs.equipmentSelections[equipmentType as keyof typeof inputs.equipmentSelections];
    
    // Calculate equipment pressure drop
    const equipmentResult = calculateEquipmentPressureDrop(
      equipmentType,
      equipmentId,
      currentPressure,
      currentTemperature,
      inputs,
      phaseProperties
    );
    
    // Update pressure and temperature
    currentPressure -= equipmentResult.pressureDrop;
    currentTemperature = equipmentResult.outletTemperature;
    totalPressureDrop += equipmentResult.pressureDrop;
    
    // Create node state
    const node: NodeState = {
      nodeId: `${equipmentType}_outlet`,
      pressure: currentPressure,
      temperature: currentTemperature,
      gasRate: inputs.gasRate,
      oilRate: inputs.oilRate,
      waterRate: inputs.waterRate,
      velocity: equipmentResult.velocity,
      reynoldsNumber: equipmentResult.reynoldsNumber,
      pressureDrop: equipmentResult.pressureDrop,
      phaseProperties: calculatePhasePropertiesAtConditions(phaseProperties, currentPressure, currentTemperature),
      warnings: equipmentResult.warnings,
      notes: equipmentResult.notes
    };
    nodes.push(node);
    
    // Add warnings and alerts
    warnings.push(...equipmentResult.warnings);
    if (equipmentResult.isCritical) {
      criticalAlerts.push(`${equipmentType.toUpperCase()}: Critical flow detected`);
    }
  }
  
  // Calculate system performance metrics
  const systemPerformance = calculateSystemPerformance(inputs, nodes, totalPressureDrop);
  
  // Calculate equipment performance summary
  const equipmentPerformance = calculateEquipmentPerformanceSummary(inputs, nodes);
  
  return {
    nodes,
    totalSystemPressureDrop: totalPressureDrop,
    requiredBackPressure: systemPerformance.requiredBackPressure,
    backPressureValveOpening: systemPerformance.backPressureValveOpening,
    limitingElement: systemPerformance.limitingElement,
    equipmentPerformance,
    systemWarnings: warnings,
    criticalAlerts,
    overallEfficiency: systemPerformance.overallEfficiency,
    energyConsumption: systemPerformance.energyConsumption,
    pressureRecovery: systemPerformance.pressureRecovery
  };
};

// Helper functions for flow assurance calculations
const calculatePhaseProperties = (inputs: FlowAssuranceInputs) => {
  const gasProperties: PhaseProperties = {
    density: calculateGasDensity(inputs.ambientPressure, inputs.ambientTemperature, 16.04, 0.9), // Simplified
    viscosity: 1.8e-5, // Pa·s at standard conditions
    specificGravity: inputs.gasSpecificGravity,
    compressibilityFactor: 0.9,
    heatCapacity: 1000 // J/(kg·K)
  };
  
  const oilProperties: PhaseProperties = {
    density: inputs.oilSpecificGravity * 1000, // kg/m³
    viscosity: 0.001, // Pa·s
    specificGravity: inputs.oilSpecificGravity,
    heatCapacity: 2000 // J/(kg·K)
  };
  
  const waterProperties: PhaseProperties = {
    density: inputs.waterSpecificGravity * 1000, // kg/m³
    viscosity: 0.001, // Pa·s
    specificGravity: inputs.waterSpecificGravity,
    heatCapacity: 4180 // J/(kg·K)
  };
  
  return {
    gas: gasProperties,
    oil: oilProperties,
    water: waterProperties
  };
};

const calculatePhasePropertiesAtConditions = (baseProperties: any, pressure: number, temperature: number) => {
  // Simplified temperature and pressure corrections
  const temperatureRatio = temperature / 288; // Reference temperature
  const pressureRatio = pressure / 101325; // Reference pressure
  
  return {
    gas: {
      ...baseProperties.gas,
      density: baseProperties.gas.density * pressureRatio / temperatureRatio,
      viscosity: baseProperties.gas.viscosity * Math.pow(temperatureRatio, 0.7)
    },
    oil: {
      ...baseProperties.oil,
      density: baseProperties.oil.density * (1 - 0.0005 * (temperature - 288)),
      viscosity: baseProperties.oil.viscosity * Math.exp(-0.01 * (temperature - 288))
    },
    water: {
      ...baseProperties.water,
      density: baseProperties.water.density * (1 - 0.0002 * (temperature - 288)),
      viscosity: baseProperties.water.viscosity * Math.exp(-0.02 * (temperature - 288))
    }
  };
};

const calculateEquipmentPressureDrop = (
  equipmentType: string,
  equipmentId: string,
  inletPressure: number,
  inletTemperature: number,
  inputs: FlowAssuranceInputs,
  phaseProperties: any
) => {
  const warnings: string[] = [];
  const notes: string[] = [];
  let pressureDrop = 0;
  let outletTemperature = inletTemperature;
  let velocity = 0;
  let reynoldsNumber = 0;
  let isCritical = false;
  
  // Calculate total flow rate and mixture properties
  const totalFlowRate = inputs.gasRate + inputs.oilRate + inputs.waterRate;
  const mixtureDensity = (inputs.gasRate * phaseProperties.gas.density + 
    inputs.oilRate * phaseProperties.oil.density + 
    inputs.waterRate * phaseProperties.water.density) / totalFlowRate;
  
  // Equipment-specific calculations
  switch (equipmentType) {
    case 'esd':
      pressureDrop = calculateESDPressureDrop(equipmentId, totalFlowRate, mixtureDensity);
      notes.push('ESD/SSV pressure drop calculated');
      break;
      
    case 'filter':
      pressureDrop = calculateFilterPressureDrop(equipmentId, totalFlowRate, mixtureDensity);
      notes.push('Sand filter pressure drop calculated');
      break;
      
    case 'choke':
      const chokeResult = calculateChokePressureDrop(equipmentId, inletPressure, totalFlowRate, mixtureDensity, inputs);
      pressureDrop = chokeResult.pressureDrop;
      isCritical = chokeResult.isCritical;
      if (isCritical) {
        warnings.push('CRITICAL FLOW: Choke is operating at critical conditions');
      }
      notes.push('Choke pressure drop calculated');
      break;
      
    case 'heater':
      const heaterResult = calculateHeaterPerformance(equipmentId, inletPressure, inletTemperature, totalFlowRate, mixtureDensity, inputs);
      pressureDrop = heaterResult.pressureDrop;
      outletTemperature = heaterResult.outletTemperature;
      notes.push(`Heater outlet temperature: ${outletTemperature.toFixed(1)}K`);
      break;
      
    case 'separator':
      pressureDrop = calculateSeparatorPressureDrop(equipmentId, totalFlowRate, mixtureDensity);
      notes.push('Separator pressure drop calculated');
      break;
      
    case 'flare':
      pressureDrop = calculateFlarePressureDrop(equipmentId, totalFlowRate, mixtureDensity);
      notes.push('Flare stack pressure drop calculated');
      break;
  }
  
  // Calculate velocity and Reynolds number
  velocity = totalFlowRate / (Math.PI * Math.pow(0.1, 2) / 4); // Simplified pipe area
  reynoldsNumber = (mixtureDensity * velocity * 0.1) / phaseProperties.gas.viscosity; // Simplified
  
  // Check velocity limits
  if (velocity > inputs.maxHoseVelocity) {
    warnings.push('VEL WARNING: Velocity exceeds maximum hose limit');
  }
  if (velocity > inputs.maxPipeVelocity) {
    warnings.push('VEL WARNING: Velocity exceeds maximum pipe limit');
  }
  
  return {
    pressureDrop,
    outletTemperature,
    velocity,
    reynoldsNumber,
    isCritical,
    warnings,
    notes
  };
};

const calculateESDPressureDrop = (equipmentId: string, flowRate: number, density: number): number => {
  // Simplified ESD pressure drop calculation
  const cv = 100; // Flow coefficient (simplified)
  const pressureDrop = Math.pow(flowRate / cv, 2) * density / 2;
  return pressureDrop;
};

const calculateFilterPressureDrop = (equipmentId: string, flowRate: number, density: number): number => {
  // Simplified filter pressure drop calculation
  const foulingFactor = 1.5; // Fouling factor
  const pressureDrop = foulingFactor * Math.pow(flowRate, 1.8) * density / 1000;
  return pressureDrop;
};

const calculateChokePressureDrop = (equipmentId: string, inletPressure: number, flowRate: number, density: number, inputs: FlowAssuranceInputs) => {
  // Choke pressure drop calculation with critical flow check
  const gamma = 1.3; // Specific heat ratio
  const criticalRatio = Math.pow(2 / (gamma + 1), gamma / (gamma - 1));
  
  let pressureDrop = 0;
  let isCritical = false;
  
  if (inputs.chokeType === 'fixed-bean') {
    const beanSize = inputs.chokeOpening; // mm
    const area = Math.PI * Math.pow(beanSize / 2000, 2); // m²
    const velocity = flowRate / area;
    
    // Check for critical flow
    const downstreamPressure = inletPressure * 0.5; // Simplified
    if (downstreamPressure / inletPressure < criticalRatio) {
      isCritical = true;
      pressureDrop = inletPressure * (1 - criticalRatio);
    } else {
      pressureDrop = inletPressure - downstreamPressure;
    }
  } else {
    // Adjustable choke
    const opening = inputs.chokeOpening / 100; // Convert % to fraction
    const cv = 50 * opening; // Flow coefficient
    pressureDrop = Math.pow(flowRate / cv, 2) * density / 2;
    
    if (pressureDrop / inletPressure > (1 - criticalRatio)) {
      isCritical = true;
      pressureDrop = inletPressure * (1 - criticalRatio);
    }
  }
  
  return { pressureDrop, isCritical };
};

const calculateHeaterPerformance = (equipmentId: string, inletPressure: number, inletTemperature: number, flowRate: number, density: number, inputs: FlowAssuranceInputs) => {
  // Simplified heater calculation
  const ua = 1000; // Overall heat transfer coefficient (W/K)
  const targetTemperature = inputs.ambientTemperature + 50; // Target outlet temperature
  const lmtd = (targetTemperature - inletTemperature) / Math.log((targetTemperature - inputs.ambientTemperature) / (inletTemperature - inputs.ambientTemperature));
  
  const duty = ua * lmtd; // W
  const outletTemperature = inletTemperature + duty / (flowRate * density * 2000); // Simplified heat capacity
  
  // Pressure drop through heater tubes
  const pressureDrop = 0.1 * inletPressure; // Simplified
  
  return { pressureDrop, outletTemperature };
};

const calculateSeparatorPressureDrop = (equipmentId: string, flowRate: number, density: number): number => {
  // Simplified separator pressure drop
  const pressureDrop = 0.05 * 101325; // 5% of atmospheric pressure
  return pressureDrop;
};

const calculateFlarePressureDrop = (equipmentId: string, flowRate: number, density: number): number => {
  // Simplified flare pressure drop
  const pressureDrop = 0.02 * 101325; // 2% of atmospheric pressure
  return pressureDrop;
};

const calculateSystemPerformance = (inputs: FlowAssuranceInputs, nodes: NodeState[], totalPressureDrop: number) => {
  const requiredBackPressure = Math.max(0, inputs.separatorSetPressure - nodes[nodes.length - 1].pressure);
  const backPressureValveOpening = Math.min(100, (requiredBackPressure / inputs.separatorSetPressure) * 100);
  
  // Find limiting element (highest pressure drop)
  const limitingElement = 'choke'; // Simplified
  
  // Calculate efficiency metrics
  const overallEfficiency = Math.max(0, 100 - (totalPressureDrop / inputs.wellheadPressure) * 100);
  const energyConsumption = totalPressureDrop * (inputs.gasRate + inputs.oilRate + inputs.waterRate) / 1000; // kW
  const pressureRecovery = Math.max(0, (inputs.wellheadPressure - nodes[nodes.length - 1].pressure) / inputs.wellheadPressure * 100);
  
  return {
    requiredBackPressure,
    backPressureValveOpening,
    limitingElement,
    overallEfficiency,
    energyConsumption,
    pressureRecovery
  };
};

const calculateEquipmentPerformanceSummary = (inputs: FlowAssuranceInputs, nodes: NodeState[]) => {
  return {
    esd: { pressureDrop: 0, status: 'Normal' },
    filter: { pressureDrop: 0, foulingFactor: 1.0, status: 'Normal' },
    choke: { pressureDrop: 0, isCritical: false, status: 'Normal' },
    heater: { duty: 0, outletTemperature: 0, status: 'Normal' },
    separator: { pressure: 0, capacity: 100, status: 'Normal' },
    flare: { pressureDrop: 0, status: 'Normal' }
  };
};