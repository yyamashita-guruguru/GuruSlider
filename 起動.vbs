' ============================================================
'  react-example launcher
'  - Starts the Vite dev server in a MINIMIZED window.
'  - Opens the app in a DEDICATED browser window (app mode).
'  - When you CLOSE that browser window, the dev server stops
'    automatically.
'  Double-click this file to run. No command prompt needed.
' ============================================================

Option Explicit

Dim shell, fso, scriptDir, url, title, browser, userDataDir
url   = "http://localhost:3000"
title = "ReactDevServer_guruguru"   ' window title used to stop the server later

Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

' Work from this script's own folder (portable even if moved).
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = scriptDir

' --- 1) Start the dev server in a minimized window (style 7 = minimized, no focus).
'        A unique window title lets us stop exactly this server later.
shell.Run "cmd /k title " & title & " & npm run dev", 7, False

' --- 2) Wait for the server to boot.
WScript.Sleep 5000

' --- 3) Open the app in a dedicated browser window and WAIT until it is closed.
'        A separate user-data-dir forces an independent browser process,
'        so closing the window reliably returns control here.
browser = FindBrowser()
userDataDir = fso.GetSpecialFolder(2) & "\react-example-appwindow"

If browser <> "" Then
    shell.Run """" & browser & """ --app=" & url & _
              " --user-data-dir=""" & userDataDir & """" & _
              " --no-first-run --no-default-browser-check", 1, True

    ' --- 4) Browser window closed -> stop the dev server (cmd + node child tree).
    shell.Run "taskkill /FI ""WINDOWTITLE eq " & title & "*"" /T /F", 0, True
Else
    ' No Chrome/Edge found: fall back to the default browser.
    ' (In this case the server keeps running; close its window to stop it.)
    shell.Run url
End If

' ------------------------------------------------------------
' Locate an installed Chromium-based browser (Chrome, then Edge).
Function FindBrowser()
    Dim candidates, p
    candidates = Array( _
        shell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe"), _
        shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"), _
        shell.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe"), _
        shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"), _
        shell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe") )
    For Each p In candidates
        If fso.FileExists(p) Then
            FindBrowser = p
            Exit Function
        End If
    Next
    FindBrowser = ""
End Function
