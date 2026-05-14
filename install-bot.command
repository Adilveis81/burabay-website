#!/bin/bash
# Установка @Alsat_Asia_bot как фонового сервиса macOS
# Двойной клик на этот файл — и бот запускается автоматически при входе в систему

PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST="$PLIST_DIR/asia.alsat.tg-bot.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$PLIST_DIR"

# Найти node
NODE_PATH=$(which node || echo "/usr/local/bin/node")

cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>asia.alsat.tg-bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$SCRIPT_DIR/tg-polling.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/tg-bot.log</string>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/tg-bot-error.log</string>
</dict>
</plist>
EOF

# Stop old instance if running
launchctl unload "$PLIST" 2>/dev/null

# Load new instance
launchctl load "$PLIST"

echo ""
echo "✅ Бот @Alsat_Asia_bot установлен как сервис macOS!"
echo "   Запускается автоматически при входе в систему."
echo ""
echo "   Логи: $SCRIPT_DIR/tg-bot.log"
echo "   Остановить: launchctl unload $PLIST"
echo ""
read -p "Нажмите Enter для закрытия..."
