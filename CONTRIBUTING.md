# Contributing to H2Oil Well Testing Calculator

Thank you for your interest in contributing to the H2Oil Well Testing Calculator! This document provides guidelines and information for contributors.

## 🎯 Project Overview

The H2Oil Well Testing Calculator is a professional-grade web application designed for oil and gas industry professionals. It provides comprehensive tools for well testing calculations, flow analysis, flare radiation modeling, and unit conversions.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Modern web browser
- Basic knowledge of React, TypeScript, and oil & gas engineering

### Development Setup
```bash
# Clone the repository
git clone https://github.com/loloil123/welltest-calculator.git

# Navigate to project directory
cd welltest-calculator

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Contribution Guidelines

### Types of Contributions
- **Bug Fixes** - Fix calculation errors, UI issues, or performance problems
- **Feature Additions** - Add new calculators or enhance existing ones
- **Documentation** - Improve documentation, add examples, or fix typos
- **Performance** - Optimize code, reduce bundle size, or improve rendering
- **Testing** - Add unit tests, integration tests, or improve test coverage
- **UI/UX** - Improve user interface, accessibility, or mobile experience

### Before You Start
1. **Check Issues** - Look for existing issues or feature requests
2. **Discuss Changes** - For major changes, open an issue first to discuss
3. **Fork Repository** - Create your own fork of the repository
4. **Create Branch** - Create a feature branch for your changes

## 🏗️ Development Workflow

### Branch Naming Convention
- `feature/calculator-name` - New calculator or major feature
- `fix/issue-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `perf/performance-improvement` - Performance optimizations
- `refactor/code-improvement` - Code refactoring

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(flare): add wind effects to radiation calculations
fix(velocity): correct multi-phase flow velocity calculation
docs(readme): update installation instructions
perf(ui): optimize Flare2DViewer rendering
```

### Pull Request Process
1. **Create Pull Request** - From your feature branch to main
2. **Describe Changes** - Provide clear description of what was changed
3. **Link Issues** - Reference any related issues
4. **Add Tests** - Include tests for new functionality
5. **Update Documentation** - Update relevant documentation
6. **Request Review** - Request review from maintainers

## 🧮 Calculator Development

### Adding New Calculators
1. **Create Component** - Create new calculator component in `src/components/calculators/`
2. **Add Calculations** - Implement calculation logic in `src/lib/well-calculations.ts`
3. **Add Types** - Define TypeScript interfaces in `src/types/well-testing.ts`
4. **Add to App** - Register calculator in `src/components/WellTestingApp.tsx`
5. **Add Tests** - Create unit tests for calculation functions
6. **Update Docs** - Update documentation and README

### Calculator Component Template
```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateYourFunction } from '@/lib/well-calculations';
import type { YourInputs, YourOutputs } from '@/types/well-testing';

interface YourCalculatorProps {
  unitSystem: UnitSystem;
}

