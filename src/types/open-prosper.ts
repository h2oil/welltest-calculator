// OPEN-PROSPER Types - Completion & Well Modelling
// Single-well performance analysis with IPR×VLP modeling

export type UnitSystem = 'metric' | 'field';

export type FluidKind = 'oil' | 'gas' | 'oil-gas' | 'gas-condensate';

export type IPRModelType = 
  | 'vogel' 
  | 'fetkovich' 
  | 'darcy-linear' 
  | 'jones' 
  | 'standing'
  | 'gas-deliverability'
  | 'cullender-smith'
  | 'back-pressure';

export type VLPCorrelation = 
  | 'beggs-brill'
  | 'hagedorn-brown'
  | 'duns-ros'
  | 'ansari'
  | 'gray'
  | 'single-phase';

export type ChokeMode = 'bean' | 'cv' | 'orifice';

export type DeviceType = 
  | 'tubing'
  | 'casing'
  | 'liner'
  | 'sssv'
  | 'packer'
  | 'ssd'
  | 'icd'
  | 'icv'
  | 'perforation'
  | 'gravel-pack'
  | 'screen';

// PVT & Fluids
export interface PVTProperties {
  // Oil properties
  Rs?: number; // Solution gas-oil ratio
  Bo?: number; // Oil formation volume factor
  mu_o?: number; // Oil viscosity
  rho_o?: number; // Oil density
  
  // Gas properties
  Z?: number; // Gas compressibility factor
  k?: number; // Specific heat ratio (Cp/Cv)
  MW?: number; // Molecular weight
  mu_g?: number; // Gas viscosity
  rho_g?: number; // Gas density
  
  // Water properties
  Bw?: number; // Water formation volume factor
  mu_w?: number; // Water viscosity
  rho_w?: number; // Water density
  
  // Compositional (optional)
  composition?: { [component: string]: number };
}

export interface Fluid {
  kind: FluidKind;
  pvt: PVTProperties;
  gor?: number; // Gas-oil ratio
  wct?: number; // Water cut
  temperature: number; // Reservoir temperature
  pressure: number; // Reservoir pressure
  standardConditions: {
    pressure: number;
    temperature: number;
  };
}

// Deviation Survey
export interface DeviationPoint {
  md: number; // Measured depth
  tvd: number; // True vertical depth
  inc: number; // Inclination
  azi: number; // Azimuth
}

export type DeviationSurvey = DeviationPoint[];

// Completion Geometry
export interface Device {
  id: string;
  type: DeviceType;
  md_start: number;
  md_end: number;
  id_inner: number; // Inner diameter
  id_outer: number; // Outer diameter
  roughness: number;
  properties?: { [key: string]: any };
}

export interface PerforationInterval {
  id: string;
  md_start: number;
  md_end: number;
  density: number; // Shots per foot
  phasing: number; // Degrees
  diameter: number; // Perforation diameter
  skin: number; // Perforation skin
  crushed_zone_skin: number;
  compaction_skin: number;
}

export interface Completion {
  tubing_id: number;
  tubing_roughness: number;
  devices: Device[];
  perforations: PerforationInterval[];
  packer_depth?: number;
  ssd_depths: number[];
}

// IPR Models
export interface IPRModel {
  type: IPRModelType;
  parameters: {
    // Common parameters
    reservoir_pressure: number;
    skin: number;
    permeability: number;
    thickness: number;
    drainage_radius: number;
    wellbore_radius: number;
    
    // Oil-specific
    bubble_point_pressure?: number;
    pi?: number; // Productivity index
    
    // Gas-specific
    a?: number; // Back-pressure equation coefficient
    b?: number; // Back-pressure equation exponent
    c?: number; // Back-pressure equation coefficient
    n?: number; // Back-pressure equation exponent
    
    // Multilayer
    layers?: {
      thickness: number;
      permeability: number;
      skin: number;
    }[];
  };
}

