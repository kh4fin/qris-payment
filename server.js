import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbPath = path.resolve(__dirname, 'locations.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    // Create table if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
});

// API Endpoint to receive location
app.post('/api/location', (req, res) => {
  const { lat, lng } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const query = `INSERT INTO locations (lat, lng, user_agent, ip_address) VALUES (?, ?, ?, ?)`;
  db.run(query, [lat, lng, userAgent, ipAddress], function(err) {
    if (err) {
      console.error('Error inserting location', err);
      return res.status(500).json({ error: 'Failed to save location' });
    }
    console.log(`Location saved: ID ${this.lastID}, Lat ${lat}, Lng ${lng}`);
    res.status(200).json({ success: true, id: this.lastID });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
