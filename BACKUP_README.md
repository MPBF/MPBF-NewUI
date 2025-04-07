# Database Backup and Restore Tools

This directory contains scripts for backing up and restoring the PostgreSQL database used by this application.

## Requirements

These scripts require:
- Node.js
- PostgreSQL client tools (`pg_dump` and `psql`) - for SQL backups
- Access to the database (via DATABASE_URL environment variable)

## Backup Scripts

### 1. SQL Backup (`backup-database.js`)

Creates a full database backup using `pg_dump` in SQL format.

```
node backup-database.js [table1,table2,...]
```

- If table names are provided as a comma-separated list, only those tables will be backed up.
- Otherwise, the entire database will be backed up.
- Backups will be saved to the `backups` directory.

### 2. JSON Backup (`backup-json.js`)

Exports all tables to JSON files without requiring PostgreSQL client tools.

```
node backup-json.js
```

- Creates a directory inside `backups` with JSON files for each table
- Also creates a backup summary file

### 3. CSV Export (`export-csv.js`)

Exports database tables to CSV files for easy importing into other systems.

```
node export-csv.js [table1,table2,...]
```

- If table names are provided as a comma-separated list, only those tables will be exported.
- Otherwise, all tables will be exported.
- Exports will be saved to the `exports` directory.

## Restore Scripts

### Restore Database (`restore-database.js`)

Restores a database from either SQL or JSON backup.

```
node restore-database.js <backup-file-path> [--table=table1,table2,...]
```

- `<backup-file-path>` - Path to the backup file (either .sql or .json)
- `--table=table1,table2,...` - Optional. For JSON backups, specify which tables to restore

## Utility Scripts

### List Tables (`list-tables.js`)

Lists all tables in the database with their row counts.

```
node list-tables.js
```

## Common Usage Examples

### Full Backup Workflow

1. Back up the entire database to SQL:
   ```
   node backup-database.js
   ```

2. Back up the entire database to JSON (as a second backup method):
   ```
   node backup-json.js
   ```

3. Export critical tables to CSV for records:
   ```
   node export-csv.js customers,orders,job_orders,rolls
   ```

### Selective Backup

Back up only specific tables:
```
node backup-database.js users,customers,orders
```

### Restore from Backup

Restore entire database from SQL backup:
```
node restore-database.js ./backups/mydatabase-backup-2025-03-21.sql
```

Restore specific tables from JSON backup:
```
node restore-database.js ./backups/json-backup-2025-03-21/backup-summary.json --table=customers,orders
```

## Automated Backups

For automated backups, you can set up a cron job to run the backup script regularly.

Example crontab entry to run a backup every day at 2 AM:
```
0 2 * * * cd /path/to/your/app && node backup-database.js >> /path/to/backup.log 2>&1
```

## Troubleshooting

### Database Connection Issues

- Make sure the DATABASE_URL environment variable is set correctly.
- Check that you have network access to the database server.
- For SQL backups, make sure the PostgreSQL client tools are installed.

### Backup File Permissions

- Ensure the script has write permissions to the `backups` and `exports` directories.

### Restoring Large Databases

- For very large databases, consider restoring tables individually.
- Make sure you have enough disk space for the backup files.