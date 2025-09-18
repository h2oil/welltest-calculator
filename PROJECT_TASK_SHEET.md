# H2Oil Well Testing Calculator - Project Task Sheet

## 📋 PROJECT OVERVIEW

**Project Name**: H2Oil Well Testing Calculator  
**Technology Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Radix UI  
**Current Version**: 0.0.0  
**Last Updated**: January 2025  
**Primary Purpose**: Professional engineering calculator suite for well testing operations

## 🏗️ ARCHITECTURE OVERVIEW

### Core Components Structure
```
src/
├── components/
│   ├── calculators/           # 9 specialized calculators
│   │   ├── DanielOrificeCalculator.tsx
│   │   ├── ChokeRateCalculator.tsx
│   │   ├── CriticalFlowCalculator.tsx
│   │   ├── GORCalculator.tsx
│   │   ├── GasVelocityCalculatorV2.tsx
│   │   ├── APIGravityCalculator.tsx
│   │   ├── FlareRadiationCalculatorEnhanced.tsx  # ⚠️ COMPLEX
│   │   ├── FlowAssuranceCalculator.tsx
│   │   └── UnitConverter.tsx
│   ├── ui/                   # Reusable UI components
│   │   ├── Flare2DViewer.tsx # ⚠️ PERFORMANCE CRITICAL
│   │   ├── ProcessFlowDiagram.tsx
│   │   └── [40+ other UI components]
│   └── WellTestingApp.tsx    # Main app container
├── lib/                      # Core business logic
│   ├── well-calculations.ts  # Main calculation engine
│   ├── flow-assurance-engine.ts # Advanced flow modeling
│   ├── unit-conversions.ts   # Unit conversion system
│   ├── unit-conversions-enhanced.ts # Enhanced unit system
│   └── storage.ts            # Data persistence
├── types/
│   └── well-testing.ts       # TypeScript definitions
└── pages/                    # Route components
```

### Data Flow Pattern
```
WellTestingApp (unitSystem) 
    ↓
Calculator Component (props)
    ↓
Calculation Engine (lib/)
    ↓
UI Components (display)
    ↓
Local Storage (persistence)
```

## 🚨 CRITICAL ISSUES & STATUS

### 1. PERFORMANCE ISSUES
- **Bundle Size**: 699.10 kB (195.07 kB gzipped) - EXCEEDS 500kB WARNING
- **Root Cause**: All calculators loaded simultaneously, no code splitting
- **Impact**: Slow initial load, poor mobile performance
- **Priority**: HIGH
- **Status**: PENDING

### 2. VELOCITY CALCULATION BUGS
- **Location**: `src/lib/flow-assurance-engine.ts` + `src/components/calculators/FlowAssuranceEnhanced.tsx`
- **Issue**: Incorrect velocity calculation, not using actual flow rates + pipe ID
- **Current Code**:
  ```typescript
  // WRONG - in solveNetwork function
  const velocity = upstreamState.q_actual_m3_s / area;
  ```
- **Should Be**:
  ```typescript
  const totalFlowRate = calculateTotalFlowRate(gasRate, oilRate, waterRate, fluid);
  const velocity = calculateVelocity(totalFlowRate, segment.id_inner_m);
  ```
- **Priority**: CRITICAL
- **Status**: PARTIALLY FIXED (functions added, not fully integrated)

### 3. FLARE2DVIEWER PERFORMANCE
- **Location**: `src/components/ui/Flare2DViewer.tsx` (1424 lines)
- **Issues**: Heavy canvas operations, memory leaks, poor mobile experience
- **Priority**: HIGH
- **Status**: PENDING

### 4. UNIT CONVERSION INCONSISTENCIES
- **Issue**: Input values reset to defaults when switching unit systems
- **Location**: Multiple calculator components
- **Priority**: MEDIUM
- **Status**: PARTIALLY FIXED

## 📝 DETAILED TASK BREAKDOWN

### Phase 1: Critical Fixes (IMMEDIATE)

#### Task 1.1: Fix Velocity Calculation
**Files to Modify**:
- `src/lib/flow-assurance-engine.ts`
- `src/components/calculators/FlowAssuranceEnhanced.tsx`

**Current State**:
- ✅ `calculateTotalFlowRate()` function added
- ✅ `calculateVelocity()` function added
- ✅ `FluidSpec` updated with `gasRate_m3_s`, `oilRate_m3_s`, `waterRate_m3_s`
- ❌ Not fully integrated in `solveNetwork()` function

