const express = require('express');
const asyncHandler = require('express-async-handler');
const {
  saveCredentialsToDatabase,
  getCredentialsFromDatabase,
  clearCredentials,
  fetchLicensesFromDatabase,
  fetchLicenseTermsFromDatabase,
  saveLicensesToDatabase,
  clearLicensesFromDatabase,
  fetchPaginatedLicensesFromDatabase,
  getLicenseCount,
} = require('../database/database');
const { authenticate, fetchAndStoreLicenses, fetchAndStoreLicenseTermsInBackground } = require('../services/bdService');
const router = express.Router();

router.get('/credentials', asyncHandler(async (req, res) => {
  try {
    const credentials = await getCredentialsFromDatabase();
    if (credentials) {
      res.status(200).json(credentials);
    } else {
      res.status(404).json({ error: 'No credentials found' });
    }
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
}));

router.post('/test-credentials', asyncHandler(async (req, res) => {
  const { url, token } = req.body;
  try {
    const isValid = await testCredentials(url, token);
    if (isValid) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error testing credentials:', error);
    res.status(500).json({ error: 'Failed to test credentials' });
  }
}));

// Function to test the credentials
const testCredentials = async (url, token) => {
  try {
    const { bearerToken, csrfToken } = await authenticate(url, token);
    // If tokens are obtained, credentials are valid
    return true;
  } catch (error) {
    console.error('Error testing credentials:', error.message);
    return false;
  }
};

router.post('/save-credentials', asyncHandler(async (req, res) => {
  const { url, token } = req.body;
  try {
    await saveCredentialsToDatabase(url, token);
    res.status(200).json({ success: 'Credentials saved' });
  } catch (error) {
    console.error('Error saving credentials:', error);
    res.status(500).json({ error: 'Failed to save credentials' });
  }
}));

router.post('/clear-credentials', asyncHandler(async (req, res) => {
  const { url, token } = req.body;
  try {
    await clearCredentials(url, token);
    res.status(200).json({ success: 'Credentials cleared' });
  } catch (error) {
    console.error('Error clearing credentials:', error);
    res.status(500).json({ error: 'Failed to clear credentials' });
  }
}));

router.get('/licenses', asyncHandler(async (req, res) => {
  try {
    const { limit, offset, search, sortField, sortOrder } = req.query;
    console.log('Fetching paginated licenses from database...');
    
    // Fetch paginated licenses and the total count of licenses
    const { licenses, totalCount } = await fetchPaginatedLicensesFromDatabase(
      parseInt(limit, 10),
      parseInt(offset, 10),
      search || '',
      sortField || 'name',
      sortOrder || 'asc'
    );

    console.log('Licenses fetched:', licenses);
    res.status(200).json({ licenses, totalCount });
  } catch (error) {
    console.error('Failed to fetch paginated licenses:', error);
    res.status(500).json({ error: `Failed to fetch paginated licenses: ${error.message}` });
  }
}));

router.get('/licenses/count', asyncHandler(async (req, res) => {
  try {
    const counts = await getLicenseCount();
    console.log('License counts fetched:', counts);
    res.status(200).json(counts);
  } catch (error) {
    console.error('Failed to fetch license counts:', error);
    res.status(500).json({ error: `Failed to fetch license counts: ${error.message}` });
  }
}));

module.exports = router;

router.post('/clear-licenses', asyncHandler(async (req, res) => {
  try {
    console.log('Clearing all licenses from database...');
    await clearLicensesFromDatabase();
    console.log('Licenses cleared.');
    res.status(200).json({ success: 'All licenses cleared' });
  } catch (error) {
    console.error('Failed to clear licenses:', error);
    res.status(500).json({ error: `Failed to clear licenses: ${error.message}` });
  }
}));

router.post('/save-licenses', asyncHandler(async (req, res) => {
  try {
    console.log('Saving licenses to database...');
    await saveLicensesToDatabase();
    console.log('Licenses saved.');
    res.status(200).json({ success: 'All licenses saved' });
  } catch (error) {
    console.error('Failed to save licenses:', error);
    res.status(500).json({ error: `Failed to save licenses: ${error.message}` });
  }
}));

router.post('/load-licenses', asyncHandler(async (req, res) => {
  try {
    console.log('Fetching stored credentials...');
    const credentials = await getCredentialsFromDatabase();
    if (!credentials) {
      console.error('No stored credentials found');
      return res.status(400).send({ error: 'No stored credentials found' });
    }

    const { url, token } = credentials;
    console.log('Credentials found. Authenticating with external service...');
    const authData = await authenticate(url, token);
    console.log('Authentication successful.');
    
    console.log('Fetching licenses...');
    const licenses = await fetchAndStoreLicenses(url, authData);
    console.log('Fetched licenses:', licenses.length);

    console.log('Fetching and storing license terms in the background...');
    fetchAndStoreLicenseTermsInBackground(authData).catch(error => {
      console.error('Failed to fetch license terms in the background:', error);
    });

    console.log('Licenses loaded successfully');
    res.status(200).send({ success: 'Licenses loaded successfully', licenseCount: licenses.length });
  } catch (error) {
    console.error('Failed to load licenses:', error.message);
    res.status(500).send({ error: `Failed to load licenses: ${error.message}` });
  }
}));

router.get('/licenses/:licenseId/terms', async (req, res) => {
  const { licenseId } = req.params;
  try {
    const terms = await fetchLicenseTermsFromDatabase(licenseId);
    res.json(terms);
  } catch (error) {
    console.error(`Failed to fetch terms for license ${licenseId}:`, error);
    res.status(500).json({ error: `Failed to fetch terms for license ${licenseId}` });
  }
});

module.exports = router;
