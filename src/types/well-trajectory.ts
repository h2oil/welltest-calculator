// Well Trajectory Types for H2Oil Complete
// Inspired by well_profile library functionality

export interface TrajectoryPoint {
  md: number;        // Measured Depth
  inc: number;       // Inclination (degrees)
  azi: number;       // Azimuth (degrees)
  tvd: number;       // True Vertical Depth
  north: number;     // North coordinate
  east: number;      // East coordinate
  dls?: number;      // Dog Leg Severity (degrees/100ft or degrees/30m)
  dl?: number;       // Dog Leg (degrees)
  buildRate?: number; // Build Rate (degrees/100ft or degrees/30m)
  turnRate?: number;  // Turn Rate (degrees/100ft or degrees/30m)
}

export interface WellTrajectory {
  id: string;
  name: string;
  points: TrajectoryPoint[];
  unitSystem: 'metric' | 'field';
  startPoint: {
    north: number;
    east: number;
    tvd: number;
  };
  endPoint: {
    north: number;
    east: number;
    tvd: number;
  };
  totalDepth: number;
  totalDisplacement: number;
  maxInclination: number;
  maxDLS: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrajectoryProfile {
  type: 'J' | 'S' | 'Horizontal' | 'Vertical' | 'Custom';
  kop?: number;           // Kick-off Point
  eob?: number;           // End of Build
  eod?: number;           // End of Drop
  buildAngle?: number;    // Build Angle
  dropAngle?: number;     // Drop Angle
  horizontalLength?: number; // Horizontal Length
  targetDepth?: number;   // Target Depth
  targetDisplacement?: number; // Target Displacement
  targetAzimuth?: number; // Target Azimuth
}

export interface TrajectoryCalculationParams {
  profile: TrajectoryProfile;
  startPoint: {
    north: number;
    east: number;
    tvd: number;
  };
  unitSystem: 'metric' | 'field';
  stepSize: number; // Step size for calculations
  maxDLS: number;   // Maximum Dog Leg Severity
}

export interface TrajectoryVisualizationOptions {
  colorBy: 'dls' | 'dl' | 'tvd' | 'md' | 'inc' | 'azi' | 'buildRate' | 'turnRate';
  size: number;
  darkMode: boolean;
  showGrid: boolean;
  showLabels: boolean;
  showStartPoint: boolean;
  showEndPoint: boolean;
  showDLS: boolean;
  showBuildRate: boolean;
  showTurnRate: boolean;
}

export interface TrajectoryAnalysis {
  totalLength: number;
  totalDisplacement: number;
  maxInclination: number;
  maxAzimuth: number;
  maxDLS: number;
  avgDLS: number;
  maxBuildRate: number;
  maxTurnRate: number;
  avgBuildRate: number;
  avgTurnRate: number;
  verticalSection: number;
  closureDistance: number;
  closureAzimuth: number;
}

// Well trajectory calculation functions
export class TrajectoryCalculator {
  static calculateDLS(point1: TrajectoryPoint, point2: TrajectoryPoint, unitSystem: 'metric' | 'field'): number {
    const deltaMD = point2.md - point1.md;
    if (deltaMD === 0) return 0;
    
    const deltaInc = point2.inc - point1.inc;
    const deltaAzi = point2.azi - point1.azi;
    
    // Handle azimuth wrap-around
    let deltaAziAdjusted = deltaAzi;
    if (deltaAzi > 180) deltaAziAdjusted -= 360;
    if (deltaAzi < -180) deltaAziAdjusted += 360;
    
    const dls = Math.acos(
      Math.cos(deltaInc * Math.PI / 180) + 
      Math.sin(point1.inc * Math.PI / 180) * 
      Math.sin(point2.inc * Math.PI / 180) * 
      (1 - Math.cos(deltaAziAdjusted * Math.PI / 180))
    ) * 180 / Math.PI;
    
    // Convert to degrees per 100ft or degrees per 30m
    const conversionFactor = unitSystem === 'metric' ? 30 : 100;
    return (dls / deltaMD) * conversionFactor;
  }
  
