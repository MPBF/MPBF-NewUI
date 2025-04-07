import fs from 'fs';
import iconv from 'iconv-lite';

// Path to the file to check
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path as an argument');
  process.exit(1);
}

// List of encodings to try, in order of likelihood
const encodingsToTry = [
  'utf8',
  'windows-1256',  // Arabic Windows
  'ISO-8859-6',    // Arabic ISO
  'cp1256',        // Arabic code page
  'utf16le',
  'windows-1252',  // Western European Windows
  'ISO-8859-1'     // Western European ISO
];

// Read the file as a buffer
try {
  const buffer = fs.readFileSync(filePath);
  
  console.log(`File size: ${buffer.length} bytes`);
  console.log('First 100 bytes as hex:');
  console.log(buffer.slice(0, 100).toString('hex').match(/.{1,2}/g).join(' '));
  
  // Try to detect the encoding by attempting to decode with each encoding
  console.log('\nAttempting to detect encoding...');
  
  let bestEncoding = null;
  let bestScore = 0;
  
  for (const encoding of encodingsToTry) {
    try {
      const decoded = iconv.decode(buffer, encoding);
      
      // Calculate a score for this encoding based on valid character percentage
      let validChars = 0;
      for (let i = 0; i < decoded.length; i++) {
        const code = decoded.charCodeAt(i);
        // Check for common characters (ASCII, Arabic ranges, etc.)
        if (
          (code >= 32 && code <= 126) || // Basic Latin
          (code >= 1536 && code <= 1791) || // Arabic
          (code >= 8192 && code <= 8303) // General Punctuation
        ) {
          validChars++;
        }
      }
      
      const validPercent = (validChars / decoded.length) * 100;
      console.log(`${encoding}: ${validPercent.toFixed(2)}% valid characters`);
      
      // Show a sample of text in this encoding
      console.log(`Sample (${encoding}): ${decoded.slice(0, 100)}`);
      
      if (validPercent > bestScore) {
        bestScore = validPercent;
        bestEncoding = encoding;
      }
    } catch (err) {
      console.log(`${encoding}: Failed to decode`);
    }
  }
  
  console.log(`\nBest encoding guess: ${bestEncoding} (${bestScore.toFixed(2)}% valid characters)`);
  
  // Ask if the user wants to convert to UTF-8
  console.log('\nTo convert this file to UTF-8, run:');
  console.log(`node convert-encoding.js "${filePath}" ${bestEncoding} utf8`);
  
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
  process.exit(1);
}