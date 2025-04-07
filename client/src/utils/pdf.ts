import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Base64 encoded Amiri font for Arabic text support
// This is a subset of the Amiri font that works well with jsPDF
const amiriFontBase64 = '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rgGvAbABsQGyAbMBtAG1AbYBtwG4AbkBugG7AbwBvQG+Ab8BwAHBAcIBwwHEAcUBxgHHAcgByQHKAcsBzAHNAc4BzwHQAdEB0gHTAdQB1QHWAdcB2AHZAdoB2wHcAd0B3gHfAeAB4QHiAeMB5AHlAeYB5wHoAekB6gHrAewB7QHuAe8B8AHxAfIB8wH0AfUB9gH3AfgB+QH6AfsB/AH9Af4B/wIAAgECAgIDAgQCBQIGAgcCCAIJAgoCCwIMAg0CDgIPAhACEQISAhMCFAIVAhYCFwIYAhkCGgIbAhwCHQIeAh8CIAIhAiICIwIkAiUCJgInAigCKQIqAisCLAItAi4CLwIwAjECMgIzAjQCNQI2AjcCOAI5AjoCOwI8Aj0CPgI/AkACQQJCAkMCRAJFAkYCRwJIAkkCSgJLAkwCTQJOAk8CUAJRAlICUwJUAlUCVgJXAlgCWQJaAlsCXAJdAl4CXwJgAmECYgJjAmQCZQJmAmcCaAJpAmoCawJsAm0CbgJvAnACcQJyAnMCdAJ1AnYCdwJ4AnkCegJ7AnwCfQJ+An8CgAKBAoICgwKEAoUChgKHAogCiQKKAosCjAKNAo4CjwKQApECkgKTApQClQKWApcCmAKZApoCmwKcAp0CngKfAqACoQKiAqMCpAKlAqYCpwKoAqkCqgKrAqwCrQKuAq8CsAKxArICswK0ArUCtgK3ArgCuQK6ArsCvAK9Ar4CvwLAAsECwgLDAsQCxQLGAscCyALJAsoCywLMAs0CzgLPAtAC0QLSAtMC1ALVAtYC1wLYAtkC2gLbAtwC3QLeAt8C4ALhAuIC4wLkAuUC5gLnAugC6QLqAusC7ALtAu4C7wLwAvEC8gLzAvQC9QL2AvcC+AL5AvoC+wL8Av0C/gL/AwADAQMCAwMDBAMFAwYDBwMIAwkDCgMLAwwDDQMOAw8DEAMRAxIDEwMUAxUDFgMXAxgDGQMaAxsDHAMdAx4DHwMgAyEDIgMjAyQDJQMmAycDKAMpAyoDKwMsAy0DLgMvAzADMQMyAzMDNAM1AzYDNwM4AzkDOgM7AzwDPQM+Az8DQANBA0IDQwNEA0UDRgNHA0gDSQNKA0sDTANNA04DTwNQA1EDUgNTA1QDVQNWA1cDWANZA1oDWwNcA10DXgNfA2ADYQNiA2MDZANlA2YDZwNoA2kDagNrA2wDbQNuA28DcANxA3IDcwN0A3UDdgN3A3gDeQN6A3sDfAN9A34DfwOAA4EDggODA4QDhQOGA4cDiAOJA4oDiwOMA40DjkDwAUcAcgBiAHAAMgASAHMAawBjACcAXQAPACQAEwATAD8ARgBmACQAJQAUADwAQwA/ACUAIgAjAE8APABGACsAKgBbAFwALQAtAC4ALgBDAFMAUwBDAFMAUwBDAFMAUwBDAE8ATwBOAE4ATgBOAAAAJAAAAAUAAAArAAAAAQAAAAQAAAAnAAAALQAAAAsAAAAfAAAAAQAAAC0AAAAoAAAAHAAAAA4AAAAMAAAADgAAACgAAAAtAAAAKAAAACsAAAAFAAAAKwAAADIAAAAEAAAALQAAAAMAAAAAAAAAAAAAAAAAAAABAAgBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAEVARYBFwEYARkBGgEbARwBHQEeAR8BIAEhASIBIwEkASUBJgEnASgBKQEqASsBLAEtAS4BLwEwATEBMgEzATQBNQE2ATcBOAE5AToBOwE8AT0BPgE/AUABQQFCAUMBRAFFAUYBRwFIAUkBSgFLAUwBTQFOAU8BUAFRAVIBUwFUAVUBVgFXAVgBWQFaAVsBXAFdAV4BXwFgAWEBYgFjAWQBZQFmAWcBaAFpAWoBawFsAW0BbgFvAXABcQFyAXMBdAF1AXYBdwF4AXkBegF7AXwBfQF+AX8BgAGBAYIBgwGEAYUBhgGHAYgBiQGKAYsBjAGNAY4BjwGQAZEBkgGTAZQBlQGWAZcBmAGZAZoBmwGcAZ0BngGfAaABoQGiAaMBpAGlAaYBpwGoAakBqgGrAawBrQGuAa8BsAGxAbIBswG0AbUBtgG3AbgBuQG6AbsBvAG9Ab4BvwHAAcEBwgHDAcQBxQHGAccByAHJAcoBywHMAc0BzgHPAdAB0QHSAdMB1AHVAdYB1wHYAdkB2gHbAdwB3QHeAd8B4AHhAeIB4wHkAeUB5gHnAegB6QHqAesB7AHtAe4B7wHwAfEB8gHzAfQB9QH2AfcB+AH5AfoB+wH8Af0B/gH/AgACAQICAgMCBAIFAgYCBwIIAgkCCgILAgwCDQIOAg8CEAIRAhICEwIUAhUCFgIXAhgCGQIaAhsCHAIdAh4CHwIgAiECIgIjAiQCJQImAicCKAIpAioCKwIsAi0CLgIvAjACMQIyAjMCNAI1AjYCNwI4AjkCOgI7AjwCPQI+Aj8CQAJBAkICQwJEAkUCRgJHAkgCSQJKAksCTAJNAk4CTwJQAlECUgJTAlQCVQJWAlcCWAJZAloCWwJcAl0CXgJfAmACYQJiAmMCZAJlAmYCZwJoAmkCagJrAmwCbQJuAm8CcAJxAnICcwJ0AnUCdgJ3AngCeQJ6AnsCfAJ9An4CfwKAAoECggKDAoQChQKGAocCiAKJAooCiwKMAo0CjgKPApACkQKSApMClAKVApYClwKYApkCmgKbApwCnQKeAp8CoAKhAqICowKkAqUCpgKnAqgCqQKqAqsCrAKtAq4CrwKwArECsgKzArQCtQK2ArcCuAK5AroCuwK8Ar0CvgK/AsACwQLCAsMCxALFAsYCxwLIAskCygLLAswCzQLOAs8C0ALRAtIC0wLUAtUC1gLXAtgC2QLaAtsCHQAAADcAAAAEAAAAAQAAAAUAAAAEAAAAJQAAACYAAAAtAAAACgAAAA0AAAABAAAANgAAACIAAAAeAAAABAAAAAcAAAAJAAAAIgAAACYAAAAiAAAAJQAAAAUAAAAlAAAANAAAAAgAAAAmAAAAAgAAABQAAAATAQkBCAEEAQUBBgEHATYBBQAtBAABDgEDAQwAAgENAQgBBQEEAQkJBgAAAO0AAAAKBwLk+fT25/j09ef5AgAQAwQCAQACAAEACQAKAAsACwAYAB0AHQAkACQAMAA9AD0AQQBBAEEAQQBBAEEAQQBBAEEAQQBBAEEABgAFAAcABAABAAYABwAFAAABUAAB4KMAAQQAAAEFAAABAgAAAQQAJQAkAAIAAwADAAMAAA==';

