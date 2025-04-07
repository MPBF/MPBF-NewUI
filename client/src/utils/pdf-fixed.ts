import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Required for TypeScript to recognize autoTable as a function of jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
  }
}

/**
 * Fixed version of PDF generator that avoids logo issues
 * 
 * This implements the OrderPdfData interface from pdf.ts but
 * avoids using the corrupted PNG logo, replacing it with a text header
 */

// OrderPdfData interface copied from original file
export interface OrderPdfData {
  orderId: number;
  orderDate: Date;
  customerName: string;
  customerArabicName?: string; // Added Arabic name field
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
 * Generate an order PDF with all specified columns, but without the logo
 * that was causing issues in the original implementation
 */
export const generateFixedOrderPdf = (orderData: OrderPdfData): void => {
  try {
    console.log("Fixed PDF Generation Started");
    
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
    
    // Skip the logo and use a text-based header instead
    // Make the company name larger and more prominent
    doc.setTextColor(51, 75, 115);
    doc.setFontSize(22); // Increased size
    doc.setFont('helvetica', 'bold');
    doc.text('MODERN PLASTIC BAG FACTORY', 70, 15); // Centered position
    
    // Add company contact info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Phone: +966 532044751', 105, 22);
    doc.text('Email: modplast83@gmail.com', 105, 27);
    doc.text('Address: Dammam - 3865-7760', 105, 32);
    
    // Add order info (top right section)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 75, 115);
    doc.text('ORDER', 270, 15, { align: 'right' });
    
    // Order details
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text(`Order #${orderData.orderId}`, 270, 22, { align: 'right' });
    doc.text(`Date: ${format(new Date(orderData.orderDate), 'dd/MM/yyyy')}`, 270, 27, { align: 'right' });
    
    // Customer info (left section below header)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 75, 115);
    doc.text('Customer Information', margin, 45);
    
    // Customer details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(`Name: ${orderData.customerName}`, margin, 52);
    
    if (orderData.customerDrawerNo) {
      doc.text(`Drawer No: ${orderData.customerDrawerNo}`, margin, 58);
    }
    
    // Order notes if any
    if (orderData.notes && orderData.notes.trim().length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.text(`Notes: ${orderData.notes}`, margin, 65);
    }
    
    // Add a horizontal line
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, 70, 290, 70);
    
    // If there are job orders, add them as a table
    if (orderData.jobOrders && orderData.jobOrders.length > 0) {
      // Prepare columns
      const columns = [
        { header: 'PCID', dataKey: 'pcid' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Product', dataKey: 'product' },
        { header: 'Size', dataKey: 'size_details' },
        { header: 'Thickness', dataKey: 'thickness' },
        { header: 'Cylinder Inch', dataKey: 'cylinder_inch' }, // Added column
        { header: 'Cutting Length cm', dataKey: 'cutting_length_cm' }, // Added column
        { header: 'Raw Material', dataKey: 'raw_material' },
        { header: 'Master Batch', dataKey: 'mast_batch' }, // Added column
        { header: 'Printed', dataKey: 'is_printed' },
        { header: 'Cutting Unit', dataKey: 'cutting_unit' },
        { header: 'Unit Weight kg', dataKey: 'unit_weight_kg' }, // Added column
        { header: 'Packing', dataKey: 'packing' }, // Added column
        { header: 'Punching', dataKey: 'punching' }, // Added column
        { header: 'Cover', dataKey: 'cover' },
        { header: 'Qty', dataKey: 'quantity' },
      ];
      
      // Prepare data
      const data = orderData.jobOrders.map(jo => {
        return {
          pcid: jo.pcid || '-',
          category: jo.category || '-',
          product: jo.product || '-',
          size_details: jo.size_details || '-',
          thickness: jo.thickness !== undefined ? jo.thickness : '-',
          cylinder_inch: jo.cylinder_inch !== undefined ? jo.cylinder_inch : '-', // Added
          cutting_length_cm: jo.cutting_length_cm !== undefined ? jo.cutting_length_cm : '-', // Added
          raw_material: jo.raw_material || '-',
          mast_batch: jo.mast_batch || '-', // Added
          is_printed: jo.is_printed ? 'Yes' : 'No',
          cutting_unit: jo.cutting_unit || '-',
          unit_weight_kg: jo.unit_weight_kg !== undefined ? jo.unit_weight_kg : '-', // Added
          packing: jo.packing || '-', // Added
          punching: jo.punching || '-', // Added
          cover: jo.cover || '-',
          quantity: jo.quantity !== undefined ? jo.quantity : '-'
        };
      });
      
      // Use autoTable plugin
      doc.autoTable({
        columns: columns,
        body: data,
        startY: 75,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        headStyles: {
          fillColor: [51, 75, 115],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: {
          valign: 'middle',
          fontSize: 10
        },
        columnStyles: {
          quantity: { halign: 'right' },
          thickness: { halign: 'right' },
          cylinder_inch: { halign: 'right' },
          cutting_length_cm: { halign: 'right' },
          unit_weight_kg: { halign: 'right' }
        },
        didDrawPage: (data: any) => {
          // Add page number at the bottom
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150);
          doc.text(
            `Page ${data.pageNumber} of ${data.pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 5
          );
          
          // Add footer
          doc.text(
            `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
            doc.internal.pageSize.width - margin,
            doc.internal.pageSize.height - 5,
            { align: 'right' }
          );
        }
      });
    }
    
    // Add a thank you note at the end if space allows
    // lastAutoTable is added by the plugin but we need to define it in our interface
    interface ExtendedJsPDF extends jsPDF {
      lastAutoTable?: { finalY: number };
    }
    const lastAutoTablePos = (doc as ExtendedJsPDF).lastAutoTable?.finalY || 75;
    if (lastAutoTablePos < doc.internal.pageSize.height - 20) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text('Thank you for your business!', doc.internal.pageSize.width / 2, lastAutoTablePos + 15, {
        align: 'center'
      });
    }
    
    // Save with meaningful filename
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