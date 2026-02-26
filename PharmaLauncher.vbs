' PharmaQMS Enterprise - Stealth Launcher
' This script starts the background server without showing any console windows.

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where the script is located
strScriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
strBatPath = strScriptPath & "\START_SILENT.bat"

' Verify if the command file exists
If Not fso.FileExists(strBatPath) Then
    MsgBox "Critical Error: System startup file (START_SILENT.bat) was not found in: " & vbCrLf & strScriptPath & vbCrLf & vbCrLf & "Please make sure you haven't moved this file out of the system folder.", 16, "PharmaQMS Error"
    WScript.Quit
End If

' Run the batch file hidden
' Chr(34) is used to wrap the path in quotes to handle spaces
WshShell.Run "cmd /c " & Chr(34) & Chr(34) & strBatPath & Chr(34) & Chr(34), 0, False
