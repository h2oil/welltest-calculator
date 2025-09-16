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

// Gas Velocity Calculations
export const calculateGasVelocity = (inputs: VelocityInputs): VelocityOutputs => {
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

  const tempK = temperature + 273.15;
  const pressurePa = pressure * 6895;
  
  // Convert standard to actual flow
  const actualFlow = standardToActualFlow(
    gasRateStd / 86400, // Convert daily rate to per second
    pressurePa,
    tempK,
    Z,
    { pressure: STANDARD_CONDITIONS.pressure_kPa * 1000, temperature: STANDARD_CONDITIONS.temperature_C + 273.15 }
  );

  // Calculate velocity
  const pipeArea = calculatePipeArea(pipeID);
  const velocity = actualFlow / pipeArea;

  // Speed of sound and Mach number
  const speedOfSound = Math.sqrt(k * GAS_CONSTANT.SI * tempK / MW);
  const machNumber = velocity / speedOfSound;

  // Calculate erosional velocity
  const density = fluidDensity || calculateGasDensity(pressurePa, tempK, MW, Z);
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