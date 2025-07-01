# TaskTracker - Docker Setup

## Быстрый старт

### Предварительные требования
- Docker
- Docker Compose

### Запуск приложения

1. **Клонируйте репозиторий и перейдите в папку проекта:**
   ```bash
   cd TaskTracker
   ```

2. **Запустите приложение с помощью Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Дождитесь запуска всех сервисов (MySQL может занять несколько минут):**
   ```bash
   docker-compose logs -f
   ```

4. **Заполните базу данных моковыми данными (опционально):**
   ```bash
   docker-compose exec app node docker-seed.js
   ```

### Доступ к приложению

- **API:** http://localhost:5000
- **Swagger документация:** http://localhost:5000/api-docs
- **MySQL:** localhost:3306

### Тестовые учетные данные

```
Email: admin@example.com
Password: password123

Email: john@example.com
Password: password123

Email: jane@example.com
Password: password123
```

## Управление контейнерами

### Остановка приложения
```bash
docker-compose down
```

### Перезапуск приложения
```bash
docker-compose restart
```

### Просмотр логов
```bash
# Все сервисы
docker-compose logs

# Только приложение
docker-compose logs app

# Только база данных
docker-compose logs mysql
```

### Удаление всех данных (включая базу)
```bash
docker-compose down -v
```

## Структура проекта

```
TaskTracker/
├── Dockerfile              # Образ для Node.js приложения
├── docker-compose.yml      # Конфигурация Docker Compose
├── init.sql               # Инициализация базы данных
├── docker-seed.js         # Заполнение моковыми данными
├── app.js                 # Основной файл приложения
├── config/
│   └── db.js             # Конфигурация базы данных
├── controllers/           # Контроллеры
├── routes/               # Маршруты API
└── middlewares/          # Промежуточное ПО
```

## Переменные окружения

В `docker-compose.yml` настроены следующие переменные:

- `DB_HOST=mysql` - хост базы данных
- `DB_USER=tasktracker` - пользователь базы данных
- `DB_PASSWORD=tasktracker123` - пароль базы данных
- `DB_NAME=tasktracker` - имя базы данных
- `JWT_SECRET=your_super_secret_jwt_key_change_this_in_production` - секрет для JWT
- `PORT=5000` - порт приложения

## Устранение неполадок

### MySQL не запускается
```bash
# Проверьте логи MySQL
docker-compose logs mysql

# Перезапустите только MySQL
docker-compose restart mysql
```

### Приложение не подключается к базе данных
```bash
# Проверьте, что MySQL запущен
docker-compose ps

# Проверьте логи приложения
docker-compose logs app
```

### Очистка и пересборка
```bash
# Остановить и удалить все контейнеры и образы
docker-compose down --rmi all

# Пересобрать образы
docker-compose up --build -d
``` 