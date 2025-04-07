/**
 * Script to process customers CSV file that has Arabic names in Windows-1256 encoding
 * and convert it to UTF-8 for importing into the system
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import iconv from 'iconv-lite';

// Recreate the encoding helper functions here to avoid import issues
const COMMON_ENCODINGS = [
  'utf8',
  'windows-1256', // Arabic Windows
  'cp1256',       // Arabic code page
  'ISO-8859-6',   // Arabic ISO
  'utf16le',
  'windows-1252', // Western European Windows
  'ISO-8859-1'    // Western European ISO
];

function detectEncoding(buffer) {
  // For our customers file, we know that windows-1256 is highly likely for Arabic text
  // We'll try it first with a high preference
  
  // Manual override for known files with Arabic content
  if (buffer.length > 10 && buffer[0] !== 0xEF && buffer[1] !== 0xBB && buffer[2] !== 0xBF) {
    // No UTF-8 BOM, likely Windows-1256 for Arabic text
    console.log("File does not have UTF-8 BOM, assuming Windows-1256 for Arabic text");
    return 'windows-1256';
  }
  
  let bestEncoding = 'utf8'; // Default to UTF-8
  let bestScore = 0;
  
  for (const encoding of COMMON_ENCODINGS) {
    try {
      const decoded = iconv.decode(buffer.slice(0, 1000), encoding);
      
      // Calculate a score for this encoding based on valid character percentage
      let validChars = 0;
      let arabicChars = 0;
      
      for (let i = 0; i < decoded.length; i++) {
        const code = decoded.charCodeAt(i);
        // Check for common characters (ASCII, Arabic ranges, etc.)
        if (
          (code >= 32 && code <= 126) || // Basic Latin
          (code >= 1536 && code <= 1791) || // Arabic
          (code === 1600) || // Arabic Tatweel
          (code >= 8192 && code <= 8303) // General Punctuation
        ) {
          validChars++;
          
          // Count Arabic characters specifically to give higher weight
          if ((code >= 1536 && code <= 1791) || code === 1600) {
            arabicChars += 5; // Give extra weight to Arabic characters
          }
        }
      }
      
      const validPercent = ((validChars + arabicChars) / decoded.length) * 100;
      
      console.log(`Encoding ${encoding}: Score ${validPercent.toFixed(2)}%, Valid chars: ${validChars}, Arabic chars: ${arabicChars/5}`);
      
      if (validPercent > bestScore) {
        bestScore = validPercent;
        bestEncoding = encoding;
      }
    } catch (error) {
      console.log(`Error with encoding ${encoding}:`, error.message);
      // Skip this encoding if it fails
      continue;
    }
  }
  
  return bestEncoding;
}

function ensureEncoding(buffer, targetEncoding = 'utf8') {
  // Detect the encoding
  const detectedEncoding = detectEncoding(buffer);
  
  // If the file is already in the target encoding, return it as is
  if (detectedEncoding === targetEncoding) {
    return buffer;
  }
  
  // Convert the file to the target encoding
  const decoded = iconv.decode(buffer, detectedEncoding);
  return iconv.encode(decoded, targetEncoding);
}

// Input and output file paths
const INPUT_FILE = './attached_assets/customers-2025-03-13.csv';
const OUTPUT_FILE = './customers-2025-03-13-utf8.csv';

async function processCustomerFile() {
  try {
    console.log(`Processing ${INPUT_FILE}...`);
    
    // Read the file as a buffer to preserve encoding
    const fileBuffer = fs.readFileSync(INPUT_FILE);
    
    // Detect the encoding
    const detectedEncoding = detectEncoding(fileBuffer);
    console.log(`Detected encoding: ${detectedEncoding}`);
    
    // Convert to UTF-8
    const convertedBuffer = ensureEncoding(fileBuffer, 'utf8');
    const fileContent = convertedBuffer.toString('utf8');
    
    // Parse the CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Parsed ${records.length} customer records`);
    
    // Log column names to identify Arabic name field
    console.log("Column names in CSV:", Object.keys(records[0]));
    
    // Add special handling for Arabic names
    const processedRecords = records.map((record, index) => {
      // Debug first few records to see structure
      if (index < 3) {
        console.log(`Record ${index}:`, record);
      }
      
      // Check all fields that might contain Arabic names 
      // (looking for fields like 'arabic_name', 'name_ar', etc.)
      const possibleArabicFields = ['arabic_name', 'name_ar', 'ar_name', 'arabicName', 'arabic', 'الاسم'];
      
      for (const field of possibleArabicFields) {
        if (record[field]) {
          console.log(`Found Arabic name in field ${field}: ${record[field]}`);
          // Normalize Unicode combining characters
          record[field] = record[field].normalize('NFC');
          
          // Add RTL markers for proper display
          record[field] = '\u202B' + record[field] + '\u202C';
        }
      }
      
      // If no specific Arabic field found but name looks like it contains Arabic
      if (record.name && /[\u0600-\u06FF]/.test(record.name)) {
        console.log(`Found Arabic characters in name field: ${record.name}`);
        record.name = record.name.normalize('NFC');
        record.name = '\u202B' + record.name + '\u202C';
      }
      
      return record;
    });
    
    // Convert back to CSV
    const csvOutput = stringify(processedRecords, {
      header: true
    });
    
    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    
    // Write to file with UTF-8 encoding and BOM
    fs.writeFileSync(OUTPUT_FILE, BOM + csvOutput, 'utf8');
    
    console.log(`Successfully converted file to UTF-8 and saved to ${OUTPUT_FILE}`);
    console.log(`Total records processed: ${processedRecords.length}`);
    
    // Print sample of the first few records to verify
    console.log('\nSample of processed records:');
    console.log(processedRecords.slice(0, 3));
    
  } catch (error) {
    console.error('Error processing customer file:', error);
  }
}

// Run the processing function
processCustomerFile();