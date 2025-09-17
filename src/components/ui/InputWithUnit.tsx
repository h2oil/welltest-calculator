import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UnitSelector from './UnitSelector';
import { convertBetweenUnits, UNIT_GROUPS } from '@/lib/unit-conversions-enhanced';

interface InputWithUnitProps {
  id: string;
  label: string;
  value: number;
  unit: string;
  onValueChange: (value: number) => void;
  onUnitChange: (unit: string) => void;
  group: keyof typeof UNIT_GROUPS;
  step?: string;
  className?: string;
  error?: string;
}

const InputWithUnit = ({
  id,
  label,
  value,
  unit,
  onValueChange,
  onUnitChange,
  group,
  step = "0.1",
  className = "",
  error
}: InputWithUnitProps) => {
  const handleUnitChange = (newUnit: string) => {
    // Convert value to new unit
    const convertedValue = convertBetweenUnits(value, unit, newUnit);
    onValueChange(convertedValue);
    onUnitChange(newUnit);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="number"
          step={step}
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
          className={`flex-1 ${error ? 'border-red-500' : ''}`}
        />
        <UnitSelector
          value={unit}
          onChange={handleUnitChange}
          group={group}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default InputWithUnit;
