#!/bin/bash

BACKUP_DIR="./backups"
DB_NAME="amrutha_chicken_db"
DB_USER="root"
DB_PASS="root_secure_password"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="$BACKUP_DIR/$DB_NAME-$DATE.sql"

mkdir -p "$BACKUP_DIR"

# Check if MySQL client is installed or run via Docker
if command -v mysqldump &> /dev/null; then
    echo "Using local mysqldump..."
    mysqldump -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$FILENAME"
elif command -v docker &> /dev/null && docker ps | grep -q "amrutha-db"; then
    echo "Using Docker mysqldump inside amrutha-db container..."
    docker exec amrutha-db mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$FILENAME"
else
    echo "Error: Neither local mysqldump nor running docker container 'amrutha-db' was found."
    exit 1
fi

if [ $? -eq 0 ]; then
    gzip "$FILENAME"
    echo "Backup completed successfully: $FILENAME.gz"
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +30 -delete
else
    echo "Backup failed!"
    exit 1
fi
