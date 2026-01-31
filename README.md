# EMG Energy Field Data Capture System

**Professional Building Energy Assessment Platform**

A comprehensive PWA (Progressive Web App) for conducting building energy compliance assessments in accordance with Irish Building Regulations Part L (TGD L 2022).

## 🌟 Features

### Field Operator Interface
- ✅ **Live Voice Transcription** - Real-time speech-to-text during recording
- ✅ **Photo Capture** - Equipment screens, clipboards, and site documentation
- ✅ **Offline-First** - Works without internet connection
- ✅ **Manual Save Control** - Explicit save workflow with visual feedback
- ✅ **Project Management** - Create new or continue existing projects
- ✅ **Mobile Optimized** - Responsive design for tablets and phones

### Manager Dashboard
- ✅ **Project Triage** - Categorized views (Active, Review, Past, All)
- ✅ **Evidence Review** - View all voice notes and photos with confidence scores
- ✅ **Custom Data Entry** - Add assessor notes, recommendations, property details
- ✅ **Auto-Generated Test Results** - Intelligent parsing from captured data
- ✅ **Compliance Checking** - Automated Part L 2022 standards verification
- ✅ **Status Management** - Track project lifecycle (Pending → In Progress → Completed)

### PDF Report Generation
- ✅ **Comprehensive Reports** - Executive summary, methodology, findings, recommendations
- ✅ **Professional Layout** - EMG Energy branding, tables, compliance badges
- ✅ **Integrated Data** - Combines field observations with manager analysis
- ✅ **Print-Ready** - Browser-based PDF generation
- ✅ **Detailed Recommendations** - Specific guidance based on test results

### Backend Storage
- ✅ **Persistent File System** - JSON-based survey storage
- ✅ **Historic Surveys** - Load, edit, delete past assessments
- ✅ **Export/Import** - Backup and restore functionality
- ✅ **Statistics Dashboard** - Track volumes and trends
- ✅ **Sync API** - Browser-to-filesystem synchronization

## 🚀 Quick Start

### 1. Start Web Server
```bash
cd /home/blendie/emg-demo
python3 -m http.server 8080
```

### 2. Start Sync Server (Optional)
```bash
node backend/sync-server.js
```

### 3. Open Application
- **Main Page**: http://localhost:8080/
- **Field Interface**: http://localhost:8080/field/
- **Manager Dashboard**: http://localhost:8080/manager/triage.html

## 📱 Usage Workflow

### Field Operator
1. Create new project or select existing
2. Enter property address
3. Record voice notes (watch live transcription!)
4. Capture photos of equipment and documents
5. Click "SAVE TO DASHBOARD"
6. View saved data in dashboard

### Manager
1. Open dashboard to see pending projects
2. Click "View Details" on any job
3. Review voice transcriptions and photos
4. Add assessor notes and recommendations
5. Enter property details (floor area, BER, etc.)
6. Save additional information
7. Generate PDF report
8. Change status to "Completed"

## 🏗️ Architecture

```
emg-demo/
├── index.html              # Landing page
├── field/                  # Field operator interface
│   ├── index.html          # Mobile capture UI
│   ├── app.js              # Core logic
│   └── sync-client.js      # Backend sync
├── manager/                # Manager dashboard
│   ├── triage.html         # Project management UI
│   └── triage.js           # Dashboard logic
├── backend/                # Node.js backend
│   ├── sync-server.js      # HTTP API server
│   ├── storage-manager.js  # File system storage
│   ├── test-workflow.js    # Testing script
│   └── package.json        # Dependencies
├── data/                   # Persistent storage
│   ├── surveys/            # Survey JSON files
│   ├── pdfs/               # Generated PDFs
│   └── reports/            # HTML reports
└── TESTING-GUIDE.md        # Complete test instructions
```

## 🧪 Testing

See [TESTING-GUIDE.md](TESTING-GUIDE.md) for comprehensive testing procedures.

Quick test:
```bash
cd backend
node test-workflow.js
```

## 📊 Data Storage

### LocalStorage (Browser)
- `emg_all_jobs` - All survey data
- `emg_current_project` - Active project
- `emg_voice_notes` - Voice recordings
- `emg_photos` - Photo data

### File System (Backend)
- `/data/surveys/*.json` - Survey records
- `/data/reports/*.html` - PDF report HTML
- `/data/export-*.json` - Backup exports

## 🔧 Backend API

When sync server is running (port 8081):

- `POST /api/sync` - Sync survey data
- `GET /api/surveys` - Get all surveys
- `GET /api/survey/:id` - Get specific survey
- `DELETE /api/survey/:id` - Delete survey
- `GET /api/stats` - Get statistics
- `GET /api/health` - Health check

## 🎤 Voice Transcription

Requires:
- Chrome or Edge browser
- Microphone permission
- Web Speech API support

Features:
- Live transcription in large animated display
- High confidence scoring
- Irish English (en-IE) optimized
- Automatic punctuation

## 📄 PDF Reports Include

1. **Executive Summary** - Key findings and compliance status
2. **Assessment Methodology** - Testing procedures and standards
3. **Property Details** - Address, type, area, BER rating
4. **Field Observations** - All voice note transcriptions
5. **Test Results Table** - Parameters, values, compliance status
6. **Compliance Analysis** - Detailed Part L evaluation
7. **Recommendations** - Prioritized improvement guidance
8. **Assessor Notes** - Custom manager observations

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: LocalStorage, File System (JSON)
- **Voice**: Web Speech API
- **Photos**: MediaDevices API
- **Backend**: Node.js (no external dependencies)
- **Server**: Python SimpleHTTPServer / Node.js HTTP

## 🔒 Data Privacy

- All data stored locally by default
- No external API calls (except EMG logo CDN)
- Optional backend sync for backups
- No cloud storage required
- GDPR-compliant architecture

## 📈 Compliance Standards

Implements testing for:
- TGD Part L 2022 (Irish Building Regulations)
- IS EN ISO 9972:2015 (Air Permeability)
- IS EN ISO 6946:2017 (Thermal Transmittance)
- Maximum U-values per TGD L specifications
- Air leakage rate limits (5.0 m³/h/m²)

## 🤝 Support

**EMG Energy Consultants**
Suite 17, Block A
Clare Technology Park
Gort Road, Ennis, Co. Clare

- 📧 info@emgenergy.ie
- ☎️ 065 672 9090
- 📱 087 9444470
- 🌐 www.emgenergy.ie

## 📝 License

Proprietary - EMG Energy Consultants © 2026

## 🎯 Future Enhancements

- [ ] GitHub/Google Drive integration
- [ ] Automated BER calculations
- [ ] Thermal imaging integration
- [ ] Multi-user authentication
- [ ] Real-time collaboration
- [ ] Mobile apps (iOS/Android)
- [ ] Cloud sync backup
- [ ] Advanced analytics

---

**Version**: 1.0
**Last Updated**: January 2026
**Status**: Production Ready
