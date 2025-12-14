const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  centerId: {
    type: String,
    required: [true, 'Center ID is required'],
  },
  centerName: {
    type: String,
    required: [true, 'Center name is required'],
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: [true, 'Date is required'],
  },
  time: {
    type: String, // HH:MM format
    required: [true, 'Time is required'],
  },
  reason: {
    type: String,
    enum: ['prenatal', 'postpartum', 'vaccination', 'mental_health', 'emergency', 'therapy'],
    required: [true, 'Reason is required'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
appointmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
