@echo off
echo ===================================
echo QuranDec - Demarrage automatique
echo ===================================
echo.

echo Demarrage du backend...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Demarrage du frontend...
start cmd /k "npm run dev"

echo.
echo ===================================
echo Application demarree !
echo ===================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Comptes de test:
echo   Admin: admin@qurandec.com / admin123
echo   Prof:  teacher@qurandec.com / teacher123
echo.

timeout /t 3 /nobreak > nul
start http://localhost:3000

echo Appuyez sur une touche pour fermer...
pause > nul
