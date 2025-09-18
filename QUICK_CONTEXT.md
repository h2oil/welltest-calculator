# Quick Context Restoration Guide

## 🚨 IMMEDIATE STATUS (January 2025)

### Current Critical Issues
1. **Velocity Calculation Bug** - Flow Assurance Calculator not calculating velocity correctly
2. **Bundle Size Warning** - 699kB exceeds 500kB limit
3. **Flare2DViewer Performance** - Heavy canvas operations causing slowdowns
4. **Unit Conversion Reset** - Inputs reset to defaults when switching units

### Last Working State
- ✅ All 9 calculators load and function
- ✅ Authentication system working
- ✅ Basic calculations working
- ✅ Export/import functionality working
- ❌ Velocity calculation in Flow Assurance needs fix
- ❌ Performance optimizations needed

## 🔧 IMMEDIATE NEXT STEPS

### Step 1: Fix Velocity Calculation (CRITICAL)
**File**: `src/lib/flow-assurance-engine.ts`
**Function**: `solveNetwork()`
**Issue**: Line ~200, velocity calculation using wrong flow rate

**Quick Fix**:
```typescript
// Find this line:
const velocity = upstreamState.q_actual_m3_s / area;

// Replace with:
const gasRate = fluid.gasRate_m3_s || 0;
const oilRate = fluid.oilRate_m3_s || 0;
const waterRate = fluid.waterRate_m3_s || 0;
const totalFlowRate = calculateTotalFlowRate(gasRate, oilRate, waterRate, fluid);
const velocity = calculateVelocity(totalFlowRate, segment.id_inner_m);
```

### Step 2: Test the Fix
```bash
npm run dev
# Navigate to Flow Assurance tab
# Check that velocity values update when changing inputs
```

### Step 3: Check Build
```bash
npm run build
# Should complete without errors
```

## 📁 KEY FILES TO REMEMBER

### Critical Files
- `src/components/WellTestingApp.tsx` - Main app container
- `src/lib/flow-assurance-engine.ts` - Flow calculations (NEEDS FIX)
- `src/components/ui/Flare2DViewer.tsx` - 2D visualization (PERFORMANCE ISSUE)
- `src/types/well-testing.ts` - Type definitions
- `PROJECT_TASK_SHEET.md` - Complete project documentation

### Calculator Components
- `src/components/calculators/FlareRadiationCalculatorEnhanced.tsx` - Flare calculations
- `src/components/calculators/FlowAssuranceEnhanced.tsx` - Flow assurance (NEEDS FIX)
- `src/components/calculators/GasVelocityCalculatorV2.tsx` - Gas velocity

## 🎯 CURRENT PRIORITIES

### This Session
1. Fix velocity calculation in Flow Assurance
2. Test all calculators still work
3. Check for any new errors

### Next Session
1. Implement code splitting for performance
2. Optimize Flare2DViewer
3. Add unit conversion auto-update

## 🚀 QUICK COMMANDS

```bash
# Start development
npm run dev

# Check for errors
npm run lint

# Build project
npm run build

# Check bundle size
npm run build -- --analyze
```

## 🔍 DEBUGGING QUICK REFERENCE

### Common Errors
- **"Cannot read properties of undefined"** → Add null checks
- **Bundle size warning** → Implement code splitting
- **Performance issues** → Add React.memo, useCallback
- **Unit conversion issues** → Check convertToSI/convertFromSI calls

### Key Console Commands
```javascript
// Check current unit system
localStorage.getItem('well-testing-unit-system')

// Check stored session
localStorage.getItem('well-testing-session')

// Clear all data
localStorage.clear()
```

## 📋 TESTING CHECKLIST

### Before Making Changes
- [ ] All calculators load
- [ ] No console errors
- [ ] Build succeeds
- [ ] Mobile view works

### After Making Changes
- [ ] Velocity calculation works in Flow Assurance
- [ ] All other calculators still work
- [ ] No new console errors
- [ ] Build still succeeds

---

**Context Last Updated**: January 2025  
**Next Review**: After velocity fix completion
