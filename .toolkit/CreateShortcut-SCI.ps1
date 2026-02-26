$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
$RootDir = Get-Location
$AppDir = Join-Path $RootDir "app"
$LauncherPath = Join-Path $RootDir "PharmaLauncher.vbs"
$DebugLauncherPath = Join-Path $RootDir "START_PQMS.bat"
$IconPath = Join-Path $AppDir "public\favicon.ico"

# 1. Main Shortcut
$ShortcutPath = Join-Path $DesktopPath "PharmaQMS Enterprise.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/c `"$DebugLauncherPath`""
$Shortcut.WorkingDirectory = $RootDir
$Shortcut.Description = "PharmaQMS Enterprise Quality Management System"
if (Test-Path $IconPath) { $Shortcut.IconLocation = $IconPath }
$Shortcut.Save()

# 2. Debug Mode Shortcut (Visible Console)
$DebugShortcutPath = Join-Path $DesktopPath "PharmaQMS (Debug Mode).lnk"
$DebugShortcut = $WshShell.CreateShortcut($DebugShortcutPath)
$DebugShortcut.TargetPath = "cmd.exe"
$DebugShortcut.Arguments = "/c `"$DebugLauncherPath`""
$DebugShortcut.WorkingDirectory = $RootDir
$DebugShortcut.Description = "PharmaQMS Debug Mode - Use if main app fails to start"
if (Test-Path $IconPath) { $DebugShortcut.IconLocation = $IconPath }
$DebugShortcut.Save()

# 3. Local Shortcut in the root folder
$LocalShortcut = Join-Path $RootDir "PharmaQMS Enterprise.lnk"
$ShortcutLocal = $WshShell.CreateShortcut($LocalShortcut)
$ShortcutLocal.TargetPath = "wscript.exe"
$ShortcutLocal.Arguments = "`"$LauncherPath`""
$ShortcutLocal.WorkingDirectory = $RootDir
if (Test-Path $IconPath) { $ShortcutLocal.IconLocation = $IconPath }
$ShortcutLocal.Save()
