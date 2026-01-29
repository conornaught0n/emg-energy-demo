/**
 * EMG Energy Field Operator App
 * Handles voice recording, photo capture, offline storage, and sync
 */

// Configuration
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';  // Production API endpoint

// State management
let projectId = null;
let operatorId = localStorage.getItem('operator_id') || generateUUID();
let voiceNotes = [];
let photos = [];
let mediaRecorder = null;
let audioChunks = [];
let recognition = null;
let currentTranscription = '';

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Store operator ID
    localStorage.setItem('operator_id', operatorId);

    // Load saved data from localStorage
    loadLocalData();

    // Check browser compatibility
    checkSpeechRecognitionSupport();

    // Setup event listeners
    document.getElementById('voiceButton').addEventListener('mousedown', startRecording);
    document.getElementById('voiceButton').addEventListener('mouseup', stopRecording);
    document.getElementById('voiceButton').addEventListener('touchstart', startRecording);
    document.getElementById('voiceButton').addEventListener('touchend', stopRecording);

    document.getElementById('equipmentButton').addEventListener('click', () => {
        document.getElementById('equipmentInput').click();
    });

    document.getElementById('clipboardButton').addEventListener('click', () => {
        document.getElementById('clipboardInput').click();
    });

    document.getElementById('equipmentInput').addEventListener('change', (e) => handlePhotoCapture(e, 'equipment'));
    document.getElementById('clipboardInput').addEventListener('change', (e) => handlePhotoCapture(e, 'clipboard'));

    document.getElementById('syncButton').addEventListener('click', syncData);

    updateUI();
    showProjectStatus();
}

function startNewProject() {
    const address = document.getElementById('addressInput').value.trim();
    if (!address) {
        showNotification('Please enter an address first');
        return;
    }

    // Create new project
    projectId = generateUUID();
    const projectRef = `EMG-${new Date().getFullYear()}-${projectId.slice(0, 6).toUpperCase()}`;

    localStorage.setItem('current_project_id', projectId);
    localStorage.setItem('current_project_ref', projectRef);

    // Reset arrays for new project
    voiceNotes = [];
    photos = [];

    // Create project record
    const projectData = {
        project_id: projectId,
        project_reference: projectRef,
        address: address,
        created_at: new Date().toISOString(),
        status: 'in-progress'
    };
    localStorage.setItem('emg_current_project', JSON.stringify(projectData));

    updateUI();
    showProjectStatus();
    showNotification('New project created: ' + projectRef);
}

function clearAllData() {
    if (!confirm('Clear ALL data? This will delete all projects, voice notes, and photos.')) {
        return;
    }

    localStorage.removeItem('emg_all_jobs');
    localStorage.removeItem('emg_current_project');
    localStorage.removeItem('emg_voice_notes');
    localStorage.removeItem('emg_photos');
    localStorage.removeItem('current_project_id');
    localStorage.removeItem('current_project_ref');
    localStorage.removeItem('fieldData');

    projectId = null;
    voiceNotes = [];
    photos = [];

    document.getElementById('addressInput').value = '';
    updateUI();
    showProjectStatus();
    showNotification('All data cleared');
}

function showProjectStatus() {
    const statusDiv = document.getElementById('projectStatus');
    const refSpan = document.getElementById('currentProjectRef');

    if (projectId) {
        const ref = localStorage.getItem('current_project_ref') || 'Unknown';
        refSpan.textContent = ref;
        statusDiv.style.display = 'block';
    } else {
        statusDiv.style.display = 'none';
    }
}

function checkSpeechRecognitionSupport() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        document.getElementById('browserWarning').classList.add('show');
        console.warn('Speech recognition not supported in this browser');
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function createProject() {
    const address = document.getElementById('addressInput').value.trim();

    if (!address || projectId) return;

    // Always work offline in demo mode - generate project ID immediately
    projectId = generateUUID();
    const projectRef = `EMG-${new Date().getFullYear()}-${projectId.slice(0, 6).toUpperCase()}`;

    localStorage.setItem('current_project_id', projectId);
    localStorage.setItem('current_project_ref', projectRef);

    // Create project record
    const projectData = {
        project_id: projectId,
        project_reference: projectRef,
        address: address,
        created_at: new Date().toISOString(),
        status: 'in_progress'
    };
    localStorage.setItem('emg_current_project', JSON.stringify(projectData));

    // Initialize empty arrays for this project
    voiceNotes = [];
    photos = [];
    updateUI();

    showNotification('Project created: ' + projectRef);
}

