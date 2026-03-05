#!/bin/bash
# Supervisor installation for Laravel queue workers
# Run as root or with sudo

set -e

echo "=== Installing Supervisor ==="
apt-get update
apt-get install -y supervisor

echo "=== Enabling Supervisor ==="
systemctl enable supervisor
systemctl start supervisor

echo "=== Checking status ==="
supervisorctl status

echo "Supervisor installed. Add parser-worker.conf and reload."
