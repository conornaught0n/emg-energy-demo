/**
 * EMG Energy Sync Server
 * Simple HTTP server for syncing data between browser and file system
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const storageManager = require('./storage-manager');

const PORT = 8081;

// Initialize storage
storageManager.initializeStorage();

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Parse URL
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    console.log(`${req.method} ${pathname}`);

    // Routes
    if (pathname === '/api/sync' && req.method === 'POST') {
        handleSync(req, res);
    } else if (pathname === '/api/surveys' && req.method === 'GET') {
        handleGetAllSurveys(req, res);
    } else if (pathname.startsWith('/api/survey/') && req.method === 'GET') {
        const jobId = pathname.split('/').pop();
        handleGetSurvey(jobId, req, res);
    } else if (pathname.startsWith('/api/survey/') && req.method === 'DELETE') {
        const jobId = pathname.split('/').pop();
        handleDeleteSurvey(jobId, req, res);
    } else if (pathname === '/api/stats' && req.method === 'GET') {
        handleGetStats(req, res);
    } else if (pathname === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'EMG Energy Sync Server' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

function handleSync(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const data = JSON.parse(body);

            if (Array.isArray(data)) {
                // Sync multiple surveys
                let synced = 0;
                data.forEach(survey => {
                    storageManager.saveSurvey(survey);
                    synced++;
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    synced: synced,
                    message: `Synced ${synced} surveys to file system`
                }));
            } else {
                // Sync single survey
                storageManager.saveSurvey(data);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Survey synced to file system'
                }));
            }
        } catch (error) {
            console.error('Sync error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    });
}

function handleGetAllSurveys(req, res) {
    try {
        const surveys = storageManager.loadAllSurveys();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            count: surveys.length,
            surveys: surveys
        }));
    } catch (error) {
        console.error('Load error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}

function handleGetSurvey(jobId, req, res) {
    try {
        const survey = storageManager.loadSurvey(jobId);

        if (!survey) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Survey not found' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            survey: survey
        }));
    } catch (error) {
        console.error('Load error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}

function handleDeleteSurvey(jobId, req, res) {
    try {
        const deleted = storageManager.deleteSurvey(jobId);

        if (deleted) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Survey deleted'
            }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Survey not found' }));
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}

function handleGetStats(req, res) {
    try {
        const stats = storageManager.getSurveyStats();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            stats: stats
        }));
    } catch (error) {
        console.error('Stats error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}

server.listen(PORT, () => {
    console.log('\n🚀 EMG Energy Sync Server Started');
    console.log(`📡 Listening on http://localhost:${PORT}`);
    console.log(`📂 Storage: ${path.join(__dirname, '../data')}`);
    console.log('\nEndpoints:');
    console.log(`  POST   /api/sync          - Sync survey data`);
    console.log(`  GET    /api/surveys       - Get all surveys`);
    console.log(`  GET    /api/survey/:id    - Get specific survey`);
    console.log(`  DELETE /api/survey/:id    - Delete survey`);
    console.log(`  GET    /api/stats         - Get statistics`);
    console.log(`  GET    /api/health        - Health check`);
    console.log('\n✅ Ready to sync data!\n');
});
