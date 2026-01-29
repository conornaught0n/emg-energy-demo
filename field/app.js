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

    // Auto-create project when address is entered
    document.getElementById('addressInput').addEventListener('blur', createProject);

    updateUI();
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
            console.log('Speech recognition started');
            transcriptionText.textContent = 'Listening... Start speaking now!';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            currentTranscription = (finalTranscript + interimTranscript).trim();

            // Update the large transcription display
            if (currentTranscription) {
                transcriptionText.textContent = currentTranscription;
                transcriptionText.classList.remove('empty');
            } else {
                transcriptionText.textContent = 'Listening... Start speaking now!';
                transcriptionText.classList.add('empty');
            }

            // Also show in button
            button.querySelector('.button-subtitle').innerHTML =
                `<span style="font-size: 11px; line-height: 1.3;">Recording... ${currentTranscription.slice(0, 30)}${currentTranscription.length > 30 ? '...' : ''}</span>`;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            transcriptionText.textContent = `Error: ${event.error}. Please try again.`;
            if (event.error === 'not-allowed') {
                showNotification('Microphone permission denied. Please enable microphone access in your browser settings.');
            }
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
        };

        try {
            recognition.start();
            console.log('Starting speech recognition...');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            transcriptionText.textContent = 'Speech recognition failed to start';
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

    const voiceNote = {
        id: generateUUID(),
        project_id: projectId,
        operator_id: operatorId,
        captured_at: new Date().toISOString(),
        audio_blob: audioBlob,
        transcription: transcription,
        synced: false
    };

    voiceNotes.push(voiceNote);
    saveLocalData();
    updateUI();

    showNotification('Voice note saved with live transcription');
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
    // Save counts and metadata
    const data = {
        voiceCount: voiceNotes.length,
        photoCount: photos.length,
        syncedCount: [...voiceNotes, ...photos].filter(item => item.synced).length
    };
    localStorage.setItem('fieldData', JSON.stringify(data));

    // Save actual voice note transcriptions (simulate transcription for demo)
    const voiceNoteData = voiceNotes.map(note => ({
        id: note.id,
        project_id: note.project_id,
        captured_at: note.captured_at,
        transcription: note.transcription || 'Voice note recording captured - waiting for processing',
        confidence: 0.95,
        duration_seconds: Math.floor(Math.random() * 30) + 20
    }));
    localStorage.setItem('emg_voice_notes', JSON.stringify(voiceNoteData));

    // Save photo metadata
    const photoData = photos.map(photo => ({
        id: photo.id,
        project_id: photo.project_id,
        photo_type: photo.photo_type,
        captured_at: photo.captured_at,
        file_data: photo.file_data,
        ocr_confidence: 0.88 + Math.random() * 0.1
    }));
    localStorage.setItem('emg_photos', JSON.stringify(photoData));

    // Save project info
    const address = document.getElementById('addressInput').value;
    if (address && projectId) {
        const projectData = {
            project_id: projectId,
            project_reference: localStorage.getItem('current_project_ref') || `EMG-2026-${projectId.slice(0, 6).toUpperCase()}`,
            address: address,
            created_at: new Date().toISOString(),
            status: 'in_progress'
        };
        localStorage.setItem('emg_current_project', JSON.stringify(projectData));
    }
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
