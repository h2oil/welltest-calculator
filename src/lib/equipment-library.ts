// Equipment Library for Flow Assurance Model
import type { EquipmentModel } from '@/types/well-testing';

export const EQUIPMENT_LIBRARY: EquipmentModel[] = [
  // ESD/SSV Equipment
  {
    id: 'esd_001',
    type: 'esd',
    name: 'Emergency Shutdown Valve',
    manufacturer: 'Cameron',
    model: 'ESD-6',
    parameters: {
      cv: 120,
      minOpening: 10,
      maxPressure: 10000,
      temperature: 150
    },
    calculationMethod: 'cv_based',
    description: '6" Emergency Shutdown Valve with quick-close actuator'
  },
  {
    id: 'esd_002',
    type: 'esd',
    name: 'Surface Safety Valve',
    manufacturer: 'Baker Hughes',
    model: 'SSV-8',
    parameters: {
      cv: 200,
      minOpening: 5,
      maxPressure: 15000,
      temperature: 200
    },
    calculationMethod: 'cv_based',
    description: '8" Surface Safety Valve with fail-safe close'
  },
  {
    id: 'esd_003',
    type: 'esd',
    name: 'Emergency Shutdown Valve',
    manufacturer: 'Schlumberger',
    model: 'ESD-4',
    parameters: {
      cv: 80,
      minOpening: 15,
      maxPressure: 8000,
      temperature: 120
    },
    calculationMethod: 'cv_based',
    description: '4" Emergency Shutdown Valve for high-pressure applications'
  },

  // Sand Filter Equipment
  {
    id: 'filter_001',
    type: 'filter',
    name: 'Cartridge Sand Filter',
    manufacturer: 'Pall',
    model: 'SF-100',
    parameters: {
      cleanDP: 0.1,
      foulingFactor: 1.0,
      maxFlow: 50,
      efficiency: 99.5
    },
    calculationMethod: 'fouling_based',
    description: '100 micron cartridge sand filter with high efficiency'
  },
  {
    id: 'filter_002',
    type: 'filter',
    name: 'Cyclone Sand Filter',
    manufacturer: 'Schlumberger',
    model: 'CSF-200',
    parameters: {
      cleanDP: 0.05,
      foulingFactor: 1.2,
      maxFlow: 100,
      efficiency: 95.0
    },
    calculationMethod: 'fouling_based',
    description: '200 micron cyclone sand filter for high flow rates'
  },
  {
    id: 'filter_003',
    type: 'filter',
    name: 'Multi-Cyclone Filter',
    manufacturer: 'Baker Hughes',
    model: 'MCF-150',
    parameters: {
      cleanDP: 0.08,
      foulingFactor: 1.1,
      maxFlow: 75,
      efficiency: 98.0
    },
    calculationMethod: 'fouling_based',
    description: '150 micron multi-cyclone filter with enhanced separation'
  },

  // Choke Equipment
  {
    id: 'choke_001',
    type: 'choke',
    name: 'Fixed Bean Choke',
    manufacturer: 'Cameron',
    model: 'FBC-32',
    parameters: {
      beanSize: 32,
      cv: 25,
      maxPressure: 10000,
      criticalRatio: 0.528
    },
    calculationMethod: 'bean_size',
    description: '32/64" fixed bean choke for critical flow control'
  },
  {
    id: 'choke_002',
    type: 'choke',
    name: 'Adjustable Choke',
    manufacturer: 'Baker Hughes',
    model: 'AC-50',
    parameters: {
      maxCv: 50,
      minCv: 5,
      maxPressure: 15000,
      criticalRatio: 0.528
    },
    calculationMethod: 'adjustable_cv',
    description: 'Adjustable choke with 10:1 turndown ratio'
  },
  {
    id: 'choke_003',
    type: 'choke',
    name: 'Fixed Bean Choke',
    manufacturer: 'Schlumberger',
    model: 'FBC-48',
    parameters: {
      beanSize: 48,
      cv: 40,
      maxPressure: 8000,
      criticalRatio: 0.528
    },
    calculationMethod: 'bean_size',
    description: '48/64" fixed bean choke for high flow applications'
  },

  // Heater Equipment
  {
    id: 'heater_001',
    type: 'heater',
    name: 'Tube Bundle Heater',
    manufacturer: 'Cameron',
    model: 'TBH-500',
    parameters: {
      ua: 1000,
      maxDuty: 500,
      passes: 4,
      maxPressure: 5000,
      maxTemperature: 200
    },
    calculationMethod: 'ua_based',
    description: '500 kW tube bundle heater with 4-pass design'
  },
  {
    id: 'heater_002',
    type: 'heater',
    name: 'Coil Heater',
    manufacturer: 'Baker Hughes',
    model: 'CH-300',
    parameters: {
      ua: 600,
      maxDuty: 300,
      passes: 2,
      maxPressure: 3000,
      maxTemperature: 150
    },
    calculationMethod: 'ua_based',
    description: '300 kW coil heater for moderate heating requirements'
  },
  {
    id: 'heater_003',
    type: 'heater',
    name: 'Shell & Tube Heater',
    manufacturer: 'Schlumberger',
    model: 'STH-750',
    parameters: {
      ua: 1500,
      maxDuty: 750,
      passes: 6,
      maxPressure: 7000,
      maxTemperature: 250
    },
    calculationMethod: 'ua_based',
    description: '750 kW shell & tube heater for high-capacity heating'
  },

  // Separator Equipment
  {
    id: 'separator_001',
    type: 'separator',
    name: '2-Phase Separator',
    manufacturer: 'Cameron',
    model: '2PS-1000',
    parameters: {
      capacity: 1000,
      maxPressure: 1000,
      residenceTime: 5,
      efficiency: 99.0
    },
    calculationMethod: 'capacity_based',
    description: '1000 bbl 2-phase separator for gas-liquid separation'
  },
  {
    id: 'separator_002',
    type: 'separator',
    name: '3-Phase Separator',
    manufacturer: 'Baker Hughes',
    model: '3PS-1500',
    parameters: {
      capacity: 1500,
      maxPressure: 1500,
      residenceTime: 8,
      efficiency: 98.5
    },
    calculationMethod: 'capacity_based',
    description: '1500 bbl 3-phase separator for gas-oil-water separation'
  },
  {
    id: 'separator_003',
    type: 'separator',
    name: 'Atmospheric Separator',
    manufacturer: 'Schlumberger',
    model: 'AS-500',
    parameters: {
      capacity: 500,
      maxPressure: 100,
      residenceTime: 3,
      efficiency: 95.0
    },
    calculationMethod: 'capacity_based',
    description: '500 bbl atmospheric separator for low-pressure applications'
  },

  // Flare Stack Equipment
  {
    id: 'flare_001',
    type: 'flare',
    name: 'Elevated Flare Stack',
    manufacturer: 'Cameron',
    model: 'EFS-50',
    parameters: {
      height: 50,
      tipDiameter: 0.5,
      maxFlow: 100,
      maxPressure: 500
    },
    calculationMethod: 'tip_diameter',
    description: '50m elevated flare stack with 0.5m tip diameter'
  },
  {
    id: 'flare_002',
    type: 'flare',
    name: 'Ground Flare',
    manufacturer: 'Baker Hughes',
    model: 'GF-30',
    parameters: {
      height: 30,
      tipDiameter: 0.3,
      maxFlow: 50,
      maxPressure: 300
    },
    calculationMethod: 'tip_diameter',
    description: '30m ground flare with 0.3m tip diameter'
  },
  {
    id: 'flare_003',
    type: 'flare',
    name: 'High-Pressure Flare',
    manufacturer: 'Schlumberger',
    model: 'HPF-75',
    parameters: {
      height: 75,
      tipDiameter: 0.8,
      maxFlow: 200,
      maxPressure: 1000
    },
    calculationMethod: 'tip_diameter',
    description: '75m high-pressure flare with 0.8m tip diameter'
  }
];

