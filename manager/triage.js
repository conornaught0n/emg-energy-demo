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
    // Demo mode - show sample projects
    const demoProjects = [
        {
            project_id: 'demo-001',
            project_reference: 'EMG-2026-DEMO01',
            address: '123 Main Street, Ennis, Co. Clare',
            created_at: new Date().toISOString(),
            voice_notes: 3,
            photos: 5,
            needs_review: 2,
            status: 'in_progress'
        },
        {
            project_id: 'demo-002',
            project_reference: 'EMG-2026-DEMO02',
            address: '45 Park Avenue, Limerick City',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            voice_notes: 2,
            photos: 4,
            needs_review: 1,
            status: 'in_progress'
        }
    ];

    displayProjectList(demoProjects);
    document.getElementById('pendingCount').textContent = `${demoProjects.length} Pending`;

    // Auto-load first demo project
    loadDemoProjectDetails('demo-001');
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
    // Demo project data
    const demoData = {
        project: {
            id: projectId,
            reference: projectId === 'demo-001' ? 'EMG-2026-DEMO01' : 'EMG-2026-DEMO02',
            address: projectId === 'demo-001' ? '123 Main Street, Ennis, Co. Clare' : '45 Park Avenue, Limerick City',
            floor_area_m2: 150,
            wall_area_m2: 200
        },
        voice_notes: [
            {
                id: 'vn1',
                transcription: 'Property assessment for air permeability test. Building is a two-storey residential dwelling, approximately 150 square meters. Weather conditions are good, no wind.',
                confidence: 0.95,
                captured_at: new Date().toISOString(),
                duration_seconds: 45
            },
            {
                id: 'vn2',
                transcription: 'Blower door test completed. Reading shows 4.2 cubic meters per hour per square meter at 50 Pascals. Within acceptable limits.',
                confidence: 0.92,
                captured_at: new Date(Date.now() - 1800000).toISOString(),
                duration_seconds: 38
            },
            {
                id: 'vn3',
                transcription: 'Wall U-value measurements taken. Front wall reading 0.28, side wall 0.31, rear wall 0.29. All walls meeting Part L requirements.',
                confidence: 0.88,
                captured_at: new Date(Date.now() - 3600000).toISOString(),
                duration_seconds: 52
            }
        ],
        photos: [
            { id: 'p1', photo_type: 'equipment', ocr_confidence: 0.94, captured_at: new Date().toISOString() },
            { id: 'p2', photo_type: 'clipboard', ocr_confidence: 0.87, captured_at: new Date().toISOString() },
            { id: 'p3', photo_type: 'equipment', ocr_confidence: 0.91, captured_at: new Date().toISOString() },
            { id: 'p4', photo_type: 'clipboard', ocr_confidence: 0.82, captured_at: new Date().toISOString() },
            { id: 'p5', photo_type: 'site', ocr_confidence: 1.0, captured_at: new Date().toISOString() }
        ],
        test_results: [
            {
                id: 'test1',
                location_id: 'Ground Floor',
                test_type: 'Air Permeability',
                parameter: 'Air Leakage Rate',
                value: 4.2,
                unit: 'm³/h/m²',
                status: 'PASS',
                confidence: 0.95,
                needs_review: false,
                regulation_reference: 'TGD L 2022 - Max 5.0 m³/h/m²'
            },
            {
                id: 'test2',
                location_id: 'Front Wall',
                test_type: 'U-Value',
                parameter: 'Wall Thermal Transmittance',
                value: 0.28,
                unit: 'W/m²K',
                status: 'PASS',
                confidence: 0.88,
                needs_review: false,
                regulation_reference: 'TGD L 2022 - Max 0.32 W/m²K'
            },
            {
                id: 'test3',
                location_id: 'Side Wall',
                test_type: 'U-Value',
                parameter: 'Wall Thermal Transmittance',
                value: 0.31,
                unit: 'W/m²K',
                status: 'PASS',
                confidence: 0.91,
                needs_review: false,
                regulation_reference: 'TGD L 2022 - Max 0.32 W/m²K'
            },
            {
                id: 'test4',
                location_id: 'Rear Wall',
                test_type: 'U-Value',
                parameter: 'Wall Thermal Transmittance',
                value: 0.29,
                unit: 'W/m²K',
                status: 'PASS',
                confidence: 0.89,
                needs_review: false,
                regulation_reference: 'TGD L 2022 - Max 0.32 W/m²K'
            },
            {
                id: 'test5',
                location_id: 'Roof',
                test_type: 'U-Value',
                parameter: 'Roof Thermal Transmittance',
                value: 0.18,
                unit: 'W/m²K',
                status: 'PASS',
                confidence: 0.93,
                needs_review: false,
                regulation_reference: 'TGD L 2022 - Max 0.20 W/m²K'
            },
            {
                id: 'test6',
                location_id: 'Windows',
                test_type: 'U-Value',
                parameter: 'Window Thermal Transmittance',
                value: 1.6,
                unit: 'W/m²K',
                status: 'PASS',
                confidence: 0.87,
                needs_review: false,
                regulation_reference: 'TGD L 2022 - Max 1.6 W/m²K'
            }
        ],
        overall_compliance: {
            total_tests: 6,
            passed: 6,
            marginal: 0,
            failed: 0,
            overall_status: 'COMPLIANT'
        },
        pricing: {
            recommendations: [],
            total_cost: 0,
            savings: {
                annual_euro: 0,
                annual_kwh: 0
            }
        }
    };

    currentProject = demoData;
    currentTestResults = demoData.test_results;
    displayProjectData(demoData);
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
        gridEl.innerHTML = '<div style="color: #999; font-style: italic;">No photos</div>';
        return;
    }

    gridEl.innerHTML = '';

    photos.forEach(photo => {
        const div = document.createElement('div');
        div.className = 'photo-item';

        // In production, would show actual photo thumbnail
        div.innerHTML = `
            <img src="/placeholder-photo.jpg" alt="${photo.photo_type}"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ccc%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22 font-size=%2214%22%3E${photo.photo_type}%3C/text%3E%3C/svg%3E'" />
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
    // TODO: Implement photo modal with OCR data display
    alert(`Photo: ${photo.photo_type}\nConfidence: ${(photo.ocr_confidence * 100).toFixed(0)}%`);
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
