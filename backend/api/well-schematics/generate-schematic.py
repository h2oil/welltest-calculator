"""
Vercel serverless function for well schematic generation
"""

from http.server import BaseHTTPRequestHandler
import json
import base64
import io
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt

# Import wellschematicspy
try:
    from wellschematicspy import Well, OpenHole, Casing, Completion
except ImportError:
    # Fallback if wellschematicspy is not available
    Well = None
    OpenHole = None
    Casing = None
    Completion = None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Check if wellschematicspy is available
            if Well is None:
                self.send_error_response(500, "wellschematicspy library not available")
                return
            
            # Extract data from request
            well_name = request_data.get('well_name', 'Well-001')
            total_depth = request_data.get('total_depth', 5000)
            casings = request_data.get('casings', [])
            completions = request_data.get('completions', [])
            open_holes = request_data.get('open_holes', [])
            
            # Create well instance
            well = Well(name=well_name, total_depth=total_depth)
            
            # Add casings
            for casing_data in casings:
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
            for completion_data in completions:
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
            for open_hole_data in open_holes:
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
            
            # Send success response
            response_data = {
                "success": True,
                "image_base64": image_base64,
                "message": "Well schematic generated successfully"
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_error_response(500, f"Error generating well schematic: {str(e)}")
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_error_response(self, status_code, message):
        response_data = {
            "success": False,
            "message": message
        }
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())
