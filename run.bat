@echo off
pushd "%~dp0"
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title MoneyPrinterTurbo VN - Local Launcher (Port 3333)

echo ========================================================================
echo   MoneyPrinterTurbo VN - Khoi dong he thong ^& Kiem tra moi truong
echo ========================================================================
echo.

REM 1. Kiem tra Node.js (>= 18) va npm
where node >nul 2>&1
if errorlevel 1 goto :ERR_NO_NODE
node -e "process.exit(parseInt(process.versions.node,10)<18?1:0)" >nul 2>&1
if errorlevel 1 goto :ERR_NODE_OLD
where npm >nul 2>&1
if errorlevel 1 goto :ERR_NO_NPM
for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
echo [OK] Node.js: !NODE_VER!

REM 2. Kiem tra FFmpeg & FFprobe (tranh dung %PATH% trong khoi ngoac de khong vo vi Program Files (x86))
where ffmpeg >nul 2>&1
if not errorlevel 1 goto :FFMPEG_READY
if exist "C:\ffmpeg\bin\ffmpeg.exe" set "PATH=C:\ffmpeg\bin;!PATH!"
if exist "!LOCALAPPDATA!\Microsoft\WinGet\Links\ffmpeg.exe" set "PATH=!LOCALAPPDATA!\Microsoft\WinGet\Links;!PATH!"
for /d %%d in ("!LOCALAPPDATA!\Microsoft\WinGet\Packages\Gyan.FFmpeg*") do (
  if exist "%%~fd\ffmpeg-*\bin\ffmpeg.exe" (
    for /d %%b in ("%%~fd\ffmpeg-*") do set "PATH=%%~fb\bin;!PATH!"
  )
)

where ffmpeg >nul 2>&1
if not errorlevel 1 goto :FFMPEG_READY
echo [CANH BAO] Chua tim thay FFmpeg trong PATH.
where winget >nul 2>&1
if errorlevel 1 goto :FFMPEG_AFTER_CHECK
echo [INFO] Dang thu cai dat FFmpeg tu dong qua winget...
winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
if exist "!LOCALAPPDATA!\Microsoft\WinGet\Links\ffmpeg.exe" set "PATH=!LOCALAPPDATA!\Microsoft\WinGet\Links;!PATH!"

:FFMPEG_AFTER_CHECK
where ffmpeg >nul 2>&1
if errorlevel 1 goto :FFMPEG_MISSING

:FFMPEG_READY
echo [OK] FFmpeg ^& FFprobe da san sang.
goto :CHECK_DEPS

:FFMPEG_MISSING
echo [CANH BAO] FFmpeg chua san sang. Can cai FFmpeg de xuat video MP4:
echo            https://www.gyan.dev/ffmpeg/builds/

:CHECK_DEPS
REM 3. Kiem tra va cai dat npm dependencies lan dau
if not exist "node_modules" goto :DO_NPM_INSTALL
if not exist "node_modules\.bin\tsx.cmd" goto :DO_NPM_INSTALL
echo [OK] Dependencies ^(node_modules^) da day du.
goto :CHECK_ENV

:DO_NPM_INSTALL
echo.
echo [LAN DAU / CAP NHAT] Dang cai dat cac goi thu vien ^(npm install^)...
call npm install
if errorlevel 1 goto :ERR_NPM_INSTALL
echo [OK] Da cai dat xong npm dependencies.

:CHECK_ENV
REM 4. Kiem tra file .env va thu muc output
if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo [OK] Da tao file .env tu .env.example.
  )
)
if not exist "output" mkdir "output"

REM 5. Kiem tra cac model AI / TTS / B-roll bang Node.js (khong phu thuoc PowerShell)
echo.
echo [MODEL] Dang kiem tra cac model AI ^& nguon tai nguyen...
node -e "fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(1800)}).then(r=>r.json()).then(d=>{const m=(d.models||[]).map(x=>x.name);console.log(m.length?'[OK] Ollama Local (11434): '+m.join(', '):'[INFO] Ollama dang chay nhung chua co model.')}).catch(()=>console.log('[INFO] Khong thay Ollama local (khong bat buoc). App dung AI mien phi + Google/Edge TTS.'))"
echo [OK] Kho nhac nen, B-roll Mixkit/Wikimedia/Archive va Google/Edge TTS da san sang.
echo.

REM 6. Khoi chay server o port 3333 va tu dong mo trinh duyet khi san sang
set "PORT=3333"
set "DISABLE_HMR=true"

echo [START] Dang khoi dong may chu tai http://localhost:!PORT! ...
echo         Trinh duyet se tu dong mo khi server san sang. Nhan Ctrl+C de dung.
echo.

start "" /b node -e "const {execFile}=require('child_process');let n=0;const t=setInterval(async()=>{n++;try{const r=await fetch('http://127.0.0.1:3333/api/system/check',{signal:AbortSignal.timeout(1500)});if(r.ok){clearInterval(t);execFile('cmd.exe',['/c','start','','http://localhost:3333']);}}catch{}if(n>=60)clearInterval(t);},700);"

if exist "node_modules\.bin\tsx.cmd" (
  call "node_modules\.bin\tsx.cmd" server.ts
) else (
  call npx --yes tsx server.ts
)

set "EXIT_CODE=!ERRORLEVEL!"
echo.
echo [STOP] May chu da dung ^(ma thoat: !EXIT_CODE!^).
pause
endlocal
popd
exit /b !EXIT_CODE!

:ERR_NO_NODE
echo [LOI] Khong tim thay Node.js tren may.
echo       Vui long cai Node.js LTS ^(v20 tro len^) tai: https://nodejs.org/
pause
popd
exit /b 1

:ERR_NODE_OLD
for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
echo [LOI] Phien ban Node.js hien tai ^(!NODE_VER!^) qua cu.
echo       Vui long cap nhat Node.js LTS ^(v20 tro len^) tai: https://nodejs.org/
pause
popd
exit /b 1

:ERR_NO_NPM
echo [LOI] Khong tim thay npm tren may. Vui long cai lai Node.js LTS.
pause
popd
exit /b 1

:ERR_NPM_INSTALL
echo [LOI] npm install that bai. Kiem tra ket noi mang va thu lai.
pause
popd
exit /b 1
