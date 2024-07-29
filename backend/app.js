const express = require('express');
const bodyParser = require('body-parser');
const bdRoutes = require('./routes/bd');
const { initializeDatabase, getCredentials, getCredentialsFromDatabase } = require('./database/database');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(bodyParser.json());
app.use('/api/bd', bdRoutes);

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

const logMemoryUsage = () => {
  const used = process.memoryUsage();
  for (let key in used) {
    logger.info(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
};

setInterval(logMemoryUsage, 60000); // Log memory usage every 60 seconds

initializeDatabase().then(async () => {
  try {
    const credentials = await getCredentialsFromDatabase();

    if (!credentials) {
      logger.info('No credentials found. Please provide credentials via the UI.');
    } else {
      logger.info('Credentials found. Starting application without license initialization.');
    }

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (err) {
    logger.error('Failed to initialize:', err);
    app.listen(port, () => {
      logger.info(`Server running on port ${port} but initialization failed`);
    });
  }
}).catch(err => {
  logger.error('Failed to initialize the database:', err);
});

module.exports = app;
