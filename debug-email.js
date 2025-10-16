// Comprehensive email debugging script
require('dotenv').config();
const { sendWelcomeEmail, sendPasswordResetEmail } = require('./utils/emailService');

async function debugEmailService() {
  console.log('🔍 EMAIL SERVICE DEBUG REPORT');
  console.log('='.repeat(50));
  
  // 1. Check environment variables
  console.log('\n📋 Environment Variables:');
  const emailVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_SECURE', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM_NAME', 'FRONTEND_URL'];
  emailVars.forEach(varName => {
    const value = process.env[varName];
    if (varName === 'EMAIL_PASSWORD') {
      console.log(`${varName}: ${value ? '***SET***' : 'NOT SET'}`);
    } else {
      console.log(`${varName}: ${value || 'NOT SET'}`);
    }
  });
  
  // 2. Test welcome email
  console.log('\n📧 Testing Welcome Email...');
  try {
    const welcomeResult = await sendWelcomeEmail({
      to: process.env.EMAIL_USER, // Send to yourself for testing
      name: 'Test User'
    });
    
    if (welcomeResult.success) {
      console.log('✅ Welcome email test: SUCCESS');
      console.log('📧 Message ID:', welcomeResult.messageId);
    } else {
      console.log('❌ Welcome email test: FAILED');
      console.log('Error:', welcomeResult.message);
    }
  } catch (error) {
    console.log('❌ Welcome email test: CRITICAL ERROR');
    console.log('Error:', error.message);
  }
  
  // 3. Test password reset email
  console.log('\n🔐 Testing Password Reset Email...');
  try {
    const resetResult = await sendPasswordResetEmail({
      to: process.env.EMAIL_USER, // Send to yourself for testing
      name: 'Test User',
      resetToken: 'test-token-12345'
    });
    
    if (resetResult.success) {
      console.log('✅ Password reset email test: SUCCESS');
      console.log('📧 Message ID:', resetResult.messageId);
    } else {
      console.log('❌ Password reset email test: FAILED');
      console.log('Error:', resetResult.message);
    }
  } catch (error) {
    console.log('❌ Password reset email test: CRITICAL ERROR');
    console.log('Error:', error.message);
  }
  
  // 4. Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Check your email inbox (including spam folder)');
  console.log('2. Verify Gmail App Password is correct');
  console.log('3. Ensure 2-Step Verification is enabled on Gmail');
  console.log('4. Check Gmail security settings');
  console.log('5. Monitor server logs for email-related errors');
  
  console.log('\n🔗 Useful Links:');
  console.log('- Gmail App Passwords: https://myaccount.google.com/apppasswords');
  console.log('- Gmail Security: https://myaccount.google.com/security');
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Debug report completed');
}

// Run if called directly
if (require.main === module) {
  debugEmailService().catch(console.error);
}

module.exports = debugEmailService;
