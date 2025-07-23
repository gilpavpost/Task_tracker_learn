set -e

# === 1. Установка Node.js, npm, pm2 ===
echo "Установка Node.js, npm и pm2..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
sudo npm install -g pm2

# === 2. Установка MySQL Server ===
echo "Установка MySQL Server..."
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server

# === 3. Настройка MySQL: создание БД и пользователя ===
DB_NAME="tasktracker"
DB_USER="taskuser"
DB_PASS="taskpass"
DB_HOST="localhost"

echo "Создание базы данных и пользователя..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';"
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';"
sudo mysql -e "FLUSH PRIVILEGES;"

# === 4. Импорт структуры БД ===
echo "Импорт структуры БД (init.sql)..."
mysql -u"$DB_USER" -p"$DB_PASS" -h "$DB_HOST" "$DB_NAME" < init.sql

# === 5. Установка npm-зависимостей ===
echo "Проверка наличия node_modules..."
if [ -d "node_modules" ]; then
  echo "Зависимости уже установлены, пропускаю npm install."
else
  echo "Установка npm-зависимостей..."
  npm install
fi

# === 5.5. Создание .env файла ===
echo "Создание .env файла..."
cat > .env << EOF
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
PORT=5000
JWT_SECRET=your_jwt_secret_key_$(date +%s)
EOF

# === 6. Заполнение БД начальными данными ===
echo "Выполнение seed.js..."
node seed.js

# === 7. Запуск приложения через pm2 ===
echo "Запуск приложения через pm2..."
pm2 stop tasktracker 2>/dev/null || true
pm2 delete tasktracker 2>/dev/null || true
pm2 start app.js --name tasktracker
pm2 save
pm2 startup

# === 8. Вывод адресов и статуса ===
IP=$(hostname -I | awk '{print $1}')
PORT=5000

echo "=============================================="
echo "TaskTracker успешно развернут и запущен как сервис!"
echo "API:      http://$IP:$PORT/api/"
echo "Swagger:  http://$IP:$PORT/api-docs"
echo "Клиент:   http://$IP:$PORT/client.html"
echo "----------------------------------------------"
echo "Статус pm2:"
pm2 status tasktracker
echo "=============================================="

echo "Данные для подключения к MySQL:"
echo "  host: $DB_HOST"
echo "  user: $DB_USER"
echo "  pass: $DB_PASS"
echo "  db:   $DB_NAME"
echo "=============================================="