import FlowAssuranceCalculatorSimplified from './FlowAssuranceCalculatorSimplified';
import type { UnitSystem } from '@/types/well-testing';

interface Props {
  unitSystem: UnitSystem;
}

const FlowAssuranceCalculator = ({ unitSystem }: Props) => {
  return <FlowAssuranceCalculatorSimplified unitSystem={unitSystem} />;
};

export default FlowAssuranceCalculator;
