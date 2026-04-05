import subprocess
import sys
import os

# Kill any existing Python processes on port 5000
os.system('taskkill /F /IM python.exe 2>nul')

# Clear cache
if os.path.exists('__pycache__'):
    import shutil
    shutil.rmtree('__pycache__')

# Start fresh server
print("Starting fresh server...")
subprocess.Popen([sys.executable, 'preview-server.py'])
print("Server started!")