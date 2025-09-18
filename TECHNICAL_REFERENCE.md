# Technical Reference Guide - H2Oil Well Testing Calculator

## 🔧 CRITICAL CODE PATTERNS

### 1. Velocity Calculation Pattern
**Location**: `src/lib/flow-assurance-engine.ts`

**Current Issue**: Incorrect velocity calculation
```typescript
// ❌ WRONG - Current implementation
const velocity = upstreamState.q_actual_m3_s / area;

// ✅ CORRECT - Should be implemented
const gasRate = fluid.gasRate_m3_s || 0;
const oilRate = fluid.oilRate_m3_s || 0;
const waterRate = fluid.waterRate_m3_s || 0;
const totalFlowRate = calculateTotalFlowRate(gasRate, oilRate, waterRate, fluid);
const velocity = calculateVelocity(totalFlowRate, segment.id_inner_m);
```

**Functions to Use**:
```typescript
// Already implemented in flow-assurance-engine.ts
export function calculateTotalFlowRate(
  gasRate_m3_s: number,
  oilRate_m3_s: number,
  waterRate_m3_s: number,
  fluid: FluidSpec
): number

export function calculateVelocity(
  totalFlowRate_m3_s: number,
  pipeId_m: number
): number
```

### 2. Unit Conversion Auto-Update Pattern
**Location**: Multiple calculator components

**Current Issue**: Values reset to defaults when switching unit systems

**Required Implementation**:
```typescript
// Add to each calculator component
const [prevUnitSystem, setPrevUnitSystem] = useState(unitSystem);

useEffect(() => {
  if (prevUnitSystem !== unitSystem) {
    // Convert existing values instead of resetting
    const convertedInputs = convertInputsToNewUnitSystem(inputs, prevUnitSystem, unitSystem);
    setInputs(convertedInputs);
    setPrevUnitSystem(unitSystem);
  }
}, [unitSystem, inputs, prevUnitSystem]);
```

**Helper Function**:
```typescript
const convertInputsToNewUnitSystem = (
  inputs: any,
  fromSystem: UnitSystem,
  toSystem: UnitSystem
) => {
  const converted = { ...inputs };
  
  // Convert each field based on its unit type
  Object.keys(converted).forEach(key => {
    if (typeof converted[key] === 'number' && key !== 'id') {
      const siValue = convertToSI(converted[key], getUnitFromKey(key, fromSystem));
      converted[key] = convertFromSI(siValue, getUnitFromKey(key, toSystem));
    }
  });
  
  return converted;
};
```

### 3. Flare2DViewer Performance Pattern
**Location**: `src/components/ui/Flare2DViewer.tsx`

**Current Issues**: Heavy canvas operations, memory leaks

**Required Optimizations**:
```typescript
// Wrap component in React.memo
const Flare2DViewer = React.memo<Flare2DViewerProps>(({ ...props }) => {
  // Use useCallback for event handlers
  const handleMouseMove = useCallback((event: MouseEvent) => {
    // Optimized mouse handling
  }, [dependencies]);

  // Use requestAnimationFrame for smooth animations
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      drawCanvas();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [dependencies]);

  // Memoize expensive calculations
  const processedContours = useMemo(() => {
    return processContours();
  }, [radiationContours, noiseContours, selectedRadiationContours, selectedNoiseContours]);
});
```

### 4. Code Splitting Pattern
**Location**: `src/components/WellTestingApp.tsx`

**Current Issue**: All calculators loaded simultaneously

**Required Implementation**:
```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const FlareRadiationCalculator = lazy(() => import('./calculators/FlareRadiationCalculatorEnhanced'));
const FlowAssuranceCalculator = lazy(() => import('./calculators/FlowAssuranceEnhanced'));
const GasVelocityCalculatorV2 = lazy(() => import('./calculators/GasVelocityCalculatorV2'));

// Loading component
const CalculatorSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-muted animate-pulse rounded" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64 bg-muted animate-pulse rounded" />
      <div className="h-64 bg-muted animate-pulse rounded" />
    </div>
  </div>
);

// Usage in TabsContent
<TabsContent value="flare-radiation" className="space-y-6">
  <Suspense fallback={<CalculatorSkeleton />}>
    <FlareRadiationCalculator unitSystem={unitSystem} />
  </Suspense>
</TabsContent>
```

## 📊 DATA STRUCTURES

### FluidSpec Interface
**Location**: `src/types/well-testing.ts`

```typescript
export interface FluidSpec {
  kind: FluidKind;
  P_in_kPa: number;  // wellhead pressure
  T_K: number;
  Z?: number;        // default 1.0
  k?: number;        // Cp/Cv; default 1.30 for gas
  MW_kg_per_kmol?: number; // gas; default 18.2
  rho_liq_kg_per_m3?: number; // liquid density if liquid or two-phase
  mu_Pa_s?: number; // optional viscosity
  gamma_g?: number; // optional gas SG
  watercut_frac?: number; // for two-phase helper calcs
  q_std: { unit: "MSCFD"|"Sm3/d"|"STB/d"; value: number }; // standard flow
  // Additional flow rates for multi-phase calculations
  gasRate_m3_s?: number; // actual gas flow rate
  oilRate_m3_s?: number; // actual oil flow rate
  waterRate_m3_s?: number; // actual water flow rate
}
```

### NetworkResult Interface
**Location**: `src/types/well-testing.ts`

```typescript
export interface NetworkResult {
  nodes: NodeState[];
  segments: SegmentResult[];
  converged: boolean;
  iterations: number;
  totalDrawdown_kPa: number;
  warnings: string[];
  errors: string[];
}
```

### NodeState Interface
**Location**: `src/types/well-testing.ts`