  static calculateBuildRate(point1: TrajectoryPoint, point2: TrajectoryPoint, unitSystem: 'metric' | 'field'): number {
    const deltaMD = point2.md - point1.md;
    if (deltaMD === 0) return 0;
    
    const deltaInc = point2.inc - point1.inc;
    const conversionFactor = unitSystem === 'metric' ? 30 : 100;
    return (deltaInc / deltaMD) * conversionFactor;
  }
  
  static calculateTurnRate(point1: TrajectoryPoint, point2: TrajectoryPoint, unitSystem: 'metric' | 'field'): number {
    const deltaMD = point2.md - point1.md;
    if (deltaMD === 0) return 0;
    
    let deltaAzi = point2.azi - point1.azi;
    if (deltaAzi > 180) deltaAzi -= 360;
    if (deltaAzi < -180) deltaAzi += 360;
    
    const conversionFactor = unitSystem === 'metric' ? 30 : 100;
    return (deltaAzi / deltaMD) * conversionFactor;
  }
  
  static calculateCoordinates(point: TrajectoryPoint, startPoint: { north: number; east: number; tvd: number }): { north: number; east: number; tvd: number } {
    const incRad = point.inc * Math.PI / 180;
    const aziRad = point.azi * Math.PI / 180;
    
    const deltaTVD = point.tvd - startPoint.tvd;
    const deltaNorth = deltaTVD * Math.cos(incRad) * Math.cos(aziRad);
    const deltaEast = deltaTVD * Math.cos(incRad) * Math.sin(aziRad);
    
    return {
      north: startPoint.north + deltaNorth,
      east: startPoint.east + deltaEast,
      tvd: point.tvd
    };
  }
  
  static generateTrajectory(params: TrajectoryCalculationParams): TrajectoryPoint[] {
    const { profile, startPoint, unitSystem, stepSize, maxDLS } = params;
    const points: TrajectoryPoint[] = [];
    
    // Start point
    points.push({
      md: 0,
      inc: 0,
      azi: 0,
      tvd: startPoint.tvd,
      north: startPoint.north,
      east: startPoint.east
    });
    
    let currentMD = 0;
    let currentInc = 0;
    let currentAzi = 0;
    let currentTVD = startPoint.tvd;
    let currentNorth = startPoint.north;
    let currentEast = startPoint.east;
    
    // Generate trajectory based on profile type
    switch (profile.type) {
      case 'J':
        return this.generateJProfile(params, points);
      case 'S':
        return this.generateSProfile(params, points);
      case 'Horizontal':
        return this.generateHorizontalProfile(params, points);
      case 'Vertical':
        return this.generateVerticalProfile(params, points);
      default:
        return points;
    }
  }
  
