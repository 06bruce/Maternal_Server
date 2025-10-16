// utils/emailService.js
const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // Check if email service is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email service not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send welcome email to newly registered user
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - User name
 */
const sendWelcomeEmail = async ({ to, name }) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Skipping welcome email.');
    return { success: false, message: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Maternal Health Platform'}" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to Maternal Health Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Maternal Health Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering with Maternal Health Platform. We're excited to have you on board!</p>
            <p>Our platform is designed to provide you with comprehensive maternal health information, support, and resources throughout your journey.</p>
            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Track your pregnancy progress</li>
              <li>Get personalized health advice</li>
              <li>Access educational resources</li>
              <li>Connect with healthcare providers</li>
              <li>Schedule appointments</li>
            </ul>
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            <a href="${process.env.FRONTEND_URL || 'https://maternalhub.vercel.app'}" class="button">Visit Platform</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Maternal Health Platform. All rights reserved.</p>
            <p>This email was sent to ${to}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Maternal Health Platform!
      
      Hello ${name},
      
      Thank you for registering with Maternal Health Platform. We're excited to have you on board!
      
      Our platform is designed to provide you with comprehensive maternal health information, support, and resources throughout your journey.
      
      What you can do:
      - Track your pregnancy progress
      - Get personalized health advice
      - Access educational resources
      - Connect with healthcare providers
      - Schedule appointments
      
      If you have any questions or need assistance, please don't hesitate to reach out to our support team.
      
      Visit us at: ${process.env.FRONTEND_URL || 'https://maternalhub.vercel.app'}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
    return { success: true, message: 'Welcome email sent successfully' };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, message: 'Failed to send welcome email', error: error.message };
  }
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - User name
 * @param {string} options.resetToken - Password reset token
 */
const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Skipping password reset email.');
    return { success: false, message: 'Email service not configured' };
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'https://maternalhub.vercel.app'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Maternal Health Platform'}" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset Request - Maternal Health Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your Maternal Health Platform account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password won't change until you access the link above and create a new one</li>
              </ul>
            </div>
            <p>For security reasons, we recommend choosing a strong password that you don't use for other accounts.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Maternal Health Platform. All rights reserved.</p>
            <p>This email was sent to ${to}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello ${name},
      
      We received a request to reset your password for your Maternal Health Platform account.
      
      Click this link to reset your password:
      ${resetUrl}
      
      IMPORTANT:
      - This link will expire in 1 hour
      - If you didn't request this, please ignore this email
      - Your password won't change until you access the link above and create a new one
      
      For security reasons, we recommend choosing a strong password that you don't use for other accounts.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: 'Failed to send password reset email', error: error.message };
  }
};

/**
 * Send password reset confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - User name
 */
const sendPasswordResetConfirmation = async ({ to, name }) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Skipping confirmation email.');
    return { success: false, message: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Maternal Health Platform'}" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Successfully Reset - Maternal Health Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .success { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Password Reset Successful</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <div class="success">
              <p><strong>Your password has been successfully reset.</strong></p>
            </div>
            <p>You can now log in to your account using your new password.</p>
            <p>If you did not make this change or believe an unauthorized person has accessed your account, please contact our support team immediately.</p>
            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Never share your password with anyone</li>
              <li>Use a unique password for each online account</li>
              <li>Consider using a password manager</li>
              <li>Enable two-factor authentication when available</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Maternal Health Platform. All rights reserved.</p>
            <p>This email was sent to ${to}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Successful
      
      Hello ${name},
      
      Your password has been successfully reset.
      
      You can now log in to your account using your new password.
      
      If you did not make this change or believe an unauthorized person has accessed your account, please contact our support team immediately.
      
      Security Tips:
      - Never share your password with anyone
      - Use a unique password for each online account
      - Consider using a password manager
      - Enable two-factor authentication when available
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset confirmation email sent to ${to}`);
    return { success: true, message: 'Password reset confirmation sent successfully' };
  } catch (error) {
    console.error('Error sending password reset confirmation:', error);
    return { success: false, message: 'Failed to send confirmation email', error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};
