// OPEN-PROSPER Calculation Engine
// Core mathematical engine for single-well performance analysis

import type {
  Fluid,
  IPRModel,
  IPRResult,
  VLPResult,
  NodalResult,
  PressureProfile,
  DeviationSurvey,
  Completion,
  VLPSettings,
  Choke,
  Constraints,
  TestPoint,
  MatchingResult,
  SensitivityResult,
  CalculationError,
  ValidationResult,
  UnitSystem
} from '@/types/open-prosper';

// Constants
const GRAVITY = 9.81; // m/s²
const GAS_CONSTANT = 8.314; // J/(mol·K)
const ATMOSPHERIC_PRESSURE = 101.325; // kPa

// Unit Conversion Helpers
export class UnitConverter {
  static pressure(value: number, from: string, to: string): number {
    const conversions: { [key: string]: number } = {
      'kPa': 1,
      'psi': 6.894757,
      'bar': 100,
      'atm': 101.325,
      'mmHg': 0.133322
    };
    return value * conversions[from] / conversions[to];
  }

  static length(value: number, from: string, to: string): number {
    const conversions: { [key: string]: number } = {
      'm': 1,
      'ft': 0.3048,
      'in': 0.0254,
      'cm': 0.01
    };
    return value * conversions[from] / conversions[to];
  }

  static flowRate(value: number, from: string, to: string): number {
    const conversions: { [key: string]: number } = {
      'm3/d': 1,
      'bbl/d': 0.158987,
      'scf/d': 0.028317,
      'm3/s': 86400,
      'bbl/s': 13737.6
    };
    return value * conversions[from] / conversions[to];
  }

  static temperature(value: number, from: string, to: string): number {
    if (from === 'C' && to === 'K') return value + 273.15;
    if (from === 'K' && to === 'C') return value - 273.15;
    if (from === 'F' && to === 'C') return (value - 32) * 5/9;
    if (from === 'C' && to === 'F') return value * 9/5 + 32;
    return value;
  }
}

// PVT Calculations
export class PVTCalculator {
  // Standing correlation for oil properties
  static calculateStandingOilProperties(
    pressure: number,
    temperature: number,
    gasGravity: number,
    oilGravity: number,
    bubblePoint?: number
  ) {
    const T = UnitConverter.temperature(temperature, 'C', 'K');
    const P = UnitConverter.pressure(pressure, 'psi', 'kPa');
    
    // Solution gas-oil ratio (Standing)
    const Rs = gasGravity * Math.pow((pressure / 18.2) * Math.pow(10, 0.0125 * oilGravity - 0.00091 * temperature), 1.2048);
    
    // Oil formation volume factor (Standing)
    const Bo = 0.9759 + 0.00012 * Math.pow(Rs * Math.pow(gasGravity / oilGravity, 0.5) + 1.25 * temperature, 1.2);
    
    // Oil viscosity (Beggs-Robinson)
    const mu_od = Math.pow(10, Math.pow(10, -1.163 - 6.9824 * Math.log10(temperature + 460)) - 1);
    const mu_o = mu_od * Math.pow(Bo, -0.515);
    
    return { Rs, Bo, mu_o };
  }

  // Lee-Gonzalez-Eakin for gas properties
  static calculateGasProperties(
    pressure: number,
    temperature: number,
    gasGravity: number,
    molecularWeight?: number
  ) {
    const T = UnitConverter.temperature(temperature, 'C', 'K');
    const P = UnitConverter.pressure(pressure, 'psi', 'kPa');
    const MW = molecularWeight || gasGravity * 28.97;
    
    // Gas compressibility factor (Hall-Yarborough)
    const Z = this.calculateGasCompressibilityFactor(P, T, MW);
    
    // Gas density
    const rho_g = (P * MW) / (Z * GAS_CONSTANT * T);
    
    // Gas viscosity (Lee-Gonzalez-Eakin)
    const K = (9.4 + 0.02 * MW) * Math.pow(T, 1.5) / (209 + 19 * MW + T);
    const X = 3.5 + 986 / T + 0.01 * MW;
    const Y = 2.4 - 0.2 * X;
    const mu_g = K * Math.exp(X * Math.pow(rho_g / 1000, Y)) / 1000000;
    
    return { Z, rho_g, mu_g };
  }

