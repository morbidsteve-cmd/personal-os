#!/bin/bash
# Run this ON Mission Control to pull and apply the latest Mission Control
# server code. One-time setup below happens once, before this script is ever
# useful — this script is just for every update after that.
#
# One-time setup (run these once, not part of this script):
#   git clone https://github.com/morbidsteve-cmd/personal-os.git
#   cd personal-os/server && npm install
#   chmod +x deploy/update.sh
#   sudo cp mission-control.service /etc/systemd/system/   # after editing the placeholders in it
#   sudo systemctl daemon-reload
#   sudo systemctl enable --now mission-control.service
#
# After that, every future update is just:
#   ./deploy/update.sh

set -e
cd "$(dirname "$0")/../.."   # repo root, relative to this script's own location
git pull
cd server
npm install
sudo systemctl restart mission-control.service
echo "Mission Control server updated and restarted."
