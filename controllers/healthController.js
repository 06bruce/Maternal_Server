const { getAllHospitals, getHospitalsBySector, searchHospitals } = require('../data/hospitals');

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
  getEmergencyContacts,
};
