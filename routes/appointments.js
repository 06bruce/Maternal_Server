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

module.exports = router;
