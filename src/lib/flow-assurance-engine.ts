import type { 
  NodeSpec, SegmentSpec, FluidSpec, NodeState, SegmentResult, NetworkResult,
  FluidKind, NodeKind 
} from '@/types/well-testing';

// Constants
const R_GAS = 8314.47; // J/(kmol·K) - Universal gas constant
const GRAVITY = 9.80665; // m/s²
const DEFAULT_ROUGHNESS = 4.6e-5; // m (carbon steel)
const DEFAULT_CD = 0.82; // Choke discharge coefficient

/**
 * Calculate discharge coefficient based on choke size and type
 * Based on industry correlations for choke performance
 */
export function calculateDischargeCoefficient(
  chokeSizeInches: number,
  chokeType: 'fixed-bean' | 'adjustable' = 'fixed-bean'
): number {
  // For fixed bean chokes, Cd varies with size due to flow characteristics
  if (chokeType === 'fixed-bean') {
    // Industry correlation: Cd increases with size up to a point, then levels off
    if (chokeSizeInches <= 0.125) { // 1/8" and smaller
      return 0.60; // Very small chokes have lower Cd due to flow restrictions
    } else if (chokeSizeInches <= 0.25) { // 1/4"
      return 0.65;
    } else if (chokeSizeInches <= 0.375) { // 3/8"
      return 0.70;
    } else if (chokeSizeInches <= 0.5) { // 1/2"
      return 0.75;
    } else if (chokeSizeInches <= 0.625) { // 5/8"
      return 0.80;
    } else if (chokeSizeInches <= 0.75) { // 3/4"
      return 0.82;
    } else if (chokeSizeInches <= 1.0) { // 1"
      return 0.85;
    } else if (chokeSizeInches <= 1.25) { // 1-1/4"
      return 0.87;
    } else if (chokeSizeInches <= 1.5) { // 1-1/2"
      return 0.88;
    } else if (chokeSizeInches <= 2.0) { // 2"
      return 0.89;
    } else { // 2" and larger
      return 0.90; // Large chokes approach theoretical maximum
    }
  } else {
    // For adjustable chokes, Cd varies with opening percentage
    // This is a simplified correlation - in practice, it depends on specific valve design
    return 0.82; // Default for adjustable chokes
  }
}

/**
 * Calculate discharge coefficient for adjustable choke based on opening percentage
 */
export function calculateAdjustableChokeCd(percentOpen: number): number {
  // Correlation based on typical adjustable choke performance
  // Cd increases with opening percentage but levels off
  if (percentOpen <= 10) {
    return 0.50; // Very low opening
  } else if (percentOpen <= 20) {
    return 0.60;
  } else if (percentOpen <= 30) {
    return 0.68;
  } else if (percentOpen <= 40) {
    return 0.74;
  } else if (percentOpen <= 50) {
    return 0.78;
  } else if (percentOpen <= 60) {
    return 0.81;
  } else if (percentOpen <= 70) {
    return 0.83;
  } else if (percentOpen <= 80) {
    return 0.85;
  } else if (percentOpen <= 90) {
    return 0.86;
  } else { // 90-100%
    return 0.87; // Near fully open
  }
}
const DEFAULT_Z = 1.0; // Compressibility factor
const DEFAULT_K = 1.30; // Cp/Cv ratio for gas
const DEFAULT_MW = 18.2; // kg/kmol (air)
const DEFAULT_RHO_LIQ = 850; // kg/m³
const EROSIONAL_C = 100; // API RP 14E constant
const MACH_LIMIT = 0.3;

// Standard conditions
const P_SC_KPA = 101.325; // kPa (1 atm)
const T_SC_K = 288.15; // K (15°C)

export interface StepperConfig {
  segment: SegmentSpec;
  fluid: FluidSpec;
  upstreamState: NodeState;
  downstreamPressure_kPa: number;
}

