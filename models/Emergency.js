const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  emergencyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userData: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    age: Number,
    gender: String
  },
  location: {
    lat: Number,
    lng: Number
  },
  hospitals: [{
    hospitalId: Number,
    name: String,
    phone: String,
    emergencyPhone: String,
    distance: Number,
    coordinates: {
      lat: Number,
      lng: Number
    },
    services: [String],
    notifiedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'responded', 'resolved', 'cancelled'],
    default: 'pending',
    index: true
  },
  respondedHospital: {
    hospitalId: Number,
    name: String,
    phone: String,
    emergencyPhone: String,
    respondedAt: Date
  },
  resolvedAt: Date,
  cancelledAt: Date,
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
emergencySchema.index({ userId: 1, createdAt: -1 });
emergencySchema.index({ status: 1, createdAt: -1 });
emergencySchema.index({ emergencyId: 1 });

// Virtual for response time calculation
emergencySchema.virtual('responseTime').get(function() {
  if (this.respondedHospital && this.respondedHospital.respondedAt) {
    return Math.floor((this.respondedHospital.respondedAt - this.createdAt) / 1000 / 60); // in minutes
  }
  return null;
});

// Ensure virtuals are included in JSON
emergencySchema.set('toJSON', { virtuals: true });
emergencySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Emergency', emergencySchema);
