const { updateCredentials } = require('../database/database');

const setupMiddleware = async (req, res, next) => {
  const { url, token } = req.body;

  try {
    await updateCredentials(url, token);
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Error in setup process:', error);
    res.status(500).send({ success: false, error: error.message });
  }
};

module.exports = setupMiddleware;

