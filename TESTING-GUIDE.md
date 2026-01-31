# EMG Energy System - Complete Testing Guide

## 🚀 Quick Start

### Prerequisites
- Web browser (Chrome or Edge recommended for live transcription)
- Node.js installed (for backend storage)
- Terminal access

### Starting the System

1. **Start the Web Server** (Terminal 1):
   ```bash
   cd /home/blendie/emg-demo
   python3 -m http.server 8080
   ```

2. **Start the Sync Server** (Terminal 2) - Optional:
   ```bash
   cd /home/blendie/emg-demo
   node backend/sync-server.js
   ```

3. **Open the Application**:
   - Main Page: http://localhost:8080/index.html
   - Field Interface: http://localhost:8080/field/index.html
   - Manager Dashboard: http://localhost:8080/manager/triage.html

---

## 📋 Complete End-to-End Test Workflow

### Phase 1: Field Operator - Data Capture

#### Test 1: Create New Project
1. Open: http://localhost:8080/field/index.html
2. Enter address: "123 Oak Avenue, Ennis, Co. Clare"
3. Click **"➕ Create New Project"**
4. ✅ Verify project reference appears (e.g., EMG-2026-XXXXXX)

#### Test 2: Voice Recording with Live Transcription
1. **Allow microphone access** when prompted
2. Press and HOLD the **"🎤 RECORD VOICE NOTE"** button
3. Speak clearly: "Property assessment beginning. Two storey detached house, approximately 165 square meters. Building appears well maintained."
4. ✅ **Verify live transcription appears in RED ANIMATED BOX**
5. Release button to stop
6. ✅ Verify "Voice note X captured! Click SAVE when ready" notification
7. Repeat 2-3 more times with different observations

**Expected Voice Note Content Examples:**
- "Blower door test setup complete. Testing at 50 Pascals pressure differential."
- "Air permeability reading shows 3.8 cubic meters per hour per square meter."
- "Wall U-value measurements taken. Front wall measures 0.27 watts per square meter kelvin."

#### Test 3: Photo Capture
1. Click **"📷 CAPTURE EQUIPMENT SCREEN"**
2. Take photo of equipment/screen
3. ✅ Verify thumbnail appears at bottom
4. Click **"📋 PHOTO MY CLIPBOARD"**
5. Take photo of clipboard/documents
6. ✅ Verify second thumbnail appears

#### Test 4: Manual Save
1. Check status bar shows correct counts
2. Click **"💾 SAVE TO DASHBOARD"** button
3. ✅ Verify button shows "⏳ SAVING..." then "✅ SAVED!"
4. ✅ Verify notification: "Saved to dashboard: X notes, Y photos"

#### Test 5: Load Existing Project
1. Click dropdown: "My Projects"
2. Select your saved project
3. ✅ Verify voice notes and photos load correctly
4. ✅ Verify status bar shows correct counts

---

### Phase 2: Manager Dashboard - Review & Edit

#### Test 6: View Dashboard
1. Open: http://localhost:8080/manager/triage.html
2. ✅ Verify project card appears with:
   - Project reference
   - Address
   - Voice note count
   - Photo count
   - Date

#### Test 7: Review Job Details
1. Click **"📊 View Details"** on job card
2. ✅ Verify modal opens with:
   - Voice notes transcriptions (should show your recorded text)
   - Photos (click to view full size)
   - Test results table (auto-generated from photos)
   - Compliance summary

#### Test 8: Add Manager Information
1. In the modal, scroll to "Manager's Additional Information"
2. **Assessor Notes**: Enter detailed observations
   ```
   Excellent property with high thermal performance. All parameters well within Part L 2022 standards. Modern construction with quality materials evident throughout.
   ```
3. **Custom Recommendations**: Enter specific advice
   ```
   Property achieves full compliance. No immediate remedial works required. Recommend continued maintenance of seals around windows and doors.
   ```
4. **Floor Area**: 165
5. **Year Built**: 2018
6. **BER Rating**: B2
7. **Property Type**: Detached House
8. Click **"💾 Save Additional Info"**
9. ✅ Verify save notification appears

#### Test 9: Change Job Status
1. Use status dropdown on job card
2. Change from "In Progress" to "Completed"
3. ✅ Verify status updates
4. ✅ Verify job moves to "Past Projects" tab

#### Test 10: Generate PDF Report
1. Open job details
2. Click **"🖨️ PDF"** button
3. ✅ Verify new window opens with comprehensive report containing:
   - EMG Energy logo
   - Property details table
   - Executive summary with your manager notes
   - Assessment methodology
   - Field observations (your voice notes)
   - Test results table
   - Compliance analysis
   - Detailed recommendations
   - Professional footer
4. Use browser print (Ctrl+P) to save as PDF

---

### Phase 3: Backend Storage - Persistent Data

#### Test 11: Sync to File System
1. Ensure sync server is running (node backend/sync-server.js)
2. In browser console (F12), run:
   ```javascript
   fetch('http://localhost:8081/api/sync', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: localStorage.getItem('emg_all_jobs')
   }).then(r => r.json()).then(console.log)
   ```
3. ✅ Verify success message in console
4. ✅ Verify file created in `/home/blendie/emg-demo/data/surveys/`

#### Test 12: View Saved Files
```bash
# List all saved surveys
cd /home/blendie/emg-demo
node backend/storage-manager.js list

# Get statistics
node backend/storage-manager.js stats

# Export all data
node backend/storage-manager.js export
```

#### Test 13: Load Historic Surveys
```bash
# View saved survey
cat /home/blendie/emg-demo/data/surveys/*.json | head -50
```

---

## 🎯 Feature Verification Checklist

