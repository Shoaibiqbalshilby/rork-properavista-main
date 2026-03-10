/**
 * Generate a random 6-digit PIN code
 */
export function generatePinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate PIN format (6 digits)
 */
export function validatePinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Format phone number for storage
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming Nigeria +234)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return '+234' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate Nigerian phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Nigeria phone numbers: +234XXXXXXXXXX (11 digits after +234)
  return /^\+234\d{10}$/.test(formatted);
}

/**
 * Send PIN via email (mock implementation - use actual email service)
 */
export async function sendPinToEmail(email: string, pin: string): Promise<boolean> {
  try {
    // In production, integrate with SendGrid, AWS SES, or similar
    console.log(`[Mock] Sending PIN ${pin} to email ${email}`);
    // For testing, we'll return true, but in production call your email service
    return true;
  } catch (error) {
    console.error('Error sending PIN to email:', error);
    return false;
  }
}

/**
 * Send PIN via SMS (mock implementation - use actual SMS service)
 */
export async function sendPinToSms(phoneNumber: string, pin: string): Promise<boolean> {
  try {
    // In production, integrate with Twilio, Africa's Talking, or similar
    console.log(`[Mock] Sending PIN ${pin} to SMS ${phoneNumber}`);
    // For testing, we'll return true, but in production call your SMS service
    return true;
  } catch (error) {
    console.error('Error sending PIN to SMS:', error);
    return false;
  }
}
