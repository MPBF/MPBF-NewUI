// This script updates Arabic names for customers
// Run with: node update-arabic-names.js

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import pg from 'pg';
import iconv from 'iconv-lite';
const { Pool } = pg;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to process records in batches
async function processBatch(records, startIdx, batchSize) {
  let successCount = 0;
  let errorCount = 0;
  const endIdx = Math.min(startIdx + batchSize, records.length);
  
  console.log(`Processing batch from index ${startIdx} to ${endIdx-1} (total records: ${records.length})`);
  
  for (let i = startIdx; i < endIdx; i++) {
    const record = records[i];
    try {
      // Skip records without name or arabic_name
      if (!record.name || !record.arabic_name) {
        console.log(`Skipping record without name or arabic_name: ${JSON.stringify(record)}`);
        continue;
      }
      
      // Update the customer record by name
      const result = await pool.query(
        'UPDATE customers SET arabic_name = $1 WHERE name = $2 RETURNING *',
        [record.arabic_name, record.name]
      );
      
      if (result.rowCount > 0) {
        console.log(`Updated customer: ${record.name}, arabic_name: ${record.arabic_name}`);
        successCount++;
      } else {
        console.log(`No customer found with name: ${record.name}`);
        errorCount++;
      }
    } catch (err) {
      console.error(`Error updating customer ${record.name}:`, err);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

// Function to read and parse the CSV file
async function updateArabicNames(csvPath) {
  try {
    console.log(`Reading CSV file from ${csvPath}`);
    
    // Read the CSV file with Windows-1256 encoding (commonly used for Arabic)
    const fileBuffer = fs.readFileSync(csvPath);
    const fileContent = iconv.decode(fileBuffer, 'windows-1256');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} records in CSV`);
    
    // Process in batches of 100 records
    const BATCH_SIZE = 100;
    let totalSuccessCount = 0;
    let totalErrorCount = 0;
    
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const { successCount, errorCount } = await processBatch(records, i, BATCH_SIZE);
      totalSuccessCount += successCount;
      totalErrorCount += errorCount;
      
      // Log progress after each batch
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length} records processed`);
      console.log(`Current stats: ${totalSuccessCount} updated, ${totalErrorCount} errors`);
    }
    
    console.log(`Update complete. Successfully updated ${totalSuccessCount} records. ${totalErrorCount} errors.`);
  } catch (error) {
    console.error('Error processing CSV:', error);
  } finally {
    // Close the database connection
    pool.end();
  }
}

// Main execution
const main = async () => {
  if (process.argv.length < 3) {
    console.log('Usage: node update-arabic-names.js <path-to-csv-file>');
    process.exit(1);
  }

  const csvPath = process.argv[2];
  await updateArabicNames(csvPath);
};

main().catch(err => {
  console.error('Error in main execution:', err);
  process.exit(1);
});