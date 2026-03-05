#!/bin/bash
# Redis installation script for Ubuntu 24.04
# Run as root or with sudo

set -e

echo "=== Installing Redis ==="
apt-get update
apt-get install -y redis-server

echo "=== Enabling Redis ==="
systemctl enable redis-server
systemctl start redis-server

echo "=== Verifying Redis ==="
redis-cli ping
# Expected: PONG

echo "=== Redis version ==="
redis-cli --version

echo "Redis installed successfully."
