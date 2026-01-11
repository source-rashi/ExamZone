/**
 * Mail Service
 * Handles email sending via nodemailer (provider agnostic)
 */

const nodemailer = require('nodemailer');

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 * @returns {Object} Nodemailer transporter
 */
function getTransporter() {
  if (!transporter) {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️  Email credentials not configured. Emails will not be sent.');
      return null;
    }
    
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    
    console.log('📧 Email transporter initialized');
  }
  
  return transporter;
}

/**
 * Send email
 * @param {String} to - Recipient email address
 * @param {String} subject - Email subject
 * @param {String} html - HTML email content
 * @returns {Promise<Object>} Send result
 */
async function sendMail(to, subject, html) {
  try {
    const transport = getTransporter();
    
    if (!transport) {
      console.log(`📧 Email skipped (no config): ${subject} to ${to}`);
      return {
        success: false,
        error: 'Email service not configured'
      };
    }
    
    const mailOptions = {
      from: `"ExamZone" <${MAIL_FROM}>`,
      to,
      subject,
      html
    };
    
    const info = await transport.sendMail(mailOptions);
    
    console.log(`📧 Email sent: ${subject} to ${to} (${info.messageId})`);
    
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    console.error(`❌ Email failed: ${subject} to ${to}`, error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send bulk emails (async, non-blocking)
 * @param {Array} emails - Array of {to, subject, html} objects
 * @returns {Promise<Object>} Summary of results
 */
async function sendBulkMail(emails) {
  const results = {
    total: emails.length,
    sent: 0,
    failed: 0,
    errors: []
  };
  
  const promises = emails.map(async (email) => {
    const result = await sendMail(email.to, email.subject, email.html);
    
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({
        to: email.to,
        error: result.error
      });
    }
  });
  
  await Promise.all(promises);
  
  return results;
}

/**
 * Verify email connection
 * @returns {Promise<Boolean>} Connection status
 */
async function verifyConnection() {
  try {
    const transport = getTransporter();
    
    if (!transport) {
      return false;
    }
    
    await transport.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
}

module.exports = {
  sendMail,
  sendBulkMail,
  verifyConnection
};
