# H2Oil Well Testing Calculator - API Documentation

## 🔌 **API Overview**

The H2Oil Well Testing Calculator uses Supabase as its backend service, providing a comprehensive API for authentication, data management, and calculation services.

## 🏗️ **Architecture**

```
Frontend (React) → Supabase API → PostgreSQL Database
                ↓
            Authentication
            Real-time Updates
            File Storage
```

## 🔐 **Authentication API**

### **Google OAuth 2.0**

#### **Sign In with Google**
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://your-app.com',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
});
```

**Response:**
```json
{
  "data": {
    "provider": "google",
    "url": "https://accounts.google.com/oauth/authorize?..."
  },
  "error": null
}
```

#### **Email/Password Authentication**

**Sign Up:**
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    emailRedirectTo: 'https://your-app.com',
    data: {
      display_name: 'John Doe'
    }
  }
});
```

**Sign In:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

**Sign Out:**
```javascript
const { error } = await supabase.auth.signOut();
```

### **Session Management**

#### **Get Current Session**
```javascript
const { data: { session }, error } = await supabase.auth.getSession();
```

#### **Listen to Auth Changes**
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

## 👤 **User Profile API**

### **Get User Profile**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

### **Update User Profile**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({
    display_name: 'New Name',
    preferred_units: { system: 'metric' }
  })
  .eq('user_id', user.id);
```

### **Create User Profile**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .insert({
    user_id: user.id,
    display_name: 'John Doe',
    preferred_units: { system: 'metric' }
  });
```

## 📊 **Calculation Sessions API**

### **Get User Sessions**
```javascript
const { data, error } = await supabase
  .from('calculation_sessions')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### **Create New Session**
```javascript
const { data, error } = await supabase
  .from('calculation_sessions')
  .insert({
    user_id: user.id,
    session_name: 'Well Test #1',
    session_data: {
      calculator: 'daniel_orifice',
      inputs: { /* calculation inputs */ },
      outputs: { /* calculation results */ }
    }
  });
```

### **Update Session**
```javascript
const { data, error } = await supabase
  .from('calculation_sessions')
  .update({
    session_name: 'Updated Name',
    session_data: updatedData
  })
  .eq('id', sessionId);
```

### **Delete Session**
```javascript
const { error } = await supabase
  .from('calculation_sessions')
  .delete()
  .eq('id', sessionId);
