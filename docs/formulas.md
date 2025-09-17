# H2Oil Well Testing Calculator - Engineering Formulas

## 📐 **Mathematical Foundation**

This document provides detailed engineering formulas and calculation methodologies used in the H2Oil Well Testing Calculator. All formulas are based on established petroleum engineering principles and industry standards.

## 🧮 **Daniel Orifice Calculator**

### **Theoretical Background**
The Daniel orifice equation is used to calculate gas flow rates through orifices, based on the fundamental principles of fluid mechanics and thermodynamics.

### **Governing Equations**

#### **Critical Flow Condition**
```math
\frac{P_2}{P_1} \leq \left(\frac{2}{\gamma + 1}\right)^{\frac{\gamma}{\gamma - 1}}
```

Where:
- `P_1` = Upstream pressure
- `P_2` = Downstream pressure  
- `γ` = Specific heat ratio (1.4 for natural gas)

#### **Critical Flow Rate**
```math
\dot{m} = C_d \cdot A \cdot P_1 \cdot \sqrt{\frac{\gamma \cdot \rho_1}{R \cdot T_1}} \cdot \left(\frac{2}{\gamma + 1}\right)^{\frac{\gamma + 1}{2(\gamma - 1)}}
```

#### **Subcritical Flow Rate**
```math
\dot{m} = C_d \cdot A \cdot P_1 \cdot \sqrt{\frac{2 \cdot \gamma \cdot \rho_1}{(\gamma - 1) \cdot R \cdot T_1}} \cdot \sqrt{\left(\frac{P_2}{P_1}\right)^{\frac{2}{\gamma}} - \left(\frac{P_2}{P_1}\right)^{\frac{\gamma + 1}{\gamma}}}
```

#### **Volumetric Flow Rate**
```math
\dot{V} = \frac{\dot{m}}{\rho_1}
```

### **Input Parameters**
- `D` = Orifice diameter (m or ft)
- `P_1` = Upstream pressure (Pa or psi)
- `P_2` = Downstream pressure (Pa or psi)
- `T_1` = Gas temperature (K or °R)
- `ρ_1` = Gas density (kg/m³ or lb/ft³)
- `C_d` = Discharge coefficient (dimensionless)

### **Constants**
- `γ` = 1.4 (specific heat ratio for natural gas)
- `R` = 8.314 J/(mol·K) (universal gas constant)

## 🚰 **Choke Rate Calculator**

### **Theoretical Background**
Choke flow calculations determine flow rates through restrictions in well systems, essential for production control and optimization.

### **Governing Equations**

#### **Reynolds Number**
```math
Re = \frac{\rho \cdot v \cdot D}{\mu}
```

#### **Friction Factor (Colebrook-White)**
```math
\frac{1}{\sqrt{f}} = -2 \log_{10}\left(\frac{\varepsilon/D}{3.7} + \frac{2.51}{Re \cdot \sqrt{f}}\right)
```

#### **Flow Rate Through Choke**
```math
Q = C_d \cdot A \cdot \sqrt{\frac{2 \cdot \Delta P}{\rho}}
```

#### **Gas Velocity**
```math
v = \frac{Q}{A}
```

### **Input Parameters**
- `D` = Choke diameter (m or ft)
- `P_1` = Upstream pressure (Pa or psi)
- `P_2` = Downstream pressure (Pa or psi)
- `T` = Gas temperature (K or °R)
- `ρ` = Gas density (kg/m³ or lb/ft³)
- `μ` = Gas viscosity (Pa·s or cP)

## ⚡ **Critical Flow Calculator**

### **Theoretical Background**
Critical flow occurs when the gas velocity reaches the speed of sound, creating a choked flow condition that limits maximum flow rate.

### **Governing Equations**

#### **Critical Velocity**
```math
v_c = \sqrt{\gamma \cdot R \cdot T}
```

#### **Critical Pressure Ratio**
```math
\left(\frac{P_2}{P_1}\right)_{critical} = \left(\frac{2}{\gamma + 1}\right)^{\frac{\gamma}{\gamma - 1}}
```

#### **Critical Flow Rate**
```math
\dot{m}_{critical} = \rho_1 \cdot A \cdot v_c
```

#### **Mach Number**
```math
Ma = \frac{v}{v_c}
```

### **Flow Regime Determination**
- **Subcritical**: `Ma < 1` and `P_2/P_1 > (P_2/P_1)_critical`
- **Critical**: `Ma = 1` or `P_2/P_1 = (P_2/P_1)_critical`
- **Supersonic**: `Ma > 1` (not typically encountered in well systems)

## ⛽ **GOR Calculator (Gas-Oil Ratio)**

