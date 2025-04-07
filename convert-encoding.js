import fs from 'fs';
import iconv from 'iconv-lite';
import path from 'path';

// Get command line arguments
const inputFile = process.argv[2];
const fromEncoding = process.argv[3];
const toEncoding = process.argv[4] || 'utf8';

if (!inputFile || !fromEncoding) {
  console.error('Usage: node convert-encoding.js <input-file> <from-encoding> [to-encoding]');
  console.error('Example: node convert-encoding.js customers.csv windows-1256 utf8');
  process.exit(1);
}

// Generate output filename - add encoding to filename
const ext = path.extname(inputFile);
const baseName = path.basename(inputFile, ext);
const outputFile = `${baseName}-${toEncoding}${ext}`;

try {
  // Read the file as a buffer
  const buffer = fs.readFileSync(inputFile);
  
  // Convert from the source encoding to the target encoding
  console.log(`Converting ${inputFile} from ${fromEncoding} to ${toEncoding}...`);
  
  // First decode from source encoding
  const decoded = iconv.decode(buffer, fromEncoding);
  
  // Then encode to target encoding
  const converted = iconv.encode(decoded, toEncoding);
  
  // Write the converted content to the new file
  fs.writeFileSync(outputFile, converted);
  
  console.log(`Conversion complete! Output saved to: ${outputFile}`);
  
  // Show a sample of the converted text
  console.log('\nSample of converted text:');
  const sample = iconv.decode(converted.slice(0, 200), toEncoding);
  console.log(sample);
  
} catch (err) {
  console.error(`Error during conversion: ${err.message}`);
  process.exit(1);
}