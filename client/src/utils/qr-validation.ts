import { ValidationResult } from '@/components/ui/qr-scanner/QRScanner';

/**
 * QR Code content format types
 */
export enum QRCodeFormat {
  ROLL = 'ROLL',
  ORDER = 'ORDER',
  JOB_ORDER = 'JOB_ORDER',
  CUSTOMER = 'CUSTOMER',
  MACHINE = 'MACHINE',
  MATERIAL = 'MATERIAL',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface for data extracted from a QR code
 */
export interface QRCodeData {
  format: QRCodeFormat;
  id: number | string;
  additionalData?: Record<string, any>;
}

/**
 * Regular expressions for different QR code formats
 */
const QR_REGEX = {
  ROLL: /^ROLL-(\d+)$/,
  ORDER: /^ORDER-(\d+)$/,
  JOB_ORDER: /^JOB-(\d+)$/,
  CUSTOMER: /^CUST-(\d+)$/,
  MACHINE: /^MACH-(\d+)$/,
  MATERIAL: /^MAT-(\d+)$/
};

/**
 * Parse QR code content and determine its format and extract data
 * @param qrCodeContent The string content of the QR code
 * @returns Parsed QR code data with format and ID
 */
export function parseQRCode(qrCodeContent: string): QRCodeData {
  // Check if the content is JSON
  try {
    const jsonData = JSON.parse(qrCodeContent);
    
    if (jsonData.type && jsonData.id) {
      const format = Object.values(QRCodeFormat).includes(jsonData.type as QRCodeFormat)
        ? jsonData.type as QRCodeFormat
        : QRCodeFormat.UNKNOWN;
        
      return {
        format,
        id: jsonData.id,
        additionalData: { ...jsonData }
      };
    }
  } catch (e) {
    // Not JSON, continue with regex matching
  }
  
  // Try to match with regex patterns
  for (const [formatKey, regex] of Object.entries(QR_REGEX)) {
    const match = qrCodeContent.match(regex);
    if (match && match[1]) {
      return {
        format: formatKey as QRCodeFormat,
        id: match[1]
      };
    }
  }
  
  // If no structured format is detected, check if it's a simple number (might be an ID)
  if (/^\d+$/.test(qrCodeContent)) {
    return {
      format: QRCodeFormat.UNKNOWN,
      id: qrCodeContent
    };
  }
  
  // If all fails, return as unknown
  return {
    format: QRCodeFormat.UNKNOWN,
    id: qrCodeContent
  };
}

/**
 * Validate a Roll QR code
 * @param content QR code content
 * @returns Validation result
 */
export async function validateRollQRCode(content: string): Promise<ValidationResult> {
  const data = parseQRCode(content);
  
  if (data.format === QRCodeFormat.ROLL) {
    try {
      // Fetch roll data from the server
      const response = await fetch(`/api/rolls/validate/${data.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            valid: false,
            message: `Roll ID ${data.id} not found`,
            data
          };
        }
        throw new Error('Error validating roll');
      }
      
      const rollData = await response.json();
      
      return {
        valid: true,
        message: `Valid Roll: ${rollData.roll_identification}`,
        data: { ...data, rollData }
      };
    } catch (error) {
      console.error('Roll validation error:', error);
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Unknown error validating roll',
        data
      };
    }
  }
  
  // If it's not a roll format, return invalid
  return {
    valid: false,
    message: `Invalid roll format: ${content}`,
    data
  };
}

/**
 * Validate an Order QR code
 * @param content QR code content
 * @returns Validation result
 */
export async function validateOrderQRCode(content: string): Promise<ValidationResult> {
  const data = parseQRCode(content);
  
  if (data.format === QRCodeFormat.ORDER) {
    try {
      // Fetch order data from the server
      const response = await fetch(`/api/orders/validate/${data.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            valid: false,
            message: `Order ID ${data.id} not found`,
            data
          };
        }
        throw new Error('Error validating order');
      }
      
      const orderData = await response.json();
      
      return {
        valid: true,
        message: `Valid Order: #${orderData.id}`,
        data: { ...data, orderData }
      };
    } catch (error) {
      console.error('Order validation error:', error);
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Unknown error validating order',
        data
      };
    }
  }
  
  // If it's not an order format, return invalid
  return {
    valid: false,
    message: `Invalid order format: ${content}`,
    data
  };
}

/**
 * Validate a generic QR code against multiple formats
 * Tries to determine the QR code type automatically and validate accordingly
 * @param content QR code content
 * @returns Validation result
 */
export async function validateQRCode(content: string): Promise<ValidationResult> {
  const data = parseQRCode(content);
  
  switch (data.format) {
    case QRCodeFormat.ROLL:
      return validateRollQRCode(content);
      
    case QRCodeFormat.ORDER:
      return validateOrderQRCode(content);
      
    case QRCodeFormat.JOB_ORDER:
      // TODO: Implement job order validation
      return {
        valid: false,
        message: 'Job order validation not implemented yet',
        data
      };
      
    case QRCodeFormat.CUSTOMER:
      // TODO: Implement customer validation
      return {
        valid: false,
        message: 'Customer validation not implemented yet',
        data
      };
      
    case QRCodeFormat.MACHINE:
      // TODO: Implement machine validation
      return {
        valid: false,
        message: 'Machine validation not implemented yet',
        data
      };
      
    case QRCodeFormat.MATERIAL:
      // TODO: Implement material validation
      return {
        valid: false,
        message: 'Material validation not implemented yet',
        data
      };
      
    default:
      return {
        valid: false,
        message: `Unknown QR code format: ${content}`,
        data
      };
  }
}

/**
 * Format a number as a QR code string according to the specified format
 * @param id The ID to format
 * @param format The QR code format
 * @returns Formatted QR code string
 */
export function formatQRCode(id: number | string, format: QRCodeFormat): string {
  switch (format) {
    case QRCodeFormat.ROLL:
      return `ROLL-${id}`;
    case QRCodeFormat.ORDER:
      return `ORDER-${id}`;
    case QRCodeFormat.JOB_ORDER:
      return `JOB-${id}`;
    case QRCodeFormat.CUSTOMER:
      return `CUST-${id}`;
    case QRCodeFormat.MACHINE:
      return `MACH-${id}`;
    case QRCodeFormat.MATERIAL:
      return `MAT-${id}`;
    default:
      return String(id);
  }
}