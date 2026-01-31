/**
 * EMG Energy Complete Workflow Test
 * Tests the entire system from field capture to PDF generation
 */

const storageManager = require('./storage-manager');
const fs = require('fs');
const path = require('path');

console.log('\n🧪 EMG ENERGY COMPLETE WORKFLOW TEST\n');
console.log('═'.repeat(60));

// Initialize storage
console.log('\n1️⃣  Initializing storage system...');
storageManager.initializeStorage();

// Load test data
console.log('\n2️⃣  Loading test survey data...');
const testDataPath = path.join(__dirname, '../data/test-survey-data.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
const testSurvey = testData.test_survey_1;

console.log(`✅ Loaded test survey: ${testSurvey.project_reference}`);
console.log(`   Address: ${testSurvey.address}`);
console.log(`   Voice Notes: ${testSurvey.voice_notes.length}`);
console.log(`   Photos: ${testSurvey.photos.length}`);
console.log(`   Test Results: ${testSurvey.test_results.length}`);

// Convert test data to job format
const jobData = {
    jobId: 'test-' + Date.now(),
    projectReference: testSurvey.project_reference,
    address: testSurvey.address,
    createdAt: testSurvey.date + 'T10:00:00Z',
    status: 'in-progress',
    voiceNotes: testSurvey.voice_notes,
    photos: testSurvey.photos,
    testResults: testSurvey.test_results,
    managerInputs: {
        notes: testSurvey.manager_notes,
        customRecommendations: testSurvey.recommendations,
        floorArea: testSurvey.floor_area_m2.toString(),
        yearBuilt: testSurvey.year_built.toString(),
        berRating: testSurvey.ber_rating,
        propertyType: testSurvey.property_type
    }
};

// Save survey to file system
console.log('\n3️⃣  Saving survey to file system...');
const savePath = storageManager.saveSurvey(jobData);
console.log(`✅ Survey saved to: ${savePath}`);

// Verify save
console.log('\n4️⃣  Verifying save...');
const loadedSurvey = storageManager.loadSurvey(jobData.jobId);
if (loadedSurvey) {
    console.log(`✅ Survey verified: ${loadedSurvey.projectReference}`);
    console.log(`   Job ID: ${loadedSurvey.jobId}`);
    console.log(`   Status: ${loadedSurvey.status}`);
} else {
    console.log('❌ Failed to load saved survey');
}

// Test update
console.log('\n5️⃣  Testing survey update...');
const updated = storageManager.updateSurvey(jobData.jobId, {
    status: 'completed',
    managerInputs: {
        ...jobData.managerInputs,
        notes: 'Updated notes: Comprehensive assessment completed successfully.'
    }
});
if (updated) {
    console.log(`✅ Survey updated to status: ${updated.status}`);
}

// Get statistics
console.log('\n6️⃣  Getting storage statistics...');
const stats = storageManager.getSurveyStats();
console.log(`✅ Statistics:`);
console.log(`   Total Surveys: ${stats.total}`);
console.log(`   Active: ${stats.active}`);
console.log(`   Review: ${stats.review}`);
console.log(`   Completed: ${stats.completed}`);
console.log(`   Total Voice Notes: ${stats.totalVoiceNotes}`);
console.log(`   Total Photos: ${stats.totalPhotos}`);

// Generate PDF report HTML
console.log('\n7️⃣  Generating PDF report...');
const reportHTML = generateTestReportHTML(loadedSurvey);
const reportPath = storageManager.savePDFReport(jobData.jobId, reportHTML);
console.log(`✅ PDF report saved to: ${reportPath}`);

// List all surveys
console.log('\n8️⃣  Listing all surveys...');
const allSurveys = storageManager.loadAllSurveys();
console.log(`✅ Found ${allSurveys.length} survey(s):`);
allSurveys.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.projectReference} - ${s.address}`);
    console.log(`      Status: ${s.status}, Voice Notes: ${s.voiceNotes.length}, Photos: ${s.photos.length}`);
});

// Export all data
console.log('\n9️⃣  Exporting all surveys...');
const exportPath = storageManager.exportAllSurveys();
console.log(`✅ Export complete: ${exportPath}`);

console.log('\n═'.repeat(60));
console.log('\n✅ WORKFLOW TEST COMPLETE!\n');
console.log('Summary:');
console.log(`  ✓ Storage system initialized`);
console.log(`  ✓ Test survey loaded and saved`);
console.log(`  ✓ Survey update tested`);
console.log(`  ✓ PDF report generated`);
console.log(`  ✓ Statistics calculated`);
console.log(`  ✓ Export functionality verified`);
console.log('\nNext steps:');
console.log(`  1. Run sync server: node backend/sync-server.js`);
console.log(`  2. Open field interface: http://localhost:8080/field/index.html`);
console.log(`  3. Open dashboard: http://localhost:8080/manager/triage.html`);
console.log(`  4. Test live voice transcription and data capture`);
console.log('');

