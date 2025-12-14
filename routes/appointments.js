const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { HOSPITALS_DATA } = require('../data/hospitals');
const {
  getAvailableSlots,
  getAllHospitalSlots,
  validateSlot,
  getSlotInfo
} = require('../data/slots');
const { sendAppointmentConfirmation } = require('../utils/emailTemplates');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid token.' });
  }
};

// POST /api/appointments - Book a new appointment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { centerId, centerName, date, time, reason, notes } = req.body;

    // Validate required fields
    if (!centerId || !centerName || !date || !time || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the center exists
    const center = HOSPITALS_DATA.find(h => h.id.toString() === centerId.toString());
    if (!center) {
      return res.status(404).json({ error: 'Health center not found' });
    }

    // Validate appointment reason
    const validReasons = ['prenatal', 'postpartum', 'vaccination', 'mental_health', 'emergency', 'therapy'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        error: 'Invalid appointment reason',
        validReasons: validReasons
      });
    }

    // Check for existing appointment at the same time and center
    const existingAppointment = await Appointment.findOne({
      centerId,
      date,
      time,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(409).json({
        error: 'This time slot is already booked',
        suggestedAction: 'Please choose a different time slot'
      });
    }

    // Validate slot availability using the new slots system
    const bookedSlots = await Appointment.find({
      centerId,
      date,
      status: { $ne: 'cancelled' }
    }).select('time');

    const bookedTimes = bookedSlots.map(apt => apt.time);
    const slotValidation = validateSlot(time, reason, centerId, bookedTimes);

    if (!slotValidation.isValid) {
      return res.status(400).json({
        error: 'Selected time slot is not available for this appointment type',
        availableSlots: slotValidation.availableSlots.slice(0, 10), // Show first 10 available slots
        slotInfo: getSlotInfo(reason)
      });
    }

    // Create new appointment
    const appointment = new Appointment({
      userId: req.userId,
      centerId,
      centerName,
      date,
      time,
      reason,
      notes,
    });

    await appointment.save();

    // Get user details for email
    const user = await User.findById(req.userId);

    // Send confirmation email (don't wait for it)
    if (user && user.email) {
      sendAppointmentConfirmation(user.email, user.name, appointment)
        .catch(err => console.error('Failed to send appointment confirmation:', err));
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        id: appointment._id,
        userId: appointment.userId,
        centerId: appointment.centerId,
        centerName: appointment.centerName,
        date: appointment.date,
        time: appointment.time,
        reason: appointment.reason,
        notes: appointment.notes,
        status: appointment.status,
        createdAt: appointment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// GET /api/appointments/user - Get user's appointments
router.get('/user', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId })
      .sort({ date: 1, time: 1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// DELETE /api/appointments/:id - Cancel an appointment
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Get user details for cancellation email
    const user = await User.findById(req.userId);

    // Send cancellation notification email (optional - you can create a template for this)
    if (user && user.email) {
      console.log(`✅ Appointment cancelled for user: ${user.email}`);
      // You can add sendAppointmentCancellation() here if needed
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// PUT /api/appointments/:id - Update/reschedule appointment
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { date, time, reason, notes } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if appointment is not already completed or cancelled
    if (appointment.status === 'completed') {
      return res.status(400).json({ error: 'Cannot update completed appointment' });
    }

    // Update fields if provided
    if (date !== undefined) appointment.date = date;
    if (time !== undefined) appointment.time = time;
    if (reason !== undefined) appointment.reason = reason;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    res.json({
      message: 'Appointment updated successfully',
      appointment: {
        id: appointment._id,
        userId: appointment.userId,
        centerId: appointment.centerId,
        centerName: appointment.centerName,
        date: appointment.date,
        time: appointment.time,
        reason: appointment.reason,
        notes: appointment.notes,
        status: appointment.status,
        updatedAt: appointment.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// GET /api/appointments/slots/:centerId/:date - Get available slots for a center on a date
router.get('/slots/:centerId/:date', async (req, res) => {
  try {
    const { centerId, date } = req.params;
    const { appointmentType } = req.query; // Optional: filter by appointment type

    // Check if the center exists
    const center = HOSPITALS_DATA.find(h => h.id.toString() === centerId.toString());
    if (!center) {
      return res.status(404).json({ error: 'Health center not found' });
    }

    // Get existing appointments for this center and date
    const existingAppointments = await Appointment.find({
      centerId,
      date,
      status: { $ne: 'cancelled' } // Exclude cancelled appointments
    }).select('time reason');

    const bookedTimes = existingAppointments.map(apt => apt.time);

    // Get all possible slots based on appointment type or general slots
    let availableSlots;
    let slotInfo = null;

    if (appointmentType) {
      // Get slots specific to appointment type
      availableSlots = getAvailableSlots(appointmentType, centerId, bookedTimes);
      slotInfo = getSlotInfo(appointmentType);
    } else {
      // Get all general slots for the hospital
      availableSlots = getAllHospitalSlots(centerId).filter(slot => !bookedTimes.includes(slot));
    }

    // Sort slots chronologically
    availableSlots.sort();

    res.json({
      slots: availableSlots,
      centerId,
      date,
      centerName: center.name,
      appointmentType: appointmentType || 'general',
      slotInfo,
      totalSlots: getAllHospitalSlots(centerId).length,
      availableCount: availableSlots.length,
      bookedCount: bookedTimes.length,
      workingHours: {
        start: '09:00',
        end: '16:30',
        weekendAvailable: centerId === '1' || centerId === '3' || centerId === '6' // Major hospitals
      }
    });
  } catch (error) {
    console.error('Error fetching appointment slots:', error);
    res.status(500).json({ error: 'Failed to fetch appointment slots' });
  }
});

// GET /api/appointments/types - Get available appointment types and their slot information
router.get('/types', async (req, res) => {
  try {
    const { APPOINTMENT_TYPE_SLOTS } = require('../data/slots');

    const appointmentTypes = Object.keys(APPOINTMENT_TYPE_SLOTS).map(type => ({
      type,
      ...getSlotInfo(type),
      availableSlots: APPOINTMENT_TYPE_SLOTS[type].slots
    }));

    res.json({
      appointmentTypes,
      totalTypes: appointmentTypes.length,
      message: 'Available appointment types with their slot configurations'
    });
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    res.status(500).json({ error: 'Failed to fetch appointment types' });
  }
});

// GET /api/appointments/:id - Get single appointment details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      appointment: {
        id: appointment._id,
        userId: appointment.userId,
        centerId: appointment.centerId,
        centerName: appointment.centerName,
        date: appointment.date,
        time: appointment.time,
        reason: appointment.reason,
        notes: appointment.notes,
        status: appointment.status,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

module.exports = router;
