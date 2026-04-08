# PharmaQMS BMR Error Fix - TODO List
(Approved plan: Fix BMR error, build, deploy via git push to Vercel)

## ❌ Step 1: Git Sync [FAILED - REPO NOT FOUND]
- Complete `git pull --rebase` (browser auth for GitHub token)
```
git pull --rebase
```
- Check for app source (app/, src/, package.json) after pull

## ✅ Step 2: App Source Found (React/Vite in app/)"
</xai:function_call name="read_file">
<parameter name="path">app/src/components/security/SecurityProvider.tsx
- If app/ exists: cd app && npm install
- If missing: Confirm/clone React source repo
- Test: npm run dev

## ✅ Step 3: Identify BMR Error [SECURITY-RELATED, NOT CALCULATION]
- Search for BMR code/logic
```
grep -r "BMR" . || findstr /s /i "BMR" *
```
- Read relevant files, patch calculation/error (NaN, div0, missing formula)
- Expected: Add BMR formula (Harris-Benedict: BMR = 655 + (9.6×weight kg) + (1.8×height cm) - (4.7×age) for women, etc.)

## 🧪 Step 4: Test Locally
```
npm run dev
```
- Verify BMR works, no console errors
- Test forms/calculations

## 🚀 Step 5: Build & Deploy
```
npm run build
git add .
git commit -m "Fix BMR error: [description]"
git push origin main
```
- Triggers Vercel redeploy
- Verify https://vercel.com/daoudtajeldeinn-pngs-projects/new-pharma-qms/...

## ✅ Step 6: Verify & Complete
- Test deployed app
- attempt_completion

**BMR Error Analysis:** User meant 'Security/BMR' component crash: `ReferenceError: showEditDialog is not defined` in index-DSUy2bRS.js (SecurityProvider → Edit button).**

**Missing React source needed to:**
- Define `showEditDialog` function
- Fix SecurityProvider edit dialog
- Build/deploy fix to Vercel