export interface SegmentResultDetailed {
  deltaP_total_kPa: number;
  deltaP_friction_kPa: number;
  deltaP_fittings_kPa: number;
  deltaP_hydrostatic_kPa: number;
  velocity_m_s: number;
  mach: number;
  reynolds: number;
  friction_factor: number;
  erosional_check: {
    velocity_limit_m_s: number;
    is_erosional: boolean;
    mach_limit_exceeded: boolean;
  };
}

/**
 * Calculate fluid density based on pressure, temperature, and fluid properties
 */
export function calculateFluidDensity(
  pressure_kPa: number,
  temperature_K: number,
  fluid: FluidSpec
): number {
  if (fluid.kind === 'gas') {
    const Z = fluid.Z || DEFAULT_Z;
    const MW = fluid.MW_kg_per_kmol || DEFAULT_MW;
    return (pressure_kPa * MW) / (R_GAS * temperature_K * Z);
  } else if (fluid.kind === 'liquid') {
    return fluid.rho_liq_kg_per_m3 || DEFAULT_RHO_LIQ;
  } else {
    // Two-phase: simplified homogeneous model
    const rho_gas = (pressure_kPa * (fluid.MW_kg_per_kmol || DEFAULT_MW)) / 
                   (R_GAS * temperature_K * (fluid.Z || DEFAULT_Z));
    const rho_liq = fluid.rho_liq_kg_per_m3 || DEFAULT_RHO_LIQ;
    const alpha = fluid.watercut_frac || 0.1; // gas fraction
    return alpha * rho_gas + (1 - alpha) * rho_liq;
  }
}

/**
 * Calculate actual volumetric flow rate from standard conditions
 */
export function calculateActualFlowRate(
  q_std: number,
  unit: "MSCFD"|"Sm3/d"|"STB/d",
  pressure_kPa: number,
  temperature_K: number,
  fluid: FluidSpec
): number {
  // Convert to m³/s
  let q_std_m3_s: number;
  switch (unit) {
    case "MSCFD":
      q_std_m3_s = q_std * 0.0283168; // MSCFD to m³/s
      break;
    case "Sm3/d":
      q_std_m3_s = q_std / 86400; // m³/d to m³/s
      break;
    case "STB/d":
      q_std_m3_s = q_std * 0.00000184; // bbl/day to m³/s
      break;
    default:
      q_std_m3_s = q_std;
  }

  // Apply compressibility correction
  const Z = fluid.Z || DEFAULT_Z;
  const Z_sc = 1.0; // Standard conditions
  return q_std_m3_s * (P_SC_KPA / pressure_kPa) * (temperature_K / T_SC_K) * (Z_sc / Z);
}

/**
 * Calculate total volumetric flow rate including all phases
 */
export function calculateTotalFlowRate(
  gasRate_m3_s: number,
  oilRate_m3_s: number,
  waterRate_m3_s: number,
  fluid: FluidSpec
): number {
  if (fluid.kind === 'gas') {
    return gasRate_m3_s;
  } else if (fluid.kind === 'liquid') {
    return oilRate_m3_s + waterRate_m3_s;
  } else {
    // Two-phase: return total of all phases
    return gasRate_m3_s + oilRate_m3_s + waterRate_m3_s;
  }
}

/**
 * Calculate velocity in a pipe segment
 */
export function calculateVelocity(
  totalFlowRate_m3_s: number,
  pipeId_m: number
): number {
  const area = Math.PI * Math.pow(pipeId_m / 2, 2);
  return totalFlowRate_m3_s / area;
}

/**
 * Calculate Reynolds number
 */
export function calculateReynolds(
  velocity_m_s: number,
  diameter_m: number,
  density_kg_m3: number,
  viscosity_Pa_s: number
): number {
  return (density_kg_m3 * velocity_m_s * diameter_m) / viscosity_Pa_s;
}

/**
 * Calculate friction factor using Churchill equation
 */
export function calculateFrictionFactor(
  reynolds: number,
  relative_roughness: number
): number {
  if (reynolds < 2300) {
    // Laminar flow
    return 64 / reynolds;
  }

  // Turbulent flow - Churchill equation
  const A = Math.pow(2.457 * Math.log(1 / Math.pow(7 / reynolds, 0.9) + 0.27 * relative_roughness), 16);
  const B = Math.pow(37530 / reynolds, 16);
  const f = 8 * Math.pow(Math.pow(8 / reynolds, 12) + 1 / Math.pow(A + B, 1.5), 1/12);
  
  return f;
}

