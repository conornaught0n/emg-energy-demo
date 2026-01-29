/**
 * EMG Energy Manager Triage Dashboard
 * Handles project review, editing, and PDF generation
 */

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

let currentProject = null;
let currentTestResults = [];
let editingTestId = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadPendingProjects();
}

async function loadPendingProjects() {
    try {
        const response = await fetch(`${API_BASE}/manager/projects/pending`);
        const data = await response.json();

        if (data.success) {
            displayProjectList(data.projects);
            document.getElementById('pendingCount').textContent = `${data.projects.length} Pending`;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        console.log('Backend not available - loading demo data');
        loadDemoData();
    }
}

function loadDemoData() {
    // Load REAL data from field operator via localStorage
    const currentProject = JSON.parse(localStorage.getItem('emg_current_project') || 'null');
    const voiceNotes = JSON.parse(localStorage.getItem('emg_voice_notes') || '[]');
    const photos = JSON.parse(localStorage.getItem('emg_photos') || '[]');

    if (!currentProject) {
        // No real data yet - show instructions
        const listEl = document.getElementById('projectList');
        listEl.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3 style="color: #2C5F2D; margin-bottom: 15px;">No Projects Yet</h3>
                <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                    To test the system:<br><br>
                    1. Open the <strong>Field Operator</strong> interface<br>
                    2. Enter a property address<br>
                    3. Capture voice notes and photos<br>
                    4. Return here to review
                </p>
                <a href="../field/index.html" style="display: inline-block; background: #2C5F2D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Go to Field Interface →
                </a>
            </div>
        `;
        document.getElementById('pendingCount').textContent = '0 Pending';
        return;
    }

    const projects = [{
        project_id: currentProject.project_id,
        project_reference: currentProject.project_reference,
        address: currentProject.address,
        created_at: currentProject.created_at,
        voice_notes: voiceNotes.length,
        photos: photos.length,
        needs_review: 0,
        status: currentProject.status
    }];

    displayProjectList(projects);
    document.getElementById('pendingCount').textContent = `${projects.length} Pending`;

    // Auto-load the real project
    loadDemoProjectDetails(currentProject.project_id);
}

function displayProjectList(projects) {
    const listEl = document.getElementById('projectList');
    listEl.innerHTML = '';

    if (projects.length === 0) {
        listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No pending projects</div>';
        return;
    }

    projects.forEach((project, index) => {
        const div = document.createElement('div');
        div.className = 'project-item' + (index === 0 ? ' active' : '');
        div.innerHTML = `
            <div class="project-ref">${project.project_reference}</div>
            <div class="project-address">${project.address}</div>
            <div class="project-meta">
                <span>🎤 ${project.voice_notes}</span>
                <span>📷 ${project.photos}</span>
                ${project.needs_review > 0 ? `<span class="badge">${project.needs_review} ⚠️</span>` : ''}
            </div>
        `;

        div.addEventListener('click', () => {
            document.querySelectorAll('.project-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            loadProjectDetails(project.project_id);
        });

        listEl.appendChild(div);
    });

    // Auto-load first project
    if (projects.length > 0) {
        loadProjectDetails(projects[0].project_id);
    }
}

async function loadProjectDetails(projectId) {
    try {
        const response = await fetch(`${API_BASE}/manager/project/${projectId}`);
        const data = await response.json();

        if (data.success) {
            currentProject = data;
            currentTestResults = data.test_results;
            displayProjectData(data);
        }
    } catch (error) {
        console.error('Error loading project details:', error);
        loadDemoProjectDetails(projectId);
    }
}

function loadDemoProjectDetails(projectId) {
    // Load REAL captured data from localStorage
    const project = JSON.parse(localStorage.getItem('emg_current_project') || 'null');
    const voiceNotes = JSON.parse(localStorage.getItem('emg_voice_notes') || '[]');
    const photos = JSON.parse(localStorage.getItem('emg_photos') || '[]');

    if (!project) {
        return;
    }

    // Generate simulated test results from captured data
    const testResults = [];

    // If we have photos, generate test results
    if (photos.length > 0) {
        const testTypes = [
            { param: 'Air Leakage Rate', value: 3.8 + Math.random() * 0.8, unit: 'm³/h/m²', location: 'Building Envelope', type: 'Air Permeability', max: 5.0 },
            { param: 'Wall Thermal Transmittance', value: 0.26 + Math.random() * 0.06, unit: 'W/m²K', location: 'External Walls', type: 'U-Value', max: 0.32 },
            { param: 'Roof Thermal Transmittance', value: 0.15 + Math.random() * 0.05, unit: 'W/m²K', location: 'Roof', type: 'U-Value', max: 0.20 },
            { param: 'Window Thermal Transmittance', value: 1.4 + Math.random() * 0.2, unit: 'W/m²K', location: 'Windows', type: 'U-Value', max: 1.6 }
        ];

        testTypes.forEach((test, idx) => {
            if (idx < photos.length) {
                const value = parseFloat(test.value.toFixed(2));
                testResults.push({
                    id: `test-${idx + 1}`,
                    location_id: test.location,
                    test_type: test.type,
                    parameter: test.param,
                    value: value,
                    unit: test.unit,
                    status: value <= test.max ? 'PASS' : 'FAIL',
                    confidence: photos[idx].ocr_confidence || 0.88,
                    needs_review: (photos[idx].ocr_confidence || 0.88) < 0.85,
                    regulation_reference: `TGD L 2022 - Max ${test.max} ${test.unit}`
                });
            }
        });
    }

    const passedTests = testResults.filter(t => t.status === 'PASS').length;
    const failedTests = testResults.filter(t => t.status === 'FAIL').length;

    const realData = {
        project: {
            id: project.project_id,
            reference: project.project_reference,
            address: project.address,
            floor_area_m2: 150,
            wall_area_m2: 200
        },
        voice_notes: voiceNotes,
        photos: photos,
        test_results: testResults,
        overall_compliance: {
            total_tests: testResults.length,
            passed: passedTests,
            marginal: 0,
            failed: failedTests,
            overall_status: failedTests === 0 ? 'COMPLIANT' : 'NON-COMPLIANT'
        },
        pricing: {
            recommendations: failedTests > 0 ? [{
                service: 'Building Envelope Improvement',
                issue: 'Some parameters exceed Part L limits',
                cost: 2500 + (failedTests * 1000),
                priority: 'HIGH'
            }] : [],
            total_cost: failedTests > 0 ? 2500 + (failedTests * 1000) : 0,
            savings: {
                annual_euro: failedTests > 0 ? 450 : 0,
                annual_kwh: failedTests > 0 ? 3200 : 0
            }
        }
    };

    currentProject = realData;
    currentTestResults = realData.test_results;
    displayProjectData(realData);
}

function displayProjectData(data) {
    // Display voice notes
    displayVoiceNotes(data.voice_notes);

    // Display photos
    displayPhotos(data.photos);

    // Display test results
    displayTestResults(data.test_results);

    // Display compliance summary
    displayComplianceSummary(data.overall_compliance);

    // Display recommendations
    displayRecommendations(data.pricing);

    // Update report header
    document.getElementById('reportAddress').textContent = data.project.address;
}

function displayVoiceNotes(voiceNotes) {
    const listEl = document.getElementById('voiceNotesList');
    document.getElementById('voiceNoteCount').textContent = voiceNotes.length;

    if (voiceNotes.length === 0) {
        listEl.innerHTML = '<div style="color: #999; font-style: italic;">No voice notes</div>';
        return;
    }

    listEl.innerHTML = '';

    voiceNotes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'voice-note';

        const confidence = note.confidence || 0;
        const confidenceClass = confidence > 0.95 ? '' : (confidence > 0.85 ? 'medium' : 'low');
        const confidencePercent = (confidence * 100).toFixed(0);

        div.innerHTML = `
            <div class="voice-time">${formatTime(note.captured_at)}</div>
            <div class="voice-text">${note.transcription || 'Processing...'}</div>
            <div class="confidence-bar">
                <div class="confidence-fill ${confidenceClass}" style="width: ${confidencePercent}%"></div>
            </div>
        `;

        listEl.appendChild(div);
    });
}

function displayPhotos(photos) {
    const gridEl = document.getElementById('photoGrid');
    document.getElementById('photoCount').textContent = photos.length;

    if (photos.length === 0) {
        gridEl.innerHTML = '<div style="color: #999; font-style: italic;">No photos yet - capture from field interface</div>';
        return;
    }

    gridEl.innerHTML = '';

    photos.forEach(photo => {
        const div = document.createElement('div');
        div.className = 'photo-item';

        // Show the actual captured photo
        const imgSrc = photo.file_data || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ccc%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22 font-size=%2214%22%3E' + photo.photo_type + '%3C/text%3E%3C/svg%3E';

        div.innerHTML = `
            <img src="${imgSrc}" alt="${photo.photo_type}" style="cursor: pointer;"
                 title="Click to view full size - ${photo.photo_type}" />
        `;

        div.addEventListener('click', () => {
            showPhotoModal(photo);
        });

        gridEl.appendChild(div);
    });
}

function displayTestResults(testResults) {
    const tableEl = document.getElementById('testResultsTable');

    if (testResults.length === 0) {
        tableEl.innerHTML = '<div style="color: #999; font-style: italic; padding: 20px;">No test results yet</div>';
        return;
    }

    let html = `
        <div class="test-result-row header">
            <div>Parameter</div>
            <div>Value</div>
            <div>Status</div>
            <div>Confidence</div>
        </div>
    `;

    testResults.forEach(test => {
        const confidence = test.confidence || 1.0;
        const needsReview = test.needs_review || confidence < 0.85;
        const statusClass = test.status === 'PASS' ? 'status-pass' :
                           (test.status === 'MARGINAL' ? 'status-marginal' : 'status-fail');

        html += `
            <div class="test-result-row">
                <div>
                    <strong>${test.parameter}</strong><br>
                    <small style="color: #666;">${test.location_id}</small>
                </div>
                <div class="editable-value ${needsReview ? 'needs-review' : ''}"
                     onclick="editTestValue('${test.id}', '${test.parameter}', ${test.value})"
                     title="${needsReview ? 'Click to review - Low confidence OCR' : 'Click to edit'}">
                    ${test.value} ${test.unit}
                    ${needsReview ? ' ⚠️' : ''}
                </div>
                <div>
                    <span class="status-badge ${statusClass}">${test.status}</span>
                </div>
                <div style="text-align: center;">
                    ${(confidence * 100).toFixed(0)}%
                </div>
            </div>
        `;
    });

    tableEl.innerHTML = html;
}

function displayComplianceSummary(compliance) {
    document.getElementById('totalTests').textContent = compliance.total_tests;
    document.getElementById('passedTests').textContent = compliance.passed;
    document.getElementById('marginalTests').textContent = compliance.marginal;
    document.getElementById('failedTests').textContent = compliance.failed;
}

function displayRecommendations(pricing) {
    const listEl = document.getElementById('recommendationsList');

    if (!pricing.recommendations || pricing.recommendations.length === 0) {
        listEl.innerHTML = '<div style="color: #666;">No improvements required - All tests passed!</div>';
        document.getElementById('totalCost').textContent = '€0.00';
        return;
    }

    listEl.innerHTML = '';

    pricing.recommendations.forEach((rec, index) => {
        if (rec.priority !== 'OPTIONAL') {
            const div = document.createElement('div');
            div.className = 'recommendation-item' + (rec.priority === 'HIGH' ? ' high-priority' : '');

            const detailsList = rec.details
                ? '<ul style="margin-top: 10px; padding-left: 20px;">' +
                  rec.details.map(d => `<li>${d}</li>`).join('') +
                  '</ul>'
                : '';

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                            ${index + 1}. ${rec.service}
                        </div>
                        <div style="color: #666; margin-bottom: 10px;">
                            <strong>Issue:</strong> ${rec.issue}
                        </div>
                        <div style="display: inline-block; padding: 4px 10px; background: ${rec.priority === 'HIGH' ? '#D32F2F' : '#FF9800'}; color: white; border-radius: 12px; font-size: 12px; font-weight: bold;">
                            ${rec.priority} PRIORITY
                        </div>
                    </div>
                    <div class="recommendation-cost">€${rec.cost.toFixed(2)}</div>
                </div>
                ${detailsList}
            `;

            listEl.appendChild(div);
        }
    });

    document.getElementById('totalCost').textContent = `€${pricing.total_cost.toFixed(2)}`;
}

