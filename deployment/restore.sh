#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="amrutha_chicken_db"
DB_USER="root"
DB_PASS="root_secure_password"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File $BACKUP_FILE does not exist."
    exit 1
fi

# Temp decompressed file
TEMP_SQL="${BACKUP_FILE%.gz}"

echo "Decompressing $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

# Check if MySQL client is installed or run via Docker
if command -v mysql &> /dev/null; then
    echo "Restoring database locally..."
    mysql -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$TEMP_SQL"
elif command -v docker &> /dev/null && docker ps | grep -q "amrutha-db"; then
    echo "Restoring database inside Docker amrutha-db container..."
    docker cp "$TEMP_SQL" amrutha-db:/tmp/restore.sql
    docker exec -i amrutha-db mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "source /tmp/restore.sql;"
    docker exec amrutha-db rm -f /tmp/restore.sql
else
    echo "Error: Neither local mysql nor running docker container 'amrutha-db' was found."
    rm -f "$TEMP_SQL"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "Restore completed successfully!"
else
    echo "Restore failed!"
fi

rm -f "$TEMP_SQL"
