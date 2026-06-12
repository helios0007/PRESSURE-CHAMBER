#!/bin/bash
# Run this script ONCE on the Pi to configure everything
echo "Setting up Bias Game kiosk..."

# Install dependencies
pip3 install -r /home/pi/pressure-chamber/new_app/requirements.txt --break-system-packages

# Copy and enable systemd service
sudo cp /home/pi/pressure-chamber/new_app/pi_setup/biasgame.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable biasgame

# Copy kiosk startup script
cp /home/pi/pressure-chamber/new_app/pi_setup/start_kiosk.sh /home/pi/
chmod +x /home/pi/start_kiosk.sh

# Set up autostart
mkdir -p /home/pi/.config/autostart
cp /home/pi/pressure-chamber/new_app/pi_setup/kiosk.desktop /home/pi/.config/autostart/

# Disable screen sleep
AUTOSTART_FILE="/home/pi/.config/lxsession/LXDE-pi/autostart"
mkdir -p "$(dirname $AUTOSTART_FILE)"
grep -qxF '@xset s off' "$AUTOSTART_FILE" || echo '@xset s off' >> "$AUTOSTART_FILE"
grep -qxF '@xset -dpms' "$AUTOSTART_FILE" || echo '@xset -dpms' >> "$AUTOSTART_FILE"
grep -qxF '@xset s noblank' "$AUTOSTART_FILE" || echo '@xset s noblank' >> "$AUTOSTART_FILE"

echo "Done! Please enable auto-login via: sudo raspi-config"
echo "Then reboot the Pi."