function editTestValue(testId, parameter, currentValue) {
    editingTestId = testId;

    document.getElementById('editModalTitle').textContent = `Edit ${parameter}`;
    document.getElementById('editModalContext').textContent = `Current value: ${currentValue}`;
    document.getElementById('editValueInput').value = currentValue;

    document.getElementById('editModal').classList.add('active');
    document.getElementById('editValueInput').focus();
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingTestId = null;
}

async function saveEditedValue() {
    const newValue = parseFloat(document.getElementById('editValueInput').value);

    if (isNaN(newValue)) {
        showNotification('Please enter a valid number');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/manager/test-result/${editingTestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                value: newValue,
                reviewed_by: 'manager-user-id'  // TODO: Get from auth
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Value updated successfully');
            closeEditModal();

            // Reload project to reflect changes
            await loadProjectDetails(currentProject.project.id);
        } else {
            showNotification('Failed to update value');
        }
    } catch (error) {
        console.error('Error updating value:', error);
        showNotification('Error updating value');
    }
}

function sendBackToField() {
    const reason = prompt('Reason for sending back to field operator:');
    if (reason) {
        showNotification('Project sent back to field operator');
        // TODO: Implement send-back functionality
    }
}

async function approveAndGenerate() {
    if (!confirm('Generate final PDF report and mark project as complete?')) {
        return;
    }

    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();

    if (!isBackendAvailable) {
        // Demo mode - use browser print
        if (confirm('Backend not available (Demo Mode).\n\nWould you like to print the report using your browser instead?')) {
            printReport();
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/manager/project/${currentProject.project.id}/generate-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                report_type: 'client',
                approved_by: 'manager-user-id'  // TODO: Get from auth
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('PDF generated successfully!');

            // Open PDF in new tab
            window.open(data.pdf_url, '_blank');

            // Reload projects list
            await loadPendingProjects();
        } else {
            showNotification('Failed to generate PDF');
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF - trying browser print instead');
        printReport();
    }
}

async function checkBackendAvailability() {
    try {
        const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

function printReport() {
    // Create a print-friendly version of the report
    const reportContent = document.getElementById('draftReport').cloneNode(true);

    // Remove action buttons from print view
    const actionButtons = reportContent.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.remove();
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>EMG Energy Assessment Report</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                    max-width: 210mm;
                    margin: 0 auto;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #2C5F2D;
                }
                .report-title {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2C5F2D;
                    margin-bottom: 10px;
                }
                .compliance-summary {
                    background: linear-gradient(135deg, #2C5F2D 0%, #1a3a1b 100%);
                    color: white;
                    padding: 25px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-top: 15px;
                }
                .summary-item {
                    text-align: center;
                }
                .summary-number {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .summary-label {
                    font-size: 12px;
                    opacity: 0.9;
                }
                .test-result-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 15px;
                    padding: 15px;
                    border-bottom: 1px solid #e0e0e0;
                    align-items: center;
                }
                .test-result-row.header {
                    background: #2C5F2D;
                    color: white;
                    font-weight: bold;
                    border-radius: 8px 8px 0 0;
                }
                .status-badge {
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-weight: bold;
                    font-size: 12px;
                    text-align: center;
                    display: inline-block;
                }
                .status-pass {
                    background: #4CAF50;
                    color: white;
                }
                .status-marginal {
                    background: #FF9800;
                    color: white;
                }
                .status-fail {
                    background: #D32F2F;
                    color: white;
                }
                .recommendations-section {
                    background: #e8f5e9;
                    padding: 25px;
                    border-radius: 12px;
                    margin-top: 30px;
                    page-break-inside: avoid;
                }
                .recommendation-item {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border-left: 4px solid #FF9800;
                    page-break-inside: avoid;
                }
                .recommendation-item.high-priority {
                    border-left-color: #D32F2F;
                }
                .recommendation-cost {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2C5F2D;
                    margin-top: 10px;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .compliance-summary {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .status-badge {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            ${reportContent.innerHTML}
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
                <p><strong>EMG Energy Consultants</strong></p>
                <p>Suite 17, Block A, Clare Technology Park, Gort Road, Ennis, Co. Clare</p>
                <p>📧 info@emgenergy.ie | 📞 065 672 9090 | 🌐 emgenergy.ie</p>
                <p style="margin-top: 15px;">Energy Compliance Experts | Serving Ireland Nationwide</p>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print();
    }, 500);

    showNotification('Opening print dialog...');
}

function showPhotoModal(photo) {
    // Show full-size photo in new window
    const photoWindow = window.open('', '_blank', 'width=800,height=600');
    photoWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Photo: ${photo.photo_type}</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background: #000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    font-family: Arial, sans-serif;
                }
                img {
                    max-width: 100%;
                    max-height: 80vh;
                    box-shadow: 0 4px 20px rgba(255,255,255,0.2);
                }
                .info {
                    color: white;
                    background: rgba(255,255,255,0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <img src="${photo.file_data}" alt="${photo.photo_type}" />
            <div class="info">
                <strong>Type:</strong> ${photo.photo_type}<br>
                <strong>Captured:</strong> ${new Date(photo.captured_at).toLocaleString()}<br>
                <strong>OCR Confidence:</strong> ${(photo.ocr_confidence * 100).toFixed(0)}%
            </div>
        </body>
        </html>
    `);
    photoWindow.document.close();
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
}

function showNotification(message) {
    alert(message);  // Simple notification - can be enhanced
}

// Keyboard shortcut for approve (Ctrl+Enter)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        approveAndGenerate();
    }
});
