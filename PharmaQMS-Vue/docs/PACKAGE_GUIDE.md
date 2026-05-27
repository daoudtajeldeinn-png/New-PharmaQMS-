# PharmaQMS - Complete Package Guide

## 📦 Package Contents

### Complete System Package
This package contains everything needed to run the Pharmaceutical Quality Management System.

---

## 🚀 Quick Start (3 Easy Steps)

### For First Time Users:

1. **Extract the Package**
   - Extract all files to a folder on your computer
   - Example: `C:\PharmaQMS` or Desktop

2. **Run First-Time Setup**
   - Double-click: `INSTALL_AND_START.bat`
   - Wait 5-10 minutes for installation
   - App will start automatically

3. **Done!**
   - Browser will open automatically
   - App runs at: http://localhost:5173
   - Start using the system

### For Subsequent Use:

1. **Just Double-Click**
   - Run: `START_APP.bat`
   - App starts in seconds
   - That's it!

---

## 📂 Package Structure

```
PharmaQMS-Vue/
│
├── 🚀 START_APP.bat                    ← DOUBLE-CLICK TO START
├── 🔧 INSTALL_AND_START.bat            ← FIRST TIME ONLY
│
├── 📖 README.md                        ← Project Overview
├── 📚 USER_GUIDE.md                    ← Complete User Guide
├── 📋 QUICK_REFERENCE.md               ← Quick Reference Card
├── 📊 ENHANCEMENT_SUMMARY.md           ← What's New
│
├── app/                                ← Main Application
│   ├── src/                            ← Source Code
│   │   ├── components/                 ← React Components
│   │   ├── pages/                      ← Application Pages
│   │   ├── locales/                    ← Translations (AR/EN)
│   │   ├── hooks/                      ← Custom Hooks
│   │   ├── i18n.ts                     ← i18n Configuration
│   │   └── ...
│   ├── public/                         ← Static Files
│   ├── package.json                    ← Dependencies
│   └── ...
│
├── G2.html                             ← Reference (Legacy)
├── coq_manager_pro.py.py              ← COA Reference
│
└── .agent/                             ← Development Docs
    ├── IMPLEMENTATION_PLAN.md
    └── PROGRESS_REPORT.md
```

---

## 💾 Download Options

### Option 1: Direct Download (Recommended)

**If you received this as a ZIP file:**
1. Right-click the ZIP file
2. Select "Extract All"
3. Choose destination folder
4. Click "Extract"
5. Run `INSTALL_AND_START.bat`

### Option 2: From GitHub (If Published)

```bash
git clone https://github.com/YourRepo/PharmaQMS-Vue.git
cd PharmaQMS-Vue
# Then run INSTALL_AND_START.bat
```

### Option 3: Manual Setup