**Required Changes**:
```typescript
// In solveNetwork() function, replace:
const velocity = upstreamState.q_actual_m3_s / area;

// With:
const gasRate = fluid.gasRate_m3_s || 0;
const oilRate = fluid.oilRate_m3_s || 0;
const waterRate = fluid.waterRate_m3_s || 0;
const totalFlowRate = calculateTotalFlowRate(gasRate, oilRate, waterRate, fluid);
const velocity = calculateVelocity(totalFlowRate, segment.id_inner_m);
```

#### Task 1.2: Fix Unit Conversion Auto-Update
**Files to Modify**:
- `src/components/calculators/FlareRadiationCalculatorEnhanced.tsx`
- `src/components/calculators/FlowAssuranceEnhanced.tsx`

**Required Pattern**:
```typescript
// Add useEffect for unit system changes
useEffect(() => {
  if (prevUnitSystem !== unitSystem) {
    // Convert existing values instead of resetting
    const convertedInputs = convertInputsToNewUnitSystem(inputs, prevUnitSystem, unitSystem);
    setInputs(convertedInputs);
  }
}, [unitSystem]);
```

### Phase 2: Performance Optimization (WEEK 2)

#### Task 2.1: Implement Code Splitting
**Files to Modify**:
- `src/components/WellTestingApp.tsx`
- `src/main.tsx`

**Implementation**:
```typescript
// Replace direct imports with lazy loading
const FlareRadiationCalculator = lazy(() => import('./calculators/FlareRadiationCalculatorEnhanced'));
const FlowAssuranceCalculator = lazy(() => import('./calculators/FlowAssuranceEnhanced'));

// Wrap in Suspense
<Suspense fallback={<CalculatorSkeleton />}>
  <FlareRadiationCalculator unitSystem={unitSystem} />
</Suspense>
```

#### Task 2.2: Optimize Bundle Size
**Files to Modify**:
- `vite.config.ts`

**Configuration**:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'calculation-engine': ['./src/lib/well-calculations.ts', './src/lib/flow-assurance-engine.ts'],
          'ui-components': ['./src/components/ui'],
          'three-js': ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  }
});
```

#### Task 2.3: Optimize Flare2DViewer
**Files to Modify**:
- `src/components/ui/Flare2DViewer.tsx`

**Required Changes**:
- Add `React.memo()` wrapper
- Use `useCallback()` for event handlers
- Implement `requestAnimationFrame` for smooth animations
- Add proper cleanup in `useEffect`

### Phase 3: Architecture Improvements (WEEK 3)

#### Task 3.1: Centralized State Management
**New Files to Create**:
- `src/store/useAppStore.ts` (Zustand store)
- `src/hooks/useCalculations.ts` (Custom hook)

**Store Structure**:
```typescript
interface AppStore {
  unitSystem: UnitSystem;
  calculations: Record<string, CalculationState>;
  ui: {
    activeTab: string;
    selectedNode: string | null;
  };
  // Actions
  setUnitSystem: (system: UnitSystem) => void;
  updateCalculation: (id: string, data: any) => void;
  resetCalculation: (id: string) => void;
}
```

#### Task 3.2: Refactor Calculation Engines
**Files to Modify**:
- `src/lib/well-calculations.ts`
- `src/lib/flow-assurance-engine.ts`

**Pattern**:
- Extract pure calculation functions
- Add comprehensive input validation
- Implement consistent error handling
- Add JSDoc documentation

### Phase 4: Testing & Quality (WEEK 4)

#### Task 4.1: Add Unit Tests
**New Files to Create**:
- `src/__tests__/calculations.test.ts`
- `src/__tests__/unit-conversions.test.ts`
- `src/__tests__/components/Flare2DViewer.test.tsx`

**Test Coverage Goals**:
- Calculation functions: 100%
- UI components: 80%
- Integration tests: 60%

#### Task 4.2: Type Safety Improvements
**Files to Modify**:
- `src/types/well-testing.ts`

**Required Additions**:
```typescript
// Strict unit system types
type UnitSystem = 'metric' | 'field';
type UnitType = 'length' | 'pressure' | 'temperature' | 'flow' | 'velocity';

