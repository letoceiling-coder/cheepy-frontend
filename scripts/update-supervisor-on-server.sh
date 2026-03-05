#!/bin/bash
# Update Supervisor configs — run ON SERVER as root
# Copy parser-worker.conf and parser-worker-photos.conf to /etc/supervisor/conf.d/ first

set -e
echo "=== Reloading Supervisor ==="
supervisorctl reread
supervisorctl update
echo ""
echo "=== Status ==="
supervisorctl status
