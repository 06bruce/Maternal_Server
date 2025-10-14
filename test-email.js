// Test email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🔍 Testing email configuration...\n');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('');
  
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials not properly set in .env file');
    process.exit(1);
  }
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  try {
    // Verify connection
    console.log('🔌 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');
    
    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Maternal Health'}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Test Email - Maternal Health Platform',
      html: `
        <h1>Test Email</h1>
        <p>If you're reading this, your email configuration is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: 'If you\'re reading this, your email configuration is working correctly!'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n✨ Email service is working correctly!');
    console.log('Check your inbox:', process.env.EMAIL_USER);
    
  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Make sure you\'re using a Gmail App Password, not your regular password');
      console.error('2. Enable 2-Step Verification in your Google Account');
      console.error('3. Generate an App Password at: https://myaccount.google.com/apppasswords');
      console.error('4. Use the 16-character app password (remove spaces)');
    }
    
    process.exit(1);
  }
}

testEmail();
