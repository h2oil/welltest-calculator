# Flare Calculator Enhancements

## Overview

The Flare Radiation & Noise Calculator has been significantly enhanced with advanced 3D visualization, comprehensive export/import functionality, and per-field unit selectors. This document describes the new features and their usage.

## New Features

### 1. 3D Visualization

The calculator now includes a real-time 3D model powered by Three.js that displays:

- **Flare Stack**: Vertical cylinder representing the flare tip at the specified height
- **Flame**: Tilted cone/ellipsoid showing the flame geometry based on exit velocity and wind conditions
- **Radiation Shells**: Semi-transparent iso-surfaces for radiation levels (12.6, 6.3, 4.73 kW/m²)
- **Noise Shells**: Wireframe iso-surfaces for noise levels (100, 85, 70 dB(A))
- **Ground Contours**: 2D contour lines projected onto the ground plane
- **Wind Arrow**: Visual indicator showing wind direction and speed
- **Interactive Controls**: Orbit, pan, zoom, and layer toggles

#### 3D Controls

- **Reset View**: Returns camera to default position (80, 60, 80)
- **Layer Toggles**: Show/hide flame, radiation, noise, and wind elements
- **Real-time Updates**: Model updates automatically when parameters change

### 2. Export Functionality

#### PNG Export
- **Download View (PNG)**: Captures current 3D canvas as PNG image
- **High Resolution**: Exports at canvas resolution for detailed analysis
- **Current State**: Captures exactly what's visible in the 3D viewer

#### CSV Export
- **Download Contours (CSV)**: Exports contour data in structured format
- **Columns**: `layer`, `level`, `vertex_index`, `x`, `y`
- **Layers**: Named as `radiation_12.6`, `radiation_6.3`, `radiation_4.73`, `noise_100`, `noise_85`, `noise_70`
- **Vertex Data**: Ordered (x,y) coordinates for each contour level

#### JSON Export
- **Export Scenario (JSON)**: Complete scenario export with all settings
- **Version Control**: Includes version `flarecalc-1.1` for compatibility
- **Comprehensive Data**: Inputs, units, derived values, and camera position

### 3. Import Functionality

#### JSON Import
- **Import Scenario (JSON)**: Restore complete scenario from saved file
- **Validation**: Schema validation ensures file compatibility
- **Unit Restoration**: Per-field units are restored exactly as saved
- **State Recovery**: All inputs, calculations, and 3D view are restored

#### File Format
```json
{
  "version": "flarecalc-1.1",
  "inputs": {
    "gasRate": { "value": 50, "unit": "MMSCFD" },
    "flareHeight": { "value": 60, "unit": "m" },
    "tipDiameter": { "value": 0.3, "unit": "m" },
    "tipPressure": { "value": 101.3, "unit": "kPa" },
    "tipTemperature": { "value": 40, "unit": "C" },
    "windSpeed": { "value": 5, "unit": "m/s" },
    "windDirection": { "value": 270, "unit": "deg" },
    "humidity": { "value": 0.6, "unit": "fraction" },
    "composition": { "CH4": 0.9, "C2H6": 0.05, "CO2": 0.04, "H2S": 0.01 }
  },
  "options": {
    "emissiveFraction": { "mode": "auto", "value": 0.27 },
    "noiseReferenceDistance": { "value": 25, "unit": "m" },
    "globalUnitPreset": "SI"
  },
  "derived": { "MW": 18.5, "Z": 0.96, "vExit": 112.3, "chi": 0.27, "flame": { "L": 22.4, "tiltDeg": 18.2 }},
  "camera": { "target":[0,0,0], "position":[80,60,80] }
}
```

### 4. Per-Field Unit Selectors

Each numeric input now has an individual unit selector that allows:

- **Independent Units**: Each field can use different units (e.g., height in feet, pressure in kPa)
- **Real-time Conversion**: Values are converted automatically when units change
- **Persistent Settings**: Unit choices are saved in scenario exports
- **SI Base Calculations**: All internal calculations use SI units for accuracy

#### Supported Unit Groups

- **Length**: m, ft, in
- **Pressure**: Pa, kPa, bar, psia, psig
- **Temperature**: K, °C, °F
- **Flow Rate**: m³/s, ft³/s, MMSCFD, MSCMD
- **Velocity**: m/s, ft/s, mph
- **Power**: W, kW, MW
- **Sound Level**: dB, dB(A)
- **Angle**: rad, °
- **Dimensionless**: fraction, %

#### Unit Conversion Rules

1. **Temperature**: Uses offset conversion (C = K - 273.15, F = 9/5*C + 32)
2. **Pressure**: Gauge pressure includes atmospheric offset (psig = psia - 14.7)
3. **Flow Rate**: Standard conditions are maintained (60°F, 14.7 psia)
4. **Precision**: All conversions maintain calculation accuracy within rounding

