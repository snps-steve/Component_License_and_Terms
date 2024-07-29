const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => rl.question(question, resolve));
};

const resetCredentials = async () => {
  const url = await askQuestion('Enter the new Black Duck URL: ');
  const token = await askQuestion('Enter the new API token: ');

  try {
    const response = await axios.post('http://localhost:3001/api/bd/reset-credentials', { url, token });
    console.log(response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error resetting credentials:', error.response.data);
    } else {
      console.error('Error resetting credentials:', error.message);
    }
  } finally {
    rl.close();
  }
};

resetCredentials();

