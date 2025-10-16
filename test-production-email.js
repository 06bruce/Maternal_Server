// Test email functionality in production
const axios = require('axios');

async function testProductionEmail() {
  console.log('🚀 TESTING EMAIL FUNCTIONALITY IN PRODUCTION');
  console.log('='.repeat(60));
  
  // Replace with your production server URL
  const PRODUCTION_URL = 'https://maternal-server.onrender.com';
  
  console.log(`📡 Testing against: ${PRODUCTION_URL}`);
  
  // Test 1: Health check
  console.log('\n1️⃣ Testing server health...');
  try {
    const healthResponse = await axios.get(`${PRODUCTION_URL}/health`);
    console.log('✅ Server is healthy:', healthResponse.data.status);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return;
  }
  
  // Test 2: User registration with welcome email
  console.log('\n2️⃣ Testing user registration (welcome email)...');
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  
  try {
    const registerResponse = await axios.post(`${PRODUCTION_URL}/api/auth/register`, {
      name: 'Email Test User',
      email: testEmail,
      password: 'password123',
      phone: '+1234567890',
      age: 25,
      gender: 'female',
      isPregnant: false
    });
    
    console.log('✅ User registered successfully');
    console.log('📧 Welcome email should be sent to:', testEmail);
    console.log('📬 Check your inbox for "Welcome to Maternal Health Platform"');
    
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data || error.message);
  }
  
  // Test 3: Password reset email
  console.log('\n3️⃣ Testing password reset email...');
  try {
    const forgotResponse = await axios.post(`${PRODUCTION_URL}/api/auth/forgot-password`, {
      email: testEmail
    });
    
    console.log('✅ Password reset request sent');
    console.log('📧 Reset email should be sent to:', testEmail);
    console.log('📬 Check your inbox for "Password Reset Request"');
    
  } catch (error) {
    console.log('❌ Password reset failed:', error.response?.data || error.message);
  }
  
  // Test 4: Test with a real email (if you want to test with your own email)
  console.log('\n4️⃣ Testing with real email (optional)...');
  const realEmail = 'maternalhub1@gmail.com'; // Replace with your email
  
  try {
    const realForgotResponse = await axios.post(`${PRODUCTION_URL}/api/auth/forgot-password`, {
      email: realEmail
    });
    
    console.log('✅ Password reset sent to real email');
    console.log('📧 Check inbox for:', realEmail);
    
  } catch (error) {
    console.log('❌ Real email test failed:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Production email tests completed');
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Check your email inbox (including spam folder)');
  console.log('2. Look for emails from "Maternal Health Platform"');
  console.log('3. If emails are not received, check server logs');
  console.log('4. Verify email configuration in production environment');
}

// Run the test
testProductionEmail().catch(console.error);
