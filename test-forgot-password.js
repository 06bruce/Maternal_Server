// Test forgot password endpoint
const axios = require('axios');

async function testForgotPassword() {
  console.log('🔍 Testing Forgot Password Endpoint\n');
  
  // Use a test email - REPLACE WITH A REAL USER EMAIL FROM YOUR DATABASE
  const testEmail = 'maternalhub1@gmail.com'; // or any user email you want to test
  
  console.log(`📧 Sending password reset request for: ${testEmail}\n`);
  
  try {
    const response = await axios.post('http://localhost:3001/api/auth/forgot-password', {
      email: testEmail
    });
    
    console.log('✅ SUCCESS!');
    console.log('Response:', response.data);
    console.log('\n📬 Check your email inbox for the password reset link!');
    console.log(`   Email: ${testEmail}`);
    console.log('   Subject: "Password Reset Request - Maternal Health Platform"');
    console.log('\n⚠️  Note: Check spam folder if you don\'t see it in inbox');
    
  } catch (error) {
    console.error('❌ FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.data.message?.includes('not found')) {
        console.error('\n💡 The email address is not registered in the system.');
        console.error('   Please register first or use a different email.');
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

testForgotPassword();
