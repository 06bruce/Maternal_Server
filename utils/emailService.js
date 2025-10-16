// utils/emailService.js
const nodemailer = require('nodemailer');
const axios = require('axios');

// Create reusable transporter
const createTransporter = () => {
  // Check if email service is configured
  const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Email service not configured. Missing variables:', missingVars.join(', '));
    console.error('💡 Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in environment variables');
    return null;
  }

  console.log('📧 Email service configured:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    secure: process.env.EMAIL_SECURE === 'true'
  });

  const useSecure = process.env.EMAIL_SECURE === 'true';
  const smtpPort = parseInt(process.env.EMAIL_PORT) || (useSecure ? 465 : 587);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: smtpPort,
    secure: useSecure, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Add connection timeout and other options for better reliability
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // Use a pooled connection to improve reliability under load
    pool: true,
    // Some platforms prefer IPv4 to avoid IPv6 routing timeouts
    family: 4,
    // TLS options
    requireTLS: !useSecure, // for 587 STARTTLS
    tls: {
      servername: process.env.EMAIL_HOST,
      // allow default CA; do not set rejectUnauthorized=false in prod
    }
  });

  return transporter;
};

// Send via Resend HTTP API as a fallback to SMTP
const sendViaResend = async ({ to, subject, html, text, fromName }) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return { success: false, message: 'Resend not configured' };
  }

  try {
    const payload = {
      from: `${fromName || (process.env.EMAIL_FROM_NAME || 'Maternal Health Platform')} <${process.env.EMAIL_FROM}>`,
      to: [to],
      subject,
      html,
      text
    };

    const res = await axios.post('https://api.resend.com/emails', payload, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const messageId = res.data?.id || res.headers['x-message-id'];
    console.log(`✅ Resend email sent to ${to}`, messageId ? `(${messageId})` : '');
    return { success: true, message: 'Email sent via Resend', messageId };
  } catch (error) {
    console.error('❌ Resend send failed:', error.response?.data || error.message);
    return { success: false, message: 'Resend send failed', error: error.message };
  }
};

// Send via Brevo (Sendinblue) HTTP API as a secondary fallback
const sendViaBrevo = async ({ to, subject, html, text, fromName }) => {
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
    return { success: false, message: 'Brevo not configured' };
  }

  try {
    const payload = {
      sender: {
        email: process.env.EMAIL_FROM,
        name: fromName || (process.env.EMAIL_FROM_NAME || 'Maternal Health Platform')
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text
    };

    const res = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      timeout: 30000
    });

    const messageId = res.data?.messageId || res.headers['x-mailin-message-id'];
    console.log(`✅ Brevo email sent to ${to}`, messageId ? `(${messageId})` : '');
    return { success: true, message: 'Email sent via Brevo', messageId };
  } catch (error) {
    console.error('❌ Brevo send failed:', error.response?.data || error.message);
    return { success: false, message: 'Brevo send failed', error: error.message };
  }
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
    // Verify connection before sending
    await transporter.verify();
    console.log('✅ SMTP connection verified for welcome email');
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent successfully to ${to}`);
    console.log('📧 Message ID:', info.messageId);
    return { success: true, message: 'Welcome email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email to', to);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send welcome email';
    if (error.message.includes('Invalid login')) {
      errorMessage = 'Email authentication failed - check credentials';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to email server';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Email server timeout';
    }
    
    // Fallback to Resend if configured
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      console.log('↪️  Falling back to Resend for welcome email...');
      return await sendViaResend({
        to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
        fromName: process.env.EMAIL_FROM_NAME
      });
    }

    if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) {
      console.log('↪️  Falling back to Brevo for welcome email...');
      return await sendViaBrevo({
        to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
        fromName: process.env.EMAIL_FROM_NAME
      });
    }

    return { success: false, message: errorMessage, error: error.message };
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
    // Verify connection before sending
    await transporter.verify();
    console.log('✅ SMTP connection verified for password reset email');
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully to ${to}`);
    console.log('📧 Message ID:', info.messageId);
    console.log('🔗 Reset URL:', resetUrl);
    return { success: true, message: 'Password reset email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email to', to);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send password reset email';
    if (error.message.includes('Invalid login')) {
      errorMessage = 'Email authentication failed - check credentials';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to email server';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Email server timeout';
    }
    
    // Fallback to Resend if configured
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      console.log('↪️  Falling back to Resend for password reset email...');
      return await sendViaResend({
        to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
        fromName: process.env.EMAIL_FROM_NAME
      });
    }

    if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) {
      console.log('↪️  Falling back to Brevo for password reset email...');
      return await sendViaBrevo({
        to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
        fromName: process.env.EMAIL_FROM_NAME
      });
    }

    return { success: false, message: errorMessage, error: error.message };
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
    // Verify connection before sending
    await transporter.verify();
    console.log('✅ SMTP connection verified for confirmation email');
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset confirmation email sent successfully to ${to}`);
    console.log('📧 Message ID:', info.messageId);
    return { success: true, message: 'Password reset confirmation sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset confirmation to', to);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send confirmation email';
    if (error.message.includes('Invalid login')) {
      errorMessage = 'Email authentication failed - check credentials';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to email server';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Email server timeout';
    }
    
    // Fallback to Resend if configured
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      console.log('↪️  Falling back to Resend for confirmation email...');
      return await sendViaResend({
        to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
        fromName: process.env.EMAIL_FROM_NAME
      });
    }

    if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) {
      console.log('↪️  Falling back to Brevo for confirmation email...');
      return await sendViaBrevo({
        to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
        fromName: process.env.EMAIL_FROM_NAME
      });
    }

    return { success: false, message: errorMessage, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};
