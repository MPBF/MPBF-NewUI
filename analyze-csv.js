import fs from 'fs';
import iconv from 'iconv-lite';

// Analyze the first few bytes of the CSV file to try and detect the encoding
const filePath = 'attached_assets/customers-2025-03-13.csv';

try {
  // Read the file as a buffer
  const buffer = fs.readFileSync(filePath);
  
  console.log(`File size: ${buffer.length} bytes`);
  console.log('First 40 bytes as hex:');
  console.log(buffer.slice(0, 40).toString('hex').match(/.{1,2}/g).join(' '));
  
  // Try to detect the encoding by looking at common encoding signatures
  const hasBOM = buffer.length >= 3 && 
    buffer[0] === 0xEF && 
    buffer[1] === 0xBB && 
    buffer[2] === 0xBF;
  
  if (hasBOM) {
    console.log("File has UTF-8 BOM signature");
  }
  
  // Try different encodings
  const encodingsToTry = [
    'utf8',
    'windows-1256',  // Arabic Windows
    'ISO-8859-6',    // Arabic ISO
    'cp1256',        // Arabic code page
    'utf16le',
    'windows-1252',  // Western European Windows
    'ISO-8859-1'     // Western European ISO
  ];
  
  for (const encoding of encodingsToTry) {
    try {
      const decoded = iconv.decode(buffer.slice(0, 200), encoding);
      console.log(`\nSample with ${encoding}:`);
      console.log(decoded);
    } catch (err) {
      console.log(`Error decoding with ${encoding}: ${err.message}`);
    }
  }
  
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
}