```typescript
export interface NodeState {
  id: string;
  kind: NodeKind;
  pressure_kPa: number;
  temperature_K: number;
  density_kg_m3: number;
  q_actual_m3_s: number;
  mdot_kg_s: number;
  velocity_m_s: number;
  machNumber?: number;
  reynoldsNumber?: number;
  erosionalVelocity_m_s?: number;
  erosionalCheck?: boolean;
  machCheck?: boolean;
}
```

## 🧮 CALCULATION FORMULAS

### Velocity Calculation
```typescript
// Multi-phase velocity calculation
const calculateVelocity = (totalFlowRate_m3_s: number, pipeId_m: number): number => {
  const area = Math.PI * Math.pow(pipeId_m / 2, 2);
  return totalFlowRate_m3_s / area;
};

// Total flow rate calculation
const calculateTotalFlowRate = (
  gasRate_m3_s: number,
  oilRate_m3_s: number,
  waterRate_m3_s: number,
  fluid: FluidSpec
): number => {
  if (fluid.kind === 'gas') {
    return gasRate_m3_s;
  } else if (fluid.kind === 'liquid') {
    return oilRate_m3_s + waterRate_m3_s;
  } else {
    // Two-phase: return total of all phases
    return gasRate_m3_s + oilRate_m3_s + waterRate_m3_s;
  }
};
```

### Discharge Coefficient Calculation
```typescript
// Fixed bean choke
export function calculateDischargeCoefficient(
  chokeSizeInches: number,
  chokeType: 'fixed-bean' | 'adjustable' = 'fixed-bean'
): number {
  if (chokeType === 'fixed-bean') {
    // Industry correlation based on choke size
    if (chokeSizeInches <= 0.125) return 0.60;
    else if (chokeSizeInches <= 0.25) return 0.65;
    else if (chokeSizeInches <= 0.375) return 0.70;
    else if (chokeSizeInches <= 0.5) return 0.75;
    else if (chokeSizeInches <= 0.625) return 0.80;
    else if (chokeSizeInches <= 0.75) return 0.82;
    else if (chokeSizeInches <= 1.0) return 0.85;
    else if (chokeSizeInches <= 1.25) return 0.87;
    else if (chokeSizeInches <= 1.5) return 0.88;
    else if (chokeSizeInches <= 2.0) return 0.89;
    else return 0.90;
  }
  return 0.82; // Default for adjustable
}

// Adjustable choke
export function calculateAdjustableChokeCd(percentOpen: number): number {
  if (percentOpen <= 10) return 0.50;
  else if (percentOpen <= 20) return 0.60;
  else if (percentOpen <= 30) return 0.68;
  else if (percentOpen <= 40) return 0.74;
  else if (percentOpen <= 50) return 0.78;
  else if (percentOpen <= 60) return 0.81;
  else if (percentOpen <= 70) return 0.83;
  else if (percentOpen <= 80) return 0.85;
  else if (percentOpen <= 90) return 0.86;
  else return 0.87;
}
```

## 🎨 UI COMPONENT PATTERNS

### Input with Unit Selector
```typescript
const InputWithUnit = ({ 
  value, 
  onChange, 
  unit, 
  onUnitChange, 
  label, 
  type = "number" 
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex space-x-2">
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1"
      />
      <Select value={unit} onValueChange={onUnitChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getAvailableUnits(fieldType).map(unit => (
            <SelectItem key={unit} value={unit}>
              {unit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);
```

### Error Boundary Pattern
```typescript
class CalculationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Calculation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Calculation Error</AlertTitle>
          <AlertDescription>
            An error occurred during calculation. Please check your inputs and try again.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

## 🔍 DEBUGGING UTILITIES

### Performance Monitoring
```typescript
// Add to components for performance monitoring
const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    };
  });
};
```

### Memory Leak Detection
```typescript
// Add to useEffect cleanup
useEffect(() => {
  const cleanup = () => {
    // Cleanup logic
  };
  
  return cleanup;
}, [dependencies]);
```

### Bundle Size Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Check specific chunks
npx vite-bundle-analyzer dist
```

## 📱 RESPONSIVE DESIGN PATTERNS

### Mobile-First Grid
```typescript
const ResponsiveGrid = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {children}
  </div>
);
```

### Touch-Friendly Controls
```typescript
const TouchButton = ({ onClick, children, ...props }) => (
  <Button
    onClick={onClick}
    className="min-h-[44px] min-w-[44px] touch-manipulation"
    {...props}
  >
    {children}
  </Button>
);
```

## 🧪 TESTING PATTERNS

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { calculateVelocity } from '@/lib/flow-assurance-engine';

describe('calculateVelocity', () => {
  it('should calculate velocity correctly', () => {
    const flowRate = 0.1; // m³/s
    const pipeId = 0.1; // m
    const expected = flowRate / (Math.PI * Math.pow(pipeId / 2, 2));
    
    expect(calculateVelocity(flowRate, pipeId)).toBeCloseTo(expected, 3);
  });
});
```

### Component Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Flare2DViewer } from '@/components/ui/Flare2DViewer';

describe('Flare2DViewer', () => {
  it('should render without crashing', () => {
    render(<Flare2DViewer {...mockProps} />);
    expect(screen.getByRole('canvas')).toBeInTheDocument();
  });
});
```

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Run `npm run build` successfully
- [ ] Check bundle size < 400kB
- [ ] Run `npm run lint` with no errors
- [ ] Test all calculators function correctly
- [ ] Verify mobile responsiveness
- [ ] Check export/import functionality

### Post-Deployment
- [ ] Monitor Vercel Speed Insights
- [ ] Check for console errors
- [ ] Verify all calculations work
- [ ] Test on different devices/browsers

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: AI Assistant
