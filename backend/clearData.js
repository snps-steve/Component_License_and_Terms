const axios = require('axios');

const clearAllData = async () => {
  try {
    const response = await axios.post('http://localhost:3001/api/bd/clear-all');
    console.log(response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error clearing all data:', error.response.data);
    } else {
      console.error('Error clearing all data:', error.message);
    }
  }
};

clearAllData();