  private static calculateGasCompressibilityFactor(P: number, T: number, MW: number): number {
    // Simplified Hall-Yarborough correlation
    const Tr = T / 191.1; // Reduced temperature (simplified)
    const Pr = P / 4.64e6; // Reduced pressure (simplified)
    
    if (Tr < 1.0 || Pr > 3.0) return 1.0; // Outside correlation range
    
    // Simplified Z calculation
    const A = 0.06125 * Pr * Math.exp(-1.2 * Math.pow(1 - Tr, 2));
    const B = 14.76 * Tr - 9.76 * Math.pow(Tr, 2) + 4.58 * Math.pow(Tr, 3);
    const C = 90.7 * Tr - 242.2 * Math.pow(Tr, 2) + 42.4 * Math.pow(Tr, 3);
    const D = 2.18 + 2.82 * Tr;
    
    const Z = A + B + C + D;
    return Math.max(0.1, Math.min(2.0, Z)); // Clamp to reasonable range
  }
}

// IPR Calculations
export class IPRCalculator {
  static calculateIPR(
    model: IPRModel,
    fluid: Fluid,
    rates: number[],
    unitSystem: UnitSystem = 'metric'
  ): IPRResult {
    const pressures: number[] = [];
    
    for (const rate of rates) {
      let pressure: number;
      
      switch (model.type) {
        case 'vogel':
          pressure = this.calculateVogelIPR(rate, model.parameters, fluid);
          break;
        case 'fetkovich':
          pressure = this.calculateFetkovichIPR(rate, model.parameters, fluid);
          break;
        case 'darcy-linear':
          pressure = this.calculateDarcyIPR(rate, model.parameters, fluid);
          break;
        case 'gas-deliverability':
          pressure = this.calculateGasDeliverabilityIPR(rate, model.parameters, fluid);
          break;
        default:
          pressure = model.parameters.reservoir_pressure;
      }
      
      pressures.push(pressure);
    }
    
    return {
      rates: [...rates],
      pressures,
      max_rate: Math.max(...rates),
      max_pressure: Math.max(...pressures)
    };
  }

  private static calculateVogelIPR(
    rate: number,
    params: any,
    fluid: Fluid
  ): number {
    const { reservoir_pressure, bubble_point_pressure, pi } = params;
    const q_max = pi * (reservoir_pressure - bubble_point_pressure) + 
                  pi * bubble_point_pressure / 1.8;
    
    if (rate >= q_max) return bubble_point_pressure;
    
    const pwf = reservoir_pressure - (rate / q_max) * (reservoir_pressure - bubble_point_pressure) -
                (rate / q_max) * (reservoir_pressure - bubble_point_pressure) * 
                (1 - rate / q_max) * 0.8;
    
    return Math.max(pwf, bubble_point_pressure);
  }

  private static calculateFetkovichIPR(
    rate: number,
    params: any,
    fluid: Fluid
  ): number {
    const { reservoir_pressure, pi, n } = params;
    const q_max = pi * Math.pow(reservoir_pressure, n);
    
    if (rate >= q_max) return 0;
    
    const pwf = Math.pow(reservoir_pressure - rate / pi, 1 / n);
    return Math.max(pwf, 0);
  }

  private static calculateDarcyIPR(
    rate: number,
    params: any,
    fluid: Fluid
  ): number {
    const { reservoir_pressure, pi } = params;
    return reservoir_pressure - rate / pi;
  }

  private static calculateGasDeliverabilityIPR(
    rate: number,
    params: any,
    fluid: Fluid
  ): number {
    const { reservoir_pressure, a, b, c, n } = params;
    const q_max = Math.pow((reservoir_pressure - a) / b, 1 / n);
    
    if (rate >= q_max) return a;
    
    const pwf = a + b * Math.pow(rate, n);
    return Math.max(pwf, 0);
  }
}

