# Python Installation Guide for H2Oil Complete

This guide will help you install Python and all required dependencies for the H2Oil Complete well_profile integration.

## 🐍 Step 1: Install Python

### Option A: Download from Python.org (Recommended)

1. **Go to Python Downloads**:
   - Visit: https://www.python.org/downloads/
   - Click "Download Python 3.11.x" (latest stable version)

2. **Run the Installer**:
   - Double-click the downloaded `.exe` file
   - ✅ **CRITICAL**: Check "Add Python to PATH" checkbox
   - Click "Install Now" (not "Customize installation")
   - Wait for installation to complete

3. **Verify Installation**:
   - Open Command Prompt or PowerShell
   - Type: `python --version`
   - You should see: `Python 3.11.x`

### Option B: Microsoft Store

1. Open Microsoft Store
2. Search for "Python 3.11"
3. Install the official Python package
4. Restart your terminal

### Option C: Chocolatey (if you have it)

```powershell
choco install python
```

## 🔧 Step 2: Install Python Dependencies

### Quick Installation (Recommended)

1. **Run the installation script**:
   ```bash
   install-python-deps.bat
   ```

2. **Or install manually**:
   ```bash
   cd backend
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```

### Manual Installation Steps

1. **Open Command Prompt or PowerShell**
2. **Navigate to the project directory**:
   ```bash
   cd "C:\Users\james\OneDrive\Documents\Cursor\Welltest App\wellspring-calculator"
   ```

3. **Install dependencies**:
   ```bash
   cd backend
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```

4. **Test installation**:
   ```bash
   python -c "import well_profile; print('well_profile version:', well_profile.__version__)"
   ```

## 🚀 Step 3: Start the Application

### Start Both Servers

1. **Using npm scripts**:
   ```bash
   npm run start:full
   ```

2. **Or start manually**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   python run_server.py

   # Terminal 2 - Frontend
   npm run dev
   ```

### Access the Application

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔍 Troubleshooting

### Python Not Found Error

**Error**: `Python was not found; run without arguments to install from the Microsoft Store`

**Solution**:
1. Reinstall Python from https://www.python.org/downloads/
2. Make sure to check "Add Python to PATH" during installation
3. Restart your terminal after installation

### Permission Denied Error

**Error**: `Permission denied` or `Access denied`

**Solution**:
```bash
python -m pip install --user -r requirements.txt
```

### Module Not Found Error

**Error**: `ModuleNotFoundError: No module named 'well_profile'`

**Solution**:
```bash
python -m pip install --upgrade pip
python -m pip install well_profile
```

### CORS Error

**Error**: `Access to fetch at 'http://localhost:8000' from origin 'http://localhost:8081' has been blocked by CORS policy`

**Solution**:
1. Make sure backend is running on port 8000
2. Check that CORS origins are configured in `backend/main.py`

### Backend Server Not Starting

**Error**: `Backend server not available`

**Solution**:
1. Check Python installation: `python --version`
2. Install dependencies: `cd backend && python -m pip install -r requirements.txt`
3. Start server manually: `cd backend && python run_server.py`

## 📱 Mobile Issues Fixed

The mobile responsiveness issues have been fixed with:

1. **Responsive Navigation**: Mobile-first design with collapsible elements
2. **Adaptive Tabs**: Shorter labels on mobile devices
3. **Flexible Layout**: Proper spacing and sizing for all screen sizes
4. **Touch-Friendly**: Larger touch targets for mobile devices

## ✅ Verification Checklist

- [ ] Python 3.8+ installed and in PATH
- [ ] `python --version` shows correct version
- [ ] All Python dependencies installed successfully
- [ ] Backend server starts without errors
- [ ] Frontend loads on both desktop and mobile
- [ ] Well trajectory calculator works with backend
- [ ] Excel import/export functionality works

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs**: Look at terminal output for error messages
2. **Verify Python**: Run `python --version` to confirm installation
3. **Test dependencies**: Run `python -c "import well_profile"` to test
4. **Check ports**: Ensure ports 8000 and 8081 are available
5. **Restart everything**: Close all terminals and restart

## 📞 Support

For additional help:
- Check the [well_profile documentation](https://github.com/pro-well-plan/well_profile)
- Review the backend logs for specific error messages
- Ensure all prerequisites are installed correctly

---

**Note**: This integration requires Python 3.8 or higher. The well_profile library is a Python package that provides professional-grade well trajectory calculations and 3D visualization capabilities.
