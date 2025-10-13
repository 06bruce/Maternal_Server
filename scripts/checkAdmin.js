const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function checkAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the admin account
    const admin = await Admin.findOne({ email: 'brucenshuti2@gmail.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found with email: brucenshuti2@gmail.com');
      console.log('\nAvailable admins:');
      const allAdmins = await Admin.find({});
      allAdmins.forEach(a => {
        console.log(`  - ${a.email} (${a.role}) - Active: ${a.isActive}`);
      });
    } else {
      console.log('✅ Admin found!');
      console.log('\n📋 Admin Details:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`   Has Password: ${!!admin.password}`);
      console.log(`   Password Length: ${admin.password ? admin.password.length : 0}`);
      console.log('\n🔑 Permissions:');
      console.log(JSON.stringify(admin.permissions, null, 2));
      
      // Test password
      console.log('\n🔐 Testing password...');
      const testPassword = '804C23DD23!';
      const isValid = await admin.comparePassword(testPassword);
      console.log(`   Password '${testPassword}' is ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAdmin();
