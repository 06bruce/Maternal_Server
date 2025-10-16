// Test user registration and welcome email
const axios = require('axios');

async function testRegistration() {
  console.log('🔍 Testing User Registration and Welcome Email\n');
  
  // Generate a unique email for testing
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  
  console.log(`📧 Registering user with email: ${testEmail}\n`);
  
  try {
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      name: 'Test User',
      email: testEmail,
      password: 'password123',
      phone: '+1234567890',
      age: 25,
      gender: 'female',
      isPregnant: false
    });
    
    console.log('✅ SUCCESS!');
    console.log('Response:', response.data);
    console.log('\n📬 Check your email inbox for the welcome email!');
    console.log(`   Email: ${testEmail}`);
    console.log('   Subject: "Welcome to Maternal Health Platform"');
    console.log('\n⚠️  Note: Check spam folder if you don\'t see it in inbox');
    
    return testEmail;
    
  } catch (error) {
    console.error('❌ FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

async function testForgotPasswordWithRegisteredUser(email) {
  if (!email) {
    console.log('\n❌ Cannot test forgot password - no registered email');
    return;
  }
  
  console.log('\n🔍 Testing Forgot Password with Registered User\n');
  
  try {
    const response = await axios.post('http://localhost:3001/api/auth/forgot-password', {
      email: email
    });
    
    console.log('✅ SUCCESS!');
    console.log('Response:', response.data);
    console.log('\n📬 Check your email inbox for the password reset email!');
    console.log(`   Email: ${email}`);
    console.log('   Subject: "Password Reset Request - Maternal Health Platform"');
    
  } catch (error) {
    console.error('❌ FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function runTests() {
  const registeredEmail = await testRegistration();
  await testForgotPasswordWithRegisteredUser(registeredEmail);
}

runTests();
