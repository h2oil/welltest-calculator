import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UNIT_GROUPS, getUnitSymbol } from '@/lib/unit-conversions-enhanced';

interface UnitSelectorProps {
  value: string;
  onChange: (unit: string) => void;
  group: keyof typeof UNIT_GROUPS;
  className?: string;
}

const UnitSelector = ({ value, onChange, group, className }: UnitSelectorProps) => {
  const units = UNIT_GROUPS[group];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-20 h-8 ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {units.map((unit) => (
          <SelectItem key={unit} value={unit}>
            {getUnitSymbol(unit)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UnitSelector;
