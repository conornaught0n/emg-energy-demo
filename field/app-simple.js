/**
 * EMG Energy Field App - SIMPLIFIED & WORKING VERSION
 * No fluff - just what actually works
 */

let projectId = null;
let projectRef = null;
let voiceNotes = [];
let photos = [];
let currentRecording = null;
let mediaRecorder = null;
let audioChunks = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 EMG Field App Starting...');

    // Load existing project if any
    loadExistingProject();

    // Setup buttons
    setupEventListeners();

    // Update UI
    updateDisplay();

    console.log('✅ App Ready');
});

function loadExistingProject() {
    // Try to load current project
    projectId = localStorage.getItem('current_project_id');
    projectRef = localStorage.getItem('current_project_ref');

    if (projectId) {
        console.log('📂 Loaded existing project:', projectRef);

        // Load data for this project
        const allJobs = JSON.parse(localStorage.getItem('emg_all_jobs') || '[]');
        const job = allJobs.find(j => j.jobId === projectId);

        if (job) {
            voiceNotes = job.voiceNotes || [];
            photos = job.photos || [];
            document.getElementById('addressInput').value = job.address || '';
        }
    }
}

function setupEventListeners() {
    // Voice button
    const voiceBtn = document.getElementById('voiceButton');
    voiceBtn.addEventListener('click', toggleRecording);

    // Photo buttons
    document.getElementById('equipmentButton').addEventListener('click', () => {
        document.getElementById('equipmentInput').click();
    });

    document.getElementById('clipboardButton').addEventListener('click', () => {
        document.getElementById('clipboardInput').click();
    });

    // Photo inputs
    document.getElementById('equipmentInput').addEventListener('change', (e) => handlePhoto(e, 'equipment'));
    document.getElementById('clipboardInput').addEventListener('change', (e) => handlePhoto(e, 'clipboard'));
}

function createNewProject() {
    const address = document.getElementById('addressInput').value.trim();

    if (!address) {
        alert('❌ Please enter an address first!');
        document.getElementById('addressInput').focus();
        return;
    }

    // Generate new project ID
    projectId = generateUUID();
    projectRef = `EMG-${new Date().getFullYear()}-${projectId.substring(0, 6).toUpperCase()}`;

    // Save to localStorage
    localStorage.setItem('current_project_id', projectId);
    localStorage.setItem('current_project_ref', projectRef);

    // Reset data
    voiceNotes = [];
    photos = [];

    // Update display
    updateDisplay();

    console.log('✅ Created project:', projectRef);
    showMessage('✅ Project created: ' + projectRef);
}

function loadSelectedProject() {
    const selector = document.getElementById('projectSelector');
    const selectedId = selector.value;

    if (!selectedId) return;

    const allJobs = JSON.parse(localStorage.getItem('emg_all_jobs') || '[]');
    const job = allJobs.find(j => j.jobId === selectedId);

    if (job) {
        projectId = job.jobId;
        projectRef = job.projectReference;
        voiceNotes = job.voiceNotes || [];
        photos = job.photos || [];

        localStorage.setItem('current_project_id', projectId);
        localStorage.setItem('current_project_ref', projectRef);

        document.getElementById('addressInput').value = job.address;

        updateDisplay();
        console.log('✅ Loaded project:', projectRef);
        showMessage('✅ Loaded: ' + projectRef);
    }
}

