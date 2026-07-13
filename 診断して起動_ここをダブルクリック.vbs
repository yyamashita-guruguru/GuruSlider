' ============================================================
'  Diagnostic launcher (visible window) -- project root
'  Double-click this file. A window opens and shows:
'    - Node.js version   (or "not recognized" if missing)
'    - npm version
'    - then it starts the dev server at http://localhost:3000
'
'  If you see  'node' / 'npm' is not recognized  ->
'  Node.js is NOT installed on this PC.
'  Install the LTS version from  https://nodejs.org  ,
'  restart the PC, then run this file again.
' ============================================================

Option Explicit

Dim shell, fso, root
Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

root = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = root

' Visible window (1), stays open (cmd /k) so any error is readable.
shell.Run "cmd /k echo ===== Node.js version ===== & node -v & echo ===== npm version ===== & npm -v & echo ===== starting dev server (http://localhost:3000) ===== & npm run dev", 1, False
