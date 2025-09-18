"""
H2Oil Complete - Well Profile Backend API
Integrates well_profile library for trajectory calculations and 3D visualization
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import well_profile as wp
import pandas as pd
import numpy as np
import json
import tempfile
import os
from pathlib import Path
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder

app = FastAPI(title="H2Oil Complete - Well Profile API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TrajectoryPoint(BaseModel):
    md: float
    tvd: float
    inc: float
    azi: float
    north: Optional[float] = None
    east: Optional[float] = None

class TrajectoryProfile(BaseModel):
    type: str  # 'J', 'S', 'Horizontal', 'Vertical'
    kop: Optional[float] = None
    eob: Optional[float] = None
    eod: Optional[float] = None
    build_angle: Optional[float] = None
    drop_angle: Optional[float] = None
    horizontal_length: Optional[float] = None
    target_depth: Optional[float] = None
    target_displacement: Optional[float] = None
    target_azimuth: Optional[float] = None

class TrajectoryRequest(BaseModel):
    profile: TrajectoryProfile
    start_point: Dict[str, float]
    unit_system: str  # 'metric' or 'field'
    step_size: float = 50.0
    max_dls: float = 3.0

class WellTrajectory(BaseModel):
    id: str
    name: str
    points: List[TrajectoryPoint]
    unit_system: str
    start_point: Dict[str, float]
    end_point: Dict[str, float]
    total_depth: float
    total_displacement: float
    max_inclination: float
    max_dls: float

@app.get("/")
async def root():
    return {"message": "H2Oil Complete - Well Profile API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "well_profile_version": wp.__version__}

@app.post("/trajectory/generate", response_model=WellTrajectory)
async def generate_trajectory(request: TrajectoryRequest):
    """Generate a well trajectory using well_profile library"""
    try:
        # Convert to well_profile parameters
        profile_params = {
            'profile': request.profile.type,
            'kop': request.profile.kop,
            'eob': request.profile.eob,
            'eod': request.profile.eod,
            'build_angle': request.profile.build_angle,
            'drop_angle': request.profile.drop_angle,
            'horizontal_length': request.profile.horizontal_length,
            'target_depth': request.profile.target_depth,
            'target_displacement': request.profile.target_displacement,
            'target_azimuth': request.profile.target_azimuth
        }
        
        # Remove None values
        profile_params = {k: v for k, v in profile_params.items() if v is not None}
        
        # Set start point
        set_start = {
            'north': request.start_point.get('north', 0),
            'east': request.start_point.get('east', 0),
            'tvd': request.start_point.get('tvd', 0)
        }
        
        # Generate trajectory using well_profile
        well = wp.get(
            request.profile.target_depth or 5000,
            set_start=set_start,
            **profile_params
        )
        
        # Convert to our format
        points = []
        for i, row in well.df.iterrows():
            points.append(TrajectoryPoint(
                md=row['md'],
                tvd=row['tvd'],
                inc=row['inc'],
                azi=row['azi'],
                north=row.get('north', 0),
                east=row.get('east', 0)
            ))
        
        # Calculate statistics
        last_point = points[-1] if points else None
        if last_point:
            total_displacement = np.sqrt(last_point.north**2 + last_point.east**2)
            max_inclination = max(p.inc for p in points)
            max_dls = well.df['dls'].max() if 'dls' in well.df.columns else 0
        else:
            total_displacement = 0
            max_inclination = 0
            max_dls = 0
        
        return WellTrajectory(
            id=f"trajectory_{hash(str(request))}",
            name=f"{request.profile.type}-Profile",
            points=points,
            unit_system=request.unit_system,
            start_point=request.start_point,
            end_point={
                'north': last_point.north if last_point else 0,
                'east': last_point.east if last_point else 0,
                'tvd': last_point.tvd if last_point else 0
            },
            total_depth=last_point.md if last_point else 0,
            total_displacement=total_displacement,
            max_inclination=max_inclination,
            max_dls=max_dls
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating trajectory: {str(e)}")

@app.post("/trajectory/load")
async def load_trajectory(file: UploadFile = File(...)):
    """Load trajectory from Excel file using well_profile"""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedSuffixFile(suffix='.xlsx', delete=False) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Load using well_profile
        well = wp.load(tmp_file_path)
        
        # Convert to our format
        points = []
        for i, row in well.df.iterrows():
            points.append(TrajectoryPoint(
                md=row['md'],
                tvd=row['tvd'],
                inc=row['inc'],
                azi=row['azi'],
                north=row.get('north', 0),
                east=row.get('east', 0)
            ))
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        
        return {
            "id": f"loaded_{file.filename}",
            "name": file.filename,
            "points": points,
            "unit_system": "metric",  # Default, could be detected
            "total_depth": well.df['md'].max(),
            "total_displacement": np.sqrt(well.df['north'].max()**2 + well.df['east'].max()**2),
            "max_inclination": well.df['inc'].max(),
            "max_dls": well.df['dls'].max() if 'dls' in well.df.columns else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading trajectory: {str(e)}")

@app.post("/trajectory/export")
async def export_trajectory(
    trajectory: WellTrajectory,
    format: str = "excel"
):
    """Export trajectory to Excel file"""
    try:
        # Convert to DataFrame
        data = []
        for point in trajectory.points:
            data.append({
                'md': point.md,
                'tvd': point.tvd,
                'inc': point.inc,
                'azi': point.azi,
                'north': point.north or 0,
                'east': point.east or 0
            })
        
        df = pd.DataFrame(data)
        
        # Create temporary file
        with tempfile.NamedSuffixFile(suffix='.xlsx', delete=False) as tmp_file:
            df.to_excel(tmp_file.name, index=False)
            tmp_file_path = tmp_file.name
        
        return FileResponse(
            tmp_file_path,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename=f"{trajectory.name}.xlsx"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting trajectory: {str(e)}")

@app.post("/trajectory/plot")
async def create_3d_plot(
    trajectory: WellTrajectory,
    style: Dict[str, Any] = {"color": "dls", "size": 5, "darkMode": False}
):
    """Create 3D plot using well_profile and return as JSON"""
    try:
        # Convert to well_profile format
        data = []
        for point in trajectory.points:
            data.append({
                'md': point.md,
                'tvd': point.tvd,
                'inc': point.inc,
                'azi': point.azi,
                'north': point.north or 0,
                'east': point.east or 0
            })
        
        df = pd.DataFrame(data)
        
        # Create well_profile object
        well = wp.Well(df)
        
        # Generate plot
        fig = well.plot(style=style)
        
        # Convert to JSON
        plot_json = json.dumps(fig, cls=PlotlyJSONEncoder)
        
        return {"plot_data": plot_json}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating plot: {str(e)}")

@app.post("/trajectory/analyze")
async def analyze_trajectory(trajectory: WellTrajectory):
    """Analyze trajectory and return detailed statistics"""
    try:
        # Convert to DataFrame for analysis
        data = []
        for point in trajectory.points:
            data.append({
                'md': point.md,
                'tvd': point.tvd,
                'inc': point.inc,
                'azi': point.azi,
                'north': point.north or 0,
                'east': point.east or 0
            })
        
        df = pd.DataFrame(data)
        
        # Calculate statistics
        analysis = {
            "total_length": df['md'].max(),
            "total_displacement": np.sqrt(df['north'].max()**2 + df['east'].max()**2),
            "max_inclination": df['inc'].max(),
            "max_azimuth": df['azi'].max(),
            "vertical_section": df['tvd'].max(),
            "closure_distance": np.sqrt(df['north'].iloc[-1]**2 + df['east'].iloc[-1]**2),
            "closure_azimuth": np.degrees(np.arctan2(df['east'].iloc[-1], df['north'].iloc[-1])),
            "point_count": len(df)
        }
        
        # Calculate DLS if not present
        if 'dls' not in df.columns and len(df) > 1:
            dls_values = []
            for i in range(1, len(df)):
                prev = df.iloc[i-1]
                curr = df.iloc[i]
                
                # Calculate DLS
                delta_md = curr['md'] - prev['md']
                if delta_md > 0:
                    delta_inc = curr['inc'] - prev['inc']
                    delta_azi = curr['azi'] - prev['azi']
                    
                    # Handle azimuth wrap-around
                    if delta_azi > 180:
                        delta_azi -= 360
                    if delta_azi < -180:
                        delta_azi += 360
                    
                    dls = np.arccos(
                        np.cos(np.radians(delta_inc)) + 
                        np.sin(np.radians(prev['inc'])) * 
                        np.sin(np.radians(curr['inc'])) * 
                        (1 - np.cos(np.radians(delta_azi)))
                    ) * 180 / np.pi
                    
                    dls_per_100ft = (dls / delta_md) * 100
                    dls_values.append(dls_per_100ft)
            
            if dls_values:
                analysis["max_dls"] = max(dls_values)
                analysis["avg_dls"] = np.mean(dls_values)
            else:
                analysis["max_dls"] = 0
                analysis["avg_dls"] = 0
        else:
            analysis["max_dls"] = df['dls'].max() if 'dls' in df.columns else 0
            analysis["avg_dls"] = df['dls'].mean() if 'dls' in df.columns else 0
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing trajectory: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
