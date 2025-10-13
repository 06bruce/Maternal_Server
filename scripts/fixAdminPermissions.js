const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function fixAdminPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all admins
    const admins = await Admin.find({});
    console.log(`Found ${admins.length} admin(s) in database`);

    // Update permissions for each admin
    for (const admin of admins) {
      console.log(`\nUpdating permissions for: ${admin.email} (${admin.role})`);
      
      // Set permissions based on role
      admin.permissions = {
        canViewUsers: true,
        canEditUsers: admin.role === 'super_admin' || admin.role === 'admin',
        canDeleteUsers: admin.role === 'super_admin',
        canViewAnalytics: true,
        canManageHospitals: true,
        canManageContent: admin.role === 'super_admin' || admin.role === 'admin'
      };

      // Ensure admin is active
      if (admin.isActive === undefined) {
        admin.isActive = true;
      }

      await admin.save({ validateBeforeSave: false });
      console.log(`✅ Permissions updated for ${admin.email}`);
      console.log('   Permissions:', JSON.stringify(admin.permissions, null, 2));
    }

    console.log('\n✅ All admin permissions updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin permissions:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixAdminPermissions();
