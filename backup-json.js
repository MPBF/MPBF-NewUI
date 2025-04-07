/**
 * Database Backup to JSON
 * 
 * This script exports all data from the database tables to JSON files.
 * This is an alternative backup method that doesn't require pg_dump.
 * 
 * Usage:
 *   node backup-json.js
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import { mkdir } from 'fs/promises';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Get database connection info from DATABASE_URL
const getDatabaseConfig = () => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set!');
    process.exit(1);
  }

  return { connectionString: dbUrl };
};

// Create backup directory if it doesn't exist
const setupBackupDirectory = async () => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const backupMainDir = path.join(process.cwd(), 'backups');
  const backupDir = path.join(backupMainDir, `json-backup-${timestamp}`);
  
  if (!fs.existsSync(backupMainDir)) {
    await mkdir(backupMainDir);
    console.log('Created backups directory.');
  }
  
  await mkdir(backupDir);
  console.log(`Created backup directory: ${backupDir}`);
  
  return backupDir;
};

// Get list of all tables in the database
const getTables = async (pool) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Error getting tables:', error);
    throw error;
  }
};

// Export data from a single table
const exportTable = async (pool, table, backupDir) => {
  try {
    console.log(`Exporting table: ${table}`);
    
    // Query all data from the table
    const result = await pool.query(`SELECT * FROM "${table}"`);
    
    // Save to JSON file
    const filePath = path.join(backupDir, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
    
    console.log(`  ✓ Exported ${result.rows.length} rows to ${filePath}`);
    return {
      table,
      rows: result.rows.length,
      path: filePath
    };
  } catch (error) {
    console.error(`  ✗ Error exporting table ${table}:`, error);
    return {
      table,
      rows: 0,
      error: error.message
    };
  }
};

// Main backup function
const backupDatabaseToJson = async () => {
  const dbConfig = getDatabaseConfig();
  const pool = new Pool(dbConfig);
  
  try {
    // Setup backup directory
    const backupDir = await setupBackupDirectory();
    
    // Get all tables
    const tables = await getTables(pool);
    console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Export data from each table
    const results = [];
    for (const table of tables) {
      const result = await exportTable(pool, table, backupDir);
      results.push(result);
    }
    
    // Create summary file
    const summaryPath = path.join(backupDir, 'backup-summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      tables: results,
      totalTables: tables.length,
      successfulTables: results.filter(r => !r.error).length,
      failedTables: results.filter(r => r.error).length,
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\nBackup summary saved to ${summaryPath}`);
    
    // Log summary
    console.log('\nBackup Complete!');
    console.log(`Successfully backed up ${summary.successfulTables} of ${summary.totalTables} tables.`);
    
    if (summary.failedTables > 0) {
      console.log(`Failed to backup ${summary.failedTables} tables.`);
      const failed = results.filter(r => r.error).map(r => r.table);
      console.log(`Failed tables: ${failed.join(', ')}`);
    }
    
    console.log(`\nBackup location: ${backupDir}`);
    
  } catch (error) {
    console.error('Backup failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
};

// Run the backup
backupDatabaseToJson();