// VLP Settings
export interface VLPSettings {
  correlation: VLPCorrelation;
  temperature_model: 'simple' | 'table';
  temperature_gradient?: number;
  temperature_table?: { md: number; temperature: number }[];
  roughness_factor: number;
  holdup_tuning: number;
}

// Choke Configuration
export interface Choke {
  mode: ChokeMode;
  bean_size?: number; // Inches
  cv?: number; // Flow coefficient
  cd?: number; // Discharge coefficient
  upstream_pressure?: number;
  downstream_pressure?: number;
}

// Constraints
export interface Constraints {
  whp_limit?: number; // Wellhead pressure limit
  psep_limit?: number; // Separator pressure limit
  q_max?: number; // Maximum flow rate
  pwf_min?: number; // Minimum bottomhole pressure
  drawdown_max?: number; // Maximum drawdown
}

// Test Points for Matching
export interface TestPoint {
  id: string;
  q: number; // Flow rate
  pwf: number; // Bottomhole pressure
  whp: number; // Wellhead pressure
  gor?: number; // Gas-oil ratio
  wct?: number; // Water cut
  date?: Date;
  notes?: string;
}

// Main Case Definition
export interface OpenProsperCase {
  id: string;
  name: string;
  description?: string;
  fluid: Fluid;
  deviation: DeviationSurvey;
  completion: Completion;
  ipr: IPRModel;
  vlp: VLPSettings;
  choke?: Choke;
  constraints?: Constraints;
  test_points?: TestPoint[];
  created_at: Date;
  updated_at: Date;
}

// Calculation Results
export interface IPRResult {
  rates: number[];
  pressures: number[];
  max_rate: number;
  max_pressure: number;
}

export interface VLPResult {
  rates: number[];
  pressures: number[];
  holdups: number[];
  temperatures: number[];
  max_rate: number;
  max_pressure: number;
}

export interface NodalResult {
  operating_point: {
    rate: number;
    pwf: number;
    whp: number;
  };
  ipr_curve: IPRResult;
  vlp_curve: VLPResult;
  convergence: boolean;
  iterations: number;
  warnings: string[];
}

export interface PressureProfile {
  md: number[];
  pressure: number[];
  temperature: number[];
  holdup: number[];
  velocity: number[];
}

// Matching Results
export interface MatchingResult {
  correlation: VLPCorrelation;
  bias_factors: {
    friction: number;
    holdup: number;
    temperature: number;
  };
  residuals: number[];
  rmse: number;
  ape: number;
  r_squared: number;
  test_points: TestPoint[];
  fitted_curve: VLPResult;
}

// Sensitivity Analysis
export interface SensitivityParameter {
  name: string;
  base_value: number;
  min_value: number;
  max_value: number;
  step: number;
  unit: string;
}

export interface SensitivityResult {
  parameter: string;
  values: number[];
  operating_points: {
    rate: number;
    pwf: number;
    whp: number;
  }[];
}

// Project Structure
export interface OpenProsperProject {
  id: string;
  name: string;
  description?: string;
  cases: OpenProsperCase[];
  created_at: Date;
  updated_at: Date;
  version: string;
}

// UI State
export interface OpenProsperUIState {
  active_tab: 'fluids' | 'well' | 'completion' | 'ipr' | 'vlp' | 'nodal' | 'matching' | 'sensitivity' | 'reports';
  selected_case_id?: string;
  unit_system: UnitSystem;
  dark_mode: boolean;
  show_grid: boolean;
  show_labels: boolean;
}

// Export/Import
export interface ExportData {
  project: OpenProsperProject;
  format: 'json' | 'csv' | 'excel';
  timestamp: Date;
  version: string;
}

// Error Types
export interface CalculationError {
  type: 'convergence' | 'validation' | 'correlation' | 'constraint';
  message: string;
  parameter?: string;
  value?: number;
  suggestion?: string;
}

// Validation
export interface ValidationResult {
  valid: boolean;
  errors: CalculationError[];
  warnings: string[];
}
