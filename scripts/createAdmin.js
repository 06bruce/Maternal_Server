const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'brucenshuti2@gmail.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email: brucenshuti2@gmail.com');
      console.log('Updating admin credentials...');
      
      existingAdmin.email = 'brucenshuti2@gmail.com';
      existingAdmin.password = '804C23DD23!';
      existingAdmin.name = 'Bruce Nshuti';
      await existingAdmin.save();
      
      console.log('✅ Admin credentials updated successfully!');
      console.log('\n📧 Email: brucenshuti2@gmail.com');
      console.log('🔑 Password: 804C23DD23!');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      name: 'Bruce Nshuti',
      email: 'brucenshuti2@gmail.com',
      password: '804C23DD23!',
      phone: '+250788000000',
      role: 'super_admin',
      permissions: {
        canViewUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewAnalytics: true,
        canManageHospitals: true,
        canManageContent: true
      },
      isActive: true
    });

    await admin.save();

    console.log('✅ Admin created successfully!');
    console.log('\n📧 Email: brucenshuti2@gmail.com');
    console.log('🔑 Password: 804C23DD23!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
