# Well Trajectory Integration

This document describes the integration of well trajectory functionality inspired by the [well_profile](https://github.com/pro-well-plan/well_profile) Python library into the H2Oil Complete application.

## Overview

The well trajectory system provides comprehensive 3D well path visualization, trajectory calculation, and analysis capabilities. It's fully integrated into the existing WellModule with three main components:

1. **Trajectory Calculator** - Generate well trajectories using various profile types
2. **3D Visualization** - Interactive 3D visualization of well paths
3. **Deviation Survey** - Traditional deviation survey data management

## Features

### Trajectory Calculator

- **Profile Types**: J-shape, S-shape, Horizontal, Vertical, and Custom profiles
- **Interactive Configuration**: Real-time parameter adjustment
- **Multiple Units**: Support for both metric and field units
- **Validation**: Built-in validation for trajectory parameters
- **Import/Export**: JSON format for trajectory data exchange

### 3D Visualization

- **Interactive Canvas**: HTML5 Canvas-based 3D rendering
- **Color Coding**: Visualize by DLS, inclination, azimuth, depth, etc.
- **Camera Controls**: Zoom, pan, rotate, and reset view
- **Dark/Light Mode**: Toggle between themes
- **Real-time Analysis**: Live trajectory analysis and statistics

### Profile Types

#### J-Shape Profile
- **Kick-off Point (KOP)**: Depth where building begins
- **End of Build (EOB)**: Depth where building ends
- **Build Angle**: Maximum inclination angle
- **Target Depth**: Final well depth

#### S-Shape Profile
- **KOP**: Initial kick-off point
- **EOB**: End of build section
- **EOD**: End of drop section
- **Build/Drop Angles**: Inclination changes
- **Target Depth**: Final well depth

#### Horizontal Profile
- **KOP**: Kick-off point
- **EOB**: End of build
- **Build Angle**: Final inclination (typically 90°)
- **Horizontal Length**: Length of horizontal section

## Technical Implementation

### TypeScript Types

```typescript
interface TrajectoryPoint {
  md: number;        // Measured Depth
  inc: number;       // Inclination (degrees)
  azi: number;       // Azimuth (degrees)
  tvd: number;       // True Vertical Depth
  north: number;     // North coordinate
  east: number;      // East coordinate
  dls?: number;      // Dog Leg Severity
  buildRate?: number; // Build Rate
  turnRate?: number;  // Turn Rate
}
```

### Calculation Engine

The `TrajectoryCalculator` class provides:

- **DLS Calculation**: Dog Leg Severity between trajectory points
- **Build Rate**: Inclination change rate
- **Turn Rate**: Azimuth change rate
- **Coordinate Calculation**: 3D position calculation
- **Profile Generation**: Automated trajectory generation

### Visualization Engine

The `TrajectoryVisualizer` component features:

- **Canvas Rendering**: High-performance 2D/3D rendering
- **Color Mapping**: Dynamic color coding based on parameters
- **Interactive Controls**: Mouse and keyboard navigation
- **Real-time Updates**: Live visualization updates
- **Export Capabilities**: Image and data export

## Usage

### Basic Workflow

1. **Navigate to Well Module**: Access the WellModule in OpenProsper
2. **Select Trajectory Calculator Tab**: Choose the calculator interface
3. **Configure Profile**: Set profile type and parameters
4. **Set Start Point**: Define well starting coordinates
5. **Generate Trajectory**: Click "Generate Trajectory" button
6. **Visualize Results**: Switch to 3D Visualization tab
7. **Analyze Data**: Review trajectory analysis and statistics

### Advanced Features

#### Import/Export
- **JSON Format**: Standard trajectory data format
- **CSV Import**: Import deviation survey data
- **Project Integration**: Save trajectories with project data

#### Customization
- **Color Schemes**: Multiple visualization color options
- **Display Options**: Toggle grid, labels, and points
- **Camera Controls**: Full 3D navigation controls

## Integration with H2Oil Complete

### WellModule Integration

The trajectory functionality is seamlessly integrated into the existing WellModule:

```typescript
// Three main tabs in WellModule
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsTrigger value="deviation">Deviation Survey</TabsTrigger>
  <TabsTrigger value="calculator">Trajectory Calculator</TabsTrigger>
  <TabsTrigger value="visualizer">3D Visualization</TabsTrigger>
</Tabs>
```

### Data Flow

1. **Trajectory Calculator** → Generates trajectory data
2. **Trajectory Visualizer** → Displays 3D visualization
3. **Deviation Survey** → Manages traditional survey data
4. **Project Integration** → Saves with well project data

### Unit System Support

- **Metric Units**: Meters, degrees, degrees/30m
- **Field Units**: Feet, degrees, degrees/100ft
- **Automatic Conversion**: Seamless unit conversion
- **Consistent Display**: Unified unit display across components

## Performance Considerations

### Optimization Features

- **Canvas Rendering**: Hardware-accelerated rendering
- **Efficient Calculations**: Optimized trajectory calculations
- **Memory Management**: Proper cleanup and garbage collection
- **Responsive Design**: Mobile and desktop compatibility

### Scalability

- **Large Datasets**: Support for thousands of trajectory points
- **Real-time Updates**: Smooth performance during parameter changes
- **Export Efficiency**: Fast data export and import

## Future Enhancements

### Planned Features

1. **Advanced Profiles**: More complex trajectory types
2. **Collision Detection**: Well-to-well collision analysis
3. **Torque & Drag**: Mechanical analysis integration
4. **Real-time Collaboration**: Multi-user editing
5. **API Integration**: External data source connections

### Extensibility

The trajectory system is designed for easy extension:

- **Custom Profiles**: Add new trajectory profile types
- **Visualization Modes**: Implement additional rendering modes
- **Analysis Tools**: Add specialized analysis functions
- **Export Formats**: Support additional file formats

## Troubleshooting

### Common Issues

1. **Canvas Not Rendering**: Check browser WebGL support
2. **Performance Issues**: Reduce trajectory point count
3. **Import Errors**: Verify JSON file format
4. **Calculation Errors**: Check parameter ranges

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Enable debug logging
const DEBUG_MODE = true;
```

## References

- [well_profile GitHub Repository](https://github.com/pro-well-plan/well_profile)
- [H2Oil Complete Documentation](./README.md)
- [OpenProsper Integration Guide](./open-prosper-integration.md)

## Support

For technical support or feature requests:

- **GitHub Issues**: Create an issue in the repository
- **Documentation**: Check the comprehensive documentation
- **Community**: Join the H2Oil Complete community discussions
