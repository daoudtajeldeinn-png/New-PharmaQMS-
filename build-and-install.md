---
description: How to build and install the PharmaQMS professional desktop application
---

# PharmaQMS Professional Build & Installation Workflow

Follow these steps to generate the professional installer and install the application on any Windows machine.

## Prerequisites
- Node.js installed on the machine.
- Internet connection (required for the first build to download Electron binaries).

## 1. Build the Professional Installer
// turbo
1. Open a terminal in the project root: `E:\phase 2 professional build\update\PharmaQMS-Vue 25.2.2026\PharmaQMS`
2. Run the build command:
   ```bash
   npm run electron:build
   ```
3. Wait for the process to complete. It will:
   - Compile the React/Vue frontend.
   - Package the app with Electron.
   - Generate an NSIS installer (`.exe`).

## 2. Locate the Installer
Once the build is finished, go to the following folder:
`E:\phase 2 professional build\update\PharmaQMS-Vue 25.2.2026\PharmaQMS\dist-electron`

You will find a file named:
**`PharmaQMS Enterprise Setup 0.0.0.exe`** (or similar)

## 3. Installation
1. Double-click the `.exe` file.
2. The application will install automatically and create a shortcut on your desktop named **"PharmaQMS Enterprise"**.
3. You can now run the application directly from the desktop icon without needing any terminal or commands.

## 4. Development/Testing Mode
If you just want to run the app quickly for testing without installing:
// turbo
1. Run:
   ```bash
   npm run electron:dev
   ```