async function toggleRecording() {
    if (!projectId) {
        alert('❌ Please create a project first!\n\n1. Enter address\n2. Click "CREATE NEW PROJECT"');
        return;
    }

    if (currentRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

async function startRecording() {
    console.log('🎤 Starting recording...');

    const button = document.getElementById('voiceButton');
    button.style.background = '#D32F2F';
    button.querySelector('.button-title').textContent = 'RECORDING...';
    button.querySelector('.button-subtitle').textContent = 'Click to stop';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            saveVoiceNote(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        currentRecording = true;

        console.log('✅ Recording started');

    } catch (error) {
        console.error('❌ Recording failed:', error);
        alert('❌ Microphone access denied!\n\nPlease allow microphone access in your browser settings.');
        resetRecordButton();
    }
}

function stopRecording() {
    console.log('⏹️ Stopping recording...');

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        currentRecording = false;
        resetRecordButton();
        console.log('✅ Recording stopped');
    }
}

function resetRecordButton() {
    const button = document.getElementById('voiceButton');
    button.style.background = 'white';
    button.querySelector('.button-title').textContent = 'RECORD VOICE NOTE';
    button.querySelector('.button-subtitle').textContent = 'Click to record';
}

function saveVoiceNote(audioBlob) {
    // Prompt for transcription text
    const text = prompt('📝 Enter text for this voice note:\n\n(Or leave blank for "Voice note recorded")');

    const note = {
        id: generateUUID(),
        project_id: projectId,
        captured_at: new Date().toISOString(),
        transcription: text || 'Voice note recorded',
        audio_blob: audioBlob,
        confidence: 1.0,
        duration_seconds: Math.floor(audioBlob.size / 1000)
    };

    voiceNotes.push(note);

    updateDisplay();
    console.log('✅ Voice note saved:', note.transcription);
    showMessage(`✅ Voice note ${voiceNotes.length} saved!`);
}

function handlePhoto(event, type) {
    if (!projectId) {
        alert('❌ Please create a project first!');
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const photo = {
            id: generateUUID(),
            project_id: projectId,
            photo_type: type,
            captured_at: new Date().toISOString(),
            file_data: e.target.result,
            ocr_confidence: 0.90
        };

        photos.push(photo);
        updateDisplay();

        console.log('✅ Photo captured:', type);
        showMessage(`✅ Photo ${photos.length} captured!`);

        // Show thumbnail
        const grid = document.getElementById('thumbnailGrid');
        const div = document.createElement('div');
        div.className = 'thumbnail';
        div.innerHTML = `<img src="${e.target.result}" alt="${type}" />`;
        grid.appendChild(div);
    };
    reader.readAsDataURL(file);

    event.target.value = '';
}

function manualSave() {
    console.log('💾 SAVE CLICKED');
    console.log('Project ID:', projectId);
    console.log('Voice notes:', voiceNotes.length);
    console.log('Photos:', photos.length);

    if (!projectId) {
        alert('❌ No project to save!\n\n1. Enter address\n2. Click "CREATE NEW PROJECT"');
        return;
    }

    const address = document.getElementById('addressInput').value.trim();
    if (!address) {
        alert('❌ Address is required!');
        return;
    }

    const saveButton = document.getElementById('saveButton');
    saveButton.textContent = '⏳ SAVING...';
    saveButton.disabled = true;

    try {
        // Prepare data
        const jobData = {
            jobId: projectId,
            projectReference: projectRef,
            address: address,
            createdAt: new Date().toISOString(),
            status: 'in-progress',
            voiceNotes: voiceNotes.map(n => ({
                id: n.id,
                project_id: n.project_id,
                captured_at: n.captured_at,
                transcription: n.transcription,
                confidence: n.confidence,
                duration_seconds: n.duration_seconds
            })),
            photos: photos.map(p => ({
                id: p.id,
                project_id: p.project_id,
                photo_type: p.photo_type,
                captured_at: p.captured_at,
                file_data: p.file_data,
                ocr_confidence: p.ocr_confidence
            })),
            managerInputs: {}
        };

        // Save to localStorage
        let allJobs = JSON.parse(localStorage.getItem('emg_all_jobs') || '[]');

        // Find existing or add new
        const existingIndex = allJobs.findIndex(j => j.jobId === projectId);
        if (existingIndex >= 0) {
            allJobs[existingIndex] = jobData;
            console.log('📝 Updated existing job');
        } else {
            allJobs.push(jobData);
            console.log('➕ Added new job');
        }

        localStorage.setItem('emg_all_jobs', JSON.stringify(allJobs));

        console.log('✅ SAVE SUCCESSFUL');
        console.log('Total jobs in dashboard:', allJobs.length);

        // Update UI
        saveButton.textContent = '✅ SAVED!';
        setTimeout(() => {
            saveButton.textContent = '💾 SAVE TO DASHBOARD';
            saveButton.disabled = false;
        }, 2000);

        showMessage(`✅ Saved! ${voiceNotes.length} notes, ${photos.length} photos`);

        // Refresh project selector
        populateProjectSelector();

    } catch (error) {
        console.error('❌ SAVE FAILED:', error);
        saveButton.textContent = '❌ FAILED';
        setTimeout(() => {
            saveButton.textContent = '💾 SAVE TO DASHBOARD';
            saveButton.disabled = false;
        }, 2000);
        alert('❌ Save failed!\n\n' + error.message);
    }
}

function populateProjectSelector() {
    const selector = document.getElementById('projectSelector');
    selector.innerHTML = '<option value="">-- Select Existing Project --</option>';

    const allJobs = JSON.parse(localStorage.getItem('emg_all_jobs') || '[]');

    allJobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job.jobId;
        option.textContent = `${job.projectReference} - ${job.address}`;
        if (job.jobId === projectId) {
            option.selected = true;
        }
        selector.appendChild(option);
    });

    console.log(`📋 Loaded ${allJobs.length} projects into selector`);
}

