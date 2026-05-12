import express from 'express';
import Database from 'better-sqlite3';
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

// Initialize Better-SQLite3 Database
const dbPath = path.resolve(__dirname, 'locations.db');
const db = new Database(dbPath);
console.log('Connected to Better-SQLite3 database at:', dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API Endpoint to receive location
app.post('/api/location', (req, res) => {
  const { lat, lng } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO locations (lat, lng, user_agent, ip_address) 
      VALUES (?, ?, ?, ?)
    `);
    const info = insert.run(lat, lng, userAgent, ipAddress);
    
    console.log(`Location saved: ID ${info.lastInsertRowid}, Lat ${lat}, Lng ${lng}`);
    res.status(200).json({ success: true, id: Number(info.lastInsertRowid) });
  } catch (err) {
    console.error('Error inserting location:', err);
    res.status(500).json({ error: 'Failed to save location' });
  }
});

// Serve static frontend files (React Build)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback for SPA routing
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
