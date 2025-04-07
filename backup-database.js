/**
 * Database Backup Script
 * 
 * This script creates a backup of the entire PostgreSQL database or selected tables
 * using the pg_dump utility. The backup is saved as an SQL file that can be used
 * to restore the database if needed.
 * 
 * Usage:
 *   node backup-database.js [table1,table2,...]
 *   
 * If table names are provided as a comma-separated list, only those tables will be backed up.
 * Otherwise, the entire database will be backed up.
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const tables = args.length > 0 ? args[0].split(',') : [];

// Get database connection info from DATABASE_URL
const getDatabaseConfig = () => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set!');
    process.exit(1);
  }

  try {
    // Parse the DATABASE_URL
    const url = new URL(dbUrl);
    
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.substring(1), // Remove leading '/'
      username: url.username,
      password: url.password,
    };
  } catch (error) {
    console.error('ERROR: Failed to parse DATABASE_URL!', error);
    process.exit(1);
  }
};

// Create backup directory if it doesn't exist
const setupBackupDirectory = () => {
  const backupDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
    console.log('Created backups directory.');
  }
  
  return backupDir;
};

// Generate backup filename based on current date/time
const getBackupFilename = (dbConfig, isSingleTable = false) => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  
  const tableInfo = isSingleTable ? `-${tables.join('-')}` : '';
  return `${dbConfig.database}${tableInfo}-backup-${timestamp}.sql`;
};

// Run pg_dump to create backup
const runBackup = async (dbConfig, backupDir, backupFilename, tables = []) => {
  // Set environment variables for pg_dump
  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  // Build pg_dump command
  let pgDumpCmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --format=plain --create`;

  // Add table names if specific tables are requested
  if (tables.length > 0) {
    const tableArgs = tables.map(table => `-t "${table}"`).join(' ');
    pgDumpCmd += ` ${tableArgs}`;
  }

  // Add output file
  const backupPath = path.join(backupDir, backupFilename);
  pgDumpCmd += ` -f "${backupPath}"`;

  console.log(`Starting database backup...`);
  if (tables.length > 0) {
    console.log(`Backing up tables: ${tables.join(', ')}`);
  } else {
    console.log('Backing up all tables');
  }

  return new Promise((resolve, reject) => {
    exec(pgDumpCmd, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`ERROR: Backup failed: ${error.message}`);
        console.error(stderr);
        reject(error);
        return;
      }
      
      console.log(`Backup completed successfully!`);
      console.log(`Backup saved to: ${backupPath}`);
      
      // Display file size
      const stats = fs.statSync(backupPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`Backup file size: ${fileSizeInMB} MB`);
      
      resolve(backupPath);
    });
  });
};

// Main backup function
const backupDatabase = async () => {
  try {
    // Get database configuration from DATABASE_URL
    const dbConfig = getDatabaseConfig();
    
    // Setup backup directory
    const backupDir = setupBackupDirectory();
    
    // Generate backup filename
    const backupFilename = getBackupFilename(dbConfig, tables.length > 0);
    
    // Run backup
    await runBackup(dbConfig, backupDir, backupFilename, tables);
    
    console.log('Database backup process completed.');
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
};

// Run the backup
backupDatabase();