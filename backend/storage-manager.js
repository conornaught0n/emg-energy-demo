/**
 * EMG Energy Backend Storage Manager
 * Handles persistent storage of surveys, PDFs, and data management
 */

const fs = require('fs');
const path = require('path');

// Storage paths
const STORAGE_ROOT = path.join(__dirname, '../data');
const SURVEYS_DIR = path.join(STORAGE_ROOT, 'surveys');
const PDFS_DIR = path.join(STORAGE_ROOT, 'pdfs');
const REPORTS_DIR = path.join(STORAGE_ROOT, 'reports');

// Ensure directories exist
function initializeStorage() {
    [STORAGE_ROOT, SURVEYS_DIR, PDFS_DIR, REPORTS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        }
    });
}

// Save survey data to file
function saveSurvey(surveyData) {
    const filename = `${surveyData.jobId}.json`;
    const filepath = path.join(SURVEYS_DIR, filename);

    const surveyWithMetadata = {
        ...surveyData,
        lastModified: new Date().toISOString(),
        version: 1
    };

    fs.writeFileSync(filepath, JSON.stringify(surveyWithMetadata, null, 2));
    console.log(`✅ Saved survey: ${filepath}`);

    return filepath;
}

// Load all surveys
function loadAllSurveys() {
    if (!fs.existsSync(SURVEYS_DIR)) {
        return [];
    }

    const files = fs.readdirSync(SURVEYS_DIR).filter(f => f.endsWith('.json'));
    const surveys = files.map(file => {
        const filepath = path.join(SURVEYS_DIR, file);
        const content = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(content);
    });

    return surveys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Load specific survey
function loadSurvey(jobId) {
    const filepath = path.join(SURVEYS_DIR, `${jobId}.json`);

    if (!fs.existsSync(filepath)) {
        return null;
    }

    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
}

// Delete survey
function deleteSurvey(jobId) {
    const surveyPath = path.join(SURVEYS_DIR, `${jobId}.json`);
    const pdfPath = path.join(PDFS_DIR, `${jobId}.pdf`);
    const reportPath = path.join(REPORTS_DIR, `${jobId}.html`);

    let deleted = [];

    if (fs.existsSync(surveyPath)) {
        fs.unlinkSync(surveyPath);
        deleted.push('survey');
    }

    if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        deleted.push('pdf');
    }

    if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath);
        deleted.push('report');
    }

    console.log(`✅ Deleted ${deleted.join(', ')} for job ${jobId}`);
    return deleted.length > 0;
}

// Update survey
function updateSurvey(jobId, updates) {
    const survey = loadSurvey(jobId);

    if (!survey) {
        return null;
    }

    const updatedSurvey = {
        ...survey,
        ...updates,
        lastModified: new Date().toISOString()
    };

    saveSurvey(updatedSurvey);
    return updatedSurvey;
}

// Save PDF report
function savePDFReport(jobId, htmlContent) {
    const filename = `${jobId}.html`;
    const filepath = path.join(REPORTS_DIR, filename);

    fs.writeFileSync(filepath, htmlContent);
    console.log(`✅ Saved PDF report: ${filepath}`);

    return filepath;
}

// Get survey statistics
function getSurveyStats() {
    const surveys = loadAllSurveys();

    const stats = {
        total: surveys.length,
        active: surveys.filter(s => s.status === 'pending' || s.status === 'in-progress').length,
        review: surveys.filter(s => s.status === 'review').length,
        completed: surveys.filter(s => s.status === 'completed').length,
        totalVoiceNotes: surveys.reduce((sum, s) => sum + (s.voiceNotes?.length || 0), 0),
        totalPhotos: surveys.reduce((sum, s) => sum + (s.photos?.length || 0), 0)
    };

    return stats;
}

// Export survey data (for backup/export)
function exportAllSurveys() {
    const surveys = loadAllSurveys();
    const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        surveys: surveys
    };

    const filepath = path.join(STORAGE_ROOT, `export-${Date.now()}.json`);
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

    console.log(`✅ Exported ${surveys.length} surveys to: ${filepath}`);
    return filepath;
}

// Import survey data
function importSurveys(importFilePath) {
    const content = fs.readFileSync(importFilePath, 'utf8');
    const importData = JSON.parse(content);

    let imported = 0;

    importData.surveys.forEach(survey => {
        saveSurvey(survey);
        imported++;
    });

    console.log(`✅ Imported ${imported} surveys`);
    return imported;
}

// Sync from localStorage data (browser -> file system)
function syncFromLocalStorage(localStorageData) {
    const allJobs = JSON.parse(localStorageData);

    let synced = 0;
    allJobs.forEach(job => {
        saveSurvey(job);
        synced++;
    });

    console.log(`✅ Synced ${synced} jobs from localStorage to file system`);
    return synced;
}

module.exports = {
    initializeStorage,
    saveSurvey,
    loadAllSurveys,
    loadSurvey,
    deleteSurvey,
    updateSurvey,
    savePDFReport,
    getSurveyStats,
    exportAllSurveys,
    importSurveys,
    syncFromLocalStorage
};

// CLI usage
if (require.main === module) {
    initializeStorage();

    const command = process.argv[2];

    if (command === 'stats') {
        const stats = getSurveyStats();
        console.log('\n📊 Survey Statistics:');
        console.log(`Total Surveys: ${stats.total}`);
        console.log(`Active: ${stats.active}`);
        console.log(`Review: ${stats.review}`);
        console.log(`Completed: ${stats.completed}`);
        console.log(`Total Voice Notes: ${stats.totalVoiceNotes}`);
        console.log(`Total Photos: ${stats.totalPhotos}`);
    } else if (command === 'list') {
        const surveys = loadAllSurveys();
        console.log(`\n📋 All Surveys (${surveys.length}):`);
        surveys.forEach(s => {
            console.log(`  ${s.projectReference} - ${s.address} (${s.status})`);
        });
    } else if (command === 'export') {
        const filepath = exportAllSurveys();
        console.log(`\n✅ Export complete: ${filepath}`);
    } else {
        console.log('\n📚 EMG Energy Storage Manager');
        console.log('Commands:');
        console.log('  node storage-manager.js stats    - Show statistics');
        console.log('  node storage-manager.js list     - List all surveys');
        console.log('  node storage-manager.js export   - Export all surveys');
    }
}