### Voice Transcription
- [ ] Live transcription visible in large red animated box
- [ ] Transcription updates in real-time as you speak
- [ ] Multiple voice notes accumulate (don't overwrite)
- [ ] Transcriptions save correctly
- [ ] Transcriptions appear in manager dashboard

### Photo Capture
- [ ] Photos captured from camera
- [ ] Thumbnails display immediately
- [ ] Photos save with metadata
- [ ] Full-size photos viewable in dashboard
- [ ] Multiple photos accumulate

### Manual Save Workflow
- [ ] Save button only active when data exists
- [ ] Save button shows progress (SAVING → SAVED)
- [ ] Data persists in localStorage
- [ ] Can load saved projects from dropdown
- [ ] Data appears in manager dashboard

### Manager Dashboard
- [ ] Job cards display all projects
- [ ] Tabs filter correctly (Active, Review, Past, All)
- [ ] Job details modal opens
- [ ] Voice notes display with transcriptions
- [ ] Photos display and are clickable
- [ ] Test results auto-generate
- [ ] Manager input fields save per job
- [ ] Status changes work
- [ ] Delete functionality works

### PDF Reports
- [ ] PDF opens in new window
- [ ] Contains EMG logo
- [ ] Shows all property details
- [ ] Includes manager notes
- [ ] Shows voice note transcriptions
- [ ] Contains test results table
- [ ] Has detailed recommendations
- [ ] Professional formatting
- [ ] Printable (Ctrl+P works)

### Backend Storage
- [ ] Surveys save to /data/surveys/
- [ ] Reports save to /data/reports/
- [ ] Can list all surveys
- [ ] Can load specific survey
- [ ] Can update survey
- [ ] Can delete survey
- [ ] Export functionality works
- [ ] Statistics calculate correctly

---

## 🐛 Troubleshooting

### Voice Transcription Not Working
- **Check**: Browser supports Web Speech API (Chrome/Edge)
- **Check**: Microphone permission granted
- **Check**: Microphone is working (test in system settings)
- **Solution**: Refresh page and allow microphone access
- **Fallback**: Voice still records, just no live transcription

### Data Not Appearing in Dashboard
- **Check**: Did you click "SAVE TO DASHBOARD"?
- **Check**: Browser console for errors (F12)
- **Solution**: Hard refresh (Ctrl+Shift+R)
- **Solution**: Clear browser cache

### Backend Not Connecting
- **Check**: Is sync server running? (node backend/sync-server.js)
- **Check**: Port 8081 available?
- **Check**: CORS errors in console?
- **Note**: System works offline without backend (localStorage only)

### PDF Not Generating
- **Check**: Browser popup blocker disabled?
- **Check**: Manager inputs saved?
- **Solution**: Use "PDF" button in job details modal
- **Fallback**: Use browser print (Ctrl+P) from dashboard

---

## 📊 Test Data Reference

### Sample Voice Notes
1. "Property assessment beginning at 123 Oak Avenue. Two storey detached house approximately 165 square meters."
2. "Blower door test setup complete. Testing at 50 Pascals pressure differential. Weather conditions good."
3. "Air permeability test complete. Reading shows 3.8 cubic meters per hour per square meter at 50 Pascals."
4. "Wall U-value measurements taken using thermal camera. Front wall measures 0.27 watts per square meter kelvin."
5. "Roof insulation inspection complete. Insulation depth measured at 350 millimeters of mineral wool."

### Expected Test Results
- Air Leakage Rate: 3.8 m³/h/m² (PASS - Max 5.0)
- Wall U-Value: 0.27 W/m²K (PASS - Max 0.32)
- Roof U-Value: 0.16 W/m²K (PASS - Max 0.20)
- Window U-Value: 1.5 W/m²K (PASS - Max 1.6)

### Sample Manager Notes
```
Excellent property with high thermal performance. All parameters well within Part L 2022 standards. Modern construction with quality materials and workmanship evident throughout. Air tightness particularly impressive for building of this age. Owner has maintained property to high standard.
```

### Sample Recommendations
```
Property achieves full compliance. No immediate remedial works required. Recommend continued maintenance of seals around windows and doors. Consider periodic re-testing in 5-10 years to verify continued performance.
```

---

## 🎬 Complete Test Script

Run this complete test from start to finish:

```bash
# 1. Start servers
cd /home/blendie/emg-demo
python3 -m http.server 8080 &
node backend/sync-server.js &

# 2. Open browser and navigate to:
# http://localhost:8080/field/index.html

# 3. Field operator workflow:
#    - Create new project with address
#    - Record 5 voice notes (watch live transcription!)
#    - Capture 2-4 photos
#    - Click SAVE TO DASHBOARD

# 4. Open manager dashboard:
# http://localhost:8080/manager/triage.html

# 5. Manager workflow:
#    - View job details
#    - Add manager notes and recommendations
#    - Fill in property details (floor area, year, BER, type)
#    - Save additional info
#    - Generate PDF report
#    - Verify all sections present

# 6. Backend verification:
node backend/storage-manager.js stats
node backend/storage-manager.js list
ls -lh data/surveys/
ls -lh data/reports/

# 7. Test complete!
```

---

## ✅ Success Criteria

The system is working correctly when:
1. ✅ Voice notes record with **visible live transcription**
2. ✅ Photos capture and display
3. ✅ Manual save persists data
4. ✅ Dashboard shows all captured data
5. ✅ Manager can add custom information per job
6. ✅ PDF generates with **all sections** including voice transcriptions
7. ✅ Backend saves surveys to file system
8. ✅ Historic surveys can be loaded, edited, and deleted

---

## 📞 Support

For issues or questions:
- Check browser console (F12) for errors
- Verify all servers are running
- Try hard refresh (Ctrl+Shift+R)
- Clear localStorage if needed: `localStorage.clear()`

---

**EMG Energy Consultants**
Building Energy Assessment System v1.0
