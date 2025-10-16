const { getAllHospitals, getHospitalsBySector, searchHospitals, getNearestHospitals } = require('../data/hospitals');

/**
 * Get health centers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHealthCenters = (req, res) => {
  try {
    const hospitals = getAllHospitals();
    res.json(hospitals);
  } catch (error) {
    console.error('Error fetching health centers:', error);
    res.status(500).json({ message: 'Failed to fetch health centers' });
  }
};

/**
 * Get health centers by sector
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHealthCentersBySector = (req, res) => {
  try {
    const { district, sector } = req.params;
    
    if (!district || !sector) {
      return res.status(400).json({ message: 'District and sector are required' });
    }

    const hospitals = getHospitalsBySector(district, sector);
    
    res.json({
      district,
      sector,
      count: hospitals.length,
      hospitals
    });
  } catch (error) {
    console.error('Error fetching health centers by sector:', error);
    res.status(500).json({ message: 'Failed to fetch health centers' });
  }
};

/**
 * Get nearest health centers by GPS coordinates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNearestHealthCenters = (req, res) => {
  try {
    const { latitude, longitude, limit } = req.body;
    
    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required',
        error: 'Missing coordinates'
      });
    }

    // Validate coordinate values
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        message: 'Invalid latitude or longitude values',
        error: 'Invalid coordinates'
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        message: 'Coordinates are out of valid range',
        error: 'Invalid coordinate range'
      });
    }

    const maxLimit = limit ? Math.min(parseInt(limit), 20) : 10;
    const hospitals = getNearestHospitals(lat, lng, maxLimit);
    
    if (hospitals.length === 0) {
      return res.status(404).json({ 
        message: 'No nearby hospitals found',
        hospitals: []
      });
    }

    res.json({
      message: `Found ${hospitals.length} nearby hospitals`,
      count: hospitals.length,
      userLocation: { latitude: lat, longitude: lng },
      hospitals
    });
  } catch (error) {
    console.error('Error fetching nearest health centers:', error);
    res.status(500).json({ 
      message: 'Failed to fetch nearest health centers',
      error: error.message 
    });
  }
};

/**
 * Get emergency contacts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmergencyContacts = (req, res) => {
  const contacts = [
    {
      name: "Emergency Hotline",
      phone: "112",
      description: "24/7 emergency medical assistance",
    },
    {
      name: "Maternal Health Support",
      phone: "116",
      description: "Specialized maternal health support",
    },
    {
      name: "Mental Health Crisis",
      phone: "114",
      description: "Mental health crisis intervention",
    },
  ];

  res.json(contacts);
};

module.exports = {
  getHealthCenters,
  getHealthCentersBySector,
  getNearestHealthCenters,
  getEmergencyContacts,
};
