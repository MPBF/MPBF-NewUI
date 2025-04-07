import fs from 'fs';
import iconv from 'iconv-lite';
import path from 'path';

// Convert the customers CSV from windows-1256 to UTF-8
const inputFile = 'attached_assets/customers-2025-03-13.csv';
const fromEncoding = 'windows-1256';
const toEncoding = 'utf8';

// Generate output filename
const ext = path.extname(inputFile);
const baseName = path.basename(inputFile, ext);
const outputFile = `${baseName}-utf8${ext}`;

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
  console.log('\nSample of converted text (first 5 lines):');
  const lines = decoded.split('\n').slice(0, 5);
  lines.forEach(line => console.log(line));
  
} catch (err) {
  console.error(`Error during conversion: ${err.message}`);
}