/**
 * Calculate pressure drop across a segment
 */
export function calculateSegmentPressureDrop(
  config: StepperConfig
): SegmentResultDetailed {
  const { segment, fluid, upstreamState, downstreamPressure_kPa } = config;
  
  // Calculate average conditions
  const P_avg = (upstreamState.pressure_kPa + downstreamPressure_kPa) / 2;
  const T_avg = upstreamState.temperature_K; // Assume isothermal for now
  
      // Calculate fluid properties at average conditions
      const density = calculateFluidDensity(P_avg, T_avg, fluid);
      const viscosity = fluid.mu_Pa_s || 1.8e-5; // Default air viscosity
      
      // Calculate velocity using actual flow rates and segment pipe ID
      const gasRate = fluid.gasRate_m3_s || 0;
      const oilRate = fluid.oilRate_m3_s || 0;
      const waterRate = fluid.waterRate_m3_s || 0;
      const totalFlowRate = calculateTotalFlowRate(gasRate, oilRate, waterRate, fluid);
      const velocity = calculateVelocity(totalFlowRate, segment.id_inner_m);
  
  // Calculate Reynolds number
  const reynolds = calculateReynolds(velocity, segment.id_inner_m, density, viscosity);
  
  // Calculate friction factor
  const relative_roughness = (segment.roughness_m || DEFAULT_ROUGHNESS) / segment.id_inner_m;
  const friction_factor = calculateFrictionFactor(reynolds, relative_roughness);
  
  // Calculate pressure drops
  const deltaP_friction = friction_factor * (segment.length_m / segment.id_inner_m) * 
                         (density * Math.pow(velocity, 2) / 2) / 1000; // Convert to kPa
  
  const deltaP_fittings = (segment.fittingsK || 0) * (density * Math.pow(velocity, 2) / 2) / 1000;
  
  const deltaP_hydrostatic = density * GRAVITY * (segment.elevation_change_m || 0) / 1000;
  
  const deltaP_total = deltaP_friction + deltaP_fittings + deltaP_hydrostatic;
  
  // Calculate Mach number
  const k = fluid.k || DEFAULT_K;
  const sound_speed = Math.sqrt(k * R_GAS * T_avg / (fluid.MW_kg_per_kmol || DEFAULT_MW));
  const mach = velocity / sound_speed;
  
  // Erosional velocity check
  const erosional_velocity = EROSIONAL_C / Math.sqrt(density);
  const is_erosional = velocity > erosional_velocity;
  const mach_limit_exceeded = mach > MACH_LIMIT;
  
  return {
    deltaP_total_kPa: deltaP_total,
    deltaP_friction_kPa: deltaP_friction,
    deltaP_fittings_kPa: deltaP_fittings,
    deltaP_hydrostatic_kPa: deltaP_hydrostatic,
    velocity_m_s: velocity,
    mach,
    reynolds,
    friction_factor,
    erosional_check: {
      velocity_limit_m_s: erosional_velocity,
      is_erosional,
      mach_limit_exceeded
    }
  };
}

/**
 * Calculate choke flow for critical and subcritical conditions
 */