// VLP Calculations
export class VLPCalculator {
  static calculateVLP(
    settings: VLPSettings,
    fluid: Fluid,
    deviation: DeviationSurvey,
    completion: Completion,
    rates: number[],
    unitSystem: UnitSystem = 'metric'
  ): VLPResult {
    const pressures: number[] = [];
    const holdups: number[] = [];
    const temperatures: number[] = [];
    
    for (const rate of rates) {
      const result = this.calculateSingleVLP(settings, fluid, deviation, completion, rate, unitSystem);
      pressures.push(result.pressure);
      holdups.push(result.holdup);
      temperatures.push(result.temperature);
    }
    
    return {
      rates: [...rates],
      pressures,
      holdups,
      temperatures,
      max_rate: Math.max(...rates),
      max_pressure: Math.max(...pressures)
    };
  }

  private static calculateSingleVLP(
    settings: VLPSettings,
    fluid: Fluid,
    deviation: DeviationSurvey,
    completion: Completion,
    rate: number,
    unitSystem: UnitSystem
  ): { pressure: number; holdup: number; temperature: number } {
    // Start from wellhead and work down
    let pressure = fluid.standardConditions.pressure; // Wellhead pressure
    let temperature = fluid.standardConditions.temperature;
    let holdup = 0.5; // Initial guess
    
    const segments = this.createSegments(deviation, completion);
    
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      const deltaL = segment.length;
      const deltaZ = segment.deltaZ;
      
      // Calculate pressure drop for this segment
      const deltaP = this.calculateSegmentPressureDrop(
        segment,
        fluid,
        rate,
        pressure,
        temperature,
        holdup,
        settings
      );
      
      pressure += deltaP;
      
      // Update temperature
      temperature += this.calculateTemperatureGradient(segment, settings);
      
      // Update holdup
      holdup = this.calculateHoldup(segment, fluid, rate, pressure, temperature, settings);
    }
    
