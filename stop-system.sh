#!/bin/bash
# EMG Energy System Shutdown Script

echo ""
echo "🛑 EMG ENERGY SYSTEM SHUTDOWN"
echo "═══════════════════════════════════════════════════════"
echo ""

# Stop web server on port 8080
if WEB_PID=$(lsof -Pi :8080 -sTCP:LISTEN -t 2>/dev/null); then
    echo "🌐 Stopping web server (PID: $WEB_PID)..."
    kill $WEB_PID 2>/dev/null
    echo "✅ Web server stopped"
else
    echo "ℹ️  Web server not running"
fi

echo ""

# Stop sync server on port 8081
if SYNC_PID=$(lsof -Pi :8081 -sTCP:LISTEN -t 2>/dev/null); then
    echo "📡 Stopping sync server (PID: $SYNC_PID)..."
    kill $SYNC_PID 2>/dev/null
    echo "✅ Sync server stopped"
else
    echo "ℹ️  Sync server not running"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ EMG ENERGY SYSTEM STOPPED"
echo ""
