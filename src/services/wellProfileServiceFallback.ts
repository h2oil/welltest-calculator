// Well Profile Service Fallback - Works without Python backend
import { WellTrajectory, TrajectoryProfile, TrajectoryPoint } from '@/types/well-trajectory';

export interface TrajectoryRequest {
  profile: TrajectoryProfile;
  start_point: {
    north: number;
    east: number;
    tvd: number;
  };
  unit_system: 'metric' | 'field';
  step_size?: number;
  max_dls?: number;
}

export interface TrajectoryAnalysis {
  total_length: number;
  total_displacement: number;
  max_inclination: number;
  max_azimuth: number;
  vertical_section: number;
  closure_distance: number;
  closure_azimuth: number;
  point_count: number;
  max_dls: number;
  avg_dls: number;
}

export interface PlotStyle {
  color: 'dls' | 'dl' | 'tvd' | 'md' | 'inc' | 'azi';
  size: number;
  darkMode: boolean;
}

class WellProfileServiceFallback {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Simulate backend response for development
    // Simulating API call using fallback service
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data based on endpoint
    if (endpoint === '/health') {
      return {
        status: 'healthy',
        well_profile_version: '0.8.1 (Fallback Mode)',
        message: 'Using fallback implementation - Python backend not available'
      } as T;
    }
    
    if (endpoint === '/trajectory/generate') {
      const request = JSON.parse(options.body as string) as TrajectoryRequest;
      return this.generateMockTrajectory(request) as T;
    }
    
    if (endpoint === '/trajectory/analyze') {
      const trajectory = JSON.parse(options.body as string) as WellTrajectory;
      return this.analyzeMockTrajectory(trajectory) as T;
    }
    
    if (endpoint === '/trajectory/plot') {
      return {
        plot_data: JSON.stringify({
          data: [{ type: 'scatter3d', mode: 'lines', name: 'Well Trajectory' }],
          layout: { title: 'Well Trajectory (Fallback Mode)' }
        })
      } as T;
    }
    
