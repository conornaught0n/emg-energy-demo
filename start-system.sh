#!/bin/bash
# EMG Energy System Startup Script

echo ""
echo "🚀 EMG ENERGY SYSTEM STARTUP"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if already running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Web server already running on port 8080"
else
    echo "🌐 Starting web server on port 8080..."
    cd /home/blendie/emg-demo
    python3 -m http.server 8080 > /tmp/emg-web.log 2>&1 &
    WEB_PID=$!
    echo "✅ Web server started (PID: $WEB_PID)"
fi

echo ""

if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Sync server already running on port 8081"
else
    echo "📡 Starting sync server on port 8081..."
    cd /home/blendie/emg-demo
    node backend/sync-server.js > /tmp/emg-sync.log 2>&1 &
    SYNC_PID=$!
    echo "✅ Sync server started (PID: $SYNC_PID)"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ EMG ENERGY SYSTEM READY"
echo ""
echo "📱 Application URLs:"
echo "   Main Page:    http://localhost:8080/"
echo "   Field Ops:    http://localhost:8080/field/"
echo "   Dashboard:    http://localhost:8080/manager/triage.html"
echo ""
echo "🔧 Backend API:"
echo "   Sync Server:  http://localhost:8081/api"
echo "   Health:       http://localhost:8081/api/health"
echo ""
echo "📊 Management Commands:"
echo "   Statistics:   node backend/storage-manager.js stats"
echo "   List Jobs:    node backend/storage-manager.js list"
echo "   Export Data:  node backend/storage-manager.js export"
echo ""
echo "🧪 Testing:"
echo "   Full Test:    node backend/test-workflow.js"
echo "   Guide:        cat TESTING-GUIDE.md"
echo ""
echo "🛑 To stop servers:"
echo "   ./stop-system.sh"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
