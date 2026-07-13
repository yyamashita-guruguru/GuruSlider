' ============================================================
'  One-click setup:
'   1) Installs Node.js (LTS) automatically if it is missing
'      (uses winget, or downloads the official installer).
'   2) Installs the project libraries (npm install).
'
'  Just double-click this file. Click "Yes" on the Windows
'  security (UAC) prompt so it is allowed to install Node.js.
'  When it finishes, start the app with 起動.vbs.
' ============================================================

Option Explicit

Dim shell, fso, root, ps1, f, q
Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")
q = Chr(34)

root = fso.GetParentFolderName(WScript.ScriptFullName)
ps1  = shell.ExpandEnvironmentStrings("%TEMP%") & "\react_example_setup.ps1"

' --- Write the PowerShell setup script (ASCII only, no double-quotes) ---
Set f = fso.CreateTextFile(ps1, True)
f.WriteLine "param([string]$Root)"
f.WriteLine "$ErrorActionPreference = 'Continue'"
f.WriteLine "$q = [char]34"
f.WriteLine "Write-Host '====================================================='"
f.WriteLine "Write-Host '  Node.js + library auto setup'"
f.WriteLine "Write-Host '====================================================='"
f.WriteLine "if (-not (Get-Command node -ErrorAction SilentlyContinue)) {"
f.WriteLine "    Write-Host 'Node.js not found. Installing LTS...'"
f.WriteLine "    $ok = $false"
f.WriteLine "    if (Get-Command winget -ErrorAction SilentlyContinue) {"
f.WriteLine "        Write-Host 'Trying winget...'"
f.WriteLine "        winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements"
f.WriteLine "        if (Test-Path 'C:\Program Files\nodejs\npm.cmd') { $ok = $true }"
f.WriteLine "    }"
f.WriteLine "    if (-not $ok) {"
f.WriteLine "        try {"
f.WriteLine "            Write-Host 'Downloading Node.js LTS from nodejs.org...'"
f.WriteLine "            $idx = Invoke-RestMethod 'https://nodejs.org/dist/index.json'"
f.WriteLine "            $lts = ($idx | Where-Object { $_.lts } | Select-Object -First 1).version"
f.WriteLine "            $url = 'https://nodejs.org/dist/' + $lts + '/node-' + $lts + '-x64.msi'"
f.WriteLine "            $msi = Join-Path $env:TEMP ('node-' + $lts + '-x64.msi')"
f.WriteLine "            Invoke-WebRequest -Uri $url -OutFile $msi"
f.WriteLine "            Start-Process msiexec.exe -ArgumentList ('/i ' + $q + $msi + $q + ' /qn /norestart') -Wait"
f.WriteLine "        } catch {"
f.WriteLine "            Write-Host ('Auto install failed: ' + $_.Exception.Message)"
f.WriteLine "            Write-Host 'Please install Node.js LTS manually from https://nodejs.org'"
f.WriteLine "        }"
f.WriteLine "    }"
f.WriteLine "} else {"
f.WriteLine "    Write-Host 'Node.js already installed.'"
f.WriteLine "}"
f.WriteLine "$nd = 'C:\Program Files\nodejs'"
f.WriteLine "if (Test-Path ($nd + '\npm.cmd')) { $env:Path = $nd + ';' + $env:Path }"
f.WriteLine "if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {"
f.WriteLine "    Write-Host ''"
f.WriteLine "    Write-Host 'npm is not available in this session yet.'"
f.WriteLine "    Write-Host 'Node.js was installed but the PC needs a RESTART.'"
f.WriteLine "    Write-Host 'Please restart this PC, then run this file again.'"
f.WriteLine "    Read-Host 'Press Enter to close'"
f.WriteLine "    exit"
f.WriteLine "}"
f.WriteLine "Set-Location -LiteralPath $Root"
f.WriteLine "Write-Host '===== Installing project libraries (npm install) ====='"
f.WriteLine "npm install"
f.WriteLine "npm install html2canvas-pro"
f.WriteLine "Write-Host ''"
f.WriteLine "Write-Host '====================================================='"
f.WriteLine "Write-Host '  DONE. You can now start the app with your start .vbs file.'"
f.WriteLine "Write-Host '====================================================='"
f.WriteLine "Read-Host 'Press Enter to close'"
f.Close

' --- Launch the script with admin rights (UAC prompt), passing the project folder ---
CreateObject("Shell.Application").ShellExecute "powershell.exe", "-ExecutionPolicy Bypass -NoProfile -File " & q & ps1 & q & " " & q & root & q, "", "runas", 1
