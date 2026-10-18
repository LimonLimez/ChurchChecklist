#!/bin/bash
# Double-click this file on the MacBook to start the Media Team Wiki.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Download it from https://nodejs.org (the LTS version), then try again."
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi
(sleep 1 && open "http://localhost:4321") &
node server.js