// Enhanced calculation result types
interface CalculationResult<T> {
  data: T;
  errors: string[];
  warnings: string[];
  metadata: {
    calculatedAt: Date;
    version: string;
    unitSystem: UnitSystem;
  };
}
```

## 🔧 DEVELOPMENT GUIDELINES

### Code Organization Rules
1. **Single Responsibility**: Each function should do one thing well
2. **Pure Functions**: Calculation functions should be pure (no side effects)
3. **Type Safety**: Use strict TypeScript, avoid `any` types
4. **Error Handling**: Always handle errors gracefully
5. **Performance**: Use React.memo, useCallback, useMemo appropriately

### File Naming Conventions
- **Components**: PascalCase (e.g., `Flare2DViewer.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useCalculations.ts`)
- **Utilities**: camelCase (e.g., `unit-conversions.ts`)
- **Types**: camelCase with descriptive names (e.g., `well-testing.ts`)

### Import Organization
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { Card, CardContent } from '@/components/ui/card';

// 3. Internal utilities
import { calculateFlareRadiation } from '@/lib/well-calculations';

// 4. Types
import type { FlareRadiationInputs } from '@/types/well-testing';
```

## 📚 KEY REFERENCES & DEPENDENCIES

### Critical Dependencies
- **React 18.3.1**: Core framework
- **TypeScript 5.8.3**: Type safety
- **Vite 5.4.19**: Build tool
- **Tailwind CSS 3.4.17**: Styling
- **Radix UI**: Accessible components
- **Three.js 0.158.0**: 3D graphics (performance concern)

### Calculation References
- **API Standard 521**: Flare radiation calculations
- **API RP 14E**: Erosional velocity limits
- **Darcy-Weisbach**: Pressure drop calculations
- **Beggs-Brill**: Two-phase flow correlations

### Performance Targets
- **Bundle Size**: < 400kB (currently 699kB)
- **Load Time**: < 3 seconds on 3G
- **Runtime**: 60fps for canvas operations
- **Memory**: < 100MB heap usage

## 🚀 QUICK START INSTRUCTIONS

### When Resuming Work:
1. **Read this file first** - Understand current state and priorities
2. **Check git status** - See what's been changed
3. **Run `npm run build`** - Check for build errors
4. **Start with Phase 1 tasks** - Fix critical issues first
5. **Test thoroughly** - Each change should be tested

### Development Workflow:
```bash
# 1. Start development server
npm run dev

# 2. Check for linting errors
npm run lint

# 3. Build and test
npm run build

# 4. Check bundle size
npm run build -- --analyze
```

### Testing Checklist:
- [ ] All calculators load without errors
- [ ] Unit conversions work correctly
- [ ] Calculations update in real-time
- [ ] Mobile responsiveness works
- [ ] Export/import functions work
- [ ] No console errors

## 🔍 DEBUGGING GUIDE

### Common Issues & Solutions

#### Issue: "Cannot read properties of undefined"
**Location**: Usually in Flare2DViewer or calculation functions
**Solution**: Add null checks and default values
```typescript
// Instead of:
const value = data.property.subProperty;

// Use:
const value = data?.property?.subProperty ?? defaultValue;
```

#### Issue: Bundle size too large
**Solution**: Implement code splitting and lazy loading
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### Issue: Performance problems in Flare2DViewer
**Solution**: Optimize canvas operations
```typescript
// Use requestAnimationFrame
const animate = () => {
  drawCanvas();
  requestAnimationFrame(animate);
};
```

### Performance Monitoring
- Use React DevTools Profiler
- Monitor bundle size with `npm run build`
- Check memory usage in browser dev tools
- Use Vercel Speed Insights for real-world performance

## 📋 CURRENT TODO LIST

### Immediate (This Week)
- [ ] Fix velocity calculation in Flow Assurance Calculator
- [ ] Implement proper multi-phase flow support
- [ ] Add error boundaries for better error handling
- [ ] Fix unit conversion auto-update

### Short Term (Next 2 Weeks)
- [ ] Implement code splitting for calculators
- [ ] Optimize Flare2DViewer performance
- [ ] Add responsive design improvements
- [ ] Implement centralized state management

### Long Term (Next Month)
- [ ] Add comprehensive testing suite
- [ ] Implement accessibility improvements
- [ ] Add advanced calculation features
- [ ] Optimize for mobile devices

## 🎯 SUCCESS METRICS

### Performance Targets
- Bundle size: < 400kB (currently 699kB)
- Load time: < 3 seconds
- Runtime performance: 60fps
- Memory usage: < 100MB

### Quality Targets
- TypeScript coverage: 100%
- Test coverage: 80%
- Accessibility: WCAG 2.1 AA
- Mobile responsiveness: 100%

### User Experience Targets
- Zero calculation errors
- Real-time updates
- Intuitive navigation
- Professional appearance

---

**Last Updated**: January 2025  
**Next Review**: After Phase 1 completion  
**Maintainer**: AI Assistant  
**Version**: 1.0.0
