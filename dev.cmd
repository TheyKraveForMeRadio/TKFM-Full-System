@echo off
setlocal
cd /d %~dp0
cd v2
npm run dev -- --port 5173 --strictPort
