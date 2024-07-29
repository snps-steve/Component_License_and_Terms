
// database/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'bdDatabase.db');
const IV_LENGTH = 16; // For AES, this is always 16
const MAX_RETRIES = process.env.MAX_RETRIES || 5;
const RETRY_DELAY = process.env.RETRY_DELAY || 100; // in milliseconds

const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex'); // 256 bits
};

const encrypt = (text, key) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text, key) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv); // Define decipher
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

const runWithRetry = (stmt, params) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const run = () => {
      stmt.run(params, function (err) {
        if (err && err.code === 'SQLITE_BUSY' && attempts < MAX_RETRIES) {
          attempts++;
          setTimeout(run, RETRY_DELAY);
        } else if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    };

    run();
  });
};

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        db.serialize(() => {
          db.run(`
            CREATE TABLE IF NOT EXISTS credentials (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              url TEXT,
              token TEXT,
              encryption_key TEXT
            )
          `);

          db.run(`
            CREATE TABLE IF NOT EXISTS licenses (
              id TEXT PRIMARY KEY,
              name TEXT,
              licenseFamily TEXT,
              ownership TEXT,
              licenseStatus TEXT,
              licenseSource TEXT,
              inUse BOOLEAN
            )
          `);

          db.run(`
            CREATE TABLE IF NOT EXISTS license_terms (
              licenseId TEXT,
              name TEXT,
              description TEXT,
              responsibility TEXT,
              PRIMARY KEY (licenseId, name)
            )
          `, (err) => {
            if (err) {
              reject(err);
            } else {
              db.run(`CREATE INDEX IF NOT EXISTS idx_license_name ON licenses(name)`, (err) => {
                if (err) {
                  reject(err);
                } else {
                  db.all(`PRAGMA table_info(credentials)`, [], (err, columns) => {
                    if (err) {
                      reject(err);
                    } else {
                      const hasEncryptionKey = columns.some(col => col.name === 'encryption_key');
                      if (!hasEncryptionKey) {
                        db.run(`ALTER TABLE credentials ADD COLUMN encryption_key TEXT`, (err) => {
                          if (err) {
                            reject(err);
                          } else {
                            resolve(db);
                          }
                        });
                      } else {
                        resolve(db);
                      }
                    }
                  });
                }
              });
            }
          });
        });
      }
    });
  });
};

const getCredentialsFromDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get(`SELECT url, token, encryption_key FROM credentials LIMIT 1`, [], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const key = row.encryption_key;
        resolve({
          url: decrypt(row.url, key),
          token: decrypt(row.token, key),
          encryption_key: key
        });
      } else {
        resolve(null);
      }
    });
    db.close();
  });
};

const updateCredentials = (url, token) => {
  const encryptionKey = generateEncryptionKey();
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run(`DELETE FROM credentials`);
      db.run(`INSERT INTO credentials (url, token, encryption_key) VALUES (?, ?, ?)`,
        [encrypt(url, encryptionKey), encrypt(token, encryptionKey), encryptionKey], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
    db.close();
  });
};

const clearCredentials = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.run(`DELETE FROM credentials`, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    db.close();
  });
};

const saveCredentialsToDatabase = async (url, token) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO credentials (id, url, token) VALUES (1, ?, ?)`,
      [url, token],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve();
      }
    );
  });
};

const getLicenseCount = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get(`SELECT COUNT(*) as count FROM licenses`, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
    db.close();
  });
};

const saveLicensesToDatabase = async (licenses) => {
  const db = new sqlite3.Database(dbPath);

  await new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO licenses (id, name, licenseFamily, ownership, licenseStatus, licenseSource, inUse)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const license of licenses) {
          await runWithRetry(stmt, [
            license.id,
            license.name,
            license.licenseFamily ? license.licenseFamily : 'N/A',
            license.ownership,
            license.licenseStatus,
            license.licenseSource,
            license.inUse
          ]);
        }

        stmt.finalize((err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  });

  db.close();
};

const saveLicenseTermsToDatabase = async (licenseTerms) => {
  const db = new sqlite3.Database(dbPath);

  await new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO license_terms (licenseId, name, description, responsibility)
          VALUES (?, ?, ?, ?)
        `);

        for (const term of licenseTerms) {
          await runWithRetry(stmt, [
            term.licenseId,
            term.name,
            term.description,
            term.responsibility
          ]);
        }

        stmt.finalize((err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  });

  db.close();
};

const fetchLicensesFromDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.all(`SELECT * FROM licenses`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });

    db.close();
  });
};

const fetchPaginatedLicensesFromDatabase = async (limit, offset, search, sortField, sortOrder) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    const searchCondition = search ? `WHERE name LIKE ?` : '';
    const query = `
      SELECT * FROM licenses
      ${searchCondition}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const totalCountQuery = `
      SELECT COUNT(*) as totalCount FROM licenses
      ${searchCondition}
    `;

    const queryParams = search ? [`%${search}%`, limit, offset] : [limit, offset];
    const totalCountParams = search ? [`%${search}%`] : [];

    db.all(query, queryParams, (err, licenses) => {
      if (err) {
        reject(err);
        return;
      }

      db.get(totalCountQuery, totalCountParams, (err, totalCountResult) => {
        if (err) {
          reject(err);
          return;
        }

        const totalCount = totalCountResult.totalCount;
        resolve({ licenses, totalCount });
      });
    });
  });
};

const fetchLicenseTermsFromDatabase = (licenseId) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.all(`SELECT * FROM license_terms WHERE licenseId = ?`, [licenseId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });

    db.close();
  });
};

const clearLicensesFromDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run(`DELETE FROM licenses`, (err) => {
        if (err) {
          reject(err);
        }
      });
      db.run(`DELETE FROM license_terms`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    db.close();
  });
};

module.exports = {
  initializeDatabase,
  getCredentialsFromDatabase,
  clearCredentials,
  updateCredentials,
  saveCredentialsToDatabase,
  getLicenseCount,
  saveLicensesToDatabase,
  saveLicenseTermsToDatabase,
  fetchLicensesFromDatabase,
  fetchPaginatedLicensesFromDatabase,
  fetchLicenseTermsFromDatabase,
  clearLicensesFromDatabase
};