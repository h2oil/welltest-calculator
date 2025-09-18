// Well Profile Service - Frontend API client for Python backend
import { WellTrajectory, TrajectoryProfile, TrajectoryPoint } from '@/types/well-trajectory';

const API_BASE_URL = 'http://localhost:8000';

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

class WellProfileService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
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
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/trajectory/load`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async exportTrajectory(trajectory: WellTrajectory, format: string = 'excel'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/trajectory/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trajectory, format }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.blob();
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
      a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading trajectory:', error);
      throw error;
    }
  }
}

export const wellProfileService = new WellProfileService();