```

## 🧮 **Calculation Engine API**

### **Daniel Orifice Calculator**

#### **Input Parameters**
```typescript
interface DanielOrificeInputs {
  orifice_diameter: number;        // mm or in
  upstream_pressure: number;       // kPa or psi
  downstream_pressure: number;     // kPa or psi
  gas_temperature: number;         // K or °R
  gas_density: number;            // kg/m³ or lb/ft³
  gas_viscosity: number;          // Pa·s or cP
  discharge_coefficient: number;   // dimensionless
  unit_system: 'metric' | 'field';
}
```

#### **Calculation Function**
```javascript
const calculateDanielOrifice = (inputs) => {
  const {
    orifice_diameter,
    upstream_pressure,
    downstream_pressure,
    gas_temperature,
    gas_density,
    gas_viscosity,
    discharge_coefficient,
    unit_system
  } = inputs;

  // Conversion factors based on unit system
  const factors = unit_system === 'metric' ? {
    pressure: 1000,    // kPa to Pa
    diameter: 0.001,   // mm to m
    density: 1,        // kg/m³
    viscosity: 1       // Pa·s
  } : {
    pressure: 6894.76, // psi to Pa
    diameter: 0.0254,  // in to m
    density: 16.0185,  // lb/ft³ to kg/m³
    viscosity: 0.001   // cP to Pa·s
  };

  // Daniel orifice equation implementation
  const A = Math.PI * Math.pow(orifice_diameter * factors.diameter / 2, 2);
  const P1 = upstream_pressure * factors.pressure;
  const P2 = downstream_pressure * factors.pressure;
  const rho = gas_density * factors.density;
  const mu = gas_viscosity * factors.viscosity;
  const T = gas_temperature;

  // Critical pressure ratio
  const gamma = 1.4; // Specific heat ratio for natural gas
  const critical_ratio = Math.pow(2 / (gamma + 1), gamma / (gamma - 1));

  // Flow calculation
  const pressure_ratio = P2 / P1;
  const is_critical = pressure_ratio <= critical_ratio;

  let mass_flow_rate;
  if (is_critical) {
    // Critical flow
    mass_flow_rate = discharge_coefficient * A * P1 * 
      Math.sqrt(gamma * rho * Math.pow(2 / (gamma + 1), (gamma + 1) / (gamma - 1)));
  } else {
    // Subcritical flow
    const term1 = 2 * gamma / (gamma - 1);
    const term2 = Math.pow(P2 / P1, 2 / gamma);
    const term3 = Math.pow(P2 / P1, (gamma + 1) / gamma);
    mass_flow_rate = discharge_coefficient * A * P1 * 
      Math.sqrt(term1 * rho * (term2 - term3));
  }

  return {
    mass_flow_rate,
    volumetric_flow_rate: mass_flow_rate / rho,
    is_critical,
    pressure_ratio,
    critical_ratio
  };
};
```

### **Choke Rate Calculator**

#### **Input Parameters**
```typescript
interface ChokeRateInputs {
  choke_diameter: number;          // mm or in
  upstream_pressure: number;       // kPa or psi
  downstream_pressure: number;     // kPa or psi
  gas_temperature: number;         // K or °R
  gas_density: number;            // kg/m³ or lb/ft³
  gas_viscosity: number;          // Pa·s or cP
  unit_system: 'metric' | 'field';
}
```

### **Critical Flow Calculator**

#### **Input Parameters**
```typescript
interface CriticalFlowInputs {
  pipe_diameter: number;           // mm or in
  upstream_pressure: number;       // kPa or psi
  downstream_pressure: number;     // kPa or psi
  gas_temperature: number;         // K or °R
  gas_density: number;            // kg/m³ or lb/ft³
  gas_viscosity: number;          // Pa·s or cP
  pipe_roughness: number;         // mm or in
  pipe_length: number;            // m or ft
  unit_system: 'metric' | 'field';
}
```

### **GOR Calculator**

#### **Input Parameters**
```typescript
interface GORInputs {
  gas_production_rate: number;     // m³/d or scf/d
  oil_production_rate: number;     // m³/d or bbl/d
  water_production_rate: number;   // m³/d or bbl/d
  gas_gravity: number;            // dimensionless
  oil_gravity: number;            // API degrees
  temperature: number;            // K or °R
  pressure: number;               // kPa or psi
  unit_system: 'metric' | 'field';
}
```

### **Gas Velocity Calculator**

#### **Input Parameters**
```typescript
interface GasVelocityInputs {
  pipe_diameter: number;           // mm or in
  gas_flow_rate: number;          // m³/s or ft³/s
  gas_density: number;            // kg/m³ or lb/ft³
  gas_viscosity: number;          // Pa·s or cP
  pipe_roughness: number;         // mm or in
  unit_system: 'metric' | 'field';
}
```

## 🔄 **Unit Conversion API**

### **Length Conversion**
```javascript
const convertLength = (value, fromUnit, toUnit) => {
  const conversions = {
    'mm': { 'm': 0.001, 'in': 0.0393701, 'ft': 0.00328084 },
    'm': { 'mm': 1000, 'in': 39.3701, 'ft': 3.28084 },
    'in': { 'mm': 25.4, 'm': 0.0254, 'ft': 0.0833333 },
    'ft': { 'mm': 304.8, 'm': 0.3048, 'in': 12 }
  };
  
  return value * conversions[fromUnit][toUnit];
};
```

### **Pressure Conversion**
```javascript
const convertPressure = (value, fromUnit, toUnit) => {
  const conversions = {
    'kPa': { 'psi': 0.145038, 'bar': 0.01, 'atm': 0.00986923 },
    'psi': { 'kPa': 6.89476, 'bar': 0.0689476, 'atm': 0.068046 },
    'bar': { 'kPa': 100, 'psi': 14.5038, 'atm': 0.986923 },
    'atm': { 'kPa': 101.325, 'psi': 14.696, 'bar': 1.01325 }
  };
  
  return value * conversions[fromUnit][toUnit];
};
```

### **Temperature Conversion**
```javascript
const convertTemperature = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return value;
  
  // Convert to Celsius first
  let celsius;
  switch (fromUnit) {
    case 'C': celsius = value; break;
    case 'F': celsius = (value - 32) * 5/9; break;
    case 'K': celsius = value - 273.15; break;
    case 'R': celsius = (value - 491.67) * 5/9; break;
  }
  
  // Convert from Celsius
  switch (toUnit) {
    case 'C': return celsius;
    case 'F': return celsius * 9/5 + 32;
    case 'K': return celsius + 273.15;
    case 'R': return celsius * 9/5 + 491.67;
  }
};
```

## 📁 **File Management API**

### **Export Session Data**
```javascript
const exportSession = (sessionData) => {
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    session_name: sessionData.session_name,
    calculator: sessionData.calculator,
    inputs: sessionData.inputs,
    outputs: sessionData.outputs,
    unit_system: sessionData.unit_system
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `welltest-session-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

### **Import Session Data**
```javascript
const importSession = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.version && data.calculator && data.inputs) {
          resolve(data);
        } else {
          reject(new Error('Invalid file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse file'));
      }
    };
    reader.readAsText(file);
  });
};
```

## 🔍 **Error Handling**

### **API Error Types**
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
}

// Common error codes
const ERROR_CODES = {
  AUTHENTICATION_FAILED: 'auth_failed',
  INVALID_INPUT: 'invalid_input',
  CALCULATION_ERROR: 'calc_error',
  DATABASE_ERROR: 'db_error',
  FILE_ERROR: 'file_error'
};
```

