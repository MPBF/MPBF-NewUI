/**
 * Utility functions for handling Arabic text in different contexts
 */

// Normalize and encode Arabic text to handle Unicode properly
export const normalizeArabicText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  try {
    // Normalize Unicode to ensure consistent representation
    // NFC is Normalization Form Canonical Composition - good for Arabic
    return text.normalize('NFC');
  } catch (error) {
    console.error('Error normalizing Arabic text:', error);
    return text || '';
  }
};

// Reverse Arabic text if needed (for PDFs)
export const reverseArabicText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  // Check if text contains Arabic characters (including extended Arabic ranges)
  const containsArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  
  if (containsArabic) {
    // Split to characters, reverse, and join back
    return text.split('').reverse().join('');
  }
  
  return text;
};

// Remove diacritics from Arabic text
export const removeDiacritics = (text: string | null | undefined): string => {
  if (!text) return '';
  
  // Remove Arabic diacritics that might cause issues in PDFs
  // Includes all Arabic diacritical marks
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]|[\u08D4-\u08FF]/g, '');
};

// Clean Arabic text for PDF display
export const prepareArabicForPdf = (text: string | null | undefined): string => {
  if (!text) return '';
  
  try {
    // First normalize the text for consistent Unicode representation
    const normalized = normalizeArabicText(text);
    
    // Then clean and prepare the text
    const cleaned = removeDiacritics(normalized);
    
    // For PDFs we'll reverse the text to accommodate the right-to-left rendering
    // This helps with proper display in PDF documents
    const reversed = reverseArabicText(cleaned);
    return reversed;
  } catch (error) {
    console.error('Error preparing Arabic text for PDF:', error);
    return text || '';
  }
};

// Get proper HTML direction for text
export const getTextDirection = (text: string | null | undefined): 'rtl' | 'ltr' => {
  if (!text) return 'ltr';
  
  // Check if text contains Arabic characters (using expanded Arabic Unicode ranges)
  const containsArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  
  return containsArabic ? 'rtl' : 'ltr';
};

// Decode potentially double-encoded Arabic text
export const decodeArabicText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  try {
    // Attempt to fix incorrectly encoded Arabic text
    // This handles cases where text might have been double-encoded
    
    // First normalize the text
    let result = normalizeArabicText(text);
    
    // Check if it appears to be a garbled UTF-8 string
    // This is a common issue when UTF-8 is interpreted as another encoding
    if (/\\u/.test(result)) {
      try {
        // Try to decode JSON-style Unicode escape sequences
        result = JSON.parse(`"${result.replace(/"/g, '\\"')}"`);
      } catch (e) {
        // If that fails, leave as is
      }
    }
    
    // Try to handle Windows-1256 encoded content appearing as UTF-8
    // This often happens with Arabic text
    if (/[\u00c7-\u00ef]/.test(result) && !/[\u0600-\u06FF]/.test(result)) {
      try {
        // Attempt conversion from common encoding mistakes
        const bytes = [];
        for (let i = 0; i < result.length; i++) {
          bytes.push(result.charCodeAt(i));
        }
        const buffer = new Uint8Array(bytes);
        // Try to interpret as Windows-1256
        result = new TextDecoder('windows-1256').decode(buffer);
      } catch (e) {
        console.error('Failed to convert potential Windows-1256 content:', e);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error decoding Arabic text:', error);
    return text || '';
  }
};

// Format Arabic text for display in HTML with proper RTL and other considerations
export const formatArabicForDisplay = (text: string | null | undefined): string => {
  if (!text) return '';
  
  // Apply all needed transformations in the right order
  const normalized = normalizeArabicText(text);
  const decoded = decodeArabicText(normalized);
  
  // Add bidirectional isolation markers for mixed text environments
  return `\u2067${decoded}\u2069`;
};