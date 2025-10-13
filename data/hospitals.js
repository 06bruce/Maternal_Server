// Rwanda Hospitals Database with Sector Information
// This is sample data - in production, this should come from a database

const HOSPITALS_DATA = [
  // Kigali City - Gasabo District
  {
    id: 1,
    name: "King Faisal Hospital",
    district: "Gasabo",
    sector: "Kacyiru",
    location: "Kacyiru, Kigali",
    phone: "3939",
    emergencyPhone: "+250 788 309 000",
    hours: "24/7 Emergency Services",
    rating: 4.8,
    services: ["Emergency", "Maternity", "Pediatrics", "Surgery"],
    coordinates: { lat: -1.9536, lng: 30.0906 }
  },
  {
    id: 2,
    name: "Kibagabaga District Hospital",
    district: "Gasabo",
    sector: "Remera",
    location: "Remera, Kigali",
    phone: "+250 252 586 555",
    emergencyPhone: "+250 788 309 001",
    hours: "24/7 Emergency Services",
    rating: 4.5,
    services: ["Emergency", "Maternity", "General Medicine"],
    coordinates: { lat: -1.9442, lng: 30.0946 }
  },
  {
    id: 3,
    name: "Kigali University Teaching Hospital (CHUK)",
    district: "Gasabo",
    sector: "Kacyiru",
    location: "Kacyiru, Kigali",
    phone: "+250 788 309 002",
    emergencyPhone: "+250 788 309 002",
    hours: "24/7 Emergency Services",
    rating: 4.7,
    services: ["Emergency", "Maternity", "Pediatrics", "Surgery", "ICU"],
    coordinates: { lat: -1.9536, lng: 30.0906 }
  },

  // Kigali City - Kicukiro District
  {
    id: 4,
    name: "Rwanda Military Hospital (RMH)",
    district: "Kicukiro",
    sector: "Kanombe",
    location: "Kanombe, Kigali",
    phone: "4060",
    emergencyPhone: "+250 788 309 003",
    hours: "24/7 Emergency Services",
    rating: 4.6,
    services: ["Emergency", "Maternity", "Surgery", "ICU"],
    coordinates: { lat: -1.9833, lng: 30.1167 }
  },
  {
    id: 5,
    name: "Masaka District Hospital",
    district: "Kicukiro",
    sector: "Masaka",
    location: "Masaka, Kigali",
    phone: "+250 788 309 004",
    emergencyPhone: "+250 788 309 004",
    hours: "24/7 Emergency Services",
    rating: 4.3,
    services: ["Emergency", "Maternity", "General Medicine"],
    coordinates: { lat: -2.0167, lng: 30.1000 }
  },

  // Kigali City - Nyarugenge District
  {
    id: 6,
    name: "Kigali Central Hospital (CHK)",
    district: "Nyarugenge",
    sector: "Nyarugenge",
    location: "Nyarugenge, Kigali",
    phone: "+250 782 749 660",
    emergencyPhone: "+250 788 309 005",
    hours: "24/7 Emergency Services",
    rating: 4.5,
    services: ["Emergency", "Maternity", "Pediatrics", "Surgery"],
    coordinates: { lat: -1.9536, lng: 30.0588 }
  },
  {
    id: 7,
    name: "Muhima District Hospital",
    district: "Nyarugenge",
    sector: "Muhima",
    location: "Muhima, Kigali",
    phone: "+250 788 309 006",
    emergencyPhone: "+250 788 309 006",
    hours: "24/7 Emergency Services",
    rating: 4.4,
    services: ["Emergency", "Maternity", "General Medicine"],
    coordinates: { lat: -1.9536, lng: 30.0588 }
  },

  // Southern Province - Huye District
  {
    id: 8,
    name: "Butare University Teaching Hospital (CHUB)",
    district: "Huye",
    sector: "Huye",
    location: "Huye, Southern Province",
    phone: "+250 788 309 007",
    emergencyPhone: "+250 788 309 007",
    hours: "24/7 Emergency Services",
    rating: 4.6,
    services: ["Emergency", "Maternity", "Pediatrics", "Surgery", "ICU"],
    coordinates: { lat: -2.5967, lng: 29.7400 }
  },

  // Western Province - Rubavu District
  {
    id: 9,
    name: "Gisenyi District Hospital",
    district: "Rubavu",
    sector: "Gisenyi",
    location: "Gisenyi, Western Province",
    phone: "+250 788 309 008",
    emergencyPhone: "+250 788 309 008",
    hours: "24/7 Emergency Services",
    rating: 4.4,
    services: ["Emergency", "Maternity", "General Medicine"],
    coordinates: { lat: -1.7025, lng: 29.2569 }
  },

  // Northern Province - Musanze District
  {
    id: 10,
    name: "Ruhengeri District Hospital",
    district: "Musanze",
    sector: "Muhoza",
    location: "Musanze, Northern Province",
    phone: "+250 788 309 009",
    emergencyPhone: "+250 788 309 009",
    hours: "24/7 Emergency Services",
    rating: 4.5,
    services: ["Emergency", "Maternity", "Pediatrics", "Surgery"],
    coordinates: { lat: -1.4992, lng: 29.6344 }
  },

  // Eastern Province - Rwamagana District
  {
    id: 11,
    name: "Rwamagana District Hospital",
    district: "Rwamagana",
    sector: "Rwamagana",
    location: "Rwamagana, Eastern Province",
    phone: "+250 788 309 010",
    emergencyPhone: "+250 788 309 010",
    hours: "24/7 Emergency Services",
    rating: 4.3,
    services: ["Emergency", "Maternity", "General Medicine"],
    coordinates: { lat: -1.9486, lng: 30.4347 }
  }
];

