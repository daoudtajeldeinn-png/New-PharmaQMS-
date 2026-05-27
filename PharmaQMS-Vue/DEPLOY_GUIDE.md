# PharmaQMS Deployment Guide

## Problem: Files Disappearing / App Not Working on New PC

If you copy the application to a new computer and files "disappear" or it doesn't run, follow these steps.

### 1. Prevent File Loss (Antivirus)
The "disappearing files" issue is caused by Antivirus software (Windows Defender) erroneously flagging the system files (like `.bat` scripts or the `MasterKeyGen.js`) as suspicious.

**Solution:**
1. On the new computer, create a folder (e.g., `C:\PharmaQMS`).
2. **Exclude this folder from Antivirus**:
   - Go to **Windows Security** > **Virus & threat protection**.
   - Click **Manage settings** under "Virus & threat protection settings".
   - Scroll to **Exclusions** > **Add or remove exclusions**.
   - Add the `C:\PharmaQMS` folder.
3. Now copy the application files into this folder. They will no longer be deleted.

### 2. Run the Application
1. Double-click **`SETUP_SHORTCUT.bat`**.
   - This will create a "PharmaQMS Enterprise" icon on your **Desktop**.
   - It will also clean up the folder by hiding unnecessary files.
2. From now on, just use the **Desktop Icon** to start the program.

### 3. Fix Login on New Computer
On a new computer, your "Logged In" state is lost because it is saved in the browser.
1. Launch the app using the Desktop Icon.
2. If you are asked to login or activate and it fails:
   - Go to the `app/dist` folder.
   - Double-click **`fix_login.html`**.
   - Click the **"Repair Login"** button.
   - This will restore your Admin session on the new machine.

### Summary Checklist for New PC:
- [ ] Create folder & Add Antivirus Exclusion.
- [ ] Copy files.
- [ ] Run `SETUP_SHORTCUT.bat`.
- [ ] If locked out: Run `app/dist/fix_login.html`.