async function startRecording(e) {
    e.preventDefault();

    if (!projectId) {
        showNotification('Please click "New Project" button first');
        const addressInput = document.getElementById('addressInput');
        addressInput.style.border = '3px solid #D32F2F';
        setTimeout(() => addressInput.style.border = '', 2000);
        return;
    }

    const button = document.getElementById('voiceButton');
    const transcriptionDisplay = document.getElementById('transcriptionDisplay');
    const transcriptionText = document.getElementById('transcriptionText');

    button.classList.add('recording');
    transcriptionDisplay.classList.add('active');
    transcriptionText.textContent = 'Listening... Start speaking now!';
    transcriptionText.classList.add('empty');
    currentTranscription = '';

    // Start live speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IE'; // Irish English

        recognition.onstart = () => {
            console.log('✅ Speech recognition STARTED');
            transcriptionText.textContent = '🎤 Listening... Speak now!';
            transcriptionText.style.color = '#2C5F2D';
            transcriptionText.style.fontWeight = 'bold';
        };

        recognition.onresult = (event) => {
            console.log('📝 Got speech result');
            let transcript = '';

            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            currentTranscription = transcript.trim();
            console.log('Transcript:', currentTranscription);

            // Update the large transcription display
            if (currentTranscription) {
                transcriptionText.textContent = currentTranscription;
                transcriptionText.classList.remove('empty');
                transcriptionText.style.color = '#333';
                transcriptionText.style.fontWeight = '500';
            }

            // Also show in button
            button.querySelector('.button-subtitle').innerHTML =
                `<span style="font-size: 11px;">Recording... "${currentTranscription.slice(0, 40)}${currentTranscription.length > 40 ? '..."' : '"'}</span>`;
        };

        recognition.onerror = (event) => {
            console.error('❌ Speech error:', event.error);
            if (event.error === 'not-allowed') {
                transcriptionText.textContent = '❌ Microphone blocked! Allow mic access and try again.';
                showNotification('Please allow microphone access');
            } else if (event.error === 'no-speech') {
                transcriptionText.textContent = '⚠️ No speech detected. Try speaking louder.';
            } else {
                transcriptionText.textContent = `Error: ${event.error}`;
            }
            transcriptionText.style.color = '#D32F2F';
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
        };

        try {
            recognition.start();
            console.log('🎤 Attempting to start speech recognition...');
        } catch (error) {
            console.error('❌ Failed to start:', error);
            transcriptionText.textContent = '❌ Speech recognition failed. Using fallback mode.';
            transcriptionText.style.color = '#FF9800';
            currentTranscription = 'Voice note recorded (transcription unavailable)';
        }
    } else {
        transcriptionText.textContent = '⚠️ Speech recognition not supported in this browser. Use Chrome or Edge for live transcription.';
        transcriptionText.classList.remove('empty');
        button.querySelector('.button-subtitle').textContent = 'Recording... (No live transcription)';
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await saveVoiceNote(audioBlob);

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
    } catch (error) {
        console.error('Error starting recording:', error);
        showNotification('Microphone access denied. Please allow microphone access.');
        button.classList.remove('recording');
        transcriptionDisplay.classList.remove('active');
        if (recognition) recognition.stop();
    }
}

function stopRecording(e) {
    e.preventDefault();

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();

        // Stop speech recognition
        if (recognition) {
            recognition.stop();
        }

        const button = document.getElementById('voiceButton');
        const transcriptionDisplay = document.getElementById('transcriptionDisplay');
        const transcriptionText = document.getElementById('transcriptionText');

        button.classList.remove('recording');
        button.classList.add('success');

        // Show success message in transcription display
        transcriptionText.textContent = `✅ Saved: "${currentTranscription || 'Voice note recorded'}"`;
        transcriptionText.classList.remove('empty');

        button.querySelector('.button-subtitle').textContent = 'Voice note saved with transcription!';

        setTimeout(() => {
            button.classList.remove('success');
            button.querySelector('.button-subtitle').textContent = 'Hold to record';
            transcriptionDisplay.classList.remove('active');
        }, 3000);
    }
}

