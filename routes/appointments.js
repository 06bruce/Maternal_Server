const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { HOSPITALS_DATA } = require('../data/hospitals');

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
    }).select('time');

    const bookedTimes = existingAppointments.map(apt => apt.time);

    // Generate all possible slots
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ];

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({
      slots: availableSlots,
      centerId,
      date,
      centerName: center.name,
      totalSlots: allSlots.length,
      availableCount: availableSlots.length,
      bookedCount: bookedTimes.length
    });
  } catch (error) {
    console.error('Error fetching appointment slots:', error);
    res.status(500).json({ error: 'Failed to fetch appointment slots' });
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
