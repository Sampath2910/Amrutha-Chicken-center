# Database Setup & Operations Guide

This guide details how to configure, set up, back up, and restore the MySQL database for the **Amrutha Chicken Center** platform.

---

## 1. Database Configuration Parameters

To ensure correct data storage (particularly Telugu translations) and high-performance connection pooling under heavy production traffic, apply the following settings to your MySQL instance:

### Character Set and Collation
The database uses `utf8mb4` character encoding to natively support multi-byte Unicode strings (Telugu characters, emojis, etc.).
*   **Default Character Set**: `utf8mb4`
*   **Default Collation**: `utf8mb4_unicode_ci`

### Storage Engine
*   All tables are designed explicitly using the transactional **InnoDB** engine (`ENGINE=InnoDB`). This guarantees ACID compliance, row-level locking, and foreign key constraints enforcement.

---

## 2. Setting Up the Database Locally

### A. Manual SQL Import
If setting up a local database for development or testing:

1.  Log in to the MySQL command-line tool or your GUI manager (e.g., DBeaver, MySQL Workbench):
    ```bash
    mysql -u root -p
    ```
2.  Import the schema and seed data by executing the `schema.sql` script:
    ```sql
    CREATE DATABASE IF NOT EXISTS amrutha_chicken_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    USE amrutha_chicken_db;
    SOURCE /path/to/database/schema.sql;
    ```

### B. Automated Flyway Migrations
In production environments, the Spring Boot application handles database setup and updates automatically:
*   On application startup, Flyway scans the `backend/src/main/resources/db/migration/` directory.
*   It applies the baseline schema (`V1__init_schema.sql`) and any incremental updates (e.g., index optimizations `V2__optimize_indexes.sql`) sequentially.
*   No manual schema maintenance is required once Flyway is running.

---

## 3. Production Connection Pooling (HikariCP)
Spring Boot integrates HikariCP by default. We configure pooling under `spring.datasource.hikari` in `application-prod.yml`:
*   `maximum-pool-size` (Default: `10`): Restricts active connections to prevent database resource exhaustion on free/hobby database tiers.
*   `minimum-idle` (Default: `2`): Keeps minimum idle connections open to handle sudden traffic bursts.
*   `idle-timeout` (Default: `600000ms` / 10 minutes): Reclaims idle connections to prevent memory leakage.
*   `max-lifetime` (Default: `1800000ms` / 30 minutes): Destroys old connections to refresh state.

---

## 4. Backups and Recovery Procedures

Operational scripts are provided under the `deployment/` directory to manage system backups and disaster recovery.

### A. Database Backup (`deployment/backup.sh`)
The backup script performs a compressed database dump (`mysqldump`) and automatically purges old backups:

1.  **Usage**:
    ```bash
    chmod +x deployment/backup.sh
    ./deployment/backup.sh
    ```
2.  **Logic**:
    *   Creates a `backups/` directory.
    *   Runs `mysqldump` locally or targets the Docker container (`amrutha-db`).
    *   Compresses the SQL output using `gzip`.
    *   Finds and deletes any `.sql.gz` files in the backups folder older than 30 days.

### B. Database Restore (`deployment/restore.sh`)
The restore script decompresses a backup and imports it:

1.  **Usage**:
    ```bash
    chmod +x deployment/restore.sh
    ./deployment/restore.sh ./backups/amrutha_chicken_db-2026-06-26_18-50-00.sql.gz
    ```
2.  **Logic**:
    *   Validates that the target backup file exists.
    *   Decompresses the `.gz` backup to a temporary `.sql` file.
    *   Runs the SQL restoration locally or inside the Docker container (`amrutha-db`).
    *   Safely removes the temporary decompressed `.sql` file to prevent disk bloat.
