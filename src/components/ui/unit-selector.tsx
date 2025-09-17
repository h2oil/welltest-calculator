import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface UnitSelectorProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export const UnitSelector = ({ 
  label, 
  value, 
  onValueChange, 
  options, 
  className 
}: UnitSelectorProps) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Label className="text-sm text-muted-foreground min-w-fit">{label}:</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-20 h-8 bg-secondary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Predefined unit options
export const PRESSURE_UNITS = [
  { value: 'psia', label: 'psia' },
  { value: 'psig', label: 'psig' },
  { value: 'bar', label: 'bar' },
  { value: 'kPa', label: 'kPa' },
  { value: 'inwg', label: 'inwg' },
  { value: 'atm', label: 'atm' },
];

export const TEMPERATURE_UNITS = [
  { value: 'degF', label: '°F' },
  { value: 'degC', label: '°C' },
  { value: 'K', label: 'K' },
];

export const LENGTH_UNITS = [
  { value: 'in', label: 'in' },
  { value: 'mm', label: 'mm' },
  { value: 'ft', label: 'ft' },
  { value: 'm', label: 'm' },
];

export const FLOW_UNITS = [
  { value: 'MSCFD', label: 'MSCFD' },
  { value: 'MMSCFD', label: 'MMSCFD' },
  { value: 'Sm3d', label: 'Sm³/d' },
  { value: 'Sm3h', label: 'Sm³/h' },
  { value: 'SCFM', label: 'SCFM' },
  { value: 'm3s', label: 'm³/s' },
];

export const MASS_FLOW_UNITS = [
  { value: 'kgs', label: 'kg/s' },
  { value: 'lbmh', label: 'lbm/h' },
];

export const DENSITY_UNITS = [
  { value: 'kgm3', label: 'kg/m³' },
  { value: 'lbmft3', label: 'lbm/ft³' },
];

export const VELOCITY_UNITS = [
  { value: 'ms', label: 'm/s' },
  { value: 'fts', label: 'ft/s' },
];

export const AREA_UNITS = [
  { value: 'in2', label: 'in²' },
  { value: 'm2', label: 'm²' },
  { value: 'mm2', label: 'mm²' },
];

export const VOLUME_UNITS = [
  { value: 'bbl', label: 'bbl' },
  { value: 'gal', label: 'gal' },
  { value: 'L', label: 'L' },
  { value: 'm3', label: 'm³' },
  { value: 'ft3', label: 'ft³' },
];