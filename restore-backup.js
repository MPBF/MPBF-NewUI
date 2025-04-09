/**
 * Database Restore Script - Optimized for batch processing
 * 
 * This script restores database tables from JSON backup files in an optimized way.
 * It batches inserts for large tables and handles the restoration process in an efficient manner.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db } = require('./server/db');
const { drizzle } = require('drizzle-orm/postgres-js');
const { sql } = require('drizzle-orm');

const BATCH_SIZE = 100; // Number of records to insert at once

async function restoreTable(tableName, filePath) {
  console.log(`Restoring table: ${tableName}...`);
  
  try {
    // Read the backup file
    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`  Table ${tableName} is empty, skipping.`);
      return true;
    }
    
    // Truncate the table first
    console.log(`  Truncating table ${tableName}...`);
    await db.execute(sql.raw(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`));
    
    // For small tables, do a simple insert
    if (data.length <= BATCH_SIZE) {
      await db.execute(sql.raw(`
        INSERT INTO ${tableName} 
        SELECT * FROM json_populate_recordset(null::${tableName}, '${JSON.stringify(data)}')
      `));
      console.log(`  ✓ Restored ${data.length} rows to ${tableName}`);
      return true;
    }
    
    // For larger tables, batch the inserts
    let processed = 0;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      await db.execute(sql.raw(`
        INSERT INTO ${tableName} 
        SELECT * FROM json_populate_recordset(null::${tableName}, '${JSON.stringify(batch)}')
      `));
      processed += batch.length;
      process.stdout.write(`  Restored ${processed}/${data.length} rows...\r`);
    }
    
    console.log(`  ✓ Restored ${data.length} rows to ${tableName}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to restore table ${tableName}:`, error.message);
    return false;
  }
}

async function main() {
  const backupDir = 'backups/json-backup-2025-03-21T04-37-32-842Z';
  
  // Define the order of tables to restore - restore tables with dependencies first
  const tablesInOrder = [
    'categories',
    'customers',
    'salespersons',
    'machine_options',
    'machines',
    'machine_to_options',
    'materials',
    'material_inputs',
    'products',
    'items'
  ];
  
  console.log('Starting optimized database restore...');
  
  let success = 0;
  let failed = 0;
  
  for (const tableName of tablesInOrder) {
    const filePath = path.join(backupDir, `${tableName}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ! File for table ${tableName} doesn't exist, skipping.`);
      continue;
    }
    
    const result = await restoreTable(tableName, filePath);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  console.log(`Restore completed: ${success} tables restored, ${failed} tables failed.`);
}

main().catch(console.error);