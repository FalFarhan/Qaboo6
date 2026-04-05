#!/usr/bin/env python3
"""
QABOOT V4 PRO - Debug Server
"""

from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)

# Debug mode
app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

@app.route('/')
def index():
    print("Accessing index...")
    try:
        return render_template('index.html')
    except Exception as e:
        print(f"Error: {e}")
        return f"Error: {str(e)}", 500

@app.route('/portfolio')
def portfolio():
    print("Accessing portfolio...")
    try:
        return render_template('portfolio.html')
    except Exception as e:
        print(f"Error: {e}")
        return f"Error: {str(e)}", 500

if __name__ == '__main__':
    print("="*60)
    print("QABOOT V4 PRO - Debug Server")
    print("="*60)
    print(f"Template folder: {app.template_folder}")
    print(f"Static folder: {app.static_folder}")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)