@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title MoneyPrinterTurbo VN - Local Launcher (Port 3333)
cd /d "%~dp0"

echo ========================================================================
echo   MoneyPrinterTurbo VN - Khoi dong he thong ^& Kiem tra moi truong
echo ========================================================================
echo.

:: 1. Kiem tra Node.js va npm
where node >nul 2>&1
if errorlevel 1 (
  echo [LOI] Khong tim thay Node.js tren may.
  echo       Vui long cai Node.js LTS (v20 tro len) tai: https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [LOI] Khong tim thay npm tren may. Vui long cai lai Node.js LTS.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js: %NODE_VER%

:: 2. Kiem tra FFmpeg & FFprobe
where ffmpeg >nul 2>&1
if errorlevel 1 (
  if exist "C:\ffmpeg\bin\ffmpeg.exe" set "PATH=C:\ffmpeg\bin;%PATH%"
  if exist "%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe" set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%"
)
where ffmpeg >nul 2>&1
if errorlevel 1 (
  echo [CANH BAO] Chua tim thay FFmpeg trong PATH.
  where winget >nul 2>&1
  if not errorlevel 1 (
    echo [INFO] Dang thu cai dat FFmpeg tu dong qua winget...
    winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
    if exist "%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe" set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%"
  )
)
where ffmpeg >nul 2>&1
if errorlevel 1 (
  echo [CANH BAO] FFmpeg chua san sang. Can cai FFmpeg de xuat video MP4:
  echo            https://www.gyan.dev/ffmpeg/builds/
) else (
  echo [OK] FFmpeg & FFprobe da san sang.
)

:: 3. Kiem tra va cai dat npm dependencies lan dau
if not exist "node_modules" (
  echo.
  echo [LAN DAU] Dang cai dat cac goi thu vien ^(npm install^)...
  call npm install
  if errorlevel 1 (
    echo [LOI] npm install that bai. Kiem tra ket noi mang va thu lai.
    pause
    exit /b 1
  )
) else if not exist "node_modules\.bin\tsx.cmd" (
  echo.
  echo [CAP NHAT] Dang bo sung thu vien con thieu ^(npm install^)...
  call npm install
  if errorlevel 1 (
    echo [LOI] npm install that bai.
    pause
    exit /b 1
  )
) else (
  echo [OK] Dependencies ^(node_modules^) da day du.
)

:: 4. Kiem tra file .env va thu muc output
if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo [OK] Da tao file .env tu .env.example ^(tuy chon dien GEMINI_API_KEY / ELEVENLABS_API_KEY^).
  )
)
if not exist "output" mkdir "output"

:: 5. Kiem tra cac model AI / TTS / B-roll
echo.
echo [MODEL] Dang kiem tra cac model AI ^& nguon tai nguyen...
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2; if ($r.models -and $r.models.Count -gt 0) { $names = ($r.models | ForEach-Object { $_.name }) -join ', '; Write-Host ('[OK] Ollama Local (11434) san sang: ' + $names) } else { Write-Host '[INFO] Ollama dang chay nhung chua co model. Co the chay: ollama pull qwen2.5' } } catch { Write-Host '[INFO] Khong thay Ollama local (khong bat buoc). App se dung AI mien phi (Pollinations + Wikipedia) va Google/Edge TTS.' }"

echo [OK] Kho nhac nen, B-roll Mixkit/Wikimedia/Archive va Google/Edge TTS da san sang.
echo.

:: 6. Khoi chay server o port 3333 va tu dong mo trinh duyet khi san sang
set "PORT=3333"
set "DISABLE_HMR=true"

echo [START] Dang khoi dong may chu tai http://localhost:%PORT% ...
echo         Trinh duyet se tu dong mo khi server san sang. Nhan Ctrl+C de dung.
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$url='http://localhost:3333'; for ($i=0; $i -lt 45; $i++) { try { $res = Invoke-WebRequest -Uri ($url + '/api/system/check') -UseBasicParsing -TimeoutSec 2; if ($res.StatusCode -eq 200) { Start-Process $url; break } } catch {}; Start-Sleep -Milliseconds 700 }"

call npx tsx server.ts
if errorlevel 1 (
  echo.
  echo [LOI] May chu da dung voi ma loi %ERRORLEVEL%.
  pause
)
endlocal
