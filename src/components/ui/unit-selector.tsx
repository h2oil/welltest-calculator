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
];