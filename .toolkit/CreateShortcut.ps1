$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
$ShortcutPath = Join-Path $DesktopPath "PharmaQMS Enterprise.lnk"
$RootDir = Get-Location
$AppDir = Join-Path $RootDir "app"
$LauncherPath = Join-Path $RootDir "PharmaLauncher.vbs"
$IconPath = Join-Path $AppDir "public\favicon.ico"

# Create Desktop Shortcut
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$LauncherPath`""
$Shortcut.WorkingDirectory = $RootDir
$Shortcut.Description = "PharmaQMS Enterprise Quality Management System"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}
$Shortcut.Save()

# Create Local Shortcut in the root folder for easy access
$LocalShortcut = Join-Path $RootDir "PharmaQMS Enterprise.lnk"
$ShortcutLocal = $WshShell.CreateShortcut($LocalShortcut)
$ShortcutLocal.TargetPath = "wscript.exe"
$ShortcutLocal.Arguments = "`"$LauncherPath`""
$ShortcutLocal.WorkingDirectory = $RootDir
if (Test-Path $IconPath) {
    $ShortcutLocal.IconLocation = $IconPath
}
$ShortcutLocal.Save()