/**
 * Get hospitals by sector
 * @param {string} district - District name
 * @param {string} sector - Sector name
 * @returns {Array} - Array of hospitals in the sector and nearby
 */
const getHospitalsBySector = (district, sector) => {
  // Find hospitals in the exact sector
  const exactMatches = HOSPITALS_DATA.filter(
    h => h.district.toLowerCase() === district.toLowerCase() && 
         h.sector.toLowerCase() === sector.toLowerCase()
  );

  // Find hospitals in the same district (nearby)
  const districtMatches = HOSPITALS_DATA.filter(
    h => h.district.toLowerCase() === district.toLowerCase() &&
         h.sector.toLowerCase() !== sector.toLowerCase()
  );

  // Combine and limit to top 5
  const results = [...exactMatches, ...districtMatches].slice(0, 5);

  // Add distance indicator (mock - in production use actual geolocation)
  return results.map((hospital, index) => ({
    ...hospital,
    distance: exactMatches.includes(hospital) ? `${(Math.random() * 2 + 0.5).toFixed(1)} km` : `${(Math.random() * 5 + 3).toFixed(1)} km`,
    isInSector: exactMatches.includes(hospital)
  }));
};

/**
 * Get all hospitals
 * @returns {Array} - Array of all hospitals
 */
const getAllHospitals = () => {
  return HOSPITALS_DATA;
};

/**
 * Search hospitals by name or location
 * @param {string} query - Search query
 * @returns {Array} - Array of matching hospitals
 */
const searchHospitals = (query) => {
  const lowerQuery = query.toLowerCase();
  return HOSPITALS_DATA.filter(h =>
    h.name.toLowerCase().includes(lowerQuery) ||
    h.location.toLowerCase().includes(lowerQuery) ||
    h.district.toLowerCase().includes(lowerQuery) ||
    h.sector.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Get nearest hospitals based on user's GPS coordinates
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} limit - Maximum number of hospitals to return (default: 10)
 * @returns {Array} - Array of nearest hospitals with distance info
 */
const getNearestHospitals = (userLat, userLon, limit = 10) => {
  // Calculate distance for each hospital
  const hospitalsWithDistance = HOSPITALS_DATA.map(hospital => {
    const distance = calculateDistance(
      userLat,
      userLon,
      hospital.coordinates.lat,
      hospital.coordinates.lng
    );
    
    return {
      ...hospital,
      distance: distance.toFixed(1), // Distance in km, rounded to 1 decimal
      distanceKm: parseFloat(distance.toFixed(1))
    };
  });

  // Sort by distance (nearest first) and limit results
  return hospitalsWithDistance
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};

module.exports = {
  HOSPITALS_DATA,
  getHospitalsBySector,
  getAllHospitals,
  searchHospitals,
  getNearestHospitals,
  calculateDistance
};