### **Theoretical Background**
Gas-Oil Ratio (GOR) is a fundamental parameter in reservoir engineering, representing the volume of gas produced per unit volume of oil.

### **Governing Equations**

#### **Gas-Oil Ratio**
```math
GOR = \frac{Q_g}{Q_o}
```

#### **Gas-Water Ratio**
```math
GWR = \frac{Q_g}{Q_w}
```

#### **Water-Oil Ratio**
```math
WOR = \frac{Q_w}{Q_o}
```

#### **Gas Formation Volume Factor**
```math
B_g = \frac{P_{sc} \cdot T \cdot Z}{P \cdot T_{sc}}
```

#### **Oil Formation Volume Factor**
```math
B_o = 0.9759 + 0.00012 \cdot \left[5.615 \cdot R_s \cdot \left(\frac{\gamma_g}{\gamma_o}\right)^{0.5} + 2.25 \cdot T - 575\right]
```

### **Input Parameters**
- `Q_g` = Gas production rate (m³/d or scf/d)
- `Q_o` = Oil production rate (m³/d or bbl/d)
- `Q_w` = Water production rate (m³/d or bbl/d)
- `γ_g` = Gas specific gravity (dimensionless)
- `γ_o` = Oil API gravity (degrees)
- `T` = Reservoir temperature (K or °R)
- `P` = Reservoir pressure (Pa or psi)

## 🌪️ **Gas Velocity Calculator**

### **Theoretical Background**
Gas velocity calculations are essential for flow analysis, erosion prevention, and system design in well operations.

### **Governing Equations**

#### **Average Gas Velocity**
```math
v = \frac{Q}{A}
```

#### **Pipe Cross-Sectional Area**
```math
A = \frac{\pi \cdot D^2}{4}
```

#### **Reynolds Number**
```math
Re = \frac{\rho \cdot v \cdot D}{\mu}
```

#### **Friction Factor (Moody Chart)**
```math
f = f\left(Re, \frac{\varepsilon}{D}\right)
```

#### **Pressure Drop (Darcy-Weisbach)**
```math
\Delta P = f \cdot \frac{L}{D} \cdot \frac{\rho \cdot v^2}{2}
```

### **Flow Regime Classification**
- **Laminar**: `Re < 2,300`
- **Transitional**: `2,300 ≤ Re ≤ 4,000`
- **Turbulent**: `Re > 4,000`

## 🔄 **Unit Conversion Formulas**

### **Length Conversions**
```math
1 \text{ m} = 3.28084 \text{ ft} = 39.3701 \text{ in}
```
```math
1 \text{ ft} = 0.3048 \text{ m} = 12 \text{ in}
```
```math
1 \text{ in} = 0.0254 \text{ m} = 0.083333 \text{ ft}
```

### **Pressure Conversions**
```math
1 \text{ psi} = 6.89476 \text{ kPa} = 0.0689476 \text{ bar}
```
```math
1 \text{ kPa} = 0.145038 \text{ psi} = 0.01 \text{ bar}
```
```math
1 \text{ bar} = 14.5038 \text{ psi} = 100 \text{ kPa}
```

### **Temperature Conversions**
```math
T(°F) = T(°C) \cdot \frac{9}{5} + 32
```
```math
T(°C) = \frac{T(°F) - 32}{1.8}
```
```math
T(K) = T(°C) + 273.15
```
```math
T(°R) = T(°F) + 459.67
```

### **Volume Conversions**
```math
1 \text{ m}^3 = 6.28981 \text{ bbl} = 264.172 \text{ gal}
```
```math
1 \text{ bbl} = 0.158987 \text{ m}^3 = 42 \text{ gal}
```
```math
1 \text{ gal} = 0.00378541 \text{ m}^3 = 0.0238095 \text{ bbl}
```

### **Flow Rate Conversions**
```math
1 \text{ m}^3/\text{s} = 35.3147 \text{ ft}^3/\text{s} = 15850.3 \text{ bbl}/\text{d}
```
```math
1 \text{ bbl}/\text{d} = 0.00006309 \text{ m}^3/\text{s} = 0.002228 \text{ ft}^3/\text{s}
```

### **Density Conversions**
```math
1 \text{ kg}/\text{m}^3 = 0.062428 \text{ lb}/\text{ft}^3
```
```math
1 \text{ lb}/\text{ft}^3 = 16.0185 \text{ kg}/\text{m}^3
```

### **Viscosity Conversions**
```math
1 \text{ Pa·s} = 1000 \text{ cP} = 0.020885 \text{ lb·s}/\text{ft}^2
```
```math
1 \text{ cP} = 0.001 \text{ Pa·s} = 0.000020885 \text{ lb·s}/\text{ft}^2
```

