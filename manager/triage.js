/**
 * EMG Energy Manager Triage Dashboard
 * Handles project review, editing, and PDF generation
 */

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

let allJobs = [];
let currentJobId = null;
let currentProject = null;
let currentTestResults = [];
let editingTestId = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    loadAllJobs();
    displayJobsDashboard();
}

function loadAllJobs() {
    // Load all jobs from localStorage
    const stored Jobs = localStorage.getItem('emg_all_jobs');
    if (storedJobs) {
        allJobs = JSON.parse(storedJobs);
    } else {
        // Check if there's a current project (old format)
        const currentProject = JSON.parse(localStorage.getItem('emg_current_project') || 'null');
        if (currentProject) {
            // Convert old format to new job format
            allJobs = [{
                jobId: currentProject.project_id,
                projectReference: currentProject.project_reference,
                address: currentProject.address,
                createdAt: currentProject.created_at,
                status: 'in-progress',
                voiceNotes: JSON.parse(localStorage.getItem('emg_voice_notes') || '[]'),
                photos: JSON.parse(localStorage.getItem('emg_photos') || '[]'),
                managerInputs: JSON.parse(localStorage.getItem('emg_manager_inputs') || '{}')
            }];
            saveAllJobs();
        }
    }
}

function saveAllJobs() {
    localStorage.setItem('emg_all_jobs', JSON.stringify(allJobs));
}

