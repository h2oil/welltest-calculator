import FlowAssuranceEnhanced from './FlowAssuranceEnhanced';
import type { UnitSystem } from '@/types/well-testing';

interface Props {
  unitSystem: UnitSystem;
}

const FlowAssuranceCalculator = ({ unitSystem }: Props) => {
  return <FlowAssuranceEnhanced unitSystem={unitSystem} />;
};

export default FlowAssuranceCalculator;
