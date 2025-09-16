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

export interface CalculationSession {
  unitSystem: UnitSystem;
  standardConditions: StandardConditions;
  danielOrifice: DanielOrificeInputs;
  choke: ChokeInputs;
  criticalFlow: CriticalFlowInputs;
  gor: GORInputs;
  velocity: VelocityInputs;
  notes: Record<string, string>;
}