export function calculateChokeFlow(
  upstreamState: NodeState,
  chokeSpec: NodeSpec['choke'],
  fluid: FluidSpec
): { P2_kPa: number; mdot_kg_s: number; regime: 'critical' | 'subcritical' } {
  if (!chokeSpec) {
    throw new Error('Choke specification required');
  }

  const P0 = upstreamState.pressure_kPa;
  const T0 = upstreamState.temperature_K;
  const k = fluid.k || DEFAULT_K;
  const Z = fluid.Z || DEFAULT_Z;
  const MW = fluid.MW_kg_per_kmol || DEFAULT_MW;
  const Cd = chokeSpec.Cd || DEFAULT_CD;

  // Calculate choke area
  let area_m2: number;
  if (chokeSpec.mode === 'fixed-bean') {
    const d_bean_m = (chokeSpec.bean_d_in || 0.5) * 0.0254; // Convert inches to meters
    area_m2 = Math.PI * Math.pow(d_bean_m / 2, 2);
  } else {
    // Percent open - use quadratic relationship
    const percent = chokeSpec.percent_open || 50;
    const max_area = Math.PI * Math.pow(0.0254 / 2, 2); // 1 inch max
    area_m2 = max_area * Math.pow(percent / 100, 2);
  }

  // Calculate critical pressure ratio
  const r_critical = Math.pow(2 / (k + 1), k / (k - 1));
  
  // For now, assume subcritical flow and solve iteratively
  // This is a simplified approach - in practice, you'd solve the full equation
  const P2_guess = P0 * 0.8; // Initial guess
  
  // Calculate mass flow rate
  const density = calculateFluidDensity(P0, T0, fluid);
  const mdot = upstreamState.mdot_kg_s; // Use upstream mass flow as initial guess
  
  // Determine regime
  const regime = (P2_guess / P0) <= r_critical ? 'critical' : 'subcritical';
  
  return {
    P2_kPa: P2_guess,
    mdot_kg_s: mdot,
    regime
  };
}

/**
 * Solve the entire network
 */
