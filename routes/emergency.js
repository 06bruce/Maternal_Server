const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { HOSPITALS_DATA: HOSPITALS } = require('../data/hospitals');
const Emergency = require('../models/Emergency');

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Find nearest hospitals
function findNearestHospitals(userLocation, count = 3) {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    // If no location provided, return first 3 hospitals with emergency services
    return HOSPITALS.filter(h => h.services.includes('Emergency')).slice(0, count);
  }

  // Calculate distance to each hospital and sort by nearest
  const hospitalsWithDistance = HOSPITALS
    .filter(h => h.services.includes('Emergency'))
    .map(hospital => ({
      ...hospital,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        hospital.coordinates.lat,
        hospital.coordinates.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance);

  return hospitalsWithDistance.slice(0, count);
}

// Emergencies are now stored in MongoDB via Emergency model

// Send emergency alert
router.post('/alert', protect, async (req, res) => {
  try {
    const { userData, location } = req.body;
    const userId = req.user.id;

    // Validate required user data
    if (!userData || !userData.name || !userData.phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required user information (name and phone)'
      });
    }

    // Find nearest hospitals (3+)
    const nearestHospitals = findNearestHospitals(location, 4);

    if (nearestHospitals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No nearby hospitals found'
      });
    }

    // Create emergency record
    const emergencyId = `EMG-${Date.now()}-${userId}`;

    // Store emergency in database
    const emergency = await Emergency.create({
      emergencyId,
      userId,
      userData: {
        name: userData.name,
        phone: userData.phone,
        email: userData.email || 'N/A',
        age: userData.age || null,
        gender: userData.gender || 'N/A',
      },
      location: location || null,
      hospitals: nearestHospitals.map(h => ({
        hospitalId: h.id,
        name: h.name,
        phone: h.phone,
        emergencyPhone: h.emergencyPhone,
        distance: h.distance,
        coordinates: h.coordinates,
        services: h.services
      })),
      status: 'pending'
    });

    console.log(`🚨 EMERGENCY ALERT SENT - ID: ${emergencyId}`);
    console.log(`   Patient: ${userData.name} (${userData.phone})`);
    console.log(`   Alerted Hospitals:`);
    nearestHospitals.forEach((hospital, index) => {
      console.log(`     ${index + 1}. ${hospital.name} - ${hospital.emergencyPhone}`);
    });

    // Send email notifications to hospitals
    const { sendHospitalEmergencyAlert } = require('../utils/emailTemplates');

    for (const hospital of nearestHospitals) {
      if (hospital.email) {
        sendHospitalEmergencyAlert(hospital.email, emergency)
          .catch(err => console.error(`Failed to send alert to ${hospital.name}:`, err));
      }
    }

    // TODO: In production, also implement:
    // 1. Send SMS to hospitals (Africa's Talking/Twilio)
    // 2. Send push notifications to hospital systems
    // 3. WebSocket/Socket.io for real-time updates to user

    // Emit real-time notification to user
    try {
      const { emitEmergencyAlert } = require('../utils/socketHandler');
      emitEmergencyAlert(userId, {
        emergencyId,
        status: 'pending',
        hospitals: nearestHospitals,
        message: 'Emergency alert sent successfully'
      });
    } catch (err) {
      console.error('Failed to emit real-time notification:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Emergency alert sent successfully',
      emergencyId,
      alertedHospitals: nearestHospitals.map(h => h.id),
      hospitals: nearestHospitals,
    });

  } catch (error) {
    console.error('Error sending emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency alert',
      error: error.message
    });
  }
});

// Get emergency status
router.get('/:emergencyId', protect, async (req, res) => {
  try {
    const { emergencyId } = req.params;
    console.log(`[EMERGENCY GET] Fetching emergency: ${emergencyId} for user: ${req.user.id}`);
    
    const emergency = await Emergency.findOne({ emergencyId });

    if (!emergency) {
      console.log(`[EMERGENCY GET] Emergency not found: ${emergencyId}`);
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    // Check if user owns this emergency
    if (emergency.userId.toString() !== req.user.id) {
      console.error(`[EMERGENCY GET] ❌ Authorization mismatch. Emergency user: ${emergency.userId}, Request user: ${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - this emergency does not belong to you'
      });
    }

    console.log(`[EMERGENCY GET] ✅ Emergency retrieved successfully: ${emergencyId}`);
    res.status(200).json({
      success: true,
      emergency
    });

  } catch (error) {
    console.error('[EMERGENCY GET] ❌ Error getting emergency status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency status',
      error: error.message
    });
  }
});

// Cancel emergency
router.delete('/:emergencyId', protect, async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const emergency = await Emergency.findOne({ emergencyId });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    // Check if user owns this emergency
    if (emergency.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Update emergency status to cancelled
    emergency.status = 'cancelled';
    emergency.cancelledAt = new Date();
    await emergency.save();

    console.log(`✅ EMERGENCY CANCELLED - ID: ${emergencyId}`);

    // TODO: Notify hospitals that emergency was cancelled

    res.status(200).json({
      success: true,
      message: 'Emergency cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling emergency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel emergency',
      error: error.message
    });
  }
});

// Hospital response endpoint (for hospitals to mark emergency as responded)
// TODO: Add hospital authentication before production
router.post('/:emergencyId/respond', async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { hospitalId } = req.body;

    const emergency = await Emergency.findOne({ emergencyId });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    const hospital = emergency.hospitals.find(h => h.hospitalId === hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not in alerted list'
      });
    }

    // Mark hospital as responded
    emergency.respondedHospital = {
      hospitalId: hospital.hospitalId,
      name: hospital.name,
      phone: hospital.phone,
      emergencyPhone: hospital.emergencyPhone,
      respondedAt: new Date()
    };
    emergency.status = 'responded';
    await emergency.save();

    console.log(`✅ HOSPITAL RESPONDED - ${hospital.name} responded to ${emergencyId}`);

    // Emit real-time notification to user
    try {
      const { emitHospitalResponse } = require('../utils/socketHandler');
      emitHospitalResponse(emergency.userId.toString(), emergencyId, emergency.respondedHospital);
    } catch (err) {
      console.error('Failed to emit hospital response notification:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Hospital response recorded',
      hospital: emergency.respondedHospital
    });

  } catch (error) {
    console.error('Error recording hospital response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record hospital response',
      error: error.message
    });
  }
});

module.exports = router;