async function saveVoiceNote(audioBlob) {
    // Use the live transcription if available, otherwise use fallback
    const transcription = currentTranscription || 'Voice note recorded - transcription unavailable';

    console.log('💾 Saving voice note...');
    console.log('Transcription:', transcription);
    console.log('Project ID:', projectId);

    const voiceNote = {
        id: generateUUID(),
        project_id: projectId,
        operator_id: operatorId,
        captured_at: new Date().toISOString(),
        audio_blob: audioBlob,
        transcription: transcription,
        confidence: 0.95,
        duration_seconds: Math.floor(audioBlob.size / 1000), // Rough estimate
        synced: false
    };

    voiceNotes.push(voiceNote);
    console.log('✅ Voice note added. Total:', voiceNotes.length);

    saveLocalData();
    updateUI();

    showNotification(`Voice note ${voiceNotes.length} saved!`);
}

async function handlePhotoCapture(event, photoType) {
    const file = event.target.files[0];
    if (!file) return;

    if (!projectId) {
        showNotification('Please enter property address first');
        return;
    }

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = function(e) {
        const photo = {
            id: generateUUID(),
            project_id: projectId,
            operator_id: operatorId,
            photo_type: photoType,
            captured_at: new Date().toISOString(),
            file: file,
            file_data: e.target.result, // base64 data
            synced: false
        };

        photos.push(photo);
        saveLocalData();
        updateUI();

        // Show thumbnail
        displayThumbnail(file);

        showNotification('Photo captured');
    };
    reader.readAsDataURL(file);

    // Show success feedback
    const button = event.target.id === 'equipmentInput'
        ? document.getElementById('equipmentButton')
        : document.getElementById('clipboardButton');

    button.classList.add('success');
    setTimeout(() => button.classList.remove('success'), 2000);

    // Reset file input
    event.target.value = '';
}

function displayThumbnail(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const thumbnailGrid = document.getElementById('thumbnailGrid');
        const div = document.createElement('div');
        div.className = 'thumbnail';
        div.innerHTML = `<img src="${e.target.result}" alt="Capture" />`;
        thumbnailGrid.appendChild(div);
    };
    reader.readAsDataURL(file);
}

async function syncData() {
    // Demo mode - data is already saved to localStorage
    const syncButton = document.getElementById('syncButton');
    syncButton.textContent = '✅ SAVING...';

    // Ensure data is saved
    saveLocalData();

    setTimeout(() => {
        updateUI();
        showNotification('All data saved locally');
    }, 500);
}

