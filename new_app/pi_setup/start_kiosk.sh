#!/bin/bash
echo "Waiting for Flask..."
until curl -s http://localhost:5000 > /dev/null; do
    sleep 1
done
echo "Flask ready, launching kiosk..."
chromium-browser --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  --restore-last-session \
  http://localhost:5000
