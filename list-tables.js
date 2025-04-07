/**
 * Database Table List and Row Count
 * 
 * This script lists all tables in the database and shows their row count.
 * 
 * Usage:
 *   node list-tables.js
 */

import dotenv from 'dotenv';
import pg from 'pg';

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

// Get list of all tables in the database with row counts
const getTablesWithRowCounts = async (pool) => {
  try {
    // First get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    // Get row count for each table
    const results = [];
    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
      results.push({
        table,
        rows: parseInt(countResult.rows[0].count, 10)
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error getting tables:', error);
    throw error;
  }
};

// Main function
const listTables = async () => {
  const dbConfig = getDatabaseConfig();
  const pool = new Pool(dbConfig);
  
  try {
    console.log('Connecting to database...');
    
    // Get table info
    const tables = await getTablesWithRowCounts(pool);
    
    // Calculate totals
    const totalTables = tables.length;
    const totalRows = tables.reduce((sum, t) => sum + t.rows, 0);
    
    // Format and output the results
    console.log('\nDatabase Tables and Row Counts:');
    console.log('================================');
    
    // Find the longest table name for proper formatting
    const maxTableNameLength = Math.max(...tables.map(t => t.table.length), 10);
    
    // Print header
    console.log(`${'Table'.padEnd(maxTableNameLength + 2)} | Row Count`);
    console.log(`${'-'.repeat(maxTableNameLength + 2)} | ${'-'.repeat(9)}`);
    
    // Print each table
    tables.forEach(t => {
      console.log(`${t.table.padEnd(maxTableNameLength + 2)} | ${t.rows.toString().padStart(9)}`);
    });
    
    // Print summary
    console.log(`${'-'.repeat(maxTableNameLength + 2)} | ${'-'.repeat(9)}`);
    console.log(`${'Total'.padEnd(maxTableNameLength + 2)} | ${totalRows.toString().padStart(9)}`);
    
    console.log(`\nFound ${totalTables} tables with a total of ${totalRows} rows.`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
};

// Run the function
listTables();