export function solveNetwork(
  nodes: NodeSpec[],
  segments: SegmentSpec[],
  fluidSpec: FluidSpec,
  options: {
    maxIterations?: number;
    tolerance?: number;
    relaxation?: number;
  } = {}
): NetworkResult {
  const maxIterations = options.maxIterations || 50;
  const tolerance = options.tolerance || 0.0001;
  const relaxation = options.relaxation || 0.5;
  
  const warnings: string[] = [];
  
  // Initialize node states
  let nodeStates: NodeState[] = nodes.map(node => {
    const pressure = node.kind === 'wellhead' ? fluidSpec.P_in_kPa : fluidSpec.P_in_kPa * 0.9;
    const temperature = fluidSpec.T_K;
    const density = calculateFluidDensity(pressure, temperature, fluidSpec);
    
    // Calculate actual flow rates for each phase
    const gasRate = fluidSpec.gasRate_m3_s || calculateActualFlowRate(
      fluidSpec.q_std.value,
      fluidSpec.q_std.unit,
      pressure,
      temperature,
      fluidSpec
    );
    const oilRate = fluidSpec.oilRate_m3_s || 0;
    const waterRate = fluidSpec.waterRate_m3_s || 0;
    
    // Calculate total flow rate
    const totalFlowRate = calculateTotalFlowRate(gasRate, oilRate, waterRate, fluidSpec);
    const mdot = totalFlowRate * density;
    
    // Calculate initial velocity (will be updated with actual segment pipe ID)
    const velocity = 0; // Will be calculated during iteration with actual pipe ID
    const erosional_velocity = EROSIONAL_C / Math.sqrt(density);
    
    return {
      id: node.id,
      kind: node.kind,
      label: node.label,
      pressure_kPa: pressure,
      temperature_K: temperature,
      q_actual_m3_s: totalFlowRate,
      mdot_kg_s: mdot,
      density_kg_m3: density,
      velocity_m_s: velocity,
      mach: 0, // Will be calculated during iteration
      reynolds: 0, // Will be calculated during iteration
      friction_factor: 0, // Will be calculated during iteration
      erosional_check: {
        velocity_limit_m_s: erosional_velocity,
        is_erosional: false, // Will be calculated during iteration
        mach_limit_exceeded: false
      },
      warnings: []
    };
  });

  let converged = false;
  let iterations = 0;
  let maxPressureChange = 0;
  let maxFlowMismatch = 0;

  // Iterative solver
  for (let iter = 0; iter < maxIterations; iter++) {
    const previousStates = nodeStates.map(state => ({ ...state }));
    maxPressureChange = 0;
    maxFlowMismatch = 0;

    // Process each segment
    for (const segment of segments) {
      const fromNode = nodeStates.find(n => n.id === segment.from);
      const toNode = nodeStates.find(n => n.id === segment.to);
      
      if (!fromNode || !toNode) continue;

      // Calculate segment pressure drop
      const segmentResult = calculateSegmentPressureDrop({
        segment,
        fluid: fluidSpec,
        upstreamState: fromNode,
        downstreamPressure_kPa: toNode.pressure_kPa
      });

      // Update downstream node pressure
      const newPressure = fromNode.pressure_kPa - segmentResult.deltaP_total_kPa;
      const pressureChange = Math.abs(newPressure - toNode.pressure_kPa);
      maxPressureChange = Math.max(maxPressureChange, pressureChange);
      
      toNode.pressure_kPa = newPressure * relaxation + toNode.pressure_kPa * (1 - relaxation);
      
      // Update fluid properties
      toNode.density_kg_m3 = calculateFluidDensity(toNode.pressure_kPa, toNode.temperature_K, fluidSpec);
      
      // Calculate actual flow rates for each phase
      const gasRate = fluidSpec.gasRate_m3_s || calculateActualFlowRate(
        fluidSpec.q_std.value,
        fluidSpec.q_std.unit,
        toNode.pressure_kPa,
        toNode.temperature_K,
        fluidSpec
      );
      const oilRate = fluidSpec.oilRate_m3_s || 0;
      const waterRate = fluidSpec.waterRate_m3_s || 0;
      
      // Calculate total flow rate
      const totalFlowRate = calculateTotalFlowRate(gasRate, oilRate, waterRate, fluidSpec);
      toNode.q_actual_m3_s = totalFlowRate;
      toNode.mdot_kg_s = totalFlowRate * toNode.density_kg_m3;
      
      // Calculate velocity using actual segment pipe ID
      const velocity = calculateVelocity(totalFlowRate, segment.id_inner_m);
      const erosional_velocity = EROSIONAL_C / Math.sqrt(toNode.density_kg_m3);
      
      // Update node velocity
      toNode.velocity_m_s = velocity;
      toNode.mach = segmentResult.mach;
      toNode.reynolds = segmentResult.reynolds;
      toNode.friction_factor = segmentResult.friction_factor;
      
      toNode.erosional_check = {
        velocity_limit_m_s: erosional_velocity,
        is_erosional: velocity > erosional_velocity,
        mach_limit_exceeded: segmentResult.mach > MACH_LIMIT
      };
      
      // Add warnings
      if (toNode.erosional_check.is_erosional) {
        toNode.warnings.push(`Erosional velocity exceeded: ${velocity.toFixed(1)} > ${erosional_velocity.toFixed(1)} m/s`);
      }
      if (toNode.erosional_check.mach_limit_exceeded) {
        toNode.warnings.push(`Mach number exceeded: ${segmentResult.mach.toFixed(3)} > ${MACH_LIMIT}`);
      }
    }

    // Check convergence
    if (maxPressureChange < tolerance && maxFlowMismatch < tolerance) {
      converged = true;
      iterations = iter + 1;
      break;
    }
    
    iterations = iter + 1;
  }

  if (!converged) {
    warnings.push(`Solver did not converge after ${iterations} iterations`);
  }

  // Calculate segment results
  const segmentResults: SegmentResult[] = segments.map(segment => {
    const fromNode = nodeStates.find(n => n.id === segment.from);
    const toNode = nodeStates.find(n => n.id === segment.to);
    
    if (!fromNode || !toNode) {
      return {
        id: segment.id,
        from: segment.from,
        to: segment.to,
        deltaP_total_kPa: 0,
        deltaP_friction_kPa: 0,
        deltaP_fittings_kPa: 0,
        deltaP_hydrostatic_kPa: 0,
        velocity_m_s: 0,
        mach: 0,
        reynolds: 0,
        friction_factor: 0,
        length_m: segment.length_m,
        id_inner_m: segment.id_inner_m,
        elevation_change_m: segment.elevation_change_m || 0,
        erosional_check: {
          velocity_limit_m_s: 0,
          is_erosional: false,
          mach_limit_exceeded: false
        }
      };
    }

    const segmentResult = calculateSegmentPressureDrop({
      segment,
      fluid: fluidSpec,
      upstreamState: fromNode,
      downstreamPressure_kPa: toNode.pressure_kPa
    });

    return {
      id: segment.id,
      from: segment.from,
      to: segment.to,
      ...segmentResult,
      length_m: segment.length_m,
      id_inner_m: segment.id_inner_m,
      elevation_change_m: segment.elevation_change_m || 0
    };
  });

  // Calculate total drawdown
  const wellheadNode = nodeStates.find(n => n.kind === 'wellhead');
  const finalNode = nodeStates[nodeStates.length - 1];
  const totalDrawdown = wellheadNode && finalNode ? 
    wellheadNode.pressure_kPa - finalNode.pressure_kPa : 0;

  return {
    nodes: nodeStates,
    segments: segmentResults,
    total_drawdown_kPa: totalDrawdown,
    convergence: {
      converged,
      iterations,
      max_pressure_change: maxPressureChange,
      max_flow_mismatch: maxFlowMismatch
    },
    warnings
  };
}