/**
 * Helper function to prepare a document with Amiri font for Arabic text
 * @param doc The jsPDF document
 * @returns The document with Amiri font added
 */
const prepareArabicFont = (doc: jsPDF): jsPDF => {
  doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  return doc;
};

/**
 * Helper function to render Arabic text properly
 * @param doc The jsPDF document
 * @param text The Arabic text to render
 * @param x X position
 * @param y Y position
 * @param options Text options
 */
const renderArabicText = (doc: jsPDF, text: string, x: number, y: number, options: any = {}): void => {
  // Save current font settings
  const originalFont = doc.getFont();
  
  // Set Amiri font for Arabic text
  doc.setFont('Amiri', 'normal');
  
  // Create a cleaned options object without unsupported properties
  const { langCode, isInputRtl, isOutputRtl, ...cleanedOptions } = options;
  
  // Render the text with right alignment
  doc.text(text, x, y, { 
    align: options.align || 'right',
    ...cleanedOptions
  });
  
  // Restore original font
  doc.setFont(originalFont.fontName, originalFont.fontStyle);
};

interface PdfOptions {
  title: string;
  subtitle?: string;
  filterInfo?: string;
  dateRange?: string;
  columns: string[];
  data: any[][];
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
}

/**
 * Generate a PDF report
 */