### **Error Handling Example**
```javascript
const handleAPIError = (error) => {
  switch (error.code) {
    case 'auth_failed':
      // Redirect to login
      window.location.href = '/auth';
      break;
    case 'invalid_input':
      // Show validation error
      showToast('Invalid input parameters', 'error');
      break;
    case 'calc_error':
      // Show calculation error
      showToast('Calculation failed', 'error');
      break;
    default:
      // Show generic error
      showToast('An error occurred', 'error');
  }
};
```

## 📊 **Real-time Updates**

### **Subscribe to Session Changes**
```javascript
const subscribeToSessions = (userId, callback) => {
  return supabase
    .channel('calculation_sessions')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'calculation_sessions',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe();
};
```

### **Unsubscribe from Updates**
```javascript
const unsubscribe = subscribeToSessions(userId, (payload) => {
  console.log('Session updated:', payload);
});

// Later...
unsubscribe();
```

## 🧪 **Testing the API**

### **Test Authentication**
```javascript
// Test Google OAuth
const testGoogleAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  });
  console.log('Google Auth:', { data, error });
};

// Test email/password
const testEmailAuth = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword'
  });
  console.log('Email Auth:', { data, error });
};
```

### **Test Calculations**
```javascript
const testDanielOrifice = () => {
  const inputs = {
    orifice_diameter: 25.4, // 1 inch
    upstream_pressure: 1000, // kPa
    downstream_pressure: 500, // kPa
    gas_temperature: 288, // K
    gas_density: 0.717, // kg/m³
    gas_viscosity: 0.000012, // Pa·s
    discharge_coefficient: 0.61,
    unit_system: 'metric'
  };
  
  const result = calculateDanielOrifice(inputs);
  console.log('Daniel Orifice Result:', result);
};
```

## 📈 **Performance Monitoring**

### **API Response Times**
```javascript
const measureAPITime = async (apiCall) => {
  const start = performance.now();
  const result = await apiCall();
  const end = performance.now();
  
  console.log(`API call took ${end - start} milliseconds`);
  return result;
};
```

### **Error Rate Monitoring**
```javascript
let errorCount = 0;
let totalCalls = 0;

const trackAPICall = async (apiCall) => {
  totalCalls++;
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    errorCount++;
    console.error('API Error:', error);
    throw error;
  } finally {
    const errorRate = (errorCount / totalCalls) * 100;
    console.log(`Error rate: ${errorRate.toFixed(2)}%`);
  }
};
```

---

## 📚 **Additional Resources**

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Query for Data Fetching](https://tanstack.com/query/latest)

---

**API Version:** 1.0  
**Last Updated:** September 2025  
**Base URL:** `https://woywfcpcbqgeeqcinwoz.supabase.co`
