/**
 * EMG Energy Sync Client
 * Syncs data from browser localStorage to backend file system
 */

const SYNC_API = 'http://localhost:8081/api';

// Sync all jobs to backend
async function syncAllJobsToBackend() {
    const allJobs = JSON.parse(localStorage.getItem('emg_all_jobs') || '[]');

    if (allJobs.length === 0) {
        console.log('📭 No jobs to sync');
        return { success: true, synced: 0 };
    }

    try {
        const response = await fetch(`${SYNC_API}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allJobs)
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Synced ${result.synced} jobs to backend`);
            return result;
        } else {
            console.error('❌ Sync failed:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('❌ Sync error:', error.message);
        return { success: false, error: error.message };
    }
}

// Load surveys from backend
async function loadSurveysFromBackend() {
    try {
        const response = await fetch(`${SYNC_API}/surveys`);
        const result = await response.json();

        if (result.success) {
            console.log(`✅ Loaded ${result.count} surveys from backend`);
            // Update localStorage with backend data
            localStorage.setItem('emg_all_jobs', JSON.stringify(result.surveys));
            return result.surveys;
        } else {
            console.error('❌ Load failed:', result.error);
            return [];
        }
    } catch (error) {
        console.error('❌ Load error:', error.message);
        return [];
    }
}

// Check if backend is available
async function checkBackendConnection() {
    try {
        const response = await fetch(`${SYNC_API}/health`, { timeout: 2000 });
        const result = await response.json();
        return result.status === 'ok';
    } catch (error) {
        return false;
    }
}

// Auto-sync when page loads (optional)
async function autoSync() {
    const isConnected = await checkBackendConnection();

    if (isConnected) {
        console.log('🔗 Backend connected - syncing...');
        await syncAllJobsToBackend();
    } else {
        console.log('📴 Backend not available - using local storage only');
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        syncAllJobsToBackend,
        loadSurveysFromBackend,
        checkBackendConnection,
        autoSync
    };
}
