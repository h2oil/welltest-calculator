// Well Information Types for H2Oil Complete
import type { UnitSystem } from './open-prosper';

export interface WellInfo {
  // Basic Information
  projectName: string;
  wellName: string;
  clientName?: string;
  locationName?: string;
  country?: string;
  stateProvince?: string;
  
  // Geographic Information
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  
  // Well Details
  wellType: 'production' | 'injection' | 'disposal' | 'exploration' | 'appraisal';
  operatorName?: string;
  fieldName?: string;
  reservoirName?: string;
  
  // Dates
  spudDate?: Date;
  completionDate?: Date;
  
  // Depths
  totalDepth?: number;
  measuredDepth?: number;
  trueVerticalDepth?: number;
  
  // System
  unitSystem: UnitSystem;
  
  // Additional Data
  projectData?: Record<string, any>;
  isTemplate?: boolean;
  templateName?: string;
}

export interface WellProject {
  id: string;
  userId: string;
  wellInfo: WellInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface WellConfiguration {
  id: string;
  projectId: string;
  userId: string;
  configurationName: string;
  configurationData: Record<string, any>;
  calculationResults?: Record<string, any>;
  lastCalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  wellInfo: Partial<WellInfo>;
  isSystemTemplate: boolean;
  createdAt: Date;
}

// Form validation
export interface WellInfoValidation {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// Country and state options
export interface CountryOption {
  code: string;
  name: string;
  states?: StateOption[];
}

export interface StateOption {
  code: string;
  name: string;
}

// Well type options
export const WELL_TYPES = [
  { value: 'production', label: 'Production Well' },
  { value: 'injection', label: 'Injection Well' },
  { value: 'disposal', label: 'Disposal Well' },
  { value: 'exploration', label: 'Exploration Well' },
  { value: 'appraisal', label: 'Appraisal Well' }
] as const;

// Common countries for dropdown
export const COMMON_COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States', states: [
    { code: 'TX', name: 'Texas' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CA', name: 'California' },
    { code: 'AK', name: 'Alaska' }
  ]},
  { code: 'CA', name: 'Canada', states: [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'MB', name: 'Manitoba' }
  ]},
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NO', name: 'Norway' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AU', name: 'Australia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'OM', name: 'Oman' }
];