/**
 * Create default network configuration
 */
export function createDefaultNetwork(): { nodes: NodeSpec[]; segments: SegmentSpec[] } {
  const nodes: NodeSpec[] = [
    { id: 'wellhead', kind: 'wellhead', label: 'Wellhead' },
    { id: 'esd', kind: 'esd', label: 'ESD Valve' },
    { id: 'filter', kind: 'sand_filter', label: 'Sand Filter' },
    { 
      id: 'choke', 
      kind: 'choke', 
      label: 'Choke',
      choke: {
        mode: 'fixed-bean',
        bean_d_in: 0.5,
        Cd: 0.82
      }
    },
    { id: 'separator', kind: 'separator', label: 'Test Separator' },
    { id: 'flare', kind: 'flare', label: 'Flare Stack' }
  ];

  const segments: SegmentSpec[] = [
    {
      id: 'seg1',
      from: 'wellhead',
      to: 'esd',
      length_m: 10,
      id_inner_m: 0.1023, // 4" pipe
      roughness_m: DEFAULT_ROUGHNESS,
      fittingsK: 0.5,
      elevation_change_m: 0
    },
    {
      id: 'seg2',
      from: 'esd',
      to: 'filter',
      length_m: 5,
      id_inner_m: 0.1023,
      roughness_m: DEFAULT_ROUGHNESS,
      fittingsK: 1.0,
      elevation_change_m: 0
    },
    {
      id: 'seg3',
      from: 'filter',
      to: 'choke',
      length_m: 3,
      id_inner_m: 0.1023,
      roughness_m: DEFAULT_ROUGHNESS,
      fittingsK: 0.5,
      elevation_change_m: 0
    },
    {
      id: 'seg4',
      from: 'choke',
      to: 'separator',
      length_m: 20,
      id_inner_m: 0.1023,
      roughness_m: DEFAULT_ROUGHNESS,
      fittingsK: 2.0,
      elevation_change_m: 0
    },
    {
      id: 'seg5',
      from: 'separator',
      to: 'flare',
      length_m: 15,
      id_inner_m: 0.1023,
      roughness_m: DEFAULT_ROUGHNESS,
      fittingsK: 1.5,
      elevation_change_m: 0
    }
  ];

  return { nodes, segments };
}

/**
 * Create default fluid specification
 */
export function createDefaultFluidSpec(): FluidSpec {
  return {
    kind: 'gas',
    P_in_kPa: 5000, // 50 bar
    T_K: 333, // 60°C
    Z: DEFAULT_Z,
    k: DEFAULT_K,
    MW_kg_per_kmol: DEFAULT_MW,
    gamma_g: 0.7,
    q_std: {
      unit: 'MSCFD',
      value: 10
    },
    gasRate_m3_s: 0.28, // 10 MSCFD converted to m³/s
    oilRate_m3_s: 0.05, // 50 bbl/day converted to m³/s
    waterRate_m3_s: 0.01 // 10 bbl/day converted to m³/s
  };
}
