@echo off
REM This batch file starts the PHP MQTT subscriber with one double-click on Windows.
REM It moves to the backend folder so relative paths inside the script keep working.
cd /d "%~dp0backend"

REM Run the subscriber with the PHP that comes with XAMPP.
"C:\xampp\php\php.exe" subscriber.php

REM Keep the window open if PHP stops so the error message stays visible.
pause
