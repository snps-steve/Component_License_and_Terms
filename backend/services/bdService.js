const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'bdDatabase.db');

const {
  saveLicensesToDatabase,
  saveLicenseTermsToDatabase,
  clearLicensesFromDatabase,
  fetchLicensesFromDatabase,
} = require('../database/database');

const MAX_RETRIES = 5;
const RETRY_DELAY = 100; // in milliseconds

// Function to authenticate and obtain bearer token and csrf token
const authenticate = async (url, token) => {
  console.log('Authenticating with URL:', url);
  try {
    const authResponse = await axios.post(`${url}/api/tokens/authenticate`, {}, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.blackducksoftware.user-4+json'
      }
    });

    const bearerToken = authResponse.data.bearerToken;
    const csrfToken = authResponse.headers['x-csrf-token'];

    console.log('Authentication response:', authResponse.data);

    // Store tokens globally or in a higher scope variable
    global.bearerToken = bearerToken;
    global.csrfToken = csrfToken;

    return { bearerToken, csrfToken };
  } catch (error) {
    if (error.response) {
      console.error('Error response from authentication:', error.response);
      throw new Error(`Authentication failed: ${error.response.status} ${error.response.statusText}`);
    } else {
      console.error('Error during authentication:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
};

// Function to fetch data from a URL
const getUrl = async (method, url, headers, payload) => {
  try {
    const response = await axios.request({
      method,
      url,
      headers,
      data: payload,
      validateStatus: (status) => status < 500
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error(`HTTP error: ${response.status}`);
      console.error(response.data);
      throw new Error(`HTTP error: ${response.status}`);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    throw new Error(`Request failed: ${error.message}`);
  }
};

// Function to fetch licenses and store them in the database
const fetchAndStoreLicenses = async (url, token) => {
  const licenses = [];
  const headers = {
    'Authorization': `Bearer ${token.bearerToken}`,
    'X-CSRF-TOKEN': token.csrfToken,
    'Accept': 'application/vnd.blackducksoftware.bill-of-materials-6+json'
  };

  let limit = 100;
  let offset = 0;

  try {
    while (true) {
      const licenseUrl = `${url}/api/license-dashboard?limit=${limit}&offset=${offset}`;
      console.log(`Fetching licenses from URL: ${licenseUrl}`);
      const response = await getUrl('GET', licenseUrl, headers, null);

      // Pretty-print the raw response data
      prettyPrint(response);

      for (const license of response.items) {
        const licenseId = license._meta?.href?.split('/').pop();
        const termsUrl = `${url}/api/licenses/${licenseId}/license-terms`;

        if (licenseId) {
          const licenseData = {
            id: licenseId,
            name: license.name,
            ownership: license.ownership,
            inUse: license.inUse,
            licenseFamily: license.licenseFamily?.name,
            licenseSource: license.licenseSource,
            licenseStatus: license.licenseStatus,
            termsUrl: termsUrl
          };

          // Log the variables
          console.log('licenseId: ', licenseId);
          console.log('license name: ', license.name);
          console.log('license ownership: ', license.ownership);
          console.log('license inUse: ', license.inUse);
          console.log('license licenseFamily: ', license.licenseFamily?.name);
          console.log('license licenseSource: ', license.licenseSource);
          console.log('license licenseStatus: ', license.licenseStatus);
          console.log('termsUrl: ', termsUrl);

          licenses.push(licenseData);
        } else {
          console.warn(`Skipping license due to missing information: ${JSON.stringify(license, null, 2)}`);
        }
      }

      if (response.items.length < limit) {
        break;
      }
      offset += limit;
    }

    console.log('Clearing existing licenses from database...');
    await clearLicensesFromDatabase();
    console.log('Existing licenses cleared.');

    console.log('Saving new licenses to database...');
    for (const license of licenses) {
      console.log(`Saving license to database: ${JSON.stringify(license, null, 2)}`);
    }
    await saveLicensesToDatabase(licenses);
    console.log('New licenses saved.');

  } catch (error) {
    console.error('Error fetching licenses:', error.message);
    throw new Error(`Failed to fetch licenses: ${error.message}`);
  }

  return licenses;
};

// Function to fetch license terms for each license and store them in the database
const fetchAndStoreLicenseTermsInBackground = async () => {
  try {
    const licenses = await fetchLicensesFromDatabase();
    for (const license of licenses) {
      const termsUrl = license.termsUrl;
      console.log(`Fetching terms for license: ${license.id} from URL: ${termsUrl}`);
      try {
        const terms = await fetchLicenseTerms(termsUrl, { bearerToken: global.bearerToken, csrfToken: global.csrfToken });
        const termsWithLicenseId = terms.map(term => ({ ...term, licenseId: license.id }));
        console.log(`Fetched terms for license ${license.id}:`, termsWithLicenseId);
        await saveLicenseTermsToDatabase(termsWithLicenseId);
        console.log(`Successfully fetched and stored terms for license: ${license.id}`);
      } catch (error) {
        console.error(`Failed to fetch license terms for license ${license.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error fetching licenses from the database:', error.message);
    throw new Error(`Failed to fetch licenses from the database: ${error.message}`);
  }
};

// Function to fetch license terms
const fetchLicenseTerms = async (termsUrl, token) => {
  const headers = {
    'Authorization': `Bearer ${token.bearerToken}`,
    'X-CSRF-TOKEN': token.csrfToken,
    'Accept': 'application/vnd.blackducksoftware.component-detail-5+json'
  };

  try {
    console.log(`Fetching license terms from URL: ${termsUrl}`);
    const response = await getUrl('GET', termsUrl, headers, null);

    // Pretty-print the raw response data
    prettyPrint(response);

    const terms = response.items.map(term => {
      // Log the variables
      console.log('name: ', term.name);
      console.log('description: ', term.description);
      console.log('responsibility: ', term.responsibility);
      console.log('associationSource: ', term.associationSource);
      console.log('deactivated: ', term.deactivated);
      console.log('fulfillmentRequired: ', term.fulfillmentRequired);

      return {
        name: term.name,
        description: term.description,
        responsibility: term.responsibility,
        associationSource: term.associationSource,
        deactivated: term.deactivated,
        fulfillmentRequired: term.fulfillmentRequired
      };
    });

    return terms;
  } catch (error) {
    console.error(`Error fetching license terms from ${termsUrl}:`, error.message);
    throw new Error(`Failed to fetch license terms: ${error.message}`);
  }
};

// Function to pretty-print JSON objects
const prettyPrint = (json) => {
  console.log(JSON.stringify(json, null, 2));
};

module.exports = { authenticate, fetchAndStoreLicenses, fetchAndStoreLicenseTermsInBackground, fetchLicenseTerms };
