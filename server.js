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
// Gunakan path absolut untuk memastikan database bisa diakses saat deploy di VPS
const dbPath = path.resolve(__dirname, 'locations.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
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
    `, (err) => {
      if (err) console.error('Error creating table:', err);
    });
  }
});

// API Endpoint to receive location
app.post('/api/location', (req, res) => {
  const { lat, lng } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  // Ambil IP dari proxy jika ada (seperti Nginx di VPS)
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const query = `INSERT INTO locations (lat, lng, user_agent, ip_address) VALUES (?, ?, ?, ?)`;
  db.run(query, [lat, lng, userAgent, ipAddress], function(err) {
    if (err) {
      console.error('Error inserting location:', err);
      return res.status(500).json({ error: 'Failed to save location' });
    }
    console.log(`Location saved: ID ${this.lastID}, Lat ${lat}, Lng ${lng}`);
    res.status(200).json({ success: true, id: this.lastID });
  });
});

// Serve static frontend files (React Build)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