async function uploadVoiceNote(note) {
    try {
        const formData = new FormData();
        formData.append('audio_file', note.audio_blob, 'voice_note.webm');
        formData.append('project_id', note.project_id);
        formData.append('operator_id', note.operator_id);
        formData.append('captured_at', note.captured_at);

        const response = await fetch(`${API_BASE}/field/voice/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error uploading voice note:', error);
        return false;
    }
}

async function uploadPhoto(photo) {
    try {
        const formData = new FormData();
        formData.append('photo_file', photo.file);
        formData.append('project_id', photo.project_id);
        formData.append('operator_id', photo.operator_id);
        formData.append('photo_type', photo.photo_type);
        formData.append('captured_at', photo.captured_at);

        const response = await fetch(`${API_BASE}/field/photo/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error uploading photo:', error);
        return false;
    }
}

function saveLocalData() {
    console.log('💾 Saving local data...');
    console.log('Voice notes:', voiceNotes.length);
    console.log('Photos:', photos.length);

    // Save counts and metadata
    const data = {
        voiceCount: voiceNotes.length,
        photoCount: photos.length,
        syncedCount: voiceNotes.length + photos.length
    };
    localStorage.setItem('fieldData', JSON.stringify(data));

    // Save actual voice note data
    const voiceNoteData = voiceNotes.map(note => ({
        id: note.id,
        project_id: note.project_id,
        captured_at: note.captured_at,
        transcription: note.transcription,
        confidence: note.confidence || 0.95,
        duration_seconds: note.duration_seconds || 30
    }));
    localStorage.setItem('emg_voice_notes', JSON.stringify(voiceNoteData));
    console.log('✅ Saved voice notes to localStorage');

    // Save photo metadata
    const photoData = photos.map(photo => ({
        id: photo.id,
        project_id: photo.project_id,
        photo_type: photo.photo_type,
        captured_at: photo.captured_at,
        file_data: photo.file_data,
        ocr_confidence: photo.ocr_confidence || 0.90
    }));
    localStorage.setItem('emg_photos', JSON.stringify(photoData));
    console.log('✅ Saved photos to localStorage');

    // Save to jobs dashboard
    const address = document.getElementById('addressInput').value;
    if (address && projectId) {
        const projectRef = localStorage.getItem('current_project_ref') || `EMG-2026-${projectId.slice(0, 6).toUpperCase()}`;

        let allJobs = JSON.parse(localStorage.getItem('emg_all_jobs') || '[]');
        let existingJob = allJobs.find(j => j.jobId === projectId);

        if (existingJob) {
            existingJob.voiceNotes = voiceNoteData;
            existingJob.photos = photoData;
            existingJob.address = address;
            console.log('✅ Updated existing job');
        } else {
            const newJob = {
                jobId: projectId,
                projectReference: projectRef,
                address: address,
                createdAt: new Date().toISOString(),
                status: 'in-progress',
                voiceNotes: voiceNoteData,
                photos: photoData,
                managerInputs: {}
            };
            allJobs.push(newJob);
            console.log('✅ Created new job');
        }

        localStorage.setItem('emg_all_jobs', JSON.stringify(allJobs));
        console.log('✅ Jobs saved. Total jobs:', allJobs.length);
    }
}

function loadLocalData() {
    const saved = localStorage.getItem('fieldData');
    if (saved) {
        const data = JSON.parse(saved);
        updateUI();
    }

    // Load existing voice notes and photos for the current session
    const savedVoiceNotes = localStorage.getItem('emg_voice_notes');
    if (savedVoiceNotes) {
        const parsed = JSON.parse(savedVoiceNotes);
        // Only load voice notes for current project
        voiceNotes = parsed.filter(note => !projectId || note.project_id === projectId);
    }

    const savedPhotos = localStorage.getItem('emg_photos');
    if (savedPhotos) {
        const parsed = JSON.parse(savedPhotos);
        photos = parsed.filter(photo => !projectId || photo.project_id === projectId);
    }

    // Restore project ID
    projectId = localStorage.getItem('current_project_id');
    if (projectId) {
        const savedProject = localStorage.getItem('emg_current_project');
        if (savedProject) {
            const project = JSON.parse(savedProject);
            document.getElementById('addressInput').value = project.address || '';
        }
    }

    updateUI();
}

function updateUI() {
    document.getElementById('voiceCount').textContent = voiceNotes.length;
    document.getElementById('photoCount').textContent = photos.length;

    const syncedCount = [...voiceNotes, ...photos].filter(item => item.synced).length;
    document.getElementById('uploadedCount').textContent = voiceNotes.length + photos.length;

    // Update sync button - always show as synced in demo mode
    const syncButton = document.getElementById('syncButton');
    const totalItems = voiceNotes.length + photos.length;

    if (totalItems > 0) {
        syncButton.textContent = `✅ DATA SAVED (${totalItems} items)`;
        syncButton.disabled = false;
    } else {
        syncButton.textContent = '✅ READY TO CAPTURE';
        syncButton.disabled = true;
    }
}

function showNotification(message) {
    // Don't show notification for "working offline" messages
    if (message.includes('offline') || message.includes('sync later')) {
        console.log(message);
        return;
    }

    // Create a toast notification instead of alert
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
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: bold;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Add animation styles
if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(100px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(0); opacity: 1; }
            to { transform: translateX(-50%) translateY(100px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Auto-save every 10 seconds
setInterval(() => {
    if (voiceNotes.length > 0 || photos.length > 0) {
        saveLocalData();
    }
}, 10000);

// Service Worker for PWA (offline functionality)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => {
        console.log('Service Worker registered');
    });
}
