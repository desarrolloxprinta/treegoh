@echo off
title Treegoh - Push a GitHub
echo ========================================================
echo  Subiendo Treegoh a https://github.com/ruyx/treegoh
echo ========================================================
echo.
wsl -d Ubuntu -e bash -c "cd /home/suario/ruy-projects/treegoh && bash push_to_github.sh"
echo.
pause

