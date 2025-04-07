import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Load environment variables for Taqnyat configuration
const TAQNYAT_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID; // Reusing the env vars with Twilio names
const TAQNYAT_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TAQNYAT_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Base URL for the Taqnyat API
const TAQNYAT_API_URL = 'https://api.taqnyat.sa/v1';

/**
 * SMS Service for sending text messages via Taqnyat
 */
class SMSService {
  private apiKey?: string;
  private sender?: string;
  private accountSid?: string;
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization - will only initialize when a method is called
    console.log('SMS Service created, but not yet initialized. Will initialize on first use.');
  }

  /**
   * Initialize the SMS service with credentials
   * @returns true if initialization was successful, false otherwise
   */
  private initialize(): boolean {
    // Check if already initialized
    if (this.initialized) {
      return true;
    }

    try {
      if (!TAQNYAT_ACCOUNT_SID) {
        console.warn('TWILIO_ACCOUNT_SID environment variable not set (used for Taqnyat account)');
        return false;
      }
      if (!TAQNYAT_AUTH_TOKEN) {
        console.warn('TWILIO_AUTH_TOKEN environment variable not set (used for Taqnyat token)');
        return false;
      }
      if (!TAQNYAT_PHONE_NUMBER) {
        console.warn('TWILIO_PHONE_NUMBER environment variable not set (used for Taqnyat sender ID)');
        return false;
      }

      this.apiKey = TAQNYAT_AUTH_TOKEN;
      
      // Try using a text-based sender name instead of a phone number
      // Taqnyat allows alphanumeric sender IDs like "MPBF" or company name
      this.sender = "MPBF";  // Using the company initials as sender ID
      
      // Remove common prefixes if present in the account SID
      this.accountSid = TAQNYAT_ACCOUNT_SID.replace('https://api.taqnyat.sa/v1/', '').replace('http://api.taqnyat.sa/v1/', '');
      
      console.log('SMS Service initialized with sender ID:', this.sender);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize SMS service:', error);
      return false;
    }
  }

  /**
   * Send an SMS message
   * @param phoneNumber Recipient phone number (in international format)
   * @param message Message text content
   * @returns Promise with the result
   */
  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    try {
      // Check if SMS service is initialized
      if (!this.initialize()) {
        return {
          success: false,
          error: 'SMS service not initialized. Missing environment variables.',
        };
      }

      // Validate the phone number
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      // Validate the message
      if (!message) {
        throw new Error('Message content is required');
      }

      // Format phone number for Taqnyat requirements
      const recipient = this.formatPhoneNumber(phoneNumber);

      // Log request details for debugging
      console.log('SMS Request payload:', {
        recipient,
        body: message,
        sender: this.sender
      });
      
      // Make the API request to Taqnyat using their API
      const response = await axios.post(`${TAQNYAT_API_URL}/messages`, {
        numbers: [recipient],
        body: message,
        sender: this.sender,
        output: 'json'
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        success: true,
        messageId: response.data?.id || null,
        response: response.data
      };
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error',
        details: error.response?.data || null
      };
    }
  }

  /**
   * Send a bulk SMS message to multiple recipients
   * @param phoneNumbers Array of recipient phone numbers
   * @param message Message text content
   * @returns Promise with the result
   */
  async sendBulkSMS(phoneNumbers: string[], message: string): Promise<any> {
    try {
      // Check if SMS service is initialized
      if (!this.initialize()) {
        return {
          success: false,
          error: 'SMS service not initialized. Missing environment variables.',
        };
      }

      // Validate the phone numbers
      if (!phoneNumbers || phoneNumbers.length === 0) {
        throw new Error('At least one phone number is required');
      }

      // Validate the message
      if (!message) {
        throw new Error('Message content is required');
      }

      // Format phone numbers for Taqnyat requirements
      const formattedPhoneNumbers = phoneNumbers.map(phone => 
        this.formatPhoneNumber(phone)
      );

      // Join the numbers with commas for the multiple recipients field
      const recipientsList = formattedPhoneNumbers.join(',');
      
      // Log request details for debugging
      console.log('Bulk SMS Request payload:', {
        recipient: recipientsList,
        body: message,
        sender: this.sender
      });
      
      // Make the API request to Taqnyat
      const response = await axios.post(`${TAQNYAT_API_URL}/messages`, {
        numbers: formattedPhoneNumbers,
        body: message,
        sender: this.sender,
        output: 'json'
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        success: true,
        response: response.data
      };
    } catch (error: any) {
      console.error('Error sending bulk SMS:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error',
        details: error.response?.data || null
      };
    }
  }

  /**
   * Format a phone number to ensure it's in proper international format
   * @param phoneNumber The phone number to format
   * @returns Formatted phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    try {
      // Remove any non-digit characters except the plus sign
      let cleaned = phoneNumber.replace(/[^\d+]/g, '');
      
      // If it starts with a plus sign, remove it
      if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
      }
      
      // If it starts with "00", remove the 00
      if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
      }
      
      // If it's a local Saudi number starting with 0
      if (cleaned.startsWith('0')) {
        cleaned = '966' + cleaned.substring(1);
      }
      
      // Make sure number starts with country code (966 for Saudi Arabia)
      if (!cleaned.startsWith('966')) {
        cleaned = '966' + cleaned;
      }
      
      // Log the formatted number for debugging
      console.log(`Formatted phone number from ${phoneNumber} to ${cleaned}`);
      
      return cleaned;
    } catch (error) {
      console.error('Error formatting phone number:', error);
      return phoneNumber; // Return original number in case of error
    }
  }
}

// Create a singleton instance
const smsService = new SMSService();

export default smsService;