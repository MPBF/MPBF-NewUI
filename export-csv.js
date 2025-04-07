/**
 * Database Export to CSV
 * 
 * This script exports all data from the database tables to CSV files.
 * 
 * Usage:
 *   node export-csv.js [table1,table2,...]
 *   
 * If table names are provided as a comma-separated list, only those tables will be exported.
 * Otherwise, all tables will be exported.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import { mkdir } from 'fs/promises';
import { stringify } from 'csv-stringify/sync';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Parse command line arguments
const args = process.argv.slice(2);
const specifiedTables = args.length > 0 ? args[0].split(',') : [];

// Get database connection info from DATABASE_URL
const getDatabaseConfig = () => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set!');
    process.exit(1);
  }

  return { connectionString: dbUrl };
};

// Create export directory if it doesn't exist
const setupExportDirectory = async () => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const exportMainDir = path.join(process.cwd(), 'exports');
  const exportDir = path.join(exportMainDir, `csv-export-${timestamp}`);
  
  if (!fs.existsSync(exportMainDir)) {
    await mkdir(exportMainDir);
    console.log('Created exports directory.');
  }
  
  await mkdir(exportDir);
  console.log(`Created export directory: ${exportDir}`);
  
  return exportDir;
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
    
    let tables = result.rows.map(row => row.table_name);
    
    // Filter tables if specific tables were requested
    if (specifiedTables.length > 0) {
      tables = tables.filter(table => specifiedTables.includes(table));
    }
    
    return tables;
  } catch (error) {
    console.error('Error getting tables:', error);
    throw error;
  }
};

// Get column names for a table
const getColumns = async (pool, table) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    
    return result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type
    }));
  } catch (error) {
    console.error(`Error getting columns for table ${table}:`, error);
    throw error;
  }
};

// Export data from a single table
const exportTable = async (pool, table, columns, exportDir) => {
  try {
    console.log(`Exporting table: ${table}`);
    
    // Query all data from the table
    const result = await pool.query(`SELECT * FROM "${table}"`);
    
    // Prepare CSV header
    const header = columns.map(col => col.name);
    
    // Process the data and convert any complex objects to JSON strings
    const rows = result.rows.map(row => {
      const processedRow = {};
      columns.forEach(col => {
        const value = row[col.name];
        // Convert objects to strings
        if (value !== null && typeof value === 'object') {
          processedRow[col.name] = JSON.stringify(value);
        } else {
          processedRow[col.name] = value;
        }
      });
      return processedRow;
    });
    
    // Convert to CSV
    const csv = stringify(rows, {
      header: true,
      columns: header
    });
    
    // Save to CSV file
    const filePath = path.join(exportDir, `${table}.csv`);
    fs.writeFileSync(filePath, '\ufeff' + csv); // Add BOM for UTF-8 encoding
    
    console.log(`  ✓ Exported ${rows.length} rows to ${filePath}`);
    return {
      table,
      rows: rows.length,
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

// Main export function
const exportDatabaseToCSV = async () => {
  const dbConfig = getDatabaseConfig();
  const pool = new Pool(dbConfig);
  
  try {
    // Setup export directory
    const exportDir = await setupExportDirectory();
    
    // Get all tables
    const tables = await getTables(pool);
    
    if (tables.length === 0) {
      console.log('No tables found to export.');
      if (specifiedTables.length > 0) {
        console.log(`Specified tables not found: ${specifiedTables.join(', ')}`);
      }
      return;
    }
    
    console.log(`Found ${tables.length} tables to export: ${tables.join(', ')}`);
    
    // Export data from each table
    const results = [];
    for (const table of tables) {
      // Get column information
      const columns = await getColumns(pool, table);
      
      // Export the table
      const result = await exportTable(pool, table, columns, exportDir);
      results.push(result);
    }
    
    // Create summary file
    const summaryPath = path.join(exportDir, 'export-summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      tables: results,
      totalTables: tables.length,
      successfulTables: results.filter(r => !r.error).length,
      failedTables: results.filter(r => r.error).length,
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\nExport summary saved to ${summaryPath}`);
    
    // Log summary
    console.log('\nExport Complete!');
    console.log(`Successfully exported ${summary.successfulTables} of ${summary.totalTables} tables.`);
    
    if (summary.failedTables > 0) {
      console.log(`Failed to export ${summary.failedTables} tables.`);
      const failed = results.filter(r => r.error).map(r => r.table);
      console.log(`Failed tables: ${failed.join(', ')}`);
    }
    
    console.log(`\nExport location: ${exportDir}`);
    
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
};

// Run the export
exportDatabaseToCSV();