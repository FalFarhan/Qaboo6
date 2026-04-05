#!/usr/bin/env python3
"""
QABOOT V4 - Static Site Builder
Build Flask templates to Static HTML
"""

import os
import shutil
from pathlib import Path

def build_static_site():
    """Build static website"""
    
    # Directories
    base_dir = Path(__file__).parent
    build_dir = base_dir / 'dist'
    static_dir = base_dir / 'static'
    templates_dir = base_dir / 'templates'
    
    # Create build directory
    if build_dir.exists():
        shutil.rmtree(build_dir)
    build_dir.mkdir()
    
    # Copy static files
    print("[1/3] Copying Static Files...")
    shutil.copytree(static_dir, build_dir / 'static')
    
    # Copy CSS/JS from root
    for ext in ['*.css', '*.js']:
        for file in base_dir.glob(ext):
            dest_dir = build_dir / 'static'
            if file.suffix == '.css':
                dest_dir = build_dir / 'static' / 'css'
            elif file.suffix == '.js':
                dest_dir = build_dir / 'static' / 'js'
            dest_dir.mkdir(exist_ok=True)
            shutil.copy(file, dest_dir / file.name)
    
    # Read template
    print("[2/3] Building HTML...")
    template_file = templates_dir / 'index.html'
    with open(template_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Replace Flask URLs
    html = html.replace("{{ url_for('static', filename='css/main.css') }}", "static/css/main.css")
    html = html.replace("{{ url_for('static', filename='js/formatters.js') }}", "static/js/formatters.js")
    html = html.replace("{{ url_for('static', filename='js/app.js') }}", "static/js/app.js")
    html = html.replace("?v=777777", "?v=" + str(int(os.path.getmtime(template_file))))
    
    # Add API config for static site
    api_config = """<script>
// API Configuration
const API_BASE = 'https://api.binance.com';
const USE_MOCK_DATA = false;
</script>
"""
    html = html.replace('</head>', api_config + '\n</head>')
    
    # Save HTML
    output_file = build_dir / 'index.html'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("[3/3] Done!")
    print(f"Build complete: {build_dir}")
    print(f"Open: {build_dir / 'index.html'}")
    
    return build_dir

if __name__ == '__main__':
    build_static_site()
