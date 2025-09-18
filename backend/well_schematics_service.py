"""
Well Schematics Service using wellschematicspy
Provides API endpoints for generating well schematics
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64
from wellschematicspy import Well, OpenHole, Casing, Completion

router = APIRouter()

class WellSchematicRequest(BaseModel):
    well_name: str
    total_depth: float
    casings: List[Dict[str, Any]]
    completions: List[Dict[str, Any]]
    open_holes: List[Dict[str, Any]] = []

class WellSchematicResponse(BaseModel):
    success: bool
    image_base64: str
    message: str

@router.post("/generate-schematic", response_model=WellSchematicResponse)
async def generate_well_schematic(request: WellSchematicRequest):
    """
    Generate a well schematic using wellschematicspy
    """
    try:
        # Create well instance
        well = Well(name=request.well_name, total_depth=request.total_depth)
        
        # Add casings
        for casing_data in request.casings:
            casing = Casing(
                name=casing_data.get('name', ''),
                top_depth=casing_data.get('top_depth', 0),
                bottom_depth=casing_data.get('bottom_depth', 0),
                outer_diameter=casing_data.get('outer_diameter', 0),
                inner_diameter=casing_data.get('inner_diameter', 0),
                weight=casing_data.get('weight', 0)
            )
            well.add_casing(casing)
        
        # Add completions
        for completion_data in request.completions:
            completion = Completion(
                name=completion_data.get('name', ''),
                top_depth=completion_data.get('top_depth', 0),
                bottom_depth=completion_data.get('bottom_depth', 0),
                outer_diameter=completion_data.get('outer_diameter', 0),
                inner_diameter=completion_data.get('inner_diameter', 0),
                completion_type=completion_data.get('completion_type', 'tubing')
            )
            well.add_completion(completion)
        
        # Add open holes
        for open_hole_data in request.open_holes:
            open_hole = OpenHole(
                name=open_hole_data.get('name', ''),
                top_depth=open_hole_data.get('top_depth', 0),
                bottom_depth=open_hole_data.get('bottom_depth', 0),
                diameter=open_hole_data.get('diameter', 0)
            )
            well.add_open_hole(open_hole)
        
        # Generate schematic
        fig, ax = well.plot()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close(fig)
        
        return WellSchematicResponse(
            success=True,
            image_base64=image_base64,
            message="Well schematic generated successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating well schematic: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "well-schematics"}

# Export the router
__all__ = ["router"]