export const generatePdf = ({
  title,
  subtitle = '',
  filterInfo = '',
  dateRange = '',
  columns,
  data,
  orientation = 'portrait',
  pageSize = 'a4',
}: PdfOptions): void => {
  try {
    // Create new PDF document
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize,
    });
    
    // Add the company logo (base64 embedded to avoid path issues)
    // We're using a try-catch block to handle any logo loading errors
    try {
      // Try to load the logo from public folder first
      doc.addImage('/FactoryLogoHPNGWg.png', 'PNG', 10, 10, 15, 15);
    } catch (error) {
      console.log('Error loading logo from file, using fallback text:', error);
      // If there's an error loading the image, just show text instead
      doc.setTextColor(51, 75, 115);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('MPBF', 10, 15);
    }
    
    // Add company name with logo
    doc.setTextColor(51, 75, 115);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MODERN PLASTIC BAG FACTORY', 30, 15);
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 30);
    
    // Set start Y position after logo and title
    let startY = 40;
    
    // Add subtitle if provided
    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, 14, startY);
      startY += 8;
      
      // Add filter info if provided
      if (filterInfo) {
        doc.setFontSize(10);
        doc.text(`Filter: ${filterInfo}`, 14, startY);
        startY += 6;
      }
      
      // Add date range if provided
      if (dateRange) {
        doc.setFontSize(10);
        doc.text(`Date Range: ${dateRange}`, 14, startY);
        startY += 10;
      }
    }
    
    // Generate table with improved styling to match order PDFs
    autoTable(doc, {
      head: [columns],
      body: data,
      startY: startY,
      styles: { 
        fontSize: 9, 
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        fontStyle: 'bold',
        halign: 'center'
      },
      headStyles: { 
        fillColor: [51, 75, 115], 
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [240, 245, 250] },
      margin: { top: 10 },
    });
    
    // Add page numbers
    const pageCount = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 10
      );
      
      // Add timestamp to footer
      const timestamp = `Generated on: ${new Date().toLocaleString()}`;
      doc.text(
        timestamp,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
    
    // Save the PDF
    const filename = `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate a simple PDF with a table
 */
export const generateSimplePdf = (
  title: string,
  headers: string[],
  data: any[][]
): void => {
  generatePdf({
    title,
    columns: headers,
    data,
  });
};

/**
 * Generate a PDF for an order with job orders
 */
export interface OrderPdfData {
  orderId: number;
  orderDate: Date;
  customerName: string;
  customerArabicName?: string; // Added Arabic name field
  customerDrawerNo?: string; // Added drawer number
  notes?: string;
  jobOrders: {
    pcid?: string;
    category: string;
    product: string;
    size_details?: string;
    thickness?: number;
    cylinder_inch?: number;
    cutting_length_cm?: number;
    raw_material?: string;
    mast_batch?: string;
    is_printed?: boolean;
    cutting_unit?: string;
    unit_weight_kg?: number;
    packing?: string;
    punching?: string;
    cover?: string;
    notes?: string;
    quantity: number;
  }[];
}

// Ultra-minimal version for testing PDF generation
export const generateSimpleOrderPdf = (orderData: OrderPdfData): void => {
  try {
    console.log("Ultra-minimal PDF generation started");
    
    // Create the most basic PDF document possible
    const doc = new jsPDF();
    
    // Only add text - no images, no styling, no tables
    doc.setFontSize(14);
    doc.text("Basic PDF Test", 10, 10);
    doc.text(`Order #${orderData.orderId}`, 10, 20);
    doc.text(`Date: ${format(new Date(), 'yyyy-MM-dd')}`, 10, 30);
    
    // No tables, no fancy styling - just plain text
    doc.text("This is a test PDF document with minimal features.", 10, 40);
    doc.text("If this works, we can add more features one by one.", 10, 50);
    
    // No autotable usage, no external assets
    
    // Save with a timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const filename = `test-pdf-${timestamp}.pdf`;
    
    console.log(`Attempting to save basic PDF as ${filename}`);
    doc.save(filename);
    console.log("Basic PDF saved successfully");
  } catch (error) {
    console.error("Error generating basic PDF:", error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

/**
 * Generate an order PDF that matches exactly the specified template
 * This version creates a PDF that looks exactly like the provided template
 * with proper Arabic text support using Amiri font
 */
export const generateExactOrderPdf = (orderData: OrderPdfData): void => {
  try {
    console.log("Generating order PDF with data:", JSON.stringify(orderData, null, 2));
    
    // Create new PDF document with landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Add Amiri font for Arabic text
    // This is a Google Fonts-hosted Arabic font that works well with jsPDF
    const amiriFontBase64 = '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rgGvAbABsQGyAbMBtAG1AbYBtwG4AbkBugG7AbwBvQG+Ab8BwAHBAcIBwwHEAcUBxgHHAcgByQHKAcsBzAHNAc4BzwHQAdEB0gHTAdQB1QHWAdcB2AHZAdoB2wHcAd0B3gHfAeAB4QHiAeMB5AHlAeYB5wHoAekB6gHrAewB7QHuAe8B8AHxAfIB8wH0AfUB9gH3AfgB+QH6AfsB/AH9Af4B/wIAAgECAgIDAgQCBQIGAgcCCAIJAgoCCwIMAg0CDgIPAhACEQISAhMCFAIVAhYCFwIYAhkCGgIbAhwCHQIeAh8CIAIhAiICIwIkAiUCJgInAigCKQIqAisCLAItAi4CLwIwAjECMgIzAjQCNQI2AjcCOAI5AjoCOwI8Aj0CPgI/AkACQQJCAkMCRAJFAkYCRwJIAkkCSgJLAkwCTQJOAk8CUAJRAlICUwJUAlUCVgJXAlgCWQJaAlsCXAJdAl4CXwJgAmECYgJjAmQCZQJmAmcCaAJpAmoCawJsAm0CbgJvAnACcQJyAnMCdAJ1AnYCdwJ4AnkCegJ7AnwCfQJ+An8CgAKBAoICgwKEAoUChgKHAogCiQKKAosCjAKNAo4CjwKQApECkgKTApQClQKWApcCmAKZApoCmwKcAp0CngKfAqACoQKiAqMCpAKlAqYCpwKoAqkCqgKrAqwCrQKuAq8CsAKxArICswK0ArUCtgK3ArgCuQK6ArsCvAK9Ar4CvwLAAsECwgLDAsQCxQLGAscCyALJAsoCywLMAs0CzgLPAtAC0QLSAtMC1ALVAtYC1wLYAtkC2gLbAtwC3QLeAt8C4ALhAuIC4wLkAuUC5gLnAugC6QLqAusC7ALtAu4C7wLwAvEC8gLzAvQC9QL2AvcC+AL5AvoC+wL8Av0C/gL/AwADAQMCAwMDBAMFAwYDBwMIAwkDCgMLAwwDDQMOAw8DEAMRAxIDEwMUAxUDFgMXAxgDGQMaAxsDHAMdAx4DHwMgAyEDIgMjAyQDJQMmAycDKAMpAyoDKwMsAy0DLgMvAzADMQMyAzMDNAM1AzYDNwM4AzkDOgM7AzwDPQM+Az8DQANBA0IDQwNEA0UDRgNHA0gDSQNKA0sDTANNA04DTwNQA1EDUgNTA1QDVQNWA1cDWANZA1oDWwNcA10DXgNfA2ADYQNiA2MDZANlA2YDZwNoA2kDagNrA2wDbQNuA28DcANxA3IDcwN0A3UDdgN3A3gDeQN6A3sDfAN9A34DfwOAA4EDggODA4QDhQOGA4cDiAOJA4oDiwOMA40DjkDwAUcAcgBiAHAAMgASAHMAawBjACcAXQAPACQAEwATAD8ARgBmACQAJQAUADwAQwA/ACUAIgAjAE8APABGACsAKgBbAFwALQAtAC4ALgBDAFMAUwBDAFMAUwBDAFMAUwBDAE8ATwBOAE4ATgBOAAAAJAAAAAUAAAArAAAAAQAAAAQAAAAnAAAALQAAAAsAAAAfAAAAAQAAAC0AAAAoAAAAHAAAAA4AAAAMAAAADgAAACgAAAAtAAAAKAAAACsAAAAFAAAAKwAAADIAAAAEAAAALQAAAAMAAAAAAAAAAAAAAAAAAAABAAgBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAEVARYBFwEYARkBGgEbARwBHQEeAR8BIAEhASIBIwEkASUBJgEnASgBKQEqASsBLAEtAS4BLwEwATEBMgEzATQBNQE2ATcBOAE5AToBOwE8AT0BPgE/AUABQQFCAUMBRAFFAUYBRwFIAUkBSgFLAUwBTQFOAU8BUAFRAVIBUwFUAVUBVgFXAVgBWQFaAVsBXAFdAV4BXwFgAWEBYgFjAWQBZQFmAWcBaAFpAWoBawFsAW0BbgFvAXABcQFyAXMBdAF1AXYBdwF4AXkBegF7AXwBfQF+AX8BgAGBAYIBgwGEAYUBhgGHAYgBiQGKAYsBjAGNAY4BjwGQAZEBkgGTAZQBlQGWAZcBmAGZAZoBmwGcAZ0BngGfAaABoQGiAaMBpAGlAaYBpwGoAakBqgGrAawBrQGuAa8BsAGxAbIBswG0AbUBtgG3AbgBuQG6AbsBvAG9Ab4BvwHAAcEBwgHDAcQBxQHGAccByAHJAcoBywHMAc0BzgHPAdAB0QHSAdMB1AHVAdYB1wHYAdkB2gHbAdwB3QHeAd8B4AHhAeIB4wHkAeUB5gHnAegB6QHqAesB7AHtAe4B7wHwAfEB8gHzAfQB9QH2AfcB+AH5AfoB+wH8Af0B/gH/AgACAQICAgMCBAIFAgYCBwIIAgkCCgILAgwCDQIOAg8CEAIRAhICEwIUAhUCFgIXAhgCGQIaAhsCHAIdAh4CHwIgAiECIgIjAiQCJQImAicCKAIpAioCKwIsAi0CLgIvAjACMQIyAjMCNAI1AjYCNwI4AjkCOgI7AjwCPQI+Aj8CQAJBAkICQwJEAkUCRgJHAkgCSQJKAksCTAJNAk4CTwJQAlECUgJTAlQCVQJWAlcCWAJZAloCWwJcAl0CXgJfAmACYQJiAmMCZAJlAmYCZwJoAmkCagJrAmwCbQJuAm8CcAJxAnICcwJ0AnUCdgJ3AngCeQJ6AnsCfAJ9An4CfwKAAoECggKDAoQChQKGAocCiAKJAooCiwKMAo0CjgKPApACkQKSApMClAKVApYClwKYApkCmgKbApwCnQKeAp8CoAKhAqICowKkAqUCpgKnAqgCqQKqAqsCrAKtAq4CrwKwArECsgKzArQCtQK2ArcCuAK5AroCuwK8Ar0CvgK/AsACwQLCAsMCxALFAsYCxwLIAskCygLLAswCzQLOAs8C0ALRAtIC0wLUAtUC1gLXAtgC2QLaAtsCHQAAADcAAAAEAAAAAQAAAAUAAAAEAAAAJQAAACYAAAAtAAAACgAAAA0AAAABAAAANgAAACIAAAAeAAAABAAAAAcAAAAJAAAAIgAAACYAAAAiAAAAJQAAAAUAAAAlAAAANAAAAAgAAAAmAAAAAgAAABQAAAATAQkBCAEEAQUBBgEHATYBBQAtBAABDgEDAQwAAgENAQgBBQEEAQkJBgAAAO0AAAAKBwLk+fT25/j09ef5AgAQAwQCAQACAAEACQAKAAsACwAYAB0AHQAkACQAMAA9AD0AQQBBAEEAQQBBAEEAQQBBAEEAQQBBAEEABgAFAAcABAABAAYABwAFAAABUAAB4KMAAQQAAAEFAAABAgAAAQQAJQAkAAIAAwADAAMAAA==';
    
    // Add the Amiri font to the PDF
    doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    
    // Set fonts and sizes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    
    // Title centered at the top
    doc.text('MODERN PLASTIC BAG FACTORY', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    // Contact info aligned to the right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const rightSide = doc.internal.pageSize.getWidth() - 20;
    doc.text('Phone: +966 532044751', rightSide, 25, { align: 'right' });
    doc.text('Email: modplast83@gmail.com', rightSide, 30, { align: 'right' });
    doc.text('Address: Dammam - 3865-7760', rightSide, 35, { align: 'right' });
    
    // Order title with box around it
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PRODUCTION ORDER', rightSide, 45, { align: 'right' });
    
    // Order details - left aligned in the middle section
    const leftSide = 20;
    doc.setFontSize(10);
    
    // Add lines above and below order details
    doc.line(leftSide, 55, rightSide, 55);
    
    // Order number and date (spaced apart on same line)
    doc.text('Order #', leftSide, 65);
    doc.text(orderData.orderId.toString(), leftSide + 40, 65);
    doc.text('Date', rightSide - 40, 65);
    doc.text(format(new Date(orderData.orderDate), 'MMM d, yyyy'), rightSide, 65);
    
    // Customer info
    doc.text('Customer', leftSide, 75);
    doc.text(orderData.customerName, leftSide + 40, 75);
    
    // Arabic customer name if available - right aligned 
    if (orderData.customerArabicName) {
      doc.text('Arabic', rightSide - 40, 75);
      
      // Set Amiri font for Arabic text
      doc.setFont('Amiri', 'normal');
      doc.text(orderData.customerArabicName, rightSide, 75, { 
        align: 'right',
        isInputRtl: true, 
        isOutputRtl: true
      });
      
      // Reset font back to default
      doc.setFont('helvetica', 'normal');
    }
    
    // Drawer number if available
    if (orderData.customerDrawerNo) {
      doc.text('Drawer No:', leftSide, 85);
      doc.text(orderData.customerDrawerNo, leftSide + 40, 85);
    }
    
    // Line above job orders section
    doc.line(leftSide, 95, rightSide, 95);
    
    // Title for job orders
    doc.setFontSize(12);
    doc.text('Job Orders', leftSide, 105);
    
    // Table for job orders
    const tableColumns = [
      'PCID', 'Category', 'Product', 'Size', 'Thickness', 'Cylinder Inch', 'Cutting Length', 
      'Master Batch', 'Printed', 'Raw Material', 'Unit Weight', 'Packing', 'Quantity'
    ];
    
    // Prepare job orders data for table
    const tableData = orderData.jobOrders.map(job => [
      job.pcid || '',
      job.category,
      job.product,
      job.size_details || '',
      job.thickness || '',
      job.cylinder_inch || '0',
      job.cutting_length_cm || '0',
      job.mast_batch || '',
      typeof job.is_printed === 'boolean' ? (job.is_printed ? 'Yes' : 'No') : (job.is_printed === 'Yes' ? 'Yes' : 'No'),
      job.raw_material || '',
      job.unit_weight_kg ? `${job.unit_weight_kg}` : '',
      job.packing || '',
      job.quantity.toString()
    ]);
    
    // Generate table with formatting to match template
    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: 110,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      margin: { left: leftSide, right: 20 }
    });
    
    // Add timestamp at the bottom
    const timestamp = `Generated on: ${format(new Date(), 'M/d/yyyy, h:mm:ss a')}`;
    doc.setFontSize(8);
    doc.text(timestamp, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    
    // Save with formatted filename
    const filename = `Order #${orderData.orderId} - ${format(new Date(orderData.orderDate), 'MMM d, yyyy')}.pdf`;
    doc.save(filename);
    
  } catch (error) {
    console.error('Error generating order PDF:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

// Original complex version
/**
 * Generate a small 3x3 inch printable label for a roll
 */
export interface RollLabelData {
  rollId: string;
  rollNumber: number;
  orderId: number;
  customerName: string;
  customerArabicName?: string | null; // Added Arabic name support
  status: string;
  createdBy: string;
  createdDate: string;
  weight?: string; // Optional weight of the roll (with unit)
}

export const generateRollLabel = async (rollData: RollLabelData): Promise<void> => {
  try {
    console.log('Generating roll label with data:', rollData);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [3, 3] // 3x3 inches
    });

    doc.setFontSize(10);
    
    // Add factory logo as embedded base64 to avoid path issues
    const logoBase64 = 'data:image/png;base64,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';

    // Add the logo to the PDF
    try {
      doc.addImage(logoBase64, 'PNG', 0.2, 0.2, 0.8, 0.6);
    } catch (error) {
      console.error('Error adding logo to PDF', error);
      // Fallback to text if image fails
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MPBF', 0.5, 0.4);
    }
    
    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Roll Label', 1.5, 0.5, { align: 'center' });
    
    // Add divider
    doc.setDrawColor(0);
    doc.setLineWidth(0.01);
    doc.line(0.2, 0.9, 2.8, 0.9);
    
    // Roll information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const startY = 1.2;
    const leftX = 0.2;
    const rightX = 1.0;
    const lineHeight = 0.25;
    
    // Information fields
    doc.text('Roll ID:', leftX, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(rollData.rollId, rightX, startY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Roll #:', leftX, startY + lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.text(rollData.rollNumber.toString(), rightX, startY + lineHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Order:', leftX, startY + lineHeight * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${rollData.orderId}`, rightX, startY + lineHeight * 2);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', leftX, startY + lineHeight * 3);
    doc.setFont('helvetica', 'normal');
    doc.text(rollData.customerName, rightX, startY + lineHeight * 3);
    
    // Add Arabic customer name if available
    if (rollData.customerArabicName) {
      const lineHeightAdjust = 0.18; // Slightly smaller than normal line height
      
      // Prepare document with Arabic font
      prepareArabicFont(doc);
      
      // Render Arabic text with right alignment
      renderArabicText(doc, rollData.customerArabicName, rightX + 1.5, startY + lineHeight * 3 + lineHeightAdjust, { 
        align: 'right'
      });
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', leftX, startY + lineHeight * 4);
    doc.setFont('helvetica', 'normal');
    doc.text(rollData.status, rightX, startY + lineHeight * 4);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Created By:', leftX, startY + lineHeight * 5);
    doc.setFont('helvetica', 'normal');
    doc.text(rollData.createdBy, rightX, startY + lineHeight * 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', leftX, startY + lineHeight * 6);
    doc.setFont('helvetica', 'normal');
    doc.text(rollData.createdDate, rightX, startY + lineHeight * 6);
    
    // Add weight if available
    if (rollData.weight) {
      doc.setFont('helvetica', 'bold');
      doc.text('Weight:', leftX, startY + lineHeight * 7);
      doc.setFont('helvetica', 'normal');
      doc.text(rollData.weight, rightX, startY + lineHeight * 7);
    }
    
    // Generate QR code for the roll ID
    // Import QRCode library dynamically
    try {
      const QRCode = await import('qrcode');
      
      // Create a formatted data string for the QR code
      // Format it according to the defined standard for roll QR codes in qr-validation.ts
      const qrData = `ROLL-${rollData.rollId.replace('ROLL-', '')}`;
      
      // Generate QR code as data URL at higher quality
      const qrDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        scale: 8,
        width: 200
      });
      
      // Position for QR code - right side of label
      const qrX = 1.95;  // Right side position
      const qrY = 1.5;   // Centered vertically
      const qrSize = 1.0; // Size (1 inch)
      
      // Add the QR code image to the PDF
      doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // Add a small note about what the QR code contains
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('Scan for roll details', qrX + qrSize/2, qrY + qrSize + 0.1, { align: 'center' });
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      
      // Fallback - just add text saying "QR Code" if generation fails
      const qrX = 1.95;
      const qrY = 1.5;
      const qrSize = 1.0;
      
      // Draw a box with text as fallback
      doc.setDrawColor(0);
      doc.setFillColor(240, 240, 240);
      doc.rect(qrX, qrY, qrSize, qrSize, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('QR Code', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Generation Failed', qrX + qrSize/2, qrY + qrSize/2 + 0.2, { align: 'center' });
    }
    
    // No footer instruction needed
    
    // Print the document directly instead of saving it
    doc.autoPrint();
    
    // Open in a new window for printing
    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
  } catch (error) {
    console.error('Error generating roll label:', error);
  }
};

export const generateOrderPdf = (orderData: OrderPdfData): void => {
  try {
    console.log("PDF Generation Started");
    
    // Validate input data first
    if (!orderData) {
      throw new Error("Order data is null or undefined");
    }
    
    // Validate essential fields
    if (!orderData.orderId) {
      console.warn("Warning: Order ID is missing");
    }
    
    if (!orderData.orderDate) {
      console.warn("Warning: Order date is missing");
    }
    
    if (!orderData.customerName) {
      console.warn("Warning: Customer name is missing");
    }
    
    if (!orderData.jobOrders || !Array.isArray(orderData.jobOrders) || orderData.jobOrders.length === 0) {
      console.warn("Warning: Job orders array is empty or invalid");
    } else {
      console.log(`Job orders count: ${orderData.jobOrders.length}`);
    }
    
    // Log full data in development environment
    console.log("Order Data:", JSON.stringify(orderData, null, 2));
    
    // Create new PDF document with landscape orientation and smaller margins
    console.log("Creating new jsPDF document...");
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    console.log("jsPDF document created successfully");
    
    // Set smaller margins to fit all columns
    const margin = 5; // Minimum margin
    
    // Add the company logo (base64 embedded to avoid path issues)
    // Use a base64 string for the logo to ensure it works in the PDF
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIEAAACBCAYAAADnoNlQAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAwzSURBVHgB7Z1tTFvXGcefcx0SJxAgC+maNjRJF/qSTaIT0MIqMjFehqiaCo1JI+3UfthWlMWasqKJJlP7ob/2Zdu0tOoXrZPWbVPbomjaoIlIVo0XuqUZTLQfmmTrSteE0BKIU9Z3YgeH++zzzL4xtnPtvRhfO/P/SRj7vvn63HOe85znOYbgfw5+vWEHrSfuBUnsA0HsAiIyGKwKCFc6wWIr+t+EJCQXSHDB/P8SIMwDSWcA0s/JL2+ePz7HsAYBqy38xvNP1lPDfAdI8igQeQ9QsR4E+xOEUYZ0FxD5Y0HpX9JHH7/JsEYBaxj81tB9QlAjQPVHaS0JBTQgMAfSeEd6aPAywypOxYvg7MGRZiJEAMhIHUMVQJokCOlXPj04c5lhFaWiRTD5atALhPuJtPlhhjOk0cOSGHrt+OAkwyqGJoLJowEHSCIoaO39aSJcWpMYBUlfZDibKoHh+GCMoQNDVeCJ4cBTEsheWtBhKNZdDDVQkSI4MjJ0AEgKUwHsoGI4JY0O/JahjaoI+I2GL6gAehmqCkG/2/3lFdtXvyb19q8xFKsI+J2Ln1AL/zir4S2H//Xq4DmGQlVEMDkWHGBEfcfQ95dLDx78HENhlReBiJw7EdzN2upbpN7+RwuVYZUWQT6jgaQRtnjQErXZ1FfWnbR/77vQ9KMftFbN+DkJ/jcxBzd/9w+49ckniULlWDVFQI/8S3qcPjjqvlFqaWY1uOZm0LR/PxC+qKL22vV5mP7VECy+9VbB91aVdQJNBKBHPTGXl2OJwHX7NugeHgZec9NYfeZm6Hj5ZdD29B8RBGk9AUkD0sHGaYZaVoUILtIjn+SrT05OAm9qasqL6FmaDCcnJlI/J3+XvJf8Lfl7pW1pgc6REeA6OpL362p70hf85kiBLOurI2qcHB0K07KV93JpaUk5whMRJIVAj3h3XR2c6e2Fzy1f+eZKBm++9x7MvfkmSB9/rF5sN6l1CnUOsWapqAj43Ys3aQ+nYGwvGQZu7emBA0uX+oVWVnPbffYsaDt1CmKDg4bKRcr7YOnA/Ywcn2dYolJFQM8Cokb+r6W/01H/7rZtMLRnT2Lkr0Y4bRtmduwAZ2cnGO3qSHr/I4LIlxgWqUgRTC64fy8UrP5Jb//nX/oSLLoD1wTRVGtPj/kRQ+DUz36mKwQKIYcl8RjDEhUngqO0O9hXqAxu3AjH9u7VNfyM0hFQiDXB64nPQjFJPyeNNT/IsEDFbR2T8npNKoIyAaSZ7eqCXS++WLKxupZYiF0GorMNNPfRR7D5+nXQa8Nk/2a0v5lhBi3oVpBb1w4+qSeC/LS9Hc50damNf+NGNHEW9Obqra9Cm5EAnRWFx2iAeBPLEFq7VKQINLuC2j17FMvewxGr3uuNBVocGv0K/fz4b1jzx9nIuV+TbuvYy1CCihRB9Gu6gR+Ntm2+fl31qE/itNmRbXxsMlLYaUXi4hhUBM5KhooUgSh2VZHxOIPjsVjKnq8HPRpDzc1ZxnEjZJzTzK5dpp3OaMDK/HJtImkbJYVlL0FzbfZ1PJl6jaTz9YQQm6vfM/EZ0SWGiZ/8uPRGxwpQkSJYfGtwUeeMnza6a1fW5yTDp2fPGi5PEvNjhw4pf+80+XlkXVD2fZIkXTQcKK4QFSkCADELUL6f1A1Y2xKkX20NQO0A1kbgP/5x4m9qzXv7V7+Ch2/elLpSFoN0bZEz/HJQsSKQJKj3m2sJr2Tf/sAD6QWePEe8UeJra6Ht1VdLMjyUmkoVAcXxnbt+B5LUo/dSqOY55/xHj6xt+KklV41Dp05Bc1PTsu912ryc1+g0mD6N5VGQjIqOFHrn9N67lh8aGhoJh8OPdnd3Z4UTJz/Ptcm/T76HH+Xvb7NtgNgDD+r3BroLUyRknbZhH/tRXvXHU9s3P/4Ebm3fDrGTJ5V5/yTJiKK3339f9/3E/v+7RQf41jfw6Ni50g/LpVDRsSPEeA8Mmwsv9u/fPxeLxZRgTWJDyLUBZI/+fEJNzYnnUVG9dOnMMmAzdQSQ3Lts3gx/vftuYGJR+V5yJyCXQ4cOQTwetz0UvSJHETn27A/p35PWfuiKMjo6Onbi7bfLsu/fHPkM+vXb0IYzruwIKU0dHVnCTXc3O1pbQY7Hwf3qq4kVvVJJTwtX+/oo8U+t7Xj0ihwx3OIvTnuL2eGtt95aCofD5aonlg32+NG3G3/jxvbdRRj+4NMSh4oXQe+JxdFgMBj86KOPriQPrv9Gol/4Lf2h17w9H6wLQaTI7lCWQMWLoOHMGQgEAgF//N/j7b3/gBEqBL1FneeBdhVAXqoiUGTHk08+6feNjcF2S23uNXIulbZZdEzfVFW3Ei62QDVTNdPBVbTxydrvO++8M3/w4MFhf3x66X7CJzA1LVACXUkLT0nRkBBYeVSNCLp/9xu1WyDBnNdgBz1PHYJgMNgdPuWxXYzrWgogX6oixIiJXc9CFQP/9ncy/XdCBPaH9pAVvqpwOPzDcDjc/vSrPnhh8m2Iwcps/OdSCYJVD6rGJpAkaeLUfZYLvOVRF6MicHS+Dy5a9p7+/n4vXbDxhkIhHwjPfnCMxnGLuBSlJ4TrDBWuehGgm0A6aK4dEU6cODFJj/zH0g9Gj3hf+pFM85KY/B5xLhVYP2COVdUd4DUmAy/T84UToUPZ1ehtHw+FQj56xGcf8bQbQQfBrWwR7GM2UHUiWEYeIVzq6rqHHuV+egQHdH+pRPfz3bt3+y9evOiLnDukeIuUfQRIXaFDDCtUjQjWTSU2nXJX7Qj0vP+5vr6++9NFkHRJ+bnZI/7FF1/00qNe80knUYYl9QfqJH+vy+W6zBZhNxUdQ7j3s9mQHTpXBFEU5T179gwGnK9YiiW8deuWl56HD1+NDGL4lXOBcgeBVvr6AfGTdHWPjWtXPDqZOYmQO3uIUnEfaJepFnIdQJ6j0T0+et7uPnfuXPbi0OrVsOGzz3ILeWk9X59h/3eA/N0dWwgWCDpEqXgRaDl/8nIeUUSa+v16A0Z25A+FQp5QKNTV8YLXUgAn0eRoHe+dqLbto8pArhQqXAJVMhxcRQuRnOCZ/NQQOmK46dPWTp8+/RhVt/P3vgHTPQc4yfOVNcdQ4Xh2KTIqgpyQDl0G2X9FNqTlvb3/bN5R8A5L7oQoCttWhewg+w/ZixerW+YD17NFkQnQdxNO/uPQzZs33YlEoBx2GKnHiUKFYGaVbCX+jnJyRTCrOxfmGb6dzK6pCExgZ1dwdc+u3LXE3JsWAiPP24JaAFI4YGNcIVkIlEI3jFgMmJm4grlCYMfPsYKqCExiJgjVbpdRoWXIyPLZUAiWc+hmYuCtYOaoPe1ymRQCvcuwECxP21YOVAQmsbO75z9cEzRl3LjBzr3Mf7AmsIKZvUNzI4TZW8fVAVsYKgaVg3JhZlrIJN0l6H18Kc7GVMTCUDFYM/gE2HQnLaYIVAQWsLOx1gKQWCPIXgGXG3dXMQAVgUXsNFo05xvPBLTtYvqQaNRlQsXAFoYsCo5SwRHAi4lAF9ECIJnTrS6m5/9O8qBW3cGBcRDQWZo0w8BpEUSx1t0GU2eKCPAWLJgCNw4e5P/Fgyl6TI8tAjWK/JqEI0LpZyGsZPCaSAh/wMYwcKb3BHo3lnKQrQm4DScZeRBYNSaX4rKxMqZEoHdnUVkEfKP5u4Jrg+Wbe3vZKMiDaF2ItL/uJOUkCeYNPOdYrHlNMN8E1sK60Wm5JijpiHbGa4E93r3A1X4CyQDYvQNXV9X06D/YbC5XEd0c+cJx8/BwfKgxDr5vAXAd2QlHWkUL4Sb09xNUNLQi5vC08LVIGt1Hm0Jsh27QxnQ/6Dh1FwD5EasSULcJYgHyX4TQHRhC7xOHGLqXlcTR4k+4wPmGc+m3gRRcwbJu9AoU4/GjwaMkz/Hwz0bMXCGLXnPHdnDXNvWBLPYwHXgXwJb0sjhqQqACSAhgGb37X1ZoEHkawdoXjY1tTfHaWpekLFTYE+3X/5BwnlApSK+WEvNX0UM1VgiC/OaKgJuJxZPLaYGBQSTJbXQyuBuUO37Yt5WRR/Kd3LcTLcqH2gEKYWkSQMwJkIeEgxu/+bXvLwlGRs8SxLnuAAAAAElFTkSuQmCC';
    
    // Add the logo to the PDF
    doc.addImage(logoBase64, 'PNG', 10, 10, 20, 20);
    
    // Add company name
    doc.setTextColor(51, 75, 115);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MODERN PLASTIC BAG FACTORY', 40, 15);
    
    // Add company contact info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Phone: +966 532044751', 40, 20);
    doc.text('Email: modplast83@gmail.com', 40, 25);
    doc.text('Web: www.modplastic.com', 40, 30);
    doc.text('Address: Dammam - 3865-7760', 40, 35);
    
    // Add order info (top right section)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 75, 115);
    doc.text('PRODUCTION ORDER', doc.internal.pageSize.getWidth() - 60, 18);
    
    // Add blue rectangle behind order details
    doc.setFillColor(240, 245, 250);
    doc.roundedRect(doc.internal.pageSize.getWidth() - 65, 22, 60, 18, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    
    // Add order details in right top corner with improved formatting
    const orderRef = `Order #: ${orderData.orderId}`;
    const orderDate = `Date: ${format(orderData.orderDate, 'dd MMM yyyy')}`;
    const customer = `Customer: ${orderData.customerName}`;
    const drawerNo = orderData.customerDrawerNo ? `Drawer No: ${orderData.customerDrawerNo}` : '';
    
    // Add order details lines with bold labels
    doc.text(orderRef, doc.internal.pageSize.getWidth() - 60, 28);
    doc.text(orderDate, doc.internal.pageSize.getWidth() - 60, 33);
    doc.text(customer, doc.internal.pageSize.getWidth() - 60, 38);
    
    // Add Arabic name if available
    if (orderData.customerArabicName) {
      // Prepare document with Amiri font
      prepareArabicFont(doc);
      
      // Draw "Arabic Name:" label
      doc.setFont('helvetica', 'normal');
      doc.text('Arabic Name:', doc.internal.pageSize.getWidth() - 60, 43);
      
      // Draw Arabic text with right alignment
      renderArabicText(doc, orderData.customerArabicName, doc.internal.pageSize.getWidth() - 15, 43, { 
        align: 'right'
      });
      
      // Push down drawer number position if Arabic name is shown
      if (orderData.customerDrawerNo) {
        doc.text(drawerNo, doc.internal.pageSize.getWidth() - 60, 48);
      }
    } else {
      // No Arabic name, drawer number stays at original position
      if (orderData.customerDrawerNo) {
        doc.text(drawerNo, doc.internal.pageSize.getWidth() - 60, 43);
      }
    }
    
    // Add notes if available
    if (orderData.notes) {
      doc.text(`Notes: ${orderData.notes.substring(0, 80)}${orderData.notes.length > 80 ? '...' : ''}`, 14, 40);
    }
    
    // Add dividing line
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setLineWidth(0.5);
    doc.line(14, 45, pageWidth - 14, 45);
    
    // Prepare job orders data for table - with adjusted columns and added Cylinder Inch, Cutting Length cm, Master batch, etc as requested
    const tableColumns = [
      'PCID', 'Category', 'Product', 'Size', 'µm', 'Cyl Inch', 
      'Cutting L cm', 'Raw Material', 'Mast Batch', 'Print', 'Unit',
      'Weight kg', 'Packing', 'Punching', 'Cover', 'Quantity'
    ];
    
    const tableData = orderData.jobOrders.map(job => [
      job.pcid || 'N/A',
      job.category,
      job.product,
      job.size_details || '',
      job.thickness || '',
      job.cylinder_inch || '',
      job.cutting_length_cm || '',
      job.raw_material || '',
      job.mast_batch || '',
      job.is_printed ? '✓' : '', // Checkbox representation
      job.cutting_unit || '',
      job.unit_weight_kg || '',
      job.packing || '',
      job.punching || '',
      job.cover || '',
      job.quantity
    ]);
    
    // Generate table with improved formatting
    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: 50,
      styles: { 
        fontSize: 8, // Reduced from 9 to fit all columns better
        cellPadding: 1,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        fontStyle: 'bold',
        halign: 'center'
      },
      headStyles: { 
        fillColor: [51, 75, 115], 
        textColor: 255, 
        fontSize: 8, // Reduced from 9 to fit all columns better
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [240, 245, 250] },
      columnStyles: {
        0: { cellWidth: 12, fontStyle: 'bold' }, // PCID - smaller as requested
        1: { cellWidth: 14, fontStyle: 'bold' }, // Category
        2: { cellWidth: 14, fontStyle: 'bold' }, // Product
        3: { cellWidth: 14, fontStyle: 'bold' }, // Size
        4: { cellWidth: 8, fontStyle: 'bold' },  // Thickness (µm)
        5: { cellWidth: 10, fontStyle: 'bold' }, // Cylinder Inch
        6: { cellWidth: 12, fontStyle: 'bold' }, // Cutting Length cm
        7: { cellWidth: 14, fontStyle: 'bold' }, // Raw Material
        8: { cellWidth: 14, fontStyle: 'bold' }, // Mast Batch
        9: { cellWidth: 8, halign: 'center', fontStyle: 'bold' }, // Print - checkbox column
        10: { cellWidth: 8, fontStyle: 'bold' }, // Unit
        11: { cellWidth: 10, fontStyle: 'bold' }, // Weight kg
        12: { cellWidth: 14, fontStyle: 'bold' }, // Packing
        13: { cellWidth: 14, fontStyle: 'bold' }, // Punching
        14: { cellWidth: 12, fontStyle: 'bold' }, // Cover
        15: { cellWidth: 14, halign: 'center', fontStyle: 'bold', fontSize: 11 } // Quantity - even larger as requested
      },
      // Reduce margins as requested
      margin: { left: margin, right: margin },
      didDrawCell: (data) => {
        // For the checkbox column
        if (data.section === 'body' && data.column.index === 9 && data.cell.raw === '✓') {
          // Draw a checkmark for printed items
          const x = data.cell.x + data.cell.width / 2;
          const y = data.cell.y + data.cell.height / 2;
          doc.setFontSize(12);
          doc.setTextColor(0, 128, 0); // Green color for checkmark
        }
      }
    });
    
    // Add page numbers and timestamp
    const pageCount = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 10
      );
      
      // Add timestamp to footer
      const timestamp = `Generated on: ${new Date().toLocaleString()}`;
      doc.text(
        timestamp,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
    
    // Save the PDF
    console.log("Preparing to save PDF...");
    const filename = `order-${orderData.orderId}-${format(orderData.orderDate, 'yyyy-MM-dd')}.pdf`;
    
    try {
      console.log(`Saving PDF with filename: ${filename}`);
      doc.save(filename);
      console.log("PDF saved successfully");
    } catch (error) {
      const saveError = error as Error;
      console.error("Error in PDF save operation:", saveError);
      // Try a different approach if the standard save fails
      try {
        console.log("Attempting alternative save method...");
        // Create a blob and use download attribute as fallback
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        console.log("Alternative save method completed");
      } catch (error2) {
        const fallbackError = error2 as Error;
        console.error("Both save methods failed:", fallbackError);
        throw new Error(`PDF save failed: ${saveError.message || 'Unknown error'}. Fallback also failed: ${fallbackError.message || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('Error generating order PDF:', error);
    // Log more detailed information about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};
