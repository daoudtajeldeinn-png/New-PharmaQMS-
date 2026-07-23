# PharmaQMS — Vercel Deployment Sync Guide

## The Two-Repo Problem

There are **two local copies** of the repo. Only one feeds Vercel:

| Folder | Remote | Vercel? |
|--------|--------|---------|
| `E:/phase 2 .../New-PharmaQMS-` | `repo1/repo2/repo3/repo4` | ❌ No |
| `C:/Users/daoud/CascadeProjects/New-PharmaQMS-cloned` | `origin production` | ✅ **Yes** |

**Vercel watches:** `github.com/daoudtajeldeinn-png/New-PharmaQMS-` → branch `production`

---

## Automatic Sync: Git Post-Push Hook

This hook runs automatically every time you push from the `E:/phase 2...` folder and mirrors the changes to the Vercel repo.

### Setup (run once)

Open Git Bash in the `E:/phase 2.../New-PharmaQMS-` folder and run:

```bash
cat > .git/hooks/post-push << 'EOF'
#!/bin/sh
echo ""
echo "=== AUTO-SYNC: Pushing to Vercel deployment repo ==="
VERCEL_REPO="/c/Users/daoud/CascadeProjects/New-PharmaQMS-cloned"

# Get the current branch
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)

# Sync changed app/src/pages files to the Vercel clone
echo "Syncing changed files..."
git diff --name-only HEAD~1 HEAD | grep "^app/src/pages/" | while read file; do
  src="$file"
  dst="$VERCEL_REPO/$file"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    echo "  Copied: $file"
  fi
done

# Commit and force push to Vercel production branch
cd "$VERCEL_REPO"
git add -A
git diff --cached --quiet && echo "  No changes to sync." && exit 0
git commit -m "sync: mirror from main repo (auto)"
git push origin production --force

echo "=== VERCEL SYNC COMPLETE ==="
echo ""
EOF
chmod +x .git/hooks/post-push
echo "Hook installed successfully."
```

---

## Manual Sync (when needed)

If you ever need to manually push to Vercel without a full commit cycle:

```bash
cd "/c/Users/daoud/CascadeProjects/New-PharmaQMS-cloned"
git pull origin production
cp "E:/phase 2 professional build/update/PharmaQMS-Vue 25.2.2026/PharmaQMS - Copy/New-PharmaQMS-/app/src/pages/MFRManager.tsx" app/src/pages/MFRManager.tsx
# repeat for other changed files...
git add -A
git commit -m "sync: manual mirror"
git push origin production --force
```

---

## Vercel Deployment Checklist

After every push to `origin production`:

- [ ] Wait 1-2 minutes for Vercel to rebuild
- [ ] Hard refresh browser: `Ctrl+Shift+R`
- [ ] Go to `/#/settings` and save company name/address (once per browser)
- [ ] Verify `/#/mfr` shows real company name in document header
- [ ] Verify `/#/bmr` shows real company name in document header

---

## Key Facts

- **License key** works on any browser — machine ID defaults to `DEV-ENVIRONMENT-ID` in non-Electron builds
- **Company settings** are stored in `localStorage('pqms_company_settings')` — must be saved once per browser/device via the Settings page
- **Build command:** `npm run build` (runs `cd app && npm install && npm run build`)
- **Output directory:** `dist`
