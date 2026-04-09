#!/bin/bash
set -e
echo "=== AI Cyber War Room Frontend ==="
cd frontend
echo "Installing npm packages..."
npm install --silent
echo "Starting React on port 3000..."
npm start
