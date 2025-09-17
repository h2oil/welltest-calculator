// Well Testing Calculator Types

export type UnitSystem = 'metric' | 'field';

export type FluidType = 'gas' | 'liquid';

export interface StandardConditions {
  temperature: number; // °F
  pressure: number; // psia
  temperatureC: number; // °C
  pressureKPa: number; // kPa
}

export interface GasProperties {
  k: number; // Cp/Cv ratio
  MW: number; // Molecular weight kg/kmol
  Z: number; // Compressibility factor
}

export interface DanielOrificeInputs {
  pipeID: number;
  orificeD: number;
  beta?: number;
  deltaP: number;
  density?: number;
  pressure: number;
  temperature: number;
  dischargeCoeff: number;
  expansibility?: number;
  fluidType: FluidType;
  autoCalculateDensity: boolean;
  gasProperties: GasProperties;
}

export interface DanielOrificeOutputs {
  massFlow: number; // kg/s
  volumetricFlow: number; // m³/s
  standardFlow: number; // MMSCFD or equivalent
  reynoldsNumber: number;
  warnings: string[];
  assumptions: string[];
}

export interface ChokeInputs {
  chokeDiameter: number;
  upstreamPressure: number;
  downstreamPressure: number;
  temperature: number;
  dischargeCoeff: number;
  fluidType: FluidType;
  gasProperties: GasProperties;
  liquidDensity?: number;
  liquidViscosity?: number;
}

export interface ChokeOutputs {
  massFlow: number;
  volumetricFlow: number;
  standardFlow: number;
  flowRegime: 'CHOKED' | 'SUBCRITICAL';
  machNumber: number;
  notes: string[];
}

export interface CriticalFlowInputs {
  k: number;
  upstreamPressure: number;
  downstreamPressure: number;
  temperature: number;
  Z: number;
  MW: number;
  throatArea: number;
  dischargeCoeff: number;
  guessedVelocity?: number;
}

export interface CriticalFlowOutputs {
  criticalRatio: number;
  regime: 'CHOKED' | 'SUBCRITICAL';
  massFlow: number;
  volumetricFlow: number;
  standardFlow: number;
  speedOfSound: number;
  machNumber?: number;
}

export interface GORInputs {
  // Produced GOR
  gasRate?: number;
  oilRate?: number;
  
  // Standing correlation
  apiGravity?: number;
  gasSpecificGravity?: number;
  reservoirTemp?: number;
  reservoirPressure?: number;
}

export interface GOROutputs {
  producedGOR?: number;
  solutionGOR?: number;
  bubblePointPressure?: number;
  warnings: string[];
  notes: string[];
}

export interface VelocityInputs {
  pipeID: number;
  gasRateStd: number;
  pressure: number;
  temperature: number;
  Z: number;
  k: number;
  MW: number;
  erosionalConstant: number;
  fluidDensity?: number;
}

export interface VelocityOutputs {
  velocity: number; // m/s
  machNumber: number;
  erosionalVelocity: number;
  speedOfSound: number;
  warnings: string[];
  passFailFlags: {
    erosionalVelocity: boolean;
    machNumber: boolean;
  };
}

export interface APIGravityInputs {
  specificGravity: number; // SG at 60°F
  temperature: number; // °F
  referenceTemp?: number; // °F, default 60°F
}

export interface APIGravityOutputs {
  apiGravity: number; // °API at 60°F
  apiGravityCorrected: number; // °API at given temperature
  specificGravityCorrected: number; // SG at given temperature
  density: number; // lb/ft³
  densityCorrected: number; // lb/ft³ at given temperature
  temperatureCorrection: number; // °API correction factor
  warnings: string[];
  notes: string[];
}

export interface FlareGasComposition {
  ch4: number; // Methane mole %
  c2h6: number; // Ethane mole %
  c3h8: number; // Propane mole %
  iC4: number; // Iso-butane mole %
  nC4: number; // Normal butane mole %
  c5Plus: number; // C5+ mole %
  h2: number; // Hydrogen mole %
  n2: number; // Nitrogen mole %
  co2: number; // Carbon dioxide mole %
  h2s: number; // Hydrogen sulfide mole %
}

export interface FlareRadiationInputs {
  // Operating data
  gasRate: number; // MMSCFD or MSCMD
  flareTipHeight: number; // m or ft
  windSpeed: number; // m/s or mph
  windDirection: number; // degrees from north
  
  // Flare geometry
  tipDiameter: number; // m or ft
  tipPressure: number; // kPa or psia
  tipTemperature: number; // K or °F
  
  // Gas properties
  gasComposition: FlareGasComposition;
  
  // Optional parameters
  emissiveFraction?: number; // Override calculated value
  atmosphericHumidity: number; // % relative humidity
  ambientTemperature: number; // K or °F
  noiseReferenceDistance: number; // m or ft
  
  // Contour customization
  radiationContours: number[]; // kW/m² values
  noiseContours: number[]; // dB(A) values
}

export interface FlareRadiationOutputs {
  // Derived properties
  molecularWeight: number; // kg/kmol
  lhv: number; // MJ/kg
  hhv: number; // MJ/kg
  gamma: number; // Cp/Cv ratio
  compressibilityFactor: number; // Z
  density: number; // kg/m³
  viscosity: number; // Pa·s
  chRatio: number; // C/H ratio
  sootIndex: number; // Soot index surrogate
  
  // Flare performance
  emissiveFraction: number; // χ
  exitVelocity: number; // m/s
  momentumFlux: number; // kg·m/s²
  buoyancyParameter: number; // Dimensionless
  
  // Flame geometry
  flameLength: number; // m
  flameTilt: number; // degrees
  radiantCenter: {
    x: number; // m
    y: number; // m
    z: number; // m
  };
  
  // Radiation results
  radiationFootprint: {
    contours: Array<{
      level: number; // kW/m²
      points: Array<{x: number; y: number; z: number}>;
      maxDistance: number; // m
    }>;
    maxRadiation: number; // kW/m²
    maxDistance: number; // m
  };
  
  // Noise results
  noiseFootprint: {
    contours: Array<{
      level: number; // dB(A)
      points: Array<{x: number; y: number; z: number}>;
      maxDistance: number; // m
    }>;
    maxNoise: number; // dB(A)
    maxDistance: number; // m
  };
  
  // Atmospheric conditions
  atmosphericTransmissivity: number; // τ
  airAbsorption: number; // dB/m
  
  warnings: string[];
  notes: string[];
}

export interface CalculationSession {
  unitSystem: UnitSystem;
  standardConditions: StandardConditions;
  danielOrifice: DanielOrificeInputs;
  choke: ChokeInputs;
  criticalFlow: CriticalFlowInputs;
  gor: GORInputs;
  velocity: VelocityInputs;
  apiGravity: APIGravityInputs;
  flareRadiation: FlareRadiationInputs;
  notes: Record<string, string>;
}