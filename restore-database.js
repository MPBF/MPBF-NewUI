/**
 * Database Restore Script
 * 
 * This script restores a database from a SQL or JSON backup file.
 * 
 * Usage:
 *   node restore-database.js <backup-file-path> [--table=table1,table2,...]
 * 
 * The script will detect if the backup file is SQL or JSON and restore accordingly.
 * If table names are provided with --table, only those tables will be restored from a JSON backup.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to a Promise-based function
const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('ERROR: No backup file specified!');
  console.log('Usage: node restore-database.js <backup-file-path> [--table=table1,table2,...]');
  process.exit(1);
}

const backupFilePath = args[0];
const tableArg = args.find(arg => arg.startsWith('--table='));
const tables = tableArg 
  ? tableArg.replace('--table=', '').split(',') 
  : [];

// Check if file exists
if (!fs.existsSync(backupFilePath)) {
  console.error(`ERROR: Backup file not found: ${backupFilePath}`);
  process.exit(1);
}

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
      connectionString: dbUrl,
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.substring(1), // Remove leading '/'
      user: url.username,
      password: url.password,
    };
  } catch (error) {
    console.error('ERROR: Failed to parse DATABASE_URL!', error);
    process.exit(1);
  }
};

// Detect backup file type (SQL or JSON)
const detectBackupType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.sql') {
    return 'sql';
  } else if (ext === '.json') {
    return 'json';
  } else {
    // Try to read the first few bytes to determine if it's JSON
    try {
      const fileContent = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
      const firstChar = fileContent.trim()[0];
      
      if (firstChar === '{' || firstChar === '[') {
        return 'json';
      }
    } catch (error) {
      console.error(`Error reading file: ${error.message}`);
    }
    
    // Default to SQL if we can't determine
    return 'sql';
  }
};

// Restore database from SQL backup using psql
const restoreFromSql = async (dbConfig, backupFilePath) => {
  console.log('Restoring database from SQL backup...');
  
  // Set environment variables for psql
  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  try {
    // Build psql command
    const psqlCmd = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${backupFilePath}"`;
    
    console.log('Running restore command...');
    const { stdout, stderr } = await execAsync(psqlCmd, { env });
    
    if (stderr && !stderr.includes('NOTICE') && !stderr.includes('INFO')) {
      console.warn('Warnings during restore:', stderr);
    }
    
    console.log('Restore completed successfully!');
    return true;
  } catch (error) {
    console.error(`ERROR: Restore failed: ${error.message}`);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
};

// Restore database from JSON backup
const restoreFromJson = async (dbConfig, backupFilePath) => {
  console.log('Restoring database from JSON backup...');

  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(backupFilePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Check if it's a single table backup or a directory backup
    if (Array.isArray(data)) {
      // Single table backup
      const tableName = path.basename(backupFilePath, '.json');
      
      // Check if the table should be restored
      if (tables.length > 0 && !tables.includes(tableName)) {
        console.log(`Skipping table ${tableName} as it's not in the requested tables list.`);
        return true;
      }
      
      return await restoreTableFromJson(dbConfig, tableName, data);
    } else if (data.tables && Array.isArray(data.tables)) {
      // This is likely a backup summary file
      console.log('Found backup summary file. Restoring tables listed in the summary...');
      
      // Get the directory where the backup files are located
      const backupDir = path.dirname(backupFilePath);
      
      // Restore each table
      let success = true;
      for (const tableInfo of data.tables) {
        // Check if there was an error with this table during backup
        if (tableInfo.error) {
          console.warn(`Skipping table ${tableInfo.table} as it had errors during backup.`);
          continue;
        }
        
        // Check if the table should be restored
        if (tables.length > 0 && !tables.includes(tableInfo.table)) {
          console.log(`Skipping table ${tableInfo.table} as it's not in the requested tables list.`);
          continue;
        }
        
        // Build the path to the table's JSON file
        const tableFilePath = path.join(backupDir, `${tableInfo.table}.json`);
        
        // Check if the file exists
        if (!fs.existsSync(tableFilePath)) {
          console.error(`ERROR: Table file not found: ${tableFilePath}`);
          success = false;
          continue;
        }
        
        // Read and parse the table's JSON file
        const tableFileContent = fs.readFileSync(tableFilePath, 'utf8');
        const tableData = JSON.parse(tableFileContent);
        
        // Restore the table
        const tableSuccess = await restoreTableFromJson(dbConfig, tableInfo.table, tableData);
        if (!tableSuccess) {
          success = false;
        }
      }
      
      return success;
    } else {
      console.error('ERROR: Invalid JSON backup format!');
      return false;
    }
  } catch (error) {
    console.error(`ERROR: Restore failed: ${error.message}`);
    return false;
  }
};

// Restore a single table from JSON data
const restoreTableFromJson = async (dbConfig, tableName, tableData) => {
  console.log(`Restoring table: ${tableName} (${tableData.length} rows)...`);
  
  const pool = new Pool(dbConfig);
  
  try {
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Truncate the table first to remove existing data
      console.log(`  Truncating table ${tableName}...`);
      await client.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
      
      if (tableData.length === 0) {
        console.log(`  No data to restore for table ${tableName}.`);
      } else {
        // Get the columns from the first row
        const columns = Object.keys(tableData[0]);
        
        // Process each row
        for (let i = 0; i < tableData.length; i++) {
          const row = tableData[i];
          
          // Build the INSERT statement
          const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          const values = columns.map(col => row[col]);
          
          const query = `
            INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
            VALUES (${placeholders})
          `;
          
          await client.query(query, values);
          
          // Log progress for large tables
          if ((i + 1) % 1000 === 0 || i === tableData.length - 1) {
            console.log(`  Restored ${i + 1}/${tableData.length} rows...`);
          }
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log(`  ✓ Table ${tableName} restored successfully.`);
      return true;
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error(`  ✗ Error restoring table ${tableName}:`, error);
      return false;
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error(`Error connecting to database:`, error);
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Main restore function
const restoreDatabase = async () => {
  try {
    // Get database configuration
    const dbConfig = getDatabaseConfig();
    
    // Detect backup type
    const backupType = detectBackupType(backupFilePath);
    console.log(`Detected backup type: ${backupType.toUpperCase()}`);
    
    // Perform restore based on backup type
    let success;
    if (backupType === 'sql') {
      success = await restoreFromSql(dbConfig, backupFilePath);
    } else {
      success = await restoreFromJson(dbConfig, backupFilePath);
    }
    
    if (success) {
      console.log('\nDatabase restore completed successfully!');
    } else {
      console.error('\nDatabase restore failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
};

// Run the restore
restoreDatabase();