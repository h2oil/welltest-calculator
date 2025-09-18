"""
Vercel serverless function entry point for H2Oil Backend API
"""

from main import app

# This is the entry point for Vercel
handler = app
