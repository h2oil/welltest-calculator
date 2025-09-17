// Local Storage Utilities for Well Testing App

import type { CalculationSession, UnitSystem } from '@/types/well-testing';

const STORAGE_KEYS = {
  UNIT_SYSTEM: 'well-testing-unit-system',
  SESSION_DATA: 'well-testing-session',
  NOTES: 'well-testing-notes',
  STANDARD_CONDITIONS: 'well-testing-standard-conditions'
};

// Unit System Persistence
export const getStoredUnitSystem = (): UnitSystem => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UNIT_SYSTEM);
    return (stored as UnitSystem) || 'field';
  } catch {
    return 'field';
  }
};

export const storeUnitSystem = (unitSystem: UnitSystem): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.UNIT_SYSTEM, unitSystem);
  } catch (error) {
    console.warn('Failed to store unit system:', error);
  }
};

// Session Data Persistence
export const getStoredSession = (): Partial<CalculationSession> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const storeSession = (session: Partial<CalculationSession>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to store session:', error);
  }
};

// Notes Persistence
export const getStoredNotes = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const storeNotes = (notes: Record<string, string>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (error) {
    console.warn('Failed to store notes:', error);
  }
};

// Export Session as JSON
export const exportSessionToJSON = (session: CalculationSession): string => {
  return JSON.stringify({
    ...session,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }, null, 2);
};

// Import Session from JSON
export const importSessionFromJSON = (jsonString: string): CalculationSession | null => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};

// Copy Results to Clipboard
export const copyResultsToClipboard = async (results: Record<string, unknown>, calculatorName: string): Promise<boolean> => {
  try {
    const formattedResults = formatResultsForClipboard(results, calculatorName);
    await navigator.clipboard.writeText(formattedResults);
    return true;
  } catch {
    return false;
  }
};

// Format results for clipboard
const formatResultsForClipboard = (results: Record<string, unknown>, calculatorName: string): string => {
  const timestamp = new Date().toLocaleString();
  let output = `H2Oil Well Testing - ${calculatorName}\n`;
  output += `Generated: ${timestamp}\n`;
  output += `${'='.repeat(50)}\n\n`;

  // Format based on calculator type
  switch (calculatorName) {
    case 'Daniel Orifice Calc':
      output += `Mass Flow: ${results.massFlow?.toFixed(3)} kg/s\n`;
      output += `Volumetric Flow: ${results.volumetricFlow?.toFixed(3)} m³/s\n`;
      output += `Standard Flow: ${results.standardFlow?.toFixed(3)} MMSCFD\n`;
      output += `Reynolds Number: ${results.reynoldsNumber?.toFixed(0)}\n`;
      if (results.warnings?.length > 0) {
        output += `\nWarnings:\n${results.warnings.join('\n')}\n`;
      }
      break;
    
    case 'Choke Rate Estimates':
      output += `Mass Flow: ${results.massFlow?.toFixed(3)} kg/s\n`;
      output += `Volumetric Flow: ${results.volumetricFlow?.toFixed(3)} m³/s\n`;
      output += `Standard Flow: ${results.standardFlow?.toFixed(3)} MMSCFD\n`;
      output += `Flow Regime: ${results.flowRegime}\n`;
      output += `Mach Number: ${results.machNumber?.toFixed(3)}\n`;
      break;
    
    case 'Critical Flow':
      output += `Critical Ratio: ${results.criticalRatio?.toFixed(4)}\n`;
      output += `Flow Regime: ${results.regime}\n`;
      output += `Mass Flow: ${results.massFlow?.toFixed(3)} kg/s\n`;
      output += `Speed of Sound: ${results.speedOfSound?.toFixed(1)} m/s\n`;
      break;
    
    case 'GOR² Calcs':
      if (results.producedGOR) {
        output += `Produced GOR: ${results.producedGOR.toFixed(1)} scf/STB\n`;
      }
      if (results.solutionGOR) {
        output += `Solution GOR: ${results.solutionGOR.toFixed(1)} scf/STB\n`;
      }
      if (results.bubblePointPressure) {
        output += `Bubble Point Pressure: ${results.bubblePointPressure.toFixed(1)} psia\n`;
      }
      break;
    
    case 'Gas Velocity':
      output += `Velocity: ${results.velocity?.toFixed(2)} m/s\n`;
      output += `Mach Number: ${results.machNumber?.toFixed(3)}\n`;
      output += `Erosional Velocity: ${results.erosionalVelocity?.toFixed(2)} m/s\n`;
      output += `Erosional Check: ${results.passFailFlags?.erosionalVelocity ? 'PASS' : 'FAIL'}\n`;
      output += `Mach Check: ${results.passFailFlags?.machNumber ? 'PASS' : 'FAIL'}\n`;
      break;
  }

  return output;
};

// Clear all stored data
export const clearAllStoredData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear stored data:', error);
  }
};