@echo off
REM Preview the wiki on a Windows PC. "Open app" buttons only work on the church MacBook.
cd /d "%~dp0"
start "" http://localhost:4321
node server.js
pause
