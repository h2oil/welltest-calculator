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

// Flow Assurance Model Types
export interface EquipmentModel {
  id: string;
  type: 'esd' | 'filter' | 'choke' | 'heater' | 'separator' | 'flare';
  name: string;
  manufacturer: string;
  model: string;
  parameters: Record<string, number>;
  calculationMethod: string;
  description: string;
}

export interface PhaseProperties {
  density: number; // kg/m³
  viscosity: number; // Pa·s
  specificGravity: number;
  compressibilityFactor?: number; // For gas
  heatCapacity?: number; // J/(kg·K)
}

export interface NodeState {
  nodeId: string;
  pressure: number; // Pa
  temperature: number; // K
  gasRate: number; // m³/s
  oilRate: number; // m³/s
  waterRate: number; // m³/s
  velocity: number; // m/s
  reynoldsNumber: number;
  pressureDrop: number; // Pa
  phaseProperties: {
    gas: PhaseProperties;
    oil: PhaseProperties;
    water: PhaseProperties;
  };
  warnings: string[];
  notes: string[];
}

export interface Segment {
  id: string;
  fromNode: string;
  toNode: string;
  lineId: number; // mm
  schedule: string;
  length: number; // m
  roughness: number; // mm
  fittings: {
    elbows: number;
    tees: number;
    reducers: number;
    other: number;
  };
  kFactor: number; // Total K factor for fittings
  pressureDrop: number; // Pa
  velocity: number; // m/s
  reynoldsNumber: number;
  frictionFactor: number;
}

export interface FlowAssuranceInputs {
  // Wellhead conditions
  wellheadPressure: number; // Pa
  wellheadTemperature: number; // K
  
  // Flow rates
  gasRate: number; // m³/s
  oilRate: number; // m³/s
  waterRate: number; // m³/s
  
  // Phase properties
  gasSpecificGravity: number;
  oilSpecificGravity: number;
  waterSpecificGravity: number;
  gasComposition?: FlareGasComposition;
  
  // Velocity limits
  maxHoseVelocity: number; // m/s
  maxPipeVelocity: number; // m/s
  
  // Ambient conditions
  ambientTemperature: number; // K
  ambientPressure: number; // Pa
  
  // Equipment selections
  equipmentSelections: {
    esd: string;
    filter: string;
    choke: string;
    heater: string;
    separator: string;
    flare: string;
  };
  
  // Separator settings
  separatorSetPressure: number; // Pa
  separatorType: '2-phase' | '3-phase';
  separatorOperatingMode: 'atmospheric' | 'pressured';
  
  // Choke settings
  chokeSize64ths: number; // Choke size in 64ths of an inch (e.g., 32 = 0.5 inch)
  chokeType: 'fixed-bean' | 'adjustable';
  
  // Line segments
  segments: Segment[];
}

// Enhanced Flow Assurance Types
export type FluidKind = "gas" | "liquid" | "two-phase";

export type NodeKind = "wellhead" | "esd" | "sand_filter" | "choke" | "separator" | "heater" | "manifold" | "valve" | "meter" | "custom" | "flare";

export interface NodeSpec {
  id: string;
  kind: NodeKind;
  label: string;
  // Choke-only fields
  choke?: {
    mode: "fixed-bean" | "percent-open";
    bean_d_in?: number;    // inches, for fixed-bean
    percent_open?: number; // 0–100, maps to effective area
    Cd?: number;           // default 0.82
  };
  // Separator-only fields
  separator?: {
    p_drop_override_kPa?: number; // optional fixed ΔP
  };
}

export interface SegmentSpec {
  id: string;
  from: string; 
  to: string;  // node ids
  length_m: number;
  id_inner_m: number;        // pipe inner diameter (per-user "pipe id size")
  roughness_m?: number;      // default 4.6e-5 m (carbon steel)
  fittingsK?: number;        // summed K factors for bends/tees/etc.
  elevation_change_m?: number; // +upwards
}

export interface FluidSpec {
  kind: FluidKind;
  P_in_kPa: number;  // wellhead pressure
  T_K: number;
  Z?: number;        // default 1.0
  k?: number;        // Cp/Cv; default 1.30 for gas
  MW_kg_per_kmol?: number; // gas; default 18.2
  rho_liq_kg_per_m3?: number; // liquid density if liquid or two-phase
  mu_Pa_s?: number; // optional viscosity
  gamma_g?: number; // optional gas SG
  watercut_frac?: number; // for two-phase helper calcs
  q_std: { unit: "MSCFD"|"Sm3/d"|"STB/d"; value: number }; // standard flow
}

export interface NodeState {
  id: string;
  kind: NodeKind;
  label: string;
  pressure_kPa: number;
  temperature_K: number;
  q_actual_m3_s: number;
  mdot_kg_s: number;
  density_kg_m3: number;
  velocity_m_s?: number;
  mach?: number;
  reynolds?: number;
  friction_factor?: number;
  erosional_check: {
    velocity_limit_m_s: number;
    is_erosional: boolean;
    mach_limit_exceeded: boolean;
  };
  warnings: string[];
}

export interface SegmentResult {
  id: string;
  from: string;
  to: string;
  deltaP_total_kPa: number;
  deltaP_friction_kPa: number;
  deltaP_fittings_kPa: number;
  deltaP_hydrostatic_kPa: number;
  velocity_m_s: number;
  mach: number;
  reynolds: number;
  friction_factor: number;
  length_m: number;
  id_inner_m: number;
  elevation_change_m: number;
  erosional_check: {
    velocity_limit_m_s: number;
    is_erosional: boolean;
    mach_limit_exceeded: boolean;
  };
}

export interface NetworkResult {
  nodes: NodeState[];
  segments: SegmentResult[];
  total_drawdown_kPa: number;
  convergence: {
    converged: boolean;
    iterations: number;
    max_pressure_change: number;
    max_flow_mismatch: number;
  };
  warnings: string[];
}

export interface FlowAssuranceOutputs {
  // Node states
  nodes: NodeState[];
  
  // System summary
  totalSystemPressureDrop: number; // Pa
  requiredBackPressure: number; // Pa
  backPressureValveOpening: number; // %
  limitingElement: string;
  
  // Equipment performance
  equipmentPerformance: {
    esd: { pressureDrop: number; status: string };
    filter: { pressureDrop: number; foulingFactor: number; status: string };
    choke: { pressureDrop: number; isCritical: boolean; status: string };
    heater: { duty: number; outletTemperature: number; status: string };
    separator: { pressure: number; capacity: number; status: string };
    flare: { pressureDrop: number; status: string };
  };
  
  // Warnings and alerts
  systemWarnings: string[];
  criticalAlerts: string[];
  
  // Performance metrics
  overallEfficiency: number; // %
  energyConsumption: number; // kW
  pressureRecovery: number; // %
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
  flowAssurance: FlowAssuranceInputs;
  notes: Record<string, string>;
}