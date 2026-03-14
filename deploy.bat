@echo off
echo ============================================
echo  Training Batch Time Tracker - Firebase Deploy
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Logging in to Firebase (browser will open)...
call firebase login
if %errorlevel% neq 0 (
    echo ERROR: Firebase login failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed.
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Deploying to Firebase (Hosting + Functions + Firestore)...
call firebase deploy
if %errorlevel% neq 0 (
    echo ERROR: Deploy failed. Check the output above.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Deploy complete!
echo  Your app is live at:
echo  https://learning-74e8e.web.app
echo ============================================
pause
