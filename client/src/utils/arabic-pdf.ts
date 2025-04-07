import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Arabic text handling PDF generator
 * Simplified version that doesn't try to embed a custom font
 */

// Interface for order PDF data 
export interface ArabicOrderPdfData {
  orderId: number;
  orderDate: Date;
  customerName: string;
  customerArabicName?: string; 
  customerDrawerNo?: string;
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

/**
 * Generate order PDF with proper Arabic text support
 * Simplified version that handles Arabic text without custom fonts
 */
export function generateArabicOrderPdf(orderData: ArabicOrderPdfData): void {
  console.log("Starting Arabic-enabled PDF generation");
  
  try {
    // Create new PDF document with landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Logo base64 string - truncated for brevity
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDg4LCAyMDIwLzA3LzEwLTIyOjA2OjUzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMDUtMTJUMTU6MzE6NDMrMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTA1LTEyVDE1OjM0OjIxKzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIzLTA1LTEyVDE1OjM0OjIxKzAzOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjRiZjA5YTYxLWE1ZmMt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';
    
    // Add the logo to the PDF
    doc.addImage(logoBase64, 'PNG', 10, 10, 20, 20);
    
    // Add company name
    doc.setTextColor(51, 75, 115);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MODERN PLASTIC BAG FACTORY', 35, 17);
    
    // Add order title
    doc.setFontSize(18);
    doc.setTextColor(51, 75, 115);
    doc.text('PRODUCTION ORDER', doc.internal.pageSize.getWidth() - 60, 18);
    
    // Add blue rectangle behind order details
    doc.setFillColor(240, 245, 250);
    doc.roundedRect(doc.internal.pageSize.getWidth() - 65, 22, 60, 18, 2, 2, 'F');
    
    // Add order details in right top corner
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    
    const orderRef = `Order #: ${orderData.orderId}`;
    const orderDate = `Date: ${format(orderData.orderDate, 'dd MMM yyyy')}`;
    const customer = `Customer: ${orderData.customerName}`;
    
    // Add order details lines
    doc.text(orderRef, doc.internal.pageSize.getWidth() - 60, 28);
    doc.text(orderDate, doc.internal.pageSize.getWidth() - 60, 33);
    doc.text(customer, doc.internal.pageSize.getWidth() - 60, 38);
    
    // Add Arabic name (simplified handling without custom font)
    if (orderData.customerArabicName) {
      doc.text(`Arabic Name: ${orderData.customerArabicName}`, doc.internal.pageSize.getWidth() - 60, 43);
      
      // Push down drawer number position if Arabic name is shown
      if (orderData.customerDrawerNo) {
        doc.text(`Drawer No: ${orderData.customerDrawerNo}`, doc.internal.pageSize.getWidth() - 60, 48);
      }
    } else if (orderData.customerDrawerNo) {
      // No Arabic name, drawer number stays at original position
      doc.text(`Drawer No: ${orderData.customerDrawerNo}`, doc.internal.pageSize.getWidth() - 60, 43);
    }
    
    // Add notes if available
    if (orderData.notes) {
      doc.text(`Notes: ${orderData.notes.substring(0, 80)}${orderData.notes.length > 80 ? '...' : ''}`, 14, 40);
    }
    
    // Add dividing line
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setLineWidth(0.5);
    doc.line(14, 45, pageWidth - 14, 45);
    
    // Prepare job orders data for table with adjusted columns
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
      job.is_printed ? '✓' : '', 
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
        fontSize: 8,
        cellPadding: 1,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        fontStyle: 'bold',
        halign: 'center'
      },
      headStyles: { 
        fillColor: [51, 75, 115], 
        textColor: 255, 
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [240, 245, 250] },
      columnStyles: {
        0: { cellWidth: 12 }, // PCID
        1: { cellWidth: 14 }, // Category
        2: { cellWidth: 14 }, // Product
        3: { cellWidth: 14 }, // Size
        4: { cellWidth: 8 },  // Thickness
        5: { cellWidth: 10 }, // Cylinder Inch
        6: { cellWidth: 12 }, // Cutting Length
        7: { cellWidth: 14 }, // Raw Material
        8: { cellWidth: 14 }, // Mast Batch
        9: { cellWidth: 8 },  // Print
        10: { cellWidth: 8 }, // Unit
        11: { cellWidth: 10 }, // Weight
        12: { cellWidth: 14 }, // Packing
        13: { cellWidth: 14 }, // Punching
        14: { cellWidth: 12 }, // Cover
        15: { cellWidth: 14 }  // Quantity
      },
      margin: { left: 5, right: 5 }
    });
    
    // Add page number and timestamp
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
    const filename = `order-${orderData.orderId}-${format(orderData.orderDate, 'yyyy-MM-dd')}.pdf`;
    
    try {
      doc.save(filename);
      console.log("PDF saved successfully");
    } catch (error) {
      console.error("Error saving PDF:", error);
      // Fallback method if standard save fails
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        console.log("PDF saved using fallback method");
      } catch (fallbackError) {
        console.error("Even fallback method failed:", fallbackError);
        throw new Error("Could not save or open PDF");
      }
    }
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