function clearAllData() {
    if (!confirm('⚠️ Delete ALL projects and data?\n\nThis cannot be undone!')) {
        return;
    }

    localStorage.clear();
    projectId = null;
    projectRef = null;
    voiceNotes = [];
    photos = [];

    document.getElementById('addressInput').value = '';
    document.getElementById('thumbnailGrid').innerHTML = '';

    updateDisplay();
    console.log('🗑️ All data cleared');
    showMessage('🗑️ All data cleared');
}

function updateDisplay() {
    // Update counts
    document.getElementById('voiceCount').textContent = voiceNotes.length;
    document.getElementById('photoCount').textContent = photos.length;
    document.getElementById('uploadedCount').textContent = voiceNotes.length + photos.length;

    // Update project status
    const statusDiv = document.getElementById('projectStatus');
    const helperDiv = document.getElementById('noProjectHelper');

    if (projectId) {
        document.getElementById('currentProjectRef').textContent = projectRef;
        document.getElementById('currentProjectAddress').textContent = document.getElementById('addressInput').value;
        statusDiv.style.display = 'block';
        if (helperDiv) helperDiv.style.display = 'none';
    } else {
        statusDiv.style.display = 'none';
        if (helperDiv) helperDiv.style.display = 'block';
    }

    // Update save button
    const saveButton = document.getElementById('saveButton');
    const totalItems = voiceNotes.length + photos.length;

    if (projectId && totalItems > 0) {
        saveButton.textContent = `💾 SAVE TO DASHBOARD (${totalItems} items)`;
        saveButton.disabled = false;
        saveButton.style.background = '#FF9800';
    } else if (!projectId) {
        saveButton.textContent = '⚠️ CREATE PROJECT FIRST';
        saveButton.disabled = true;
        saveButton.style.background = '#999';
    } else {
        saveButton.textContent = '💾 SAVE TO DASHBOARD';
        saveButton.disabled = true;
        saveButton.style.background = '#999';
    }

    // Populate project selector
    populateProjectSelector();
}

function showMessage(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #2C5F2D;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Make functions available globally
window.createNewProject = createNewProject;
window.loadSelectedProject = loadSelectedProject;
window.manualSave = manualSave;
window.clearAllData = clearAllData;

console.log('📱 EMG Field App Loaded - Simple & Working Version');
