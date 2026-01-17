#!/bin/bash
set -e

# Harness Runner Script
# This script orchestrates the harness test in Docker environment

echo "🚀 Starting ShellSync Harness..."

# Check if running in Docker (backend is separate container)
if [ -n "$DOCKER_ENV" ] || [ -f /.dockerenv ]; then
    echo "� Running in Docker environment..."
    echo "⏳ Waiting for backend to be ready..."
    
    # Wait for backend to be available
    BACKEND_HOST="${SHELLSYNC_HOST:-backend}"
    for i in {1..30}; do
        if nc -z "$BACKEND_HOST" 8100 2>/dev/null; then
            echo "✅ Backend is ready!"
            break
        fi
        echo "   Waiting for backend... ($i/30)"
        sleep 1
    done
else
    # Local development: Start Backend in background if not running
    if ! pgrep -x "server" > /dev/null; then
        echo "📦 Starting Backend Server..."
        go run backend/cmd/server/main.go &
        BACKEND_PID=$!
        trap "kill $BACKEND_PID 2>/dev/null" EXIT
        echo "⏳ Waiting for backend..."
        sleep 2
    fi
fi

# Run the Harness Logic
echo "🛠️ Running Harness logic..."
go run harness/main.go "$@"

echo "✅ Harness execution complete."