```bash
# 1. Navigate to app folder
cd PharmaQMS-Vue/app

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

---

## 📋 System Requirements

### Required:
- ✅ Windows 10 or later
- ✅ Node.js 18+ (Download from nodejs.org)
- ✅ Modern web browser (Chrome, Edge, Firefox)
- ✅ Internet connection (for first-time setup)
- ✅ 2 GB free disk space

### Recommended:
- ⭐ Windows 11
- ⭐ Node.js 20+
- ⭐ Google Chrome (latest)
- ⭐ 8 GB RAM
- ⭐ SSD storage

---

## 🔧 Pre-Installation Check

### Before running, ensure you have:

1. **Node.js Installed**
   ```bash
   # Check if Node.js is installed
   node --version
   # Should show: v18.x.x or higher
   ```
   
   If not installed:
   - Download from: https://nodejs.org
   - Install LTS version
   - Restart computer

2. **npm Available**
   ```bash
   # Check npm
   npm --version
   # Should show: 9.x.x or higher
   ```

3. **Sufficient Disk Space**
   - Need: 2 GB free space
   - Check: Right-click drive → Properties

---

## 📦 Package Sizes

| Component | Size | Description |
|-----------|------|-------------|
| Complete Package | ~500 MB | Everything installed |
| Source Code | ~50 MB | Without node_modules |
| node_modules | ~400 MB | Dependencies |
| Documentation | ~1 MB | All docs |

---

## 🌐 Accessing the Application

### After Starting:

1. **Automatic Launch**
   - Browser opens automatically
   - URL: http://localhost:5173

2. **Manual Access**
   - Open browser
   - Go to: http://localhost:5173
   - Bookmark for easy access

3. **Network Access**
   - Same computer: http://localhost:5173
   - Other computers: http://YOUR-IP:5173
   - Example: http://192.168.1.100:5173

---

## 🎯 First-Time Usage

### After App Opens:

1. **Login** (if required)
   - Default: Set during security setup

2. **Select Language**
   - Click Globe icon (🌐) in header
   - Choose: العربية or English

3. **Explore Dashboard**
   - View statistics
   - Check recent activity
   - Review alerts

4. **Try COA Manager**
   - Click "شهادات التحليل (COA)" in sidebar
   - View sample certificates
   - Try Print/PDF export

---

## 🔄 Updating the Package

### When Updates Available:

1. **Backup Your Data**
   - Export important records
   - Save custom settings

2. **Download New Package**
   - Extract to same location
   - Overwrite old files

3. **Reinstall Dependencies**
   - Run: `INSTALL_AND_START.bat`
   - Wait for completion

---

## 🛠️ Troubleshooting

### Common Issues:

#### 1. "Command Not Found" Error
**Problem:** Node.js not installed
**Solution:**
- Download Node.js from nodejs.org
- Install LTS version
- Restart computer
- Try again

#### 2. Port Already in Use
**Problem:** Port 5173 is busy
**Solution:**
- Close other apps using port 5173
- Or edit `vite.config.ts` to use different port

#### 3. Dependencies Installation Fails
**Problem:** Network issues
**Solution:**
- Check internet connection
- Try again later
- Use VPN if blocked
- Manual install: `cd app && npm install`

#### 4. Browser Doesn't Open
**Problem:** Default browser not set
**Solution:**
- Manually open browser
- Go to http://localhost:5173
- Set default browser in Windows settings

#### 5. "Module Not Found" Error
**Problem:** Incomplete installation
**Solution:**
- Delete `app/node_modules` folder
- Run `INSTALL_AND_START.bat` again

---

## 💡 Tips for Best Performance

### 1. Close Unnecessary Apps
- Free up RAM
- Faster performance
- Better experience

### 2. Use SSD (If Available)
- Much faster loading
- Better overall performance

### 3. Keep Browser Updated
- Latest Chrome recommended
- Better compatibility
- More features

### 4. Stable Internet (First Install)
- Don't interrupt installation
- Use wired connection if possible

### 5. Regular Backups
- Export important data weekly
- Keep backup copy of package

---

## 📤 Sharing the Package

### To Share with Colleagues:

#### Option 1: ZIP File (Recommended)
```
1. Right-click "PharmaQMS-Vue" folder
2. Send to → Compressed (zipped) folder
3. Share the ZIP file
4. Size: ~50 MB (without node_modules)
```

#### Option 2: Full Package with Dependencies
```
1. Include node_modules folder
2. Create ZIP
3. Share the ZIP file
4. Size: ~500 MB (complete package)
5. Recipient can run immediately
```

#### Option 3: Cloud Storage
```
1. Upload to OneDrive/Google Drive
2. Share link
3. Others download
4. Extract and run
```

---

## 🔒 Security Recommendations

### When Deploying:

1. **Change Default Credentials**
   - Update admin password
   - Create user accounts
   - Set strong passwords

2. **Enable HTTPS**
   - For production use
   - Get SSL certificate
   - Configure secure connection

3. **Regular Backups**
   - Daily backup of data
   - Store securely
   - Test restoration

4. **Access Control**
   - Limit user permissions
   - Track user actions
   - Regular audit

---

## 📊 Package Verification

### Ensure Complete Package:

✅ Core Files:
- [ ] START_APP.bat
- [ ] INSTALL_AND_START.bat
- [ ] README.md
- [ ] USER_GUIDE.md
- [ ] QUICK_REFERENCE.md
- [ ] ENHANCEMENT_SUMMARY.md

✅ App Folder:
- [ ] app/package.json
- [ ] app/src/
- [ ] app/public/
- [ ] app/index.html

✅ Documentation:
- [ ] All .md files
- [ ] .agent/ folder

✅ References:
- [ ] G2.html
- [ ] COA manager files

---

## 🎓 Learning Resources

### Included Documentation:

1. **USER_GUIDE.md**
   - Complete usage instructions
   - Step-by-step tutorials
   - Bilingual (Arabic/English)

2. **QUICK_REFERENCE.md**
   - Quick access to features
   - Keyboard shortcuts
   - Common tasks

3. **README.md**
   - Technical overview
   - Architecture details
   - Developer info

4. **ENHANCEMENT_SUMMARY.md**
   - Recent updates
   - New features
   - Known issues

---

## 📞 Support

### Getting Help:

1. **Documentation**
   - Check USER_GUIDE.md first
   - Review QUICK_REFERENCE.md
   - Read troubleshooting section

2. **In-App Help**
   - Click ? icon in header
   - Tooltips on hover
   - Context-sensitive help

3. **Technical Support**
   - Contact: Dr. Daoud Tajeldeinn Ahmed
   - Email: [через систему]
   - Response: 24-48 hours

---

## ✅ Installation Checklist

Before you start:
- [ ] Windows 10+ installed
- [ ] Node.js 18+ installed
- [ ] 2 GB disk space available
- [ ] Internet connection active
- [ ] Antivirus allows Node.js
- [ ] Package fully extracted

During installation:
- [ ] Run INSTALL_AND_START.bat
- [ ] Wait for completion (5-10 min)
- [ ] Don't close terminal window
- [ ] Watch for errors

After installation:
- [ ] Browser opens automatically
- [ ] App loads successfully
- [ ] Try language switching
- [ ] Test COA Manager
- [ ] Bookmark the URL

---

## 🎉 You're Ready!

**Congratulations!** You now have:
- ✅ Complete PharmaQMS package
- ✅ Easy launchers
- ✅ Full documentation
- ✅ Bilingual support
- ✅ All features ready

**Next Steps:**
1. Run `INSTALL_AND_START.bat`
2. Wait for installation
3. Start using the system!

---

## 📝 Version Information

**Package Version:** 4.1
**Release Date:** February 2026
**Languages:** Arabic (default), English
**Platform:** Windows 10+
**Framework:** React 19.2 + TypeScript

---

## 📄 License

© 2024-2026 All Rights Reserved
Proprietary Software

This package is for authorized use only.
Unauthorized distribution or modification is prohibited.

---

**Developed by:** Dr. Daoud Tajeldeinn Ahmed
**For:** Pharmaceutical Quality Management

---

**Need Help?** Check USER_GUIDE.md
**Quick Tips?** See QUICK_REFERENCE.md
**What's New?** Read ENHANCEMENT_SUMMARY.md

---

*Last Updated: February 4, 2026*
*Package prepared for easy deployment*
