@echo off
title PharmaQMS Key Generator
color 0f

if not exist "KEY_GENERATOR.html" (
    echo [ERROR] KEY_GENERATOR.html not found!
    pause
    exit
)

echo Opening Key Generator...
start "" "KEY_GENERATOR.html"
exit
