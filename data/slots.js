// Appointment Slots Configuration
// This file contains all slot-related configurations for better booking experience

// Default working hours and slot configuration
const DEFAULT_WORKING_HOURS = {
  startTime: '09:00',
  endTime: '16:30',
  slotDuration: 30, // minutes
  lunchBreak: {
    start: '12:00',
    end: '14:00'
  },
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  emergencySlots: ['08:00', '08:30', '17:00', '17:30', '18:00'] // Emergency only slots
};

// Different slot configurations based on appointment type
const APPOINTMENT_TYPE_SLOTS = {
  prenatal: {
    duration: 60, // 1 hour slots
    slots: [
      '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
    ],
    maxPerDay: 6,
    requiresSpecialist: true
  },
  postpartum: {
    duration: 45, // 45 minutes
    slots: [
      '09:15', '10:00', '10:45', '14:15', '15:00', '15:45'
    ],
    maxPerDay: 6,
    requiresSpecialist: true
  },
  vaccination: {
    duration: 15, // 15 minutes - quick appointments
    slots: [
      '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
      '11:00', '11:15', '11:30', '11:45', '14:00', '14:15', '14:30', '14:45',
      '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30'
    ],
    maxPerDay: 20,
    requiresSpecialist: false
  },
  mental_health: {
    duration: 50, // 50 minutes
    slots: [
      '09:10', '10:00', '10:50', '14:10', '15:00', '15:50'
    ],
    maxPerDay: 6,
    requiresSpecialist: true
  },
  emergency: {
    duration: 30, // 30 minutes
    slots: [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
    ],
    maxPerDay: 15,
    requiresSpecialist: false,
    priority: 'high'
  },
  therapy: {
    duration: 45, // 45 minutes
    slots: [
      '09:15', '10:00', '10:45', '11:30', '14:15', '15:00', '15:45'
    ],
    maxPerDay: 7,
    requiresSpecialist: true
  }
};

// Hospital-specific slot configurations
const HOSPITAL_SLOT_CONFIG = {
  // Major hospitals with more slots
  '1': { // King Faisal Hospital
    workingHours: {
      startTime: '08:00',
      endTime: '18:00',
      weekendSlots: true
    },
    additionalSlots: ['08:00', '08:30', '17:30', '18:00'],
    maxCapacity: 100
  },
  '3': { // Kigali University Teaching Hospital (CHUK)
    workingHours: {
      startTime: '08:00',
      endTime: '20:00',
      weekendSlots: true
    },
    additionalSlots: ['08:00', '08:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
    maxCapacity: 150
  },
  '6': { // Kigali Central Hospital (CHK)
    workingHours: {
      startTime: '08:00',
      endTime: '17:00',
      weekendSlots: true
    },
    additionalSlots: ['08:00', '08:30', '16:30', '17:00'],
    maxCapacity: 80
  }
};

/**
 * Get available slots for a specific appointment type and hospital
 * @param {string} appointmentType - Type of appointment (prenatal, postpartum, etc.)
 * @param {string} hospitalId - Hospital ID
 * @param {Array} bookedSlots - Already booked slots for the date
 * @returns {Array} Available slots
 */
const getAvailableSlots = (appointmentType, hospitalId, bookedSlots = []) => {
  // Get base slots for appointment type
  const appointmentConfig = APPOINTMENT_TYPE_SLOTS[appointmentType];
  if (!appointmentConfig) {
    return [];
  }

  let availableSlots = [...appointmentConfig.slots];

  // Add hospital-specific additional slots if available
  const hospitalConfig = HOSPITAL_SLOT_CONFIG[hospitalId];
  if (hospitalConfig && hospitalConfig.additionalSlots) {
    availableSlots = [...availableSlots, ...hospitalConfig.additionalSlots];
  }

  // Add emergency slots for emergency appointments
  if (appointmentType === 'emergency') {
    availableSlots = [...availableSlots, ...DEFAULT_WORKING_HOURS.emergencySlots];
  }

  // Remove booked slots and sort
  const filteredSlots = availableSlots
    .filter(slot => !bookedSlots.includes(slot))
    .sort();

  return [...new Set(filteredSlots)]; // Remove duplicates
};

/**
 * Get all possible slots for a hospital (used for general slot checking)
 * @param {string} hospitalId - Hospital ID
 * @returns {Array} All possible slots for the hospital
 */
const getAllHospitalSlots = (hospitalId) => {
  const hospitalConfig = HOSPITAL_SLOT_CONFIG[hospitalId];
  
  if (hospitalConfig) {
    // Use hospital-specific configuration
    const baseSlots = generateTimeSlots(
      hospitalConfig.workingHours.startTime,
      hospitalConfig.workingHours.endTime,
      30
    );
    return [...baseSlots, ...(hospitalConfig.additionalSlots || [])];
  }

  // Use default configuration
  return generateTimeSlots(
    DEFAULT_WORKING_HOURS.startTime,
    DEFAULT_WORKING_HOURS.endTime,
    DEFAULT_WORKING_HOURS.slotDuration
  );
};

/**
 * Generate time slots between start and end time
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @param {number} duration - Duration in minutes
 * @returns {Array} Array of time slots
 */
const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  for (let minutes = start; minutes < end; minutes += duration) {
    slots.push(minutesToTime(minutes));
  }
  
  return slots;
};

