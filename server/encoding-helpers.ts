import iconv from 'iconv-lite';

/**
 * List of encodings to try when auto-detecting file encoding
 * In order of likelihood for Arabic content
 */
export const COMMON_ENCODINGS = [
  'utf8',
  'windows-1256', // Arabic Windows
  'cp1256',       // Arabic code page
  'ISO-8859-6',   // Arabic ISO
  'utf16le',
  'windows-1252', // Western European Windows
  'ISO-8859-1'    // Western European ISO
];

/**
 * Detect the most likely encoding of a buffer by trying different encodings
 * and scoring the results based on valid character percentages
 * 
 * @param buffer The buffer to analyze
 * @returns The detected encoding
 */
export function detectEncoding(buffer: Buffer): string {
  let bestEncoding = 'utf8'; // Default to UTF-8
  let bestScore = 0;
  
  for (const encoding of COMMON_ENCODINGS) {
    try {
      const decoded = iconv.decode(buffer.slice(0, 1000), encoding);
      
      // Calculate a score for this encoding based on valid character percentage
      let validChars = 0;
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
        }
      }
      
      const validPercent = (validChars / decoded.length) * 100;
      
      if (validPercent > bestScore) {
        bestScore = validPercent;
        bestEncoding = encoding;
      }
    } catch (error) {
      // Skip this encoding if it fails
      continue;
    }
  }
  
  return bestEncoding;
}

/**
 * Convert a buffer from one encoding to another
 * 
 * @param buffer The buffer to convert
 * @param fromEncoding The source encoding
 * @param toEncoding The target encoding
 * @returns A buffer in the target encoding
 */
export function convertEncoding(
  buffer: Buffer, 
  fromEncoding: string, 
  toEncoding: string = 'utf8'
): Buffer {
  // First decode from source encoding
  const decoded = iconv.decode(buffer, fromEncoding);
  
  // Then encode to target encoding
  return iconv.encode(decoded, toEncoding);
}

/**
 * Process a file buffer automatically detecting and converting encoding if needed
 * 
 * @param buffer The file buffer
 * @param targetEncoding The desired output encoding (default: utf8)
 * @returns A buffer in the target encoding
 */
export function ensureEncoding(buffer: Buffer, targetEncoding: string = 'utf8'): Buffer {
  // Detect the encoding
  const detectedEncoding = detectEncoding(buffer);
  
  // If the file is already in the target encoding, return it as is
  if (detectedEncoding === targetEncoding) {
    return buffer;
  }
  
  // Convert the file to the target encoding
  return convertEncoding(buffer, detectedEncoding, targetEncoding);
}