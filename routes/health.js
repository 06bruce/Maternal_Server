const express = require('express');
const { 
  getHealthCenters,
  getHealthCentersBySector,
  getNearestHealthCenters,
  getEmergencyContacts 
} = require('../controllers/healthController');

const { endpointCache } = require('../middleware/cache');

const router = express.Router();

// Health centers endpoint with caching
router.get('/health-centers', endpointCache.healthCenters, getHealthCenters);

// Health centers by sector endpoint
router.get('/health-centers/sector/:district/:sector', getHealthCentersBySector);

// Nearest health centers by GPS coordinates endpoint
router.post('/health-centers/nearest', getNearestHealthCenters);

// Emergency contacts endpoint with caching
router.get('/emergency-contacts', endpointCache.emergencyContacts, getEmergencyContacts);

module.exports = router;
                                                            