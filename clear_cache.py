import os
import shutil

# Clear Python cache
if os.path.exists('__pycache__'):
    shutil.rmtree('__pycache__')
    print('Cache cleared')
else:
    print('No cache found')