### 5. Enhanced User Interface

#### Tabbed Interface
- **Inputs**: All parameter inputs with per-field units
- **3D Model**: Interactive 3D visualization
- **Results**: Detailed calculation results and performance metrics
- **Export**: Export options and file generation
- **Import**: Scenario import functionality

#### Input Organization
- **Operating Data**: Gas rate, flare height, wind conditions
- **Flare Geometry**: Tip diameter, pressure, temperature
- **Gas Composition**: Mole percentages with presets
- **Atmospheric Conditions**: Humidity, ambient temperature
- **Contour Customization**: Radiation and noise level settings

#### Gas Composition Presets
- **Natural Gas**: 95% CH4, 3% C2H6, 1% C3H8, 0.5% others
- **Associated Gas**: 70% CH4, 15% C2H6, 8% C3H8, 7% others
- **Sour Gas**: 80% CH4, 10% C2H6, 5% C3H8, 5% others (includes H2S)
- **Refinery Gas**: 60% CH4, 20% C2H6, 10% C3H8, 10% others

## Technical Implementation

### 3D Rendering
- **Three.js**: WebGL-based 3D graphics
- **Scene Management**: Automatic cleanup and memory management
- **Performance**: Optimized rendering with layer toggles
- **Responsive**: Adapts to container size changes

### Unit Conversion System
- **Centralized**: Single source of truth for all conversions
- **Type Safe**: TypeScript interfaces ensure correctness
- **Extensible**: Easy to add new units and conversion rules
- **Validated**: Input validation prevents invalid conversions

### File Format Standards
- **JSON Schema**: Validated scenario format
- **CSV Structure**: Standardized contour export
- **Version Control**: Backward compatibility support
- **Error Handling**: Graceful failure with user feedback

## Usage Examples

### Basic Workflow
1. **Set Parameters**: Enter flare geometry and operating conditions
2. **Select Units**: Choose appropriate units for each field
3. **View 3D Model**: Observe radiation and noise footprints
4. **Export Results**: Save PNG, CSV, or JSON as needed
5. **Save Scenario**: Export complete configuration for later use

### Advanced Workflow
1. **Import Scenario**: Load previously saved configuration
2. **Modify Parameters**: Adjust specific values as needed
3. **Compare Results**: Export multiple scenarios for comparison
4. **Share Data**: Use CSV exports for external analysis tools

### Validation and Testing

#### 3D Rendering Tests
- **Gas Rate**: 50 MMSCFD → radiation shells render correctly
- **Wind Speed**: 5 m/s → 10 m/s increases downwind extent
- **Height**: 60 m → flame geometry scales appropriately

#### Export/Import Tests
- **PNG Export**: Canvas dimensions match current view
- **CSV Export**: Contour data reconstructs polygons correctly
- **JSON Import**: All settings restore exactly to saved state

#### Unit Conversion Tests
- **Height**: m ↔ ft conversion maintains numerical accuracy
- **Pressure**: kPa ↔ psia conversion preserves calculations
- **Temperature**: °C ↔ °F conversion maintains precision

## Error Handling

### Validation Errors
- **Input Validation**: Clear error messages for invalid inputs
- **Unit Validation**: Prevents invalid unit combinations
- **File Validation**: Schema validation for imported files

### User Feedback
- **Toast Notifications**: Success/failure messages for all operations
- **Error Alerts**: Clear indication of calculation problems
- **Status Indicators**: Visual feedback during long operations

## Performance Considerations

### 3D Rendering
- **Layer Management**: Disable unused layers for better performance
- **Memory Cleanup**: Automatic disposal of Three.js objects
- **Frame Rate**: Optimized rendering loop

### File Operations
- **Async Processing**: Non-blocking file operations
- **Memory Management**: Proper cleanup of file objects
- **Error Recovery**: Graceful handling of file operation failures

## Future Enhancements

### Planned Features
- **Orbit Controls**: Full 3D navigation with mouse/touch
- **Animation**: Time-based parameter changes
- **Advanced Materials**: Realistic flame and radiation rendering
- **Measurement Tools**: Distance and area measurements in 3D

### Integration Opportunities
- **CAD Export**: Direct export to engineering CAD systems
- **Report Generation**: Automated PDF report creation
- **Cloud Storage**: Direct save/load from cloud services
- **Collaboration**: Real-time sharing of scenarios

## Troubleshooting

### Common Issues
1. **3D Not Loading**: Check browser WebGL support
2. **Export Failing**: Ensure all parameters are valid
3. **Import Errors**: Verify JSON file format and version
4. **Unit Conversion**: Check for invalid unit combinations

### Browser Compatibility
- **WebGL**: Required for 3D visualization
- **File API**: Required for import/export functionality
- **Canvas**: Required for PNG export
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)

## Support

For technical support or feature requests, please refer to the main application documentation or contact the development team.
