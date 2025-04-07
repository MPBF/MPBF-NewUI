// This script processes customers in very small batches to avoid timeout issues
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import pg from 'pg';
import iconv from 'iconv-lite';

const { Pool } = pg;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to process a smaller chunk of records
async function processChunk(records, startIdx, endIdx) {
  console.log(`Processing chunk from index ${startIdx} to ${endIdx} (total: ${records.length})`);
  
  let successCount = 0;
  let errorCount = 0;
  
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

// Main function to process a specific range of the CSV
async function processRemainingCustomers(csvPath, startIndex, endIndex) {
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
    
    // Validate indexes
    const actualStartIndex = Math.max(0, Math.min(startIndex, records.length - 1));
    const actualEndIndex = Math.min(endIndex || records.length, records.length);
    
    console.log(`Processing records from index ${actualStartIndex} to ${actualEndIndex}`);
    
    // Process in very small batches of 20 records
    const CHUNK_SIZE = 20;
    let totalSuccessCount = 0;
    let totalErrorCount = 0;
    
    for (let i = actualStartIndex; i < actualEndIndex; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, actualEndIndex);
      const { successCount, errorCount } = await processChunk(records, i, chunkEnd);
      
      totalSuccessCount += successCount;
      totalErrorCount += errorCount;
      
      // Log progress after each batch
      console.log(`Progress: ${chunkEnd}/${actualEndIndex} records processed (${Math.round((chunkEnd - actualStartIndex) / (actualEndIndex - actualStartIndex) * 100)}%)`);
      console.log(`Current stats: ${totalSuccessCount} updated, ${totalErrorCount} errors`);
    }
    
    console.log(`Chunk processing complete. Successfully updated ${totalSuccessCount} records. ${totalErrorCount} errors.`);
  } catch (error) {
    console.error('Error processing CSV:', error);
  } finally {
    // Close the database connection
    pool.end();
  }
}

// Main execution
const main = async () => {
  if (process.argv.length < 4) {
    console.log('Usage: node process-remaining-customers.js <path-to-csv-file> <start-index> [end-index]');
    process.exit(1);
  }

  const csvPath = process.argv[2];
  const startIndex = parseInt(process.argv[3], 10);
  const endIndex = process.argv.length > 4 ? parseInt(process.argv[4], 10) : undefined;
  
  await processRemainingCustomers(csvPath, startIndex, endIndex);
};

main().catch(err => {
  console.error('Error in main execution:', err);
  process.exit(1);
});