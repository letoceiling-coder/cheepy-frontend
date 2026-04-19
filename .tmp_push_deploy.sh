#!/bin/bash
set -e

echo "=== push backend ==="
cd /c/OSPanel/domains/sadavod-laravel
git push origin main

echo
echo "=== push frontend ==="
cd /c/OSPanel/domains/cheepy
git push origin main

echo
echo "=== run deploy.sh ==="
cd /c/OSPanel/domains/cheepy
bash deploy.sh