    return { pressure, holdup, temperature };
  }

  private static createSegments(deviation: DeviationSurvey, completion: Completion) {
    const segments = [];
    
    for (let i = 0; i < deviation.length - 1; i++) {
      const current = deviation[i];
      const next = deviation[i + 1];
      
      segments.push({
        md_start: current.md,
        md_end: next.md,
        length: next.md - current.md,
        deltaZ: next.tvd - current.tvd,
        inclination: (current.inc + next.inc) / 2,
        id: completion.tubing_id,
        roughness: completion.tubing_roughness
      });
    }
    
    return segments;
  }

  private static calculateSegmentPressureDrop(
    segment: any,
    fluid: Fluid,
    rate: number,
    pressure: number,
    temperature: number,
    holdup: number,
    settings: VLPSettings
  ): number {
    // Hydrostatic pressure drop
    const rho_mix = this.calculateMixtureDensity(fluid, pressure, temperature, holdup);
    const deltaP_hydrostatic = rho_mix * GRAVITY * segment.deltaZ;
    
    // Friction pressure drop
    const deltaP_friction = this.calculateFrictionPressureDrop(
      segment,
      fluid,
      rate,
      pressure,
      temperature,
      holdup,
      settings
    );
    
    // Acceleration pressure drop (usually small)
    const deltaP_acceleration = this.calculateAccelerationPressureDrop(
      segment,
      fluid,
      rate,
      pressure,
      temperature,
      holdup
    );
    
    return deltaP_hydrostatic + deltaP_friction + deltaP_acceleration;
  }

  private static calculateMixtureDensity(
    fluid: Fluid,
    pressure: number,
    temperature: number,
    holdup: number
  ): number {
    const { pvt } = fluid;
    
    if (fluid.kind === 'oil') {
      const rho_o = pvt.rho_o || 800; // kg/m³
      const rho_g = pvt.rho_g || 1.2; // kg/m³
      return holdup * rho_o + (1 - holdup) * rho_g;
    } else {
      return pvt.rho_g || 1.2; // kg/m³
    }
  }

  private static calculateFrictionPressureDrop(
    segment: any,
    fluid: Fluid,
    rate: number,
    pressure: number,
    temperature: number,
    holdup: number,
    settings: VLPSettings
  ): number {
    const { correlation } = settings;
    
    switch (correlation) {
      case 'beggs-brill':
        return this.calculateBeggsBrillFriction(segment, fluid, rate, pressure, temperature, holdup);
      case 'hagedorn-brown':
        return this.calculateHagedornBrownFriction(segment, fluid, rate, pressure, temperature, holdup);
      case 'duns-ros':
        return this.calculateDunsRosFriction(segment, fluid, rate, pressure, temperature, holdup);
      default:
        return this.calculateSinglePhaseFriction(segment, fluid, rate, pressure, temperature);
    }
  }

  private static calculateBeggsBrillFriction(
    segment: any,
    fluid: Fluid,
    rate: number,
    pressure: number,
    temperature: number,
    holdup: number
  ): number {
    // Simplified Beggs-Brill correlation
    const rho_mix = this.calculateMixtureDensity(fluid, pressure, temperature, holdup);
    const velocity = rate / (Math.PI * Math.pow(segment.id / 2, 2));
    const reynolds = (rho_mix * velocity * segment.id) / (fluid.pvt.mu_o || 0.001);
    
    const f = 0.316 / Math.pow(reynolds, 0.25); // Blasius equation
    return f * (rho_mix * Math.pow(velocity, 2) * segment.length) / (2 * segment.id);
  }

  private static calculateHagedornBrownFriction(
    segment: any,
    fluid: Fluid,
    rate: number,
    pressure: number,
    temperature: number,
    holdup: number
  ): number {
    // Simplified Hagedorn-Brown correlation
    return this.calculateBeggsBrillFriction(segment, fluid, rate, pressure, temperature, holdup);
  }

  private static calculateDunsRosFriction(
    segment: any,
    fluid: Fluid,
    rate: number,
    pressure: number,
    temperature: number,
    holdup: number
  ): number {
    // Simplified Duns-Ros correlation
    return this.calculateBeggsBrillFriction(segment, fluid, rate, pressure, temperature, holdup);
  }

  private static calculateSinglePhaseFriction(
    segment: any,
    fluid: Fluid,
    rate: number,
    pressure: number,
    temperature: number
  ): number {
    const rho = fluid.pvt.rho_o || fluid.pvt.rho_g || 1000;
    const mu = fluid.pvt.mu_o || fluid.pvt.mu_g || 0.001;
    const velocity = rate / (Math.PI * Math.pow(segment.id / 2, 2));
    const reynolds = (rho * velocity * segment.id) / mu;
    
    const f = 0.316 / Math.pow(reynolds, 0.25);
    return f * (rho * Math.pow(velocity, 2) * segment.length) / (2 * segment.id);
  }

  private static calculateAccelerationPressureDrop(
    segment: any,
    fluid: Fluid,
    rate: number,
    pressure: number,
    temperature: number,
    holdup: number
  ): number {
    // Usually negligible for most cases
    return 0;
  }

  private static calculateTemperatureGradient(segment: any, settings: VLPSettings): number {
    if (settings.temperature_model === 'simple' && settings.temperature_gradient) {
      return settings.temperature_gradient * segment.length;
    }
    return 0;
  }

  private static calculateHoldup(
    segment: any,
    fluid: Fluid,
    rate: number,
    pressure: number,
    temperature: number,
    settings: VLPSettings
  ): number {
    // Simplified holdup calculation
    if (fluid.kind === 'oil') {
      return 0.5; // Simplified assumption
    } else {
      return 0.0; // Gas phase
    }
  }
}

