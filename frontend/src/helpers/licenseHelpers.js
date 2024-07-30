// src/helpers/licenseHelper.js
const {
    fetchPaginatedLicensesFromDatabase,
    getLicenseCount
  } = require('../../database/database.js'); // Adjust the path as needed
  
  const getLicenseData = async (limit, offset, search, sortField, sortOrder) => {
    try {
      const licensesData = await fetchPaginatedLicensesFromDatabase(limit, offset, search, sortField, sortOrder);
      const counts = await getLicenseCount();
      return { licensesData, counts };
    } catch (error) {
      throw new Error('Error fetching license data: ' + error.message);
    }
  };
  
  module.exports = { getLicenseData };
  