  private static generateJProfile(params: TrajectoryCalculationParams, points: TrajectoryPoint[]): TrajectoryPoint[] {
    const { profile, startPoint, unitSystem, stepSize } = params;
    const { kop = 1000, eob = 3000, buildAngle = 60, targetDepth = 5000 } = profile;
    
    let currentMD = 0;
    let currentInc = 0;
    let currentAzi = 0;
    let currentTVD = startPoint.tvd;
    let currentNorth = startPoint.north;
    let currentEast = startPoint.east;
    
    // Vertical section to KOP
    for (let md = stepSize; md <= kop; md += stepSize) {
      currentMD = md;
      currentTVD = startPoint.tvd + md;
      currentNorth = startPoint.north;
      currentEast = startPoint.east;
      
      points.push({
        md: currentMD,
        inc: currentInc,
        azi: currentAzi,
        tvd: currentTVD,
        north: currentNorth,
        east: currentEast
      });
    }
    
    // Build section
    const buildRate = buildAngle / (eob - kop);
    for (let md = kop + stepSize; md <= eob; md += stepSize) {
      currentMD = md;
      currentInc = buildRate * (md - kop);
      currentTVD = startPoint.tvd + kop + (md - kop) * Math.cos(currentInc * Math.PI / 180);
      currentNorth = startPoint.north + (md - kop) * Math.sin(currentInc * Math.PI / 180);
      currentEast = startPoint.east;
      
      points.push({
        md: currentMD,
        inc: currentInc,
        azi: currentAzi,
        tvd: currentTVD,
        north: currentNorth,
        east: currentEast
      });
    }
    
    // Tangent section
    for (let md = eob + stepSize; md <= targetDepth; md += stepSize) {
      currentMD = md;
      currentTVD = startPoint.tvd + kop + (eob - kop) * Math.cos(buildAngle * Math.PI / 180) + 
                   (md - eob) * Math.cos(buildAngle * Math.PI / 180);
      currentNorth = startPoint.north + (eob - kop) * Math.sin(buildAngle * Math.PI / 180) + 
                     (md - eob) * Math.sin(buildAngle * Math.PI / 180);
      currentEast = startPoint.east;
      
      points.push({
        md: currentMD,
        inc: currentInc,
        azi: currentAzi,
        tvd: currentTVD,
        north: currentNorth,
        east: currentEast
      });
    }
    
    return points;
  }
  
  private static generateSProfile(params: TrajectoryCalculationParams, points: TrajectoryPoint[]): TrajectoryPoint[] {
    // S-shaped profile implementation
    return points;
  }
  
  private static generateHorizontalProfile(params: TrajectoryCalculationParams, points: TrajectoryPoint[]): TrajectoryPoint[] {
    // Horizontal well profile implementation
    return points;
  }
  
  private static generateVerticalProfile(params: TrajectoryCalculationParams, points: TrajectoryPoint[]): TrajectoryPoint[] {
    // Vertical well profile implementation
    return points;
  }
  
  static analyzeTrajectory(trajectory: WellTrajectory): TrajectoryAnalysis {
    const points = trajectory.points;
    if (points.length < 2) {
      throw new Error('Trajectory must have at least 2 points');
    }
    
    const lastPoint = points[points.length - 1];
    const totalLength = lastPoint.md;
    const totalDisplacement = Math.sqrt(
      Math.pow(lastPoint.north - trajectory.startPoint.north, 2) + 
      Math.pow(lastPoint.east - trajectory.startPoint.east, 2)
    );
    
    // Validate and clamp extreme values
    const validPoints = points.map(p => ({
      ...p,
      inc: Math.max(0, Math.min(90, p.inc)), // Clamp inclination between 0-90 degrees
      azi: ((p.azi % 360) + 360) % 360 // Normalize azimuth to 0-360 degrees
    }));
    
    const maxInclination = Math.max(...validPoints.map(p => p.inc));
    const maxAzimuth = Math.max(...validPoints.map(p => p.azi));
    
    let maxDLS = 0;
    let totalDLS = 0;
    let dlsCount = 0;
    
    for (let i = 1; i < points.length; i++) {
      const dls = this.calculateDLS(points[i-1], points[i], trajectory.unitSystem);
      if (dls > maxDLS) maxDLS = dls;
      totalDLS += dls;
      dlsCount++;
    }
    
    const avgDLS = dlsCount > 0 ? totalDLS / dlsCount : 0;
    
    return {
      totalLength,
      totalDisplacement,
      maxInclination,
      maxAzimuth,
      maxDLS,
      avgDLS,
      maxBuildRate: 0, // Calculate from trajectory
      maxTurnRate: 0,  // Calculate from trajectory
      avgBuildRate: 0, // Calculate from trajectory
      avgTurnRate: 0,  // Calculate from trajectory
      verticalSection: lastPoint.tvd - trajectory.startPoint.tvd,
      closureDistance: totalDisplacement,
      closureAzimuth: Math.atan2(lastPoint.east - trajectory.startPoint.east, 
                                 lastPoint.north - trajectory.startPoint.north) * 180 / Math.PI
    };
  }
}
