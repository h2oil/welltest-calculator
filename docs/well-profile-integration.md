# Well Profile Integration - H2Oil Complete

This document describes the integration of the [well_profile](https://github.com/pro-well-plan/well_profile) Python library into H2Oil Complete for advanced well trajectory calculations and 3D visualization.

## Overview

The well_profile integration provides:
- **Real Python Library**: Uses the actual well_profile library from Pro Well Plan AS
- **3D Visualization**: Interactive 3D plotting with Plotly
- **Excel Support**: Import/export Excel files as per well_profile standards
- **Advanced Calculations**: DLS, build rates, turn rates, and trajectory analysis
- **Multiple Profile Types**: J, S, Horizontal, and Vertical well profiles

## Architecture

```
Frontend (React/TypeScript)     Backend (Python/FastAPI)
├── TrajectoryCalculator  ────►  ├── FastAPI Server
├── TrajectoryVisualizer  ────►  ├── well_profile Library
├── WellModule           ────►  ├── Plotly 3D Plotting
└── wellProfileService   ────►  └── Excel Import/Export
```

## Installation

### Prerequisites
- Python 3.8+ installed and in PATH
- Node.js 18+ and npm 8+
- Git

### Quick Setup

1. **Install Python Dependencies**:
   ```bash
   npm run backend:install
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Start Both Servers**:
   ```bash
   npm run start:full
   ```

### Manual Setup

1. **Backend Setup**:
   ```bash
   cd backend
   python install_dependencies.py
   python run_server.py
   ```

2. **Frontend Setup**:
   ```bash
   npm install
   npm run dev
   ```

## Features

### Trajectory Calculator

Based on the [well_profile examples](https://github.com/pro-well-plan/well_profile):

```python
# J-Shape Profile
well = wp.get(6000, profile='J', kop=2000, eob=3000, build_angle=85)

# S-Shape Profile  
well = wp.get(5000, profile='S', kop=1000, eob=2500, eod=4000, build_angle=60, drop_angle=30)

# Horizontal Profile
well = wp.get(8000, profile='Horizontal', kop=2000, eob=4000, build_angle=90, horizontal_length=2000)
```

### 3D Visualization

Inspired by well_profile plotting:

```python
# Color by DLS with dark mode
well.plot(style={'color': 'dls', 'size': 5, 'darkMode': True}).show()

# Multiple wells
well_1.plot(add_well=[well_2, well_3], names=['Well 1', 'Well 2', 'Well 3']).show()
```

### Excel Import/Export

Full Excel support as per well_profile standards:
- Import: `.xlsx` files with MD, TVD, Inc, Azi columns
- Export: Standard Excel format compatible with well_profile
- Validation: Automatic data validation and error handling

## API Endpoints

### Backend API (http://localhost:8000)

- `GET /health` - Health check and version info
- `POST /trajectory/generate` - Generate trajectory
- `POST /trajectory/load` - Load from Excel file
- `POST /trajectory/export` - Export to Excel file
- `POST /trajectory/plot` - Create 3D plot
- `POST /trajectory/analyze` - Analyze trajectory

### Frontend Service

```typescript
import { wellProfileService } from '@/services/wellProfileService';

// Generate trajectory
const trajectory = await wellProfileService.generateTrajectory(request);

// Load from Excel
const trajectory = await wellProfileService.loadTrajectory(file);

// Export to Excel
await wellProfileService.downloadTrajectory(trajectory, 'filename.xlsx');

// Create 3D plot
const plot = await wellProfileService.create3DPlot(trajectory, style);

// Analyze trajectory
const analysis = await wellProfileService.analyzeTrajectory(trajectory);
```

## Usage Examples

### 1. Generate J-Shape Well

```typescript
const request = {
  profile: {
    type: 'J',
    kop: 2000,
    eob: 4000,
    build_angle: 60,
    target_depth: 6000
  },
  start_point: { north: 0, east: 0, tvd: 0 },
  unit_system: 'field',
  step_size: 100,
  max_dls: 3.0
};

const trajectory = await wellProfileService.generateTrajectory(request);
```

### 2. Load Existing Well

```typescript
// Load from Excel file
const file = event.target.files[0]; // .xlsx file
const trajectory = await wellProfileService.loadTrajectory(file);
```

### 3. Export to Excel

```typescript
// Export trajectory to Excel
await wellProfileService.downloadTrajectory(
  trajectory, 
  'my_well_trajectory.xlsx'
);
```

### 4. 3D Visualization

```typescript
// Create 3D plot with custom styling
const style = {
  color: 'dls',
  size: 5,
  darkMode: true
};

const plot = await wellProfileService.create3DPlot(trajectory, style);
```

## Configuration

### Backend Configuration

Edit `backend/main.py`:
```python
# CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081"],
    # ...
)

# Server settings
uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Frontend Configuration

Edit `src/services/wellProfileService.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

## Troubleshooting

### Common Issues

1. **Backend Not Starting**:
   ```bash
   # Check Python installation
   python --version
   
   # Install dependencies manually
   cd backend
   pip install -r requirements.txt
   ```

2. **CORS Errors**:
   - Check backend is running on port 8000
   - Verify CORS origins in `backend/main.py`

3. **Excel Import Errors**:
   - Ensure file has MD, TVD, Inc, Azi columns
   - Check file format (.xlsx, not .xls)

4. **3D Plot Not Loading**:
   - Check Plotly dependencies installed
   - Verify trajectory data is valid

### Debug Mode

Enable debug logging:
```typescript
// In wellProfileService.ts
const DEBUG = true;
if (DEBUG) console.log('API Request:', endpoint, options);
```

## Performance

### Optimization Tips

1. **Large Trajectories**:
   - Increase step size for fewer points
   - Use efficient plotting options

2. **Multiple Wells**:
   - Load wells individually
   - Use batch processing for analysis

3. **Memory Usage**:
   - Clear plot data when switching trajectories
   - Use pagination for large datasets

## Development

### Adding New Features

1. **Backend**:
   - Add new endpoints in `backend/main.py`
   - Update Pydantic models
   - Test with well_profile library

2. **Frontend**:
   - Add methods to `wellProfileService.ts`
   - Update TypeScript types
   - Add UI components

### Testing

```bash
# Test backend
cd backend
python -m pytest

# Test frontend
npm run test

# Test integration
npm run start:full
```

## References

- [well_profile GitHub](https://github.com/pro-well-plan/well_profile)
- [well_profile Documentation](https://pypi.org/project/well-profile/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Plotly Python](https://plotly.com/python/)

## Support

For technical support:
- Check the [well_profile issues](https://github.com/pro-well-plan/well_profile/issues)
- Review the backend logs
- Check the browser console for frontend errors

## License

This integration maintains the same LGPL-3.0 license as the original well_profile library.