/**
 * Convert time string to minutes
 * @param {string} time - Time in HH:MM format
 * @returns {number} Minutes from midnight
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes to time string
 * @param {number} minutes - Minutes from midnight
 * @returns {string} Time in HH:MM format
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Validate if a slot is available for booking
 * @param {string} slot - Time slot
 * @param {string} appointmentType - Type of appointment
 * @param {string} hospitalId - Hospital ID
 * @param {Array} bookedSlots - Already booked slots
 * @returns {Object} Validation result
 */
const validateSlot = (slot, appointmentType, hospitalId, bookedSlots = []) => {
  const availableSlots = getAvailableSlots(appointmentType, hospitalId, bookedSlots);
  
  return {
    isValid: availableSlots.includes(slot),
    availableSlots: availableSlots,
    message: availableSlots.includes(slot) 
      ? 'Slot is available' 
      : 'Slot is not available for this appointment type'
  };
};

/**
 * Get slot information for a specific appointment type
 * @param {string} appointmentType - Type of appointment
 * @returns {Object} Slot configuration information
 */
const getSlotInfo = (appointmentType) => {
  const config = APPOINTMENT_TYPE_SLOTS[appointmentType];
  if (!config) {
    return null;
  }

  return {
    duration: config.duration,
    maxPerDay: config.maxPerDay,
    requiresSpecialist: config.requiresSpecialist,
    priority: config.priority || 'normal',
    description: getAppointmentTypeDescription(appointmentType)
  };
};

/**
 * Get description for appointment type
 * @param {string} appointmentType - Type of appointment
 * @returns {string} Description
 */
const getAppointmentTypeDescription = (appointmentType) => {
  const descriptions = {
    prenatal: 'Prenatal care appointments for expectant mothers',
    postpartum: 'Postpartum care and recovery appointments',
    vaccination: 'Child and adult vaccination appointments',
    mental_health: 'Mental health and counseling sessions',
    emergency: 'Emergency medical consultations',
    therapy: 'Physical therapy and rehabilitation sessions'
  };
  
  return descriptions[appointmentType] || 'General medical appointment';
};

module.exports = {
  DEFAULT_WORKING_HOURS,
  APPOINTMENT_TYPE_SLOTS,
  HOSPITAL_SLOT_CONFIG,
  getAvailableSlots,
  getAllHospitalSlots,
  validateSlot,
  getSlotInfo,
  generateTimeSlots,
  timeToMinutes,
  minutesToTime
};
