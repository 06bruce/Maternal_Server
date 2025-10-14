// Complete test of password reset flow
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { sendPasswordResetEmail } = require('./utils/emailService');
const crypto = require('crypto');

async function testPasswordResetFlow() {
  console.log('🔍 Testing Complete Password Reset Flow\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find or create a test user
    const testEmail = 'ninamaurissa@gmail.com'; // Using real user from database
    console.log(`👤 Looking for user: ${testEmail}`);
    
    let user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found in database');
      console.log('💡 Please register a user first or use an existing email\n');
      
      // Show available users
      const users = await User.find().select('email name').limit(5);
      if (users.length > 0) {
        console.log('Available users in database:');
        users.forEach(u => console.log(`   - ${u.email} (${u.name})`));
      }
      
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.name} (${user.email})\n`);
    
    // Generate reset token
    console.log('🔑 Generating password reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });
    console.log('✅ Token generated and saved\n');
    
    // Send email
    console.log('📧 Sending password reset email...');
    console.log(`   To: ${user.email}`);
    console.log(`   From: ${process.env.EMAIL_USER}`);
    console.log(`   SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}\n`);
    
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken
    });
    
    if (emailResult.success) {
      console.log('✅ ✅ ✅ EMAIL SENT SUCCESSFULLY! ✅ ✅ ✅\n');
      console.log('📬 Check your inbox at:', user.email);
      console.log('   Subject: "Password Reset Request - Maternal Health Platform"');
      console.log('\n🔗 Reset link format:');
      console.log(`   ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken.substring(0, 20)}...`);
      console.log('\n⚠️  Important:');
      console.log('   - Check spam/junk folder if not in inbox');
      console.log('   - Link expires in 1 hour');
      console.log('   - Click the button in the email or copy the link');
    } else {
      console.log('❌ EMAIL FAILED TO SEND');
      console.log('Error:', emailResult.message);
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Verify EMAIL_USER and EMAIL_PASSWORD in .env');
      console.log('   2. Make sure you\'re using a Gmail App Password');
      console.log('   3. Check if 2-Step Verification is enabled');
      console.log('   4. Generate App Password at: https://myaccount.google.com/apppasswords');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

testPasswordResetFlow();