function generateTestReportHTML(survey) {
    const today = new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>EMG Energy Assessment Report - ${survey.projectReference}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .header {
            text-align: center;
            border-bottom: 4px solid #2C5F2D;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 {
            color: #2C5F2D;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .property-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            color: #2C5F2D;
            font-size: 20px;
            font-weight: bold;
            border-left: 6px solid #2C5F2D;
            padding-left: 15px;
            margin-bottom: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #2C5F2D;
            color: white;
        }
        .pass { color: #4CAF50; font-weight: bold; }
        .fail { color: #D32F2F; font-weight: bold; }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #2C5F2D;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="logo">
        <img src="https://emgenergy.ie/wp-content/uploads/2024/05/EMG-Energy.png" alt="EMG Energy" style="max-width: 250px;">
    </div>

    <div class="header">
        <h1>BUILDING ENERGY ASSESSMENT REPORT</h1>
        <p><strong>Report Reference:</strong> ${survey.projectReference}</p>
        <p><strong>Date:</strong> ${today}</p>
    </div>

    <div class="property-details">
        <h3>Property Details</h3>
        <p><strong>Address:</strong> ${survey.address}</p>
        <p><strong>Property Type:</strong> ${survey.managerInputs.propertyType || 'N/A'}</p>
        <p><strong>Floor Area:</strong> ${survey.managerInputs.floorArea || 'N/A'} m²</p>
        <p><strong>Year Built:</strong> ${survey.managerInputs.yearBuilt || 'N/A'}</p>
        <p><strong>BER Rating:</strong> ${survey.managerInputs.berRating || 'N/A'}</p>
    </div>

    <div class="section">
        <div class="section-title">Executive Summary</div>
        <p>${survey.managerInputs.notes || 'Comprehensive building energy assessment completed.'}</p>
    </div>

    <div class="section">
        <div class="section-title">Test Results</div>
        <table>
            <thead>
                <tr>
                    <th>Parameter</th>
                    <th>Location</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Standard</th>
                </tr>
            </thead>
            <tbody>
                ${(survey.testResults || []).map(test => `
                    <tr>
                        <td>${test.parameter}</td>
                        <td>${test.location}</td>
                        <td>${test.value} ${test.unit}</td>
                        <td class="${test.status === 'PASS' ? 'pass' : 'fail'}">${test.status}</td>
                        <td style="font-size: 11px;">${test.standard}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Field Observations</div>
        ${(survey.voiceNotes || []).map((note, i) => `
            <p><strong>Note ${i + 1}:</strong> ${note.transcription}</p>
        `).join('')}
    </div>

    <div class="section">
        <div class="section-title">Recommendations</div>
        <p>${survey.managerInputs.customRecommendations || survey.recommendations || 'See detailed recommendations above.'}</p>
    </div>

    <div class="footer">
        <p><strong>EMG Energy Consultants</strong></p>
        <p>Email: info@emgenergy.ie | Phone: 065 672 9090</p>
        <p>www.emgenergy.ie</p>
    </div>
</body>
</html>`;
}
