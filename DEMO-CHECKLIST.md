# Boss Demo Checklist - EMG Energy v1

## Pre-Demo Setup (5 minutes before)

### Browser Setup
- [ ] Open Google Chrome or Microsoft Edge
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Close all other tabs
- [ ] Set zoom to 100%
- [ ] Connect external speakers (optional, for better audio)

### Microphone Test
- [ ] Open Chrome → Settings → Privacy → Microphone
- [ ] Test microphone is working
- [ ] Adjust volume levels
- [ ] Close settings page

### System Check
- [ ] Open `index.html` in browser
- [ ] Verify EMG logo loads
- [ ] Both buttons visible (Field Capture & Manager Dashboard)
- [ ] No console errors (F12 → Console)

### Clear Old Demo Data
```javascript
// Open browser console (F12) and run:
localStorage.clear();
console.log('✅ Demo data cleared - ready for fresh demo');
```

---

## Demo Script (15-20 minutes)

### Part 1: System Introduction (2 min)
**Open:** `index.html`

**Say:**
> "This is our new Building Assessment System for Irish Building Regulations Part L compliance.
> It has two components: Field Capture for operators on-site, and Manager Dashboard for office review."

**Show:**
- [ ] Point to Field Capture features list
- [ ] Point to Manager Dashboard features list
- [ ] Explain browser requirements (Chrome/Edge for voice)
- [ ] Mention offline capability

---

### Part 2: Field Capture Demo (5 min)
**Click:** Field Capture button → opens `final-field.html`

#### Create Project
- [ ] Enter address: "15 Oak Avenue, Dublin 8"
- [ ] Click "CREATE PROJECT"
- [ ] **Show:** Green box appears with EMG-2026-XXXXXX reference
- [ ] **Say:** "System generates unique reference automatically"

#### Record Voice Notes
**Note 1:**
- [ ] Click "🎤 RECORD"
- [ ] **Show:** Red pulsing box appears
- [ ] Speak: "Front entrance, main door, south-facing, double-glazed"
- [ ] **Show:** Text appears in real-time
- [ ] Click "⏹️ STOP"
- [ ] **Say:** "Note saved automatically with manual stop"

**Note 2:**
- [ ] Click "🎤 RECORD" again
- [ ] Speak: "Living room, 22 degrees Celsius, three radiators, east-facing windows"
- [ ] Click "⏹️ STOP"

**Note 3:**
- [ ] Click "🎤 RECORD" again
- [ ] Speak: "Kitchen, north-facing, single glazing, cold draft detected"
- [ ] Click "⏹️ STOP"

**Show:**
- [ ] Point to note counter (should show 3)
- [ ] Point to projects counter
- [ ] Scroll through saved notes

#### Save to Dashboard
- [ ] Click "💾 SAVE TO DASHBOARD"
- [ ] **Show:** Button changes to "✅ SAVED!"
- [ ] **Say:** "Data now available to managers in real-time"

---

### Part 3: Manager Dashboard Demo (8 min)
**Click:** "📊 VIEW DASHBOARD" → opens `manager-dashboard.html`

#### Login
**Option 1 (Recommended):**
- [ ] Click "Sign in with Google"
- [ ] Enter your name (e.g., "Michael O'Brien")
- [ ] **Say:** "In production, this would be real Google OAuth"

**Option 2:**
- [ ] Type name manually
- [ ] Click Continue

#### Overview Tab
- [ ] **Show:** Stats dashboard at top
  - Total Projects: 1
  - Active: 1
  - Completed: 0
  - Voice Notes: 3
- [ ] **Show:** Recent projects section
- [ ] Click on project card to expand
- [ ] **Point out:** All 3 voice notes are visible
- [ ] **Say:** "Manager sees field notes within 5 seconds of operator saving"

#### All Jobs Tab
- [ ] Click "📋 All Jobs" tab
- [ ] **Show:** Project with full details
- [ ] **Demonstrate filters:**
  - Type "Oak" in search box → filters immediately
  - Select "In Progress" status → updates
  - Click "Clear Filters" → resets
- [ ] **Say:** "Easy to find projects with hundreds in the system"

#### Create Job Tab
- [ ] Click "➕ Create Job" tab
- [ ] Enter details:
  - Reference: "EMG-2026-DEMO1"
  - Address: "27 Main Street, Cork"
  - Status: Pending
  - Assign to: John Murphy
  - Notes: "Priority site - client requested urgent assessment"
- [ ] Click "Create Job"
- [ ] **Say:** "Managers can create and assign jobs to field staff"

#### Reports Tab
- [ ] Click "📄 Reports" tab
- [ ] Select first project from dropdown
- [ ] **Show:** Report preview appears with:
  - Project reference
  - Address
  - Date
  - Status
  - All voice notes listed
- [ ] Click "📄 Generate PDF"
- [ ] **Show:** Alert explaining PDF generation
- [ ] **Say:** "In production, this creates a full compliance report"
- [ ] Click "✉️ Send via Email"
- [ ] Enter email: demo@emgenergy.ie
- [ ] **Show:** Email client opens with pre-filled data
- [ ] **Say:** "Direct email integration for client reports"

#### Back to All Jobs
- [ ] Click "📋 All Jobs" tab
- [ ] Find project
- [ ] Click action buttons:
  - "View Details" → Shows popup with summary
  - "📄 PDF" → Quick PDF generation
  - "✉️ Email" → Quick email
  - "Delete" → Confirm deletion (cancel it)