const YourCalculator: React.FC<YourCalculatorProps> = ({ unitSystem }) => {
  const [inputs, setInputs] = useState<YourInputs>({
    // Initialize with default values
  });
  
  const [results, setResults] = useState<YourOutputs | null>(null);
  
  const handleCalculate = () => {
    try {
      const calculatedResults = calculateYourFunction(inputs, unitSystem);
      setResults(calculatedResults);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Input fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="input1">Input 1</Label>
            <Input
              id="input1"
              type="number"
              value={inputs.input1}
              onChange={(e) => setInputs(prev => ({
                ...prev,
                input1: parseFloat(e.target.value) || 0
              }))}
            />
          </div>
          {/* More inputs */}
        </div>
        
        <Button onClick={handleCalculate} className="mt-4">
          Calculate
        </Button>
        
        {/* Results display */}
        {results && (
          <div className="mt-6 space-y-2">
            <h3 className="text-lg font-semibold">Results</h3>
            {/* Display results */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default YourCalculator;
```

## 🧪 Testing Guidelines

### Unit Tests
- Test all calculation functions
- Test edge cases and error conditions
- Maintain 100% test coverage for calculation functions
- Use descriptive test names

### Component Tests
- Test component rendering
- Test user interactions
- Test error handling
- Test responsive behavior

### Test File Structure
```
src/
├── __tests__/
│   ├── calculations/
│   │   ├── flare-radiation.test.ts
│   │   ├── flow-assurance.test.ts
│   │   └── unit-conversions.test.ts
│   ├── components/
│   │   ├── Flare2DViewer.test.tsx
│   │   └── calculators/
│   └── utils/
```

### Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { calculateYourFunction } from '@/lib/well-calculations';

describe('calculateYourFunction', () => {
  it('should calculate correctly with valid inputs', () => {
    const inputs = {
      // Test inputs
    };
    const expected = {
      // Expected results
    };
    
    const result = calculateYourFunction(inputs);
    expect(result).toEqual(expected);
  });
  
  it('should handle edge cases', () => {
    // Test edge cases
  });
  
  it('should throw error for invalid inputs', () => {
    // Test error handling
  });
});
```

## 📚 Documentation Standards

### Code Documentation
- Use JSDoc for all public functions
- Include parameter descriptions and return types
- Add examples for complex functions
- Document calculation formulas and references

### JSDoc Template
```typescript
/**
 * Calculates flare radiation intensity at a given distance
 * 
 * @param inputs - Flare radiation input parameters
 * @param unitSystem - Unit system (metric or field)
 * @returns Flare radiation output including intensity and contours
 * 
 * @example
 * ```typescript
 * const inputs = {
 *   flareTipHeight: 30,
 *   tipDiameter: 0.5,
 *   windSpeed: 10,
 *   // ... other inputs
 * };
 * 
 * const results = calculateFlareRadiation(inputs, 'metric');
 * console.log(results.intensity); // Radiation intensity in kW/m²
 * ```
 * 
 * @see {@link https://www.api.org/} API 521 Standard
 */
export function calculateFlareRadiation(
  inputs: FlareRadiationInputs,
  unitSystem: UnitSystem
): FlareRadiationOutputs {
  // Implementation
}
```

### README Updates
- Update feature list for new calculators
- Add installation instructions for new dependencies
- Update performance metrics
- Add examples and usage instructions

## 🎨 UI/UX Guidelines

### Design Principles
- **Professional** - Clean, industry-standard appearance
- **Intuitive** - Easy to use for field engineers
- **Responsive** - Works on desktop, tablet, and mobile
- **Accessible** - WCAG 2.1 AA compliance
- **Consistent** - Follow established patterns

### Component Guidelines
- Use Radix UI components when possible
- Follow Tailwind CSS utility classes
- Implement proper loading states
- Add error boundaries for calculations
- Use consistent spacing and typography

### Mobile Considerations
- Touch-friendly button sizes (min 44px)
- Responsive grid layouts
- Optimized canvas rendering
- Reduced bundle size for mobile

## 🔧 Code Quality Standards

### TypeScript
- Use strict TypeScript settings
- Avoid `any` types
- Define proper interfaces
- Use type guards for runtime checks

### Performance
- Use React.memo for expensive components
- Implement useCallback for event handlers
- Use useMemo for expensive calculations
- Optimize bundle size
- Monitor performance metrics

### Code Style
- Follow ESLint rules
- Use Prettier for formatting
- Consistent naming conventions
- Clear variable and function names
- Proper error handling

## 🐛 Bug Reports

### Before Reporting
1. **Check Issues** - Search existing issues
2. **Reproduce** - Ensure bug is reproducible
3. **Test Latest** - Use latest version
4. **Gather Info** - Collect relevant information

### Bug Report Template
```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

## 💡 Feature Requests

### Before Requesting
1. **Check Roadmap** - Review planned features
2. **Search Issues** - Look for similar requests
3. **Consider Scope** - Ensure feature fits project goals
4. **Provide Details** - Describe feature thoroughly

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
Describe the problem this feature would solve.

**Proposed Solution**
Describe how you think this feature should work.

**Alternatives**
Describe any alternative solutions you've considered.

**Additional Context**
Any other context about the feature request.
```

## 🔒 Security

### Security Guidelines
- Never commit API keys or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Sanitize data before processing
- Report security vulnerabilities privately

### Reporting Security Issues
- Email: security@h2oil-calculator.com
- Use "SECURITY:" prefix in subject
- Provide detailed description
- Include steps to reproduce
- Wait for response before public disclosure

## 📞 Support

### Getting Help
- **Documentation** - Check existing documentation first
- **Issues** - Search GitHub issues
- **Discussions** - Use GitHub discussions for questions
- **Email** - Contact maintainers for urgent issues

### Community Guidelines
- Be respectful and professional
- Help others when possible
- Follow code of conduct
- Provide constructive feedback
- Share knowledge and best practices

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- CHANGELOG.md for significant contributions
- Release notes for major contributions
- Project documentation

---

Thank you for contributing to the H2Oil Well Testing Calculator! Your contributions help make this tool better for the oil and gas industry.

**Happy Coding!** 🚀
