#!/bin/bash
# Bash script to kill process on port (Unix/Linux/macOS)

PORT=${1:-${PORT:-3001}}

echo "🔍 Checking for process on port $PORT..."

PID=$(lsof -ti :$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "ℹ️  No process found on port $PORT"
    exit 0
fi

echo "🛑 Killing process(es) on port $PORT: $PID"
kill -9 $PID 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Killed process(es) on port $PORT"
else
    echo "⚠️  Failed to kill process(es) on port $PORT"
    exit 1
fi