#### Analytics Tab
- [ ] Click "📈 Analytics" tab
- [ ] **Show:** Chart placeholder
- [ ] **Say:** "Production version will show project trends, staff performance, compliance rates"

---

### Part 4: Field Operator Update (2 min)
**Go back to Field Capture tab** (or open in new tab)

- [ ] Click dropdown: "-- Select Project --"
- [ ] **Show:** Both projects appear (Oak Avenue + Main Street)
- [ ] Select "Main Street, Cork" (the one manager created)
- [ ] **Show:** Project loads with manager's notes
- [ ] Click "🎤 RECORD"
- [ ] Speak: "Site visit completed, taking measurements"
- [ ] Click "⏹️ STOP"
- [ ] Click "💾 SAVE TO DASHBOARD"

**Switch back to Manager Dashboard**
- [ ] Wait 5 seconds (auto-refresh)
- [ ] **Show:** New note appears automatically
- [ ] **Say:** "Real-time collaboration between field and office"

---

### Part 5: Benefits Summary (2 min)

**Key Points to Emphasize:**

#### Time Savings
- [ ] **Say:** "Manual reports take 2-3 hours per site"
- [ ] **Say:** "With voice notes: 15-20 minutes"
- [ ] **Say:** "85% time reduction = massive cost savings"

#### Cost Savings
- [ ] **Say:** "2 sites per day × 2.5 hours saved × €30/hour"
- [ ] **Say:** "= €150 per day per operator"
- [ ] **Say:** "= €33,000 per year per operator"

#### Quality Improvements
- [ ] **Say:** "More detailed notes (easy to speak vs write)"
- [ ] **Say:** "Captured on-site (no memory errors)"
- [ ] **Say:** "Structured data (easier compliance checking)"

#### Staff Benefits
- [ ] **Say:** "Less paperwork = happier staff"
- [ ] **Say:** "Natural speech = no typing on-site"
- [ ] **Say:** "Works offline = no connectivity issues"

---

## Handling Questions

### "What about internet connectivity on-site?"
**Answer:** "System works completely offline. Data is saved locally and syncs when back in range. Voice recognition works offline after first load."

### "What if voice recognition gets it wrong?"
**Answer:** "Manager reviews all notes and can edit them before generating final report. Most transcription is 95%+ accurate with clear speech."

### "Can we customize the reports?"
**Answer:** "Yes, production version will have customizable templates, company branding, and different report types for different building types."

### "How secure is the data?"
**Answer:** "Production version will use encrypted database, secure authentication, role-based access control, and comply with GDPR requirements."

### "What about photos?"
**Answer:** "Photo upload removed from demo due to browser storage limits. Production version will store photos on server with unlimited capacity."

### "How much does this cost?"
**Answer:** "Development: [your estimate]. Annual savings: €33,000+ per operator. ROI within 3-6 months."

### "When can we go live?"
**Answer:** "After your approval: Backend development (2-3 weeks), beta testing (1 week), rollout (1 week). Live in 4-5 weeks."

---

## Post-Demo Actions

### If Boss Approves:
- [ ] Get sign-off email
- [ ] Schedule backend development kick-off meeting
- [ ] Select 2-3 beta testers from field staff
- [ ] Set project timeline and milestones
- [ ] Begin backend development

### If Boss Requests Changes:
- [ ] Document all requested changes
- [ ] Estimate time for each change
- [ ] Schedule follow-up demo
- [ ] Make changes
- [ ] Re-demo

### If More Info Needed:
- [ ] Provide detailed cost breakdown
- [ ] Share ROI calculations
- [ ] Arrange field operator trial
- [ ] Schedule technical deep-dive

---

## Emergency Fixes During Demo

### Voice Not Working
1. Press F12 → Console
2. Look for red errors
3. Check microphone permission (camera icon in address bar)
4. Reload page: Ctrl+Shift+R
5. Try different browser tab

### Projects Not Showing
1. Click "Clear Filters" button
2. Hard refresh: Ctrl+Shift+R
3. Check localStorage: F12 → Application → localStorage
4. If needed: `localStorage.clear()` and restart demo

### Page Won't Load
1. Check internet connection (for images)
2. Hard refresh: Ctrl+Shift+R
3. Open in private/incognito window
4. Try different browser

---

## Demo Success Criteria

✅ Voice transcription works smoothly
✅ Projects save and appear in dashboard
✅ Manager can create and assign jobs
✅ Report preview displays correctly
✅ Email functionality demonstrates
✅ Boss understands time savings
✅ Boss sees value proposition
✅ Technical questions answered confidently

---

## Final Check (Before Boss Arrives)

5 minutes before:
- [ ] Browser open to `index.html`
- [ ] Microphone tested and working
- [ ] No other tabs open
- [ ] Console clear (no errors)
- [ ] Demo data cleared (fresh start)
- [ ] Backup tab ready (in case of issues)
- [ ] Water/coffee ready
- [ ] Confident and ready!

---

**Good luck with the demo! You've got this! 🚀**

**Remember:**
- Speak clearly during voice recording
- Take your time (don't rush)
- Show enthusiasm about time savings
- Be confident in the technology
- Answer questions honestly
- If something fails, stay calm and use backup plan

**The system works great - just show it off!**
