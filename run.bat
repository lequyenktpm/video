@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title MoneyPrinterTurbo VN - Local Launcher (Port 3333)

pushd "%~dp0" >nul 2>&1
if errorlevel 1 (
  echo [LOI] Khong the truy cap thu muc chua run.bat.
  echo       Hay giai nen file ZIP ra thu muc rieng ^(vd: D:\video^) roi chay lai.
  pause
  exit /b 1
)

echo ========================================================================
echo   MoneyPrinterTurbo VN - Khoi dong he thong ^& Kiem tra moi truong
echo ========================================================================
echo Thu muc chay: %CD%
echo.

REM 1. Kiem tra Node.js va npm
where node >nul 2>&1
if errorlevel 1 goto :NO_NODE
where npm >nul 2>&1
if errorlevel 1 goto :NO_NPM

for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
echo [OK] Node.js: %NODE_VER%
goto :CHECK_FFMPEG

:NO_NODE
echo [LOI] Khong tim thay Node.js tren may.
echo       Vui long cai Node.js LTS ^(v20 tro len^) tai: https://nodejs.org/
echo       Sau khi cai xong, hay mo lai file run.bat.
pause
popd >nul 2>&1
exit /b 1

:NO_NPM
echo [LOI] Khong tim thay npm tren may. Vui long cai lai Node.js LTS tai https://nodejs.org/
pause
popd >nul 2>&1
exit /b 1

:CHECK_FFMPEG
REM 2. Kiem tra FFmpeg & FFprobe (khong dung khoi ngoac de tranh loi PATH chua dau ngoac/ky tu dac biet)
where ffmpeg >nul 2>&1
if not errorlevel 1 goto :FFMPEG_READY

if exist "C:\ffmpeg\bin\ffmpeg.exe" set PATH=C:\ffmpeg\bin;%PATH%
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe" set PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%

where ffmpeg >nul 2>&1
if not errorlevel 1 goto :FFMPEG_READY

echo [CANH BAO] Chua tim thay FFmpeg trong PATH.
where winget >nul 2>&1
if errorlevel 1 goto :FFMPEG_MISSING

echo [INFO] Dang thu cai dat FFmpeg tu dong qua winget...
winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe" set PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%

where ffmpeg >nul 2>&1
if not errorlevel 1 goto :FFMPEG_READY

:FFMPEG_MISSING
echo [CANH BAO] FFmpeg chua san sang. Can cai FFmpeg de xuat video MP4:
echo            https://www.gyan.dev/ffmpeg/builds/
goto :CHECK_DEPS

:FFMPEG_READY
echo [OK] FFmpeg ^& FFprobe da san sang.

:CHECK_DEPS
REM 3. Kiem tra va cai dat npm dependencies
if not exist "node_modules" goto :INSTALL_DEPS
if not exist "node_modules\.bin\tsx.cmd" goto :INSTALL_DEPS
if not exist "node_modules\express" goto :INSTALL_DEPS
if not exist "node_modules\dotenv" goto :INSTALL_DEPS
echo [OK] Dependencies ^(node_modules^) da day du.
goto :PREPARE_ENV

:INSTALL_DEPS
echo.
echo [CAI DAT] Dang cai dat cac goi thu vien ^(npm install^)...
call npm install --no-audit --no-fund
if not errorlevel 1 goto :DEPS_OK

echo [THU LAI] Dang thu lai voi --legacy-peer-deps...
call npm install --legacy-peer-deps --no-audit --no-fund
if not errorlevel 1 goto :DEPS_OK

echo.
echo [LOI] npm install that bai. Kiem tra ket noi mang hoac quyen ghi thu muc roi thu lai.
pause
popd >nul 2>&1
exit /b 1

:DEPS_OK
echo [OK] Da cai dat xong thu vien.

:PREPARE_ENV
REM 4. Kiem tra file .env va thu muc output
if not exist ".env" if exist ".env.example" (
  copy /Y ".env.example" ".env" >nul
  echo [OK] Da tao file .env tu .env.example ^(tuy chon dien GEMINI_API_KEY / ELEVENLABS_API_KEY^).
)
if not exist "output" mkdir "output"

REM 5. Kiem tra Ollama local (tuy chon, khong bat buoc)
echo.
echo [MODEL] Dang kiem tra cac model AI ^& nguon tai nguyen...
where powershell >nul 2>&1
if errorlevel 1 goto :SKIP_OLLAMA_CHECK
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2; if ($r.models -and $r.models.Count -gt 0) { $names = ($r.models | ForEach-Object { $_.name }) -join ', '; Write-Host ('[OK] Ollama Local (11434) san sang: ' + $names) } else { Write-Host '[INFO] Ollama dang chay nhung chua co model. Co the chay: ollama pull qwen2.5' } } catch { Write-Host '[INFO] Khong thay Ollama local (khong bat buoc). App se dung AI mien phi va Google/Edge TTS.' }"

:SKIP_OLLAMA_CHECK
echo [OK] Kho nhac nen, B-roll Mixkit/Wikimedia/Archive va Google/Edge TTS da san sang.
echo.

REM 6. Khoi chay server o port 3333 va tu dong mo trinh duyet khi san sang
set "PORT=3333"
set "DISABLE_HMR=true"

echo [START] Dang khoi dong may chu tai http://localhost:%PORT% ...
echo         Trinh duyet se tu dong mo khi server san sang. Nhan Ctrl+C de dung.
echo.

where powershell >nul 2>&1
if errorlevel 1 goto :START_SERVER
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$url='http://localhost:3333'; for ($i=0; $i -lt 45; $i++) { try { $res = Invoke-WebRequest -Uri ($url + '/api/system/check') -UseBasicParsing -TimeoutSec 2; if ($res.StatusCode -eq 200) { Start-Process $url; break } } catch {}; Start-Sleep -Milliseconds 700 }"

:START_SERVER
if exist "node_modules\.bin\tsx.cmd" goto :RUN_LOCAL_TSX
call npm run dev
goto :AFTER_SERVER

:RUN_LOCAL_TSX
call "node_modules\.bin\tsx.cmd" server.ts

:AFTER_SERVER
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if not "%EXIT_CODE%"=="0" echo [LOI] May chu da dung voi ma loi %EXIT_CODE%.
if "%EXIT_CODE%"=="0" echo [THONG BAO] May chu da dung.
pause
popd >nul 2>&1
endlocal