export const getEquipmentByType = (type: string): EquipmentModel[] => {
  return EQUIPMENT_LIBRARY.filter(equipment => equipment.type === type);
};

export const getEquipmentById = (id: string): EquipmentModel | undefined => {
  return EQUIPMENT_LIBRARY.find(equipment => equipment.id === id);
};

export const getEquipmentTypes = (): string[] => {
  return [...new Set(EQUIPMENT_LIBRARY.map(equipment => equipment.type))];
};

// Pipe size library
export const PIPE_SIZES = [
  { nominal: '2"', schedule: 'Sch 40', id: 52.5, od: 60.3 },
  { nominal: '2"', schedule: 'Sch 80', id: 49.3, od: 60.3 },
  { nominal: '3"', schedule: 'Sch 40', id: 77.9, od: 88.9 },
  { nominal: '3"', schedule: 'Sch 80', id: 73.7, od: 88.9 },
  { nominal: '4"', schedule: 'Sch 40', id: 102.3, od: 114.3 },
  { nominal: '4"', schedule: 'Sch 80', id: 97.2, od: 114.3 },
  { nominal: '6"', schedule: 'Sch 40', id: 154.1, od: 168.3 },
  { nominal: '6"', schedule: 'Sch 80', id: 146.3, od: 168.3 },
  { nominal: '8"', schedule: 'Sch 40', id: 202.7, od: 219.1 },
  { nominal: '8"', schedule: 'Sch 80', id: 193.7, od: 219.1 },
  { nominal: '10"', schedule: 'Sch 40', id: 254.5, od: 273.0 },
  { nominal: '10"', schedule: 'Sch 80', id: 244.5, od: 273.0 },
  { nominal: '12"', schedule: 'Sch 40', id: 304.8, od: 323.9 },
  { nominal: '12"', schedule: 'Sch 80', id: 292.1, od: 323.9 }
];

export const getPipeById = (nominal: string, schedule: string) => {
  return PIPE_SIZES.find(pipe => pipe.nominal === nominal && pipe.schedule === schedule);
};
