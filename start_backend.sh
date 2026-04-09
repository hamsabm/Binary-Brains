#!/bin/bash
set -e
echo "=== AI Cyber War Room Backend ==="
cd backend
echo "Installing dependencies..."
pip install -r requirements.txt -q
echo "Starting FastAPI server on port 8000..."
python main.py
