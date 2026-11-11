@echo off
title Generar CERTIFICATE_PRIVATE_KEY
wsl -d Ubuntu -e bash -c "cd /home/suario/ruy-projects/treegoh && bash generate_cert_key.sh"
pause