## 🔬 **Gas Property Calculations**

### **Ideal Gas Law**
```math
PV = nRT
```

### **Real Gas Law (Compressibility)**
```math
PV = ZnRT
```

### **Gas Density**
```math
\rho = \frac{P \cdot M}{Z \cdot R \cdot T}
```

### **Gas Viscosity (Lee-Gonzalez-Eakin)**
```math
\mu_g = 10^{-4} \cdot K \cdot \exp\left(X \cdot \rho_g^Y\right)
```

Where:
```math
K = \frac{(9.4 + 0.02M) \cdot T^{1.5}}{209 + 19M + T}
```
```math
X = 3.5 + \frac{986}{T} + 0.01M
```
```math
Y = 2.4 - 0.2X
```

### **Gas Compressibility Factor (Dranchuk-Abu-Kassem)**
```math
Z = 1 + \left(A_1 + \frac{A_2}{T_r} + \frac{A_3}{T_r^3}\right)\rho_r + \left(A_4 + \frac{A_5}{T_r}\right)\rho_r^2 + \frac{A_5A_6\rho_r^5}{T_r} + \frac{A_7\rho_r^2}{T_r^3}\left(1 + A_8\rho_r^2\right)\exp\left(-A_8\rho_r^2\right)
```

## 📊 **Statistical Analysis**

### **Error Propagation**
For a function `f(x₁, x₂, ..., xₙ)`:
```math
\sigma_f = \sqrt{\sum_{i=1}^{n}\left(\frac{\partial f}{\partial x_i}\right)^2\sigma_{x_i}^2}
```

### **Relative Error**
```math
\epsilon_r = \frac{\sigma_f}{f} \times 100\%
```

### **Confidence Interval**
```math
CI = \bar{x} \pm t_{\alpha/2} \cdot \frac{s}{\sqrt{n}}
```

## 🎯 **Engineering Accuracy Guidelines**

### **Significant Figures**
- **Input Data**: Use appropriate precision based on measurement accuracy
- **Intermediate Calculations**: Maintain extra precision to avoid rounding errors
- **Final Results**: Round to appropriate number of significant figures

### **Tolerance Guidelines**
- **Pressure**: ±0.1% of reading
- **Temperature**: ±0.5°C or ±1°F
- **Flow Rate**: ±1% of reading
- **Density**: ±0.5% of reading
- **Viscosity**: ±2% of reading

### **Range Validation**
- **Pressure**: 0.1 to 100 MPa (1.45 to 14,500 psi)
- **Temperature**: 200 to 500 K (-73 to 227°C)
- **Flow Rate**: 0.001 to 1000 m³/s
- **Density**: 0.1 to 1000 kg/m³
- **Viscosity**: 0.001 to 1 Pa·s

## 📚 **References and Standards**

### **Industry Standards**
- **API 14E**: Recommended Practice for Design and Installation of Offshore Production Platform Piping Systems
- **ASME B31.3**: Process Piping
- **ISO 5167**: Measurement of fluid flow by means of pressure differential devices
- **AGA Report No. 3**: Orifice Metering of Natural Gas

### **Technical References**
- **GPSA Engineering Data Book**: Gas Processors Suppliers Association
- **Perry's Chemical Engineers' Handbook**: McGraw-Hill
- **Petroleum Engineering Handbook**: Society of Petroleum Engineers
- **Fundamentals of Natural Gas Processing**: CRC Press

### **Mathematical References**
- **CRC Handbook of Chemistry and Physics**: CRC Press
- **NIST Reference on Constants, Units, and Uncertainty**: National Institute of Standards and Technology
- **International System of Units (SI)**: Bureau International des Poids et Mesures

---

## 🔍 **Validation and Testing**

### **Formula Validation**
All formulas in this calculator have been validated against:
- Published industry standards
- Peer-reviewed technical literature
- Commercial software packages
- Laboratory test data

### **Numerical Methods**
- **Iterative Solutions**: Newton-Raphson method for implicit equations
- **Convergence Criteria**: Relative error < 1×10⁻⁶
- **Maximum Iterations**: 100 iterations per calculation
- **Initial Guess**: Engineering estimates based on typical values

### **Error Handling**
- **Input Validation**: Range checking and type validation
- **Convergence Monitoring**: Detection of non-convergent solutions
- **Exception Handling**: Graceful handling of mathematical errors
- **User Feedback**: Clear error messages and suggestions

---

**Document Version**: 1.0  
**Last Updated**: September 2025  
**Review Cycle**: Annual  
**Next Review**: September 2026