    throw new Error('Endpoint not implemented in fallback mode');
  }

  private generateMockTrajectory(request: TrajectoryRequest): WellTrajectory {
    const points: TrajectoryPoint[] = [];
    const stepSize = request.step_size || 100;
    const targetDepth = request.profile.target_depth || 5000;
    const totalSteps = Math.floor(targetDepth / stepSize);
    
    for (let i = 0; i <= totalSteps; i++) {
      const md = i * stepSize;
      const tvd = this.calculateTVD(md, request.profile);
      const inc = this.calculateInclination(md, request.profile);
      const azi = this.calculateAzimuth(md, request.profile);
      const north = this.calculateNorth(md, inc, azi);
      const east = this.calculateEast(md, inc, azi);
      
      // Validate and clamp values to prevent extreme results
      const validInc = Math.max(0, Math.min(90, inc)); // Clamp inclination 0-90°
      const validAzi = ((azi % 360) + 360) % 360; // Normalize azimuth 0-360°
      
      points.push({
        md,
        tvd: tvd + request.start_point.tvd,
        inc: validInc,
        azi: validAzi,
        north: north + request.start_point.north,
        east: east + request.start_point.east,
        dls: this.calculateDLS(points[points.length - 1], { md, tvd, inc: validInc, azi: validAzi, north, east }),
        buildRate: 0,
        turnRate: 0
      });
    }
    
    const lastPoint = points[points.length - 1];
    const totalDisplacement = Math.sqrt(
      Math.pow(lastPoint.north - request.start_point.north, 2) + 
      Math.pow(lastPoint.east - request.start_point.east, 2)
    );
    
    return {
      id: `trajectory_${Date.now()}`,
      name: `${request.profile.type}-Profile (Fallback)`,
      points,
      unitSystem: request.unit_system,
      startPoint: request.start_point,
      endPoint: {
        north: lastPoint.north,
        east: lastPoint.east,
        tvd: lastPoint.tvd
      },
      totalDepth: lastPoint.md,
      totalDisplacement,
      maxInclination: Math.max(...points.map(p => p.inc)),
      maxDLS: Math.max(...points.map(p => p.dls || 0)),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private calculateTVD(md: number, profile: TrajectoryProfile): number {
    // Simple TVD calculation based on profile type
    if (profile.type === 'Vertical') return md;
    if (profile.type === 'J') {
      const kop = profile.kop || 1000;
      const eob = profile.eob || 3000;
      const buildAngle = profile.build_angle || 60;
      
      if (md <= kop) return md;
      if (md <= eob) {
        const buildSection = md - kop;
        const radius = 180 / (Math.PI * buildAngle);
        return kop + radius * Math.sin(buildAngle * Math.PI / 180);
      }
      return eob + (md - eob) * Math.cos(buildAngle * Math.PI / 180);
    }
    return md * 0.8; // Default approximation
  }

  private calculateInclination(md: number, profile: TrajectoryProfile): number {
    if (profile.type === 'Vertical') return 0;
    if (profile.type === 'J') {
      const kop = profile.kop || 1000;
      const eob = profile.eob || 3000;
      const buildAngle = profile.build_angle || 60;
      
      if (md <= kop) return 0;
      if (md <= eob) {
        // Linear build from 0 to buildAngle over the build section
        const buildSection = md - kop;
        const totalBuildSection = eob - kop;
        return (buildSection / totalBuildSection) * buildAngle;
      }
      return buildAngle;
    }
    return Math.min(md / 100, 90); // Default build
  }

  private calculateAzimuth(md: number, profile: TrajectoryProfile): number {
    return profile.target_azimuth || 0;
  }

  private calculateNorth(md: number, inc: number, azi: number): number {
    return md * Math.sin(inc * Math.PI / 180) * Math.cos(azi * Math.PI / 180);
  }

  private calculateEast(md: number, inc: number, azi: number): number {
    return md * Math.sin(inc * Math.PI / 180) * Math.sin(azi * Math.PI / 180);
  }

  private calculateDLS(prev: TrajectoryPoint | undefined, curr: TrajectoryPoint): number {
    if (!prev) return 0;
    
    const deltaMD = curr.md - prev.md;
    if (deltaMD <= 0) return 0;
    
    const deltaInc = curr.inc - prev.inc;
    const deltaAzi = curr.azi - prev.azi;
    
    const dls = Math.acos(
      Math.cos(deltaInc * Math.PI / 180) + 
      Math.sin(prev.inc * Math.PI / 180) * 
      Math.sin(curr.inc * Math.PI / 180) * 
      (1 - Math.cos(deltaAzi * Math.PI / 180))
    ) * 180 / Math.PI;
    
    return (dls / deltaMD) * 100; // DLS per 100 units
  }

  private analyzeMockTrajectory(trajectory: WellTrajectory): TrajectoryAnalysis {
    const points = trajectory.points;
    const lastPoint = points[points.length - 1];
    
    return {
      total_length: lastPoint.md,
      total_displacement: Math.sqrt(lastPoint.north**2 + lastPoint.east**2),
      max_inclination: Math.max(...points.map(p => p.inc)),
      max_azimuth: Math.max(...points.map(p => p.azi)),
      vertical_section: lastPoint.tvd,
      closure_distance: Math.sqrt(lastPoint.north**2 + lastPoint.east**2),
      closure_azimuth: Math.atan2(lastPoint.east, lastPoint.north) * 180 / Math.PI,
      point_count: points.length,
      max_dls: Math.max(...points.map(p => p.dls || 0)),
      avg_dls: points.reduce((sum, p) => sum + (p.dls || 0), 0) / points.length
    };
  }

  async healthCheck(): Promise<{ status: string; well_profile_version: string }> {
    return this.request('/health');
  }

  async generateTrajectory(request: TrajectoryRequest): Promise<WellTrajectory> {
    return this.request('/trajectory/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async loadTrajectory(file: File): Promise<WellTrajectory> {
    throw new Error('File loading not available in fallback mode. Please use the trajectory calculator instead.');
  }

  async exportTrajectory(trajectory: WellTrajectory, format: string = 'excel'): Promise<Blob> {
    // Create a simple JSON export
    const data = {
      trajectory,
      exported_at: new Date().toISOString(),
      format: 'json'
    };
    
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  async create3DPlot(trajectory: WellTrajectory, style: PlotStyle): Promise<any> {
    return this.request('/trajectory/plot', {
      method: 'POST',
      body: JSON.stringify({ trajectory, style }),
    });
  }

  async analyzeTrajectory(trajectory: WellTrajectory): Promise<TrajectoryAnalysis> {
    return this.request('/trajectory/analyze', {
      method: 'POST',
      body: JSON.stringify(trajectory),
    });
  }

  async downloadTrajectory(trajectory: WellTrajectory, filename: string): Promise<void> {
    try {
      const blob = await this.exportTrajectory(trajectory);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Error downloading trajectory
      throw error;
    }
  }
}

export const wellProfileService = new WellProfileServiceFallback();