// Nodal Analysis
export class NodalAnalyzer {
  static performNodalAnalysis(
    ipr: IPRModel,
    vlp: VLPSettings,
    fluid: Fluid,
    deviation: DeviationSurvey,
    completion: Completion,
    constraints?: Constraints,
    unitSystem: UnitSystem = 'metric'
  ): NodalResult {
    const rates = this.generateRateArray(ipr, vlp, fluid, deviation, completion);
    
    const iprResult = IPRCalculator.calculateIPR(ipr, fluid, rates, unitSystem);
    const vlpResult = VLPCalculator.calculateVLP(vlp, fluid, deviation, completion, rates, unitSystem);
    
    const operatingPoint = this.findOperatingPoint(iprResult, vlpResult);
    
    return {
      operating_point: operatingPoint,
      ipr_curve: iprResult,
      vlp_curve: vlpResult,
      convergence: true,
      iterations: 1,
      warnings: []
    };
  }

  private static generateRateArray(
    ipr: IPRModel,
    vlp: VLPSettings,
    fluid: Fluid,
    deviation: DeviationSurvey,
    completion: Completion
  ): number[] {
    const maxRate = 1000; // m³/d
    const numPoints = 50;
    const rates: number[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      rates.push((i / numPoints) * maxRate);
    }
    
    return rates;
  }

  private static findOperatingPoint(ipr: IPRResult, vlp: VLPResult): {
    rate: number;
    pwf: number;
    whp: number;
  } {
    // Find intersection of IPR and VLP curves
    let bestRate = 0;
    let minDiff = Infinity;
    
    for (let i = 0; i < ipr.rates.length; i++) {
      const rate = ipr.rates[i];
      const iprPressure = ipr.pressures[i];
      const vlpPressure = vlp.pressures[i];
      
      const diff = Math.abs(iprPressure - vlpPressure);
      if (diff < minDiff) {
        minDiff = diff;
        bestRate = rate;
      }
    }
    
    const pwf = ipr.pressures[ipr.rates.indexOf(bestRate)];
    const whp = vlp.pressures[vlp.rates.indexOf(bestRate)];
    
    return { rate: bestRate, pwf, whp };
  }
}

// Data Matching
export class DataMatcher {
  static matchVLPToTestPoints(
    vlp: VLPSettings,
    fluid: Fluid,
    deviation: DeviationSurvey,
    completion: Completion,
    testPoints: TestPoint[],
    unitSystem: UnitSystem = 'metric'
  ): MatchingResult {
    // Simplified matching - in practice, this would use optimization algorithms
    const bias_factors = {
      friction: 1.0,
      holdup: 1.0,
      temperature: 1.0
    };
    
    const residuals = testPoints.map(() => 0.1); // Placeholder
    const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
    const ape = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / residuals.length;
    const r_squared = 0.95; // Placeholder
    
    // Generate fitted curve
    const rates = testPoints.map(tp => tp.q);
    const fitted_curve = VLPCalculator.calculateVLP(vlp, fluid, deviation, completion, rates, unitSystem);
    
    return {
      correlation: vlp.correlation,
      bias_factors,
      residuals,
      rmse,
      ape,
      r_squared,
      test_points: testPoints,
      fitted_curve
    };
  }
}

// Validation
export class Validator {
  static validateCase(case_: OpenProsperCase): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: string[] = [];
    
    // Validate fluid properties
    if (!case_.fluid.pvt.rho_o && case_.fluid.kind === 'oil') {
      errors.push({
        type: 'validation',
        message: 'Oil density is required for oil wells',
        parameter: 'fluid.pvt.rho_o'
      });
    }
    
    // Validate IPR parameters
    if (case_.ipr.parameters.reservoir_pressure <= 0) {
      errors.push({
        type: 'validation',
        message: 'Reservoir pressure must be positive',
        parameter: 'ipr.parameters.reservoir_pressure',
        value: case_.ipr.parameters.reservoir_pressure
      });
    }
    
    // Validate completion
    if (case_.completion.tubing_id <= 0) {
      errors.push({
        type: 'validation',
        message: 'Tubing inner diameter must be positive',
        parameter: 'completion.tubing_id',
        value: case_.completion.tubing_id
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export main calculation functions
export const OpenProsperEngine = {
  PVTCalculator,
  IPRCalculator,
  VLPCalculator,
  NodalAnalyzer,
  DataMatcher,
  Validator,
  UnitConverter
};