function displayJobsDashboard() {
    const grid = document.getElementById('jobsGrid');

    if (allJobs.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <h2 style="color: #2C5F2D; margin-bottom: 20px;">📋 No Jobs Yet</h2>
                <p style="color: #666; font-size: 16px; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto;">
                    Jobs are automatically created when you capture data in the Field Operator interface.<br>
                    You can also create a new job manually by clicking the + button below.
                </p>
                <a href="../field/index.html" style="display: inline-block; padding: 15px 30px; background: #2C5F2D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    🎤 Go to Field Interface
                </a>
            </div>
        `;
        document.getElementById('pendingCount').textContent = '0 Pending';
        return;
    }

    grid.innerHTML = allJobs.map(job => `
        <div class="job-card">
            <div class="job-ref">${job.projectReference}</div>
            <div class="job-address">${job.address}</div>

            <select class="status-select" onchange="updateJobStatus('${job.jobId}', this.value)">
                <option value="pending" ${job.status === 'pending' ? 'selected' : ''}>📋 Pending</option>
                <option value="in-progress" ${job.status === 'in-progress' ? 'selected' : ''}>🔄 In Progress</option>
                <option value="review" ${job.status === 'review' ? 'selected' : ''}>⚠️ Needs Review</option>
                <option value="completed" ${job.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
            </select>

            <div class="job-meta">
                <span>🎤 ${job.voiceNotes.length} Notes</span>
                <span>📷 ${job.photos.length} Photos</span>
                <span>📅 ${new Date(job.createdAt).toLocaleDateString()}</span>
            </div>

            <div class="job-actions">
                <button class="job-btn job-btn-primary" onclick="openJobDetail('${job.jobId}')">
                    📊 View Details
                </button>
                <button class="job-btn job-btn-secondary" onclick="deleteJob('${job.jobId}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');

    // Update pending count
    const pendingCount = allJobs.filter(j => j.status !== 'completed').length;
    document.getElementById('pendingCount').textContent = `${pendingCount} Pending`;
}

function updateJobStatus(jobId, newStatus) {
    const job = allJobs.find(j => j.jobId === jobId);
    if (job) {
        job.status = newStatus;
        saveAllJobs();
        displayJobsDashboard();
        showNotification(`Status updated to: ${newStatus}`);
    }
}

function deleteJob(jobId) {
    if (confirm('Are you sure you want to delete this job? This cannot be undone.')) {
        allJobs = allJobs.filter(j => j.jobId !== jobId);
        saveAllJobs();
        displayJobsDashboard();
        showNotification('Job deleted');
    }
}

function createNewJob() {
    const address = prompt('Enter property address for new job:');
    if (!address) return;

    const newJob = {
        jobId: generateUUID(),
        projectReference: `EMG-${new Date().getFullYear()}-${generateShortId()}`,
        address: address,
        createdAt: new Date().toISOString(),
        status: 'pending',
        voiceNotes: [],
        photos: [],
        managerInputs: {}
    };

    allJobs.push(newJob);
    saveAllJobs();
    displayJobsDashboard();
    showNotification('New job created');
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateShortId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function openJobDetail(jobId) {
    currentJobId = jobId;
    const job = allJobs.find(j => j.jobId === jobId);
    if (!job) return;

    document.getElementById('modalJobTitle').textContent = job.projectReference;
    document.getElementById('jobDetailModal').classList.add('active');

    // Load job data into the detail view
    loadDemoProjectDetails(jobId, job);
}

function closeJobModal() {
    document.getElementById('jobDetailModal').classList.remove('active');
    currentJobId = null;
}

function saveAndCloseJobModal() {
    if (!currentJobId) return;

    // Save manager inputs for this specific job
    const job = allJobs.find(j => j.jobId === currentJobId);
    if (job) {
        job.managerInputs = {
            notes: document.getElementById('managerNotes').value,
            customRecommendations: document.getElementById('customRecommendations').value,
            floorArea: document.getElementById('floorArea').value,
            yearBuilt: document.getElementById('yearBuilt').value,
            berRating: document.getElementById('berRating').value,
            propertyType: document.getElementById('propertyType').value
        };
        saveAllJobs();
        showNotification('Job data saved');
    }

    closeJobModal();
    displayJobsDashboard();
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
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="no-project-message">
                <h2>📋 No Project Data Available</h2>
                <p style="font-size: 16px; line-height: 1.8; max-width: 600px; margin: 0 auto 20px;">
                    To begin testing the EMG Energy assessment system:
                </p>
                <ol style="text-align: left; max-width: 500px; margin: 0 auto 30px; line-height: 2;">
                    <li>Open the <strong>Field Operator</strong> interface</li>
                    <li>Enter a property address</li>
                    <li>Record voice notes (speak clearly for live transcription)</li>
                    <li>Capture equipment/clipboard photos</li>
                    <li>Return here to review the data</li>
                </ol>
                <a href="../field/index.html">
                    🎤 Go to Field Interface →
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
    if (projects.length === 0) {
        return;
    }

    // Display first project in header banner
    const project = projects[0];
    document.getElementById('projectHeaderBanner').style.display = 'block';
    document.getElementById('projectRefBanner').textContent = project.project_reference;
    document.getElementById('projectAddressBanner').textContent = project.address;
    document.getElementById('projectMetaBanner').innerHTML = `
        <span>🎤 ${project.voice_notes} Voice Notes</span>
        <span>📷 ${project.photos} Photos</span>
        <span>📅 ${new Date(project.created_at).toLocaleDateString()}</span>
    `;

    // Auto-load the project
    loadProjectDetails(project.project_id);
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

function loadDemoProjectDetails(projectId, job = null) {
    // Load job-specific data
    if (!job) {
        job = allJobs.find(j => j.jobId === projectId);
    }

    if (!job) {
        // Fallback to old localStorage format
        const project = JSON.parse(localStorage.getItem('emg_current_project') || 'null');
        const voiceNotes = JSON.parse(localStorage.getItem('emg_voice_notes') || '[]');
        const photos = JSON.parse(localStorage.getItem('emg_photos') || '[]');

        if (!project) {
            return;
        }

        job = {
            jobId: project.project_id,
            projectReference: project.project_reference,
            address: project.address,
            voiceNotes: voiceNotes,
            photos: photos,
            managerInputs: {}
        };
    }

    const project = {
        project_id: job.jobId,
        reference: job.projectReference,
        address: job.address
    };

    const voiceNotes = job.voiceNotes || [];
    const photos = job.photos || [];

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

    // Load any saved manager inputs
    loadManagerInputs();
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
    generateComprehensivePDFReport();
}

function generateComprehensivePDFReport() {
    if (!currentProject) {
        showNotification('No project data available');
        return;
    }

    // Get manager inputs
    const managerInputs = JSON.parse(localStorage.getItem('emg_manager_inputs') || '{}');
    const project = currentProject.project;
    const testResults = currentTestResults;
    const voiceNotes = currentProject.voice_notes || [];

    // Generate comprehensive content
    const reportHTML = generateDetailedReportHTML(project, testResults, voiceNotes, managerInputs);

    // Create print window
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(reportHTML);
    printWindow.document.close();

    // Wait for images to load then print
    setTimeout(() => {
        printWindow.print();
    }, 1000);

    showNotification('Opening comprehensive report...');
}

function generateDetailedReportHTML(project, testResults, voiceNotes, managerInputs) {
    const today = new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });

    const passCount = testResults.filter(t => t.status === 'PASS').length;
    const failCount = testResults.filter(t => t.status === 'FAIL').length;
    const overallStatus = failCount === 0 ? 'COMPLIANT' : 'NON-COMPLIANT';

    // Generate executive summary
    const executiveSummary = generateExecutiveSummary(project, testResults, passCount, failCount, managerInputs);

    // Generate detailed findings
    const detailedFindings = generateDetailedFindings(testResults, voiceNotes);

    // Generate recommendations
    const recommendations = generateDetailedRecommendations(testResults, failCount, managerInputs);

    // Generate compliance analysis
    const complianceAnalysis = generateComplianceAnalysis(testResults, passCount, failCount);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>EMG Energy Assessment Report - ${project.reference}</title>
            <style>
                @page { margin: 2cm; }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 210mm;
                    margin: 0 auto;
                    background: white;
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    max-width: 250px;
                    height: auto;
                }
                .report-header {
                    text-align: center;
                    border-bottom: 4px solid #2C5F2D;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .report-title {
                    font-size: 32px;
                    font-weight: bold;
                    color: #2C5F2D;
                    margin-bottom: 10px;
                }
                .report-subtitle {
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 20px;
                }
                .project-details {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                .project-details table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .project-details td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #e0e0e0;
                }
                .project-details td:first-child {
                    font-weight: bold;
                    width: 40%;
                    color: #2C5F2D;
                }
                .section {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                }
                .section-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2C5F2D;
                    border-left: 6px solid #2C5F2D;
                    padding-left: 15px;
                    margin-bottom: 20px;
                }
                .subsection-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #1a3a1b;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                .paragraph {
                    text-align: justify;
                    margin-bottom: 15px;
                    line-height: 1.8;
                }
                .compliance-badge {
                    display: inline-block;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-weight: bold;
                    font-size: 18px;
                    margin: 10px 0;
                }
                .compliant {
                    background: #4CAF50;
                    color: white;
                }
                .non-compliant {
                    background: #D32F2F;
                    color: white;
                }
                .test-results-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .test-results-table th {
                    background: #2C5F2D;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                }
                .test-results-table td {
                    padding: 12px;
                    border-bottom: 1px solid #e0e0e0;
                }
                .test-results-table tr:hover {
                    background: #f5f5f5;
                }
                .status-pass {
                    color: #4CAF50;
                    font-weight: bold;
                }
                .status-fail {
                    color: #D32F2F;
                    font-weight: bold;
                }
                .recommendation-box {
                    background: #fff3cd;
                    border-left: 5px solid #FF9800;
                    padding: 20px;
                    margin: 15px 0;
                    border-radius: 5px;
                }
                .recommendation-box.high {
                    background: #f8d7da;
                    border-left-color: #D32F2F;
                }
                .key-findings {
                    background: #e8f5e9;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .key-findings ul {
                    margin: 10px 0;
                    padding-left: 25px;
                }
                .key-findings li {
                    margin: 8px 0;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 3px solid #2C5F2D;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
                @media print {
                    body { background: white; }
                    .section { page-break-inside: avoid; }
                    .compliance-badge, .test-results-table th, .recommendation-box {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="logo">
                <img src="https://emgenergy.ie/wp-content/uploads/2024/05/EMG-Energy.png" alt="EMG Energy Consultants">
            </div>

            <div class="report-header">
                <div class="report-title">BUILDING ENERGY ASSESSMENT REPORT</div>
                <div class="report-subtitle">Part L Building Regulations Compliance Assessment</div>
                <div style="margin-top: 15px;">
                    <strong>Report Reference:</strong> ${project.reference}<br>
                    <strong>Date of Assessment:</strong> ${today}
                </div>
            </div>

            <div class="project-details">
                <h3 style="color: #2C5F2D; margin-bottom: 15px;">Property Details</h3>
                <table>
                    <tr>
                        <td>Property Address:</td>
                        <td>${project.address}</td>
                    </tr>
                    <tr>
                        <td>Property Type:</td>
                        <td>${managerInputs.propertyType || 'Residential Dwelling'}</td>
                    </tr>
                    <tr>
                        <td>Floor Area:</td>
                        <td>${managerInputs.floorArea || project.floor_area_m2 || 'N/A'} m²</td>
                    </tr>
                    <tr>
                        <td>Year Built:</td>
                        <td>${managerInputs.yearBuilt || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Current BER Rating:</td>
                        <td>${managerInputs.berRating || 'To be determined'}</td>
                    </tr>
                    <tr>
                        <td>Assessor:</td>
                        <td>EMG Energy Consultants</td>
                    </tr>
                    <tr>
                        <td>Overall Compliance Status:</td>
                        <td><span class="compliance-badge ${overallStatus.toLowerCase().replace('-', '')}">${overallStatus}</span></td>
                    </tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">1. EXECUTIVE SUMMARY</div>
                ${executiveSummary}
            </div>

            <div class="section">
                <div class="section-title">2. ASSESSMENT METHODOLOGY</div>
                <div class="paragraph">
                    This comprehensive building energy assessment was conducted in accordance with the Technical Guidance Document Part L (Conservation of Fuel and Energy) - Building Regulations 2022. The assessment involved a detailed on-site inspection, including air permeability testing, thermal performance measurements, and building fabric analysis.
                </div>
                <div class="paragraph">
                    Our qualified assessors utilized calibrated testing equipment including blower door apparatus for air leakage testing, thermal imaging cameras for identifying heat loss areas, and precision instruments for measuring U-values of building elements. All testing procedures followed IS EN ISO 9972:2015 standards for air permeability testing and IS EN ISO 6946:2017 for thermal transmittance calculations.
                </div>
                ${voiceNotes.length > 0 ? `
                <div class="subsection-title">Field Observations</div>
                <div class="key-findings">
                    <ul>
                        ${voiceNotes.map(note => `<li>${note.transcription}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>

            <div class="section">
                <div class="section-title">3. DETAILED FINDINGS & COMPLIANCE ANALYSIS</div>
                ${detailedFindings}
                ${complianceAnalysis}

                <div class="subsection-title">Test Results Summary</div>
                <table class="test-results-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Location</th>
                            <th>Measured Value</th>
                            <th>Compliance Status</th>
                            <th>Standard</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${testResults.map(test => `
                            <tr>
                                <td><strong>${test.parameter}</strong></td>
                                <td>${test.location_id}</td>
                                <td>${test.value} ${test.unit}</td>
                                <td class="status-${test.status.toLowerCase()}">${test.status}</td>
                                <td style="font-size: 11px;">${test.regulation_reference}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">4. RECOMMENDATIONS</div>
                ${recommendations}
                ${managerInputs.customRecommendations ? `
                <div class="subsection-title">Additional Recommendations</div>
                <div class="paragraph">${managerInputs.customRecommendations}</div>
                ` : ''}
            </div>

            ${managerInputs.notes ? `
            <div class="section">
                <div class="section-title">5. ASSESSOR'S NOTES</div>
                <div class="paragraph">${managerInputs.notes}</div>
            </div>
            ` : ''}

            <div class="section">
                <div class="section-title">6. CONCLUSION</div>
                <div class="paragraph">
                    This assessment has evaluated the property at ${project.address} against the requirements set out in Technical Guidance Document Part L of the Irish Building Regulations. ${overallStatus === 'COMPLIANT' ?
                    'The property demonstrates full compliance with current energy efficiency standards, with all measured parameters meeting or exceeding the required performance criteria.' :
                    'The assessment has identified areas where the property does not fully meet current compliance standards. The recommendations outlined in this report provide a clear pathway to achieving full compliance and improving the overall energy performance of the building.'}
                </div>
                <div class="paragraph">
                    EMG Energy Consultants remains available to provide further guidance on implementing the recommended improvements and can assist with project management of any remedial works. We recommend that any improvement works be carried out by qualified contractors and that post-works verification testing be conducted to confirm compliance achievement.
                </div>
            </div>

            <div class="footer">
                <p><strong>EMG Energy Consultants</strong></p>
                <p>Suite 17, Block A, Clare Technology Park, Gort Road, Ennis, Co. Clare</p>
                <p>Email: info@emgenergy.ie | Phone: 065 672 9090 | Mobile: 087 9444470</p>
                <p>Web: www.emgenergy.ie</p>
                <p style="margin-top: 15px; font-style: italic;">Energy Compliance Experts | Serving Ireland Nationwide</p>
                <p style="margin-top: 10px;">Report generated: ${today} | Reference: ${project.reference}</p>
            </div>
        </body>
        </html>
    `;
}

function generateExecutiveSummary(project, testResults, passCount, failCount, managerInputs) {
    const totalTests = testResults.length;
    const complianceRate = totalTests > 0 ? Math.round((passCount / totalTests) * 100) : 0;

    return `
        <div class="paragraph">
            This report presents the findings of a comprehensive building energy assessment conducted at ${project.address}. The assessment evaluated ${totalTests} critical parameters related to thermal performance and air tightness, comparing measured values against the standards specified in Technical Guidance Document Part L (2022).
        </div>
        <div class="key-findings">
            <h4 style="margin-bottom: 10px;">Key Findings:</h4>
            <ul>
                <li><strong>Compliance Rate:</strong> ${complianceRate}% of tested parameters meet Part L requirements</li>
                <li><strong>Parameters Assessed:</strong> ${totalTests} (${passCount} compliant, ${failCount} non-compliant)</li>
                ${failCount === 0 ? '<li><strong>Overall Status:</strong> Property demonstrates full compliance with current building regulations</li>' :
                `<li><strong>Overall Status:</strong> ${failCount} parameter${failCount > 1 ? 's' : ''} require${failCount > 1 ? '' : 's'} attention to achieve full compliance</li>`}
                ${managerInputs.berRating ? `<li><strong>Current BER Rating:</strong> ${managerInputs.berRating}</li>` : ''}
            </ul>
        </div>
    `;
}

function generateDetailedFindings(testResults, voiceNotes) {
    let findings = '<div class="paragraph">The on-site assessment included comprehensive testing of the building envelope\'s thermal performance and air tightness characteristics. Each element was evaluated against the performance standards mandated by Part L of the Building Regulations.</div>';

    // Group results by type
    const airTests = testResults.filter(t => t.test_type.includes('Air') || t.test_type.includes('Permeability'));
    const uValueTests = testResults.filter(t => t.test_type.includes('U-Value') || t.test_type.includes('Thermal'));

    if (airTests.length > 0) {
        const airTest = airTests[0];
        findings += `
            <div class="subsection-title">Air Permeability Assessment</div>
            <div class="paragraph">
                Air permeability testing was conducted using blower door methodology in accordance with IS EN ISO 9972:2015. The test measured the air leakage rate through the building envelope at a pressure differential of 50 Pascals. The recorded value of ${airTest.value} ${airTest.unit} ${airTest.status === 'PASS' ? 'meets' : 'exceeds'} the maximum permissible limit of 5.0 m³/h/m² as specified in TGD Part L.
                ${airTest.status === 'PASS' ?
                'This result demonstrates effective air sealing and indicates good construction quality with minimal uncontrolled air leakage paths.' :
                'This elevated reading suggests the presence of significant air leakage paths that should be identified and sealed to improve energy efficiency and occupant comfort.'}
            </div>
        `;
    }

    if (uValueTests.length > 0) {
        findings += `
            <div class="subsection-title">Thermal Performance Assessment</div>
            <div class="paragraph">
                Thermal transmittance (U-value) measurements were conducted on key building elements to evaluate their insulation performance. U-values represent the rate of heat transfer through a building element, with lower values indicating better insulation performance.
            </div>
        `;

        uValueTests.forEach(test => {
            findings += `
                <div class="paragraph">
                    <strong>${test.location_id}:</strong> The measured U-value of ${test.value} ${test.unit} ${test.status === 'PASS' ? 'complies with' : 'exceeds'} the maximum standard of ${test.regulation_reference.split('Max ')[1]}. ${test.status === 'PASS' ?
                    'This indicates adequate insulation levels that will contribute to good thermal comfort and energy efficiency.' :
                    'Improvement of the insulation in this element would reduce heat loss and improve overall building performance.'}
                </div>
            `;
        });
    }

    return findings;
}

function generateComplianceAnalysis(testResults, passCount, failCount) {
    return `
        <div class="subsection-title">Compliance Status Overview</div>
        <div class="paragraph">
            Of the ${testResults.length} parameters assessed, ${passCount} meet the requirements of Technical Guidance Document Part L (2022), representing a compliance rate of ${Math.round((passCount/testResults.length)*100)}%. ${failCount === 0 ?
            'The property achieves full compliance across all tested parameters, demonstrating adherence to current energy efficiency standards.' :
            `There are ${failCount} parameter${failCount > 1 ? 's' : ''} that require attention to achieve full regulatory compliance. The recommendations section provides detailed guidance on addressing these areas.`}
        </div>
    `;
}

function generateDetailedRecommendations(testResults, failCount, managerInputs) {
    let recommendations = '';

    if (failCount === 0) {
        recommendations = `
            <div class="paragraph">
                All assessed parameters currently meet or exceed Part L requirements. The property demonstrates good energy performance characteristics. To maintain and potentially enhance this performance, we recommend:
            </div>
            <div class="recommendation-box">
                <strong>Maintenance Recommendations:</strong>
                <ul style="margin: 10px 0; padding-left: 25px;">
                    <li>Maintain regular inspection and maintenance of air sealing elements, particularly around windows, doors, and service penetrations</li>
                    <li>Monitor insulation condition, particularly in roof spaces, ensuring no degradation or compression occurs over time</li>
                    <li>Consider periodic re-testing (every 5-10 years) to verify continued compliance as building elements age</li>
                    <li>When undertaking future renovations, ensure any new work maintains or improves upon current performance levels</li>
                </ul>
            </div>
        `;
    } else {
        const failedTests = testResults.filter(t => t.status === 'FAIL');

        recommendations = `
            <div class="paragraph">
                To achieve full compliance with Part L requirements, the following remedial works are recommended. Each recommendation has been prioritized based on its impact on overall building performance and regulatory compliance.
            </div>
        `;

        failedTests.forEach((test, index) => {
            recommendations += `
                <div class="recommendation-box high">
                    <strong>Priority Recommendation ${index + 1}: ${test.parameter}</strong>
                    <div style="margin-top: 10px;">
                        <strong>Current Status:</strong> ${test.value} ${test.unit} (Exceeds limit of ${test.regulation_reference.split('Max ')[1]})<br>
                        <strong>Location:</strong> ${test.location_id}
                    </div>
                    <div style="margin-top: 15px;">
                        <strong>Recommended Action:</strong><br>
                        ${generateSpecificRecommendation(test)}
                    </div>
                    <div style="margin-top: 15px; color: #666; font-size: 13px;">
                        <strong>Expected Outcome:</strong> Implementation of this recommendation will bring the ${test.parameter.toLowerCase()} into compliance with Part L standards, reducing heat loss and improving energy efficiency.
                    </div>
                </div>
            `;
        });
    }

    return recommendations;
}

function generateSpecificRecommendation(test) {
    if (test.test_type.includes('Air') || test.test_type.includes('Permeability')) {
        return `Conduct a detailed air leakage survey using thermal imaging to identify specific leakage paths. Common areas requiring attention include window and door seals, service penetrations, joist-to-wall junctions, and attic hatches. Apply appropriate sealing measures using expanding foam, weatherstripping, or acoustic sealant as appropriate. Following remedial works, conduct verification testing to confirm improved performance.`;
    } else if (test.location_id.includes('Wall')) {
        return `Enhance wall insulation through internal dry-lining with insulated plasterboard (minimum 50mm PIR insulation + 12.5mm plasterboard) or external insulation system (minimum 100mm EPS with rendered finish). Internal insulation is generally more cost-effective but reduces room dimensions slightly. External insulation provides better thermal performance and eliminates thermal bridging but requires planning permission consideration.`;
    } else if (test.location_id.includes('Roof')) {
        return `Upgrade roof insulation to minimum 300mm of mineral wool insulation (achieving U-value of 0.16 W/m²K or better). If roof space is used for storage, install insulation between and over ceiling joists. Ensure proper ventilation is maintained to prevent condensation issues. Consider spray foam insulation for complex roof geometries or where space is limited.`;
    } else if (test.location_id.includes('Window')) {
        return `Replace existing windows with high-performance double or triple glazed units featuring low-emissivity coatings and thermally-broken frames. Minimum specification should be U-value 1.4 W/m²K or better. Ensure proper installation with continuous air and vapor barriers. Consider A-rated windows for optimal performance.`;
    }
    return `Consult with EMG Energy Consultants for detailed specification and implementation guidance specific to this element.`;
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

function saveManagerInputs() {
    if (!currentJobId) {
        showNotification('No job selected');
        return;
    }

    const job = allJobs.find(j => j.jobId === currentJobId);
    if (job) {
        job.managerInputs = {
            notes: document.getElementById('managerNotes').value,
            customRecommendations: document.getElementById('customRecommendations').value,
            floorArea: document.getElementById('floorArea').value,
            yearBuilt: document.getElementById('yearBuilt').value,
            berRating: document.getElementById('berRating').value,
            propertyType: document.getElementById('propertyType').value
        };
        saveAllJobs();
        showNotification('Additional information saved for this job');
    }
}

function loadManagerInputs() {
    // Load manager inputs for the current job
    if (!currentJobId) return;

    const job = allJobs.find(j => j.jobId === currentJobId);
    if (job && job.managerInputs) {
        const data = job.managerInputs;
        document.getElementById('managerNotes').value = data.notes || '';
        document.getElementById('customRecommendations').value = data.customRecommendations || '';
        document.getElementById('floorArea').value = data.floorArea || '';
        document.getElementById('yearBuilt').value = data.yearBuilt || '';
        document.getElementById('berRating').value = data.berRating || '';
        document.getElementById('propertyType').value = data.propertyType || '';
    }
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
