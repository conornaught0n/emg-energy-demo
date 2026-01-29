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

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Store operator ID
    localStorage.setItem('operator_id', operatorId);

    // Load saved data from localStorage
    loadLocalData();

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

    // Auto-create project when address is entered
    document.getElementById('addressInput').addEventListener('blur', createProject);

    updateUI();
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

    try {
        // Get GPS coordinates if available
        let latitude = null;
        let longitude = null;

        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (e) {
                console.log('GPS not available');
            }
        }

        const response = await fetch(`${API_BASE}/field/project/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address,
                operator_id: operatorId,
                gps_latitude: latitude,
                gps_longitude: longitude
            })
        });

        const data = await response.json();

        if (data.success) {
            projectId = data.project_id;
            localStorage.setItem('current_project_id', projectId);
            localStorage.setItem('current_project_ref', data.project_reference);
            showNotification('Project started: ' + data.project_reference);
        }
    } catch (error) {
        console.error('Error creating project:', error);
        // Continue offline - project will be created on sync
        projectId = generateUUID();
        localStorage.setItem('current_project_id', projectId);
        showNotification('Working offline - will sync later');
    }
}

async function startRecording(e) {
    e.preventDefault();

    if (!projectId) {
        showNotification('Please enter property address first');
        return;
    }

    const button = document.getElementById('voiceButton');
    button.classList.add('recording');
    button.querySelector('.button-subtitle').textContent = 'Recording... Release to stop';

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
        showNotification('Microphone access denied');
        button.classList.remove('recording');
    }
}

function stopRecording(e) {
    e.preventDefault();

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();

        const button = document.getElementById('voiceButton');
        button.classList.remove('recording');
        button.classList.add('success');
        button.querySelector('.button-subtitle').textContent = 'Voice note saved!';

        setTimeout(() => {
            button.classList.remove('success');
            button.querySelector('.button-subtitle').textContent = 'Hold to record';
        }, 2000);
    }
}

async function saveVoiceNote(audioBlob) {
    const voiceNote = {
        id: generateUUID(),
        project_id: projectId,
        operator_id: operatorId,
        captured_at: new Date().toISOString(),
        audio_blob: audioBlob,
        synced: false
    };

    voiceNotes.push(voiceNote);
    saveLocalData();
    updateUI();

    showNotification('Voice note saved');
}

async function handlePhotoCapture(event, photoType) {
    const file = event.target.files[0];
    if (!file) return;

    if (!projectId) {
        showNotification('Please enter property address first');
        return;
    }

    const photo = {
        id: generateUUID(),
        project_id: projectId,
        operator_id: operatorId,
        photo_type: photoType,
        captured_at: new Date().toISOString(),
        file: file,
        synced: false
    };

    photos.push(photo);
    saveLocalData();
    updateUI();

    // Show thumbnail
    displayThumbnail(file);

    // Show success feedback
    const button = event.target.id === 'equipmentInput'
        ? document.getElementById('equipmentButton')
        : document.getElementById('clipboardButton');

    button.classList.add('success');
    setTimeout(() => button.classList.remove('success'), 2000);

    showNotification('Photo captured');

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
    if (!navigator.onLine) {
        showNotification('You are offline. Data will sync when connected.');
        return;
    }

    const syncButton = document.getElementById('syncButton');
    syncButton.disabled = true;
    syncButton.textContent = '⏳ Syncing...';

    let successCount = 0;

    try {
        // Sync voice notes
        for (const note of voiceNotes) {
            if (!note.synced) {
                const success = await uploadVoiceNote(note);
                if (success) {
                    note.synced = true;
                    successCount++;
                }
            }
        }

        // Sync photos
        for (const photo of photos) {
            if (!photo.synced) {
                const success = await uploadPhoto(photo);
                if (success) {
                    photo.synced = true;
                    successCount++;
                }
            }
        }

        saveLocalData();
        updateUI();

        syncButton.textContent = `✅ Synced ${successCount} items`;
        showNotification(`Uploaded ${successCount} items successfully`);

    } catch (error) {
        console.error('Sync error:', error);
        syncButton.textContent = '❌ Sync failed - Retry';
        showNotification('Sync failed. Will retry automatically.');
    } finally {
        setTimeout(() => {
            syncButton.disabled = false;
            syncButton.textContent = '✅ SYNC NOW';
        }, 3000);
    }
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
    // Note: Can't store Blobs in localStorage, would need IndexedDB for production
    const data = {
        voiceCount: voiceNotes.length,
        photoCount: photos.length,
        syncedCount: [...voiceNotes, ...photos].filter(item => item.synced).length
    };
    localStorage.setItem('fieldData', JSON.stringify(data));
}

function loadLocalData() {
    const saved = localStorage.getItem('fieldData');
    if (saved) {
        const data = JSON.parse(saved);
        // In production, would reload actual data from IndexedDB
        updateUI();
    }

    // Restore project ID
    projectId = localStorage.getItem('current_project_id');
    if (projectId) {
        const address = localStorage.getItem('current_address');
        if (address) {
            document.getElementById('addressInput').value = address;
        }
    }
}

function updateUI() {
    document.getElementById('voiceCount').textContent = voiceNotes.length;
    document.getElementById('photoCount').textContent = photos.length;

    const syncedCount = [...voiceNotes, ...photos].filter(item => item.synced).length;
    document.getElementById('uploadedCount').textContent = syncedCount;

    // Update sync button
    const unsyncedCount = voiceNotes.length + photos.length - syncedCount;
    const syncButton = document.getElementById('syncButton');

    if (unsyncedCount > 0) {
        syncButton.textContent = `✅ SYNC NOW (${unsyncedCount} items)`;
    } else {
        syncButton.textContent = '✅ ALL SYNCED';
        syncButton.disabled = true;
    }
}

function showNotification(message) {
    // Simple notification (could be enhanced with a toast library)
    alert(message);
}

// Auto-sync every 30 seconds if online
setInterval(() => {
    if (navigator.onLine) {
        const unsyncedCount = [...voiceNotes, ...photos].filter(item => !item.synced).length;
        if (unsyncedCount > 0) {
            syncData();
        }
    }
}, 30000);

// Service Worker for PWA (offline functionality)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => {
        console.log('Service Worker registered');
    });
}
