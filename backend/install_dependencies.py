#!/usr/bin/env python3
"""
Install Python dependencies for H2Oil Complete Backend
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install Python requirements"""
    backend_dir = Path(__file__).parent
    requirements_file = backend_dir / "requirements.txt"
    
    print("Installing Python dependencies for H2Oil Complete Backend...")
    print(f"Requirements file: {requirements_file}")
    
    try:
        # Install requirements
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ])
        
        print("✅ All dependencies installed successfully!")
        print("\nInstalled packages:")
        print("- well_profile: Python tool for well trajectories")
        print("- fastapi: Modern web framework for building APIs")
        print("- uvicorn: ASGI server for FastAPI")
        print("- pandas: Data manipulation and analysis")
        print("- numpy: Numerical computing")
        print("- openpyxl: Excel file support")
        print("- plotly: Interactive plotting")
        print("- pydantic: Data validation")
        
        print("\n🚀 Backend is ready to run!")
        print("Run: python run_server.py")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure Python is installed and in PATH")
        print("2. Try: python -m pip install --upgrade pip")
        print("3. Try: python -m pip install -r requirements.txt --user")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ Python not found. Please install Python 3.8+ and try again.")
        sys.exit(1)

if __name__ == "__main__":
    install_requirements()
