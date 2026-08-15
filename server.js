const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Initialize SQLite database
const db = new sqlite3.Database(':memory:'); // In-memory for Vercel, or use file for local dev

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_user_id INTEGER NOT NULL,
      from_user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (to_user_id) REFERENCES users(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id)
    )
  `);
});

// Helper: Hash password
const hashPassword = (password) => bcrypt.hashSync(password, 10);

// Helper: Compare password
const comparePassword = (password, hash) => bcrypt.compareSync(password, hash);

// Helper: Generate JWT
const generateToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

// Helper: Verify JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};

// Middleware: Check auth
const checkAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  
  req.userId = decoded.userId;
  next();
};

// ===== ROUTES =====

// 1. Sign Up
app.post('/api/auth/signup', (req, res) => {
  const { email, username, password, bio } = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const hashedPassword = hashPassword(password);

  db.run(
    `INSERT INTO users (email, username, password, bio) VALUES (?, ?, ?, ?)`,
    [email, username, hashedPassword, bio || ''],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Email or username already exists' });
      }
      const token = generateToken(this.lastID);
      res.json({ token, userId: this.lastID, username });
    }
  );
});

// 2. Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!comparePassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    res.json({ token, userId: user.id, username: user.username });
  });
});

// 3. Get all users (for search)
app.get('/api/users', (req, res) => {
  db.all(`SELECT id, username, bio FROM users`, (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

// 4. Get user profile
app.get('/api/users/:id', (req, res) => {
  db.get(`SELECT id, username, bio, created_at FROM users WHERE id = ?`, [req.params.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// 5. Post review
app.post('/api/reviews', checkAuth, (req, res) => {
  const { to_user_id, text } = req.body;
  const from_user_id = req.userId;

  if (!to_user_id || !text) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  db.run(
    `INSERT INTO reviews (to_user_id, from_user_id, text) VALUES (?, ?, ?)`,
    [to_user_id, from_user_id, text],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, to_user_id, from_user_id, text });
    }
  );
});

// 6. Get reviews for a user
app.get('/api/reviews/:user_id', (req, res) => {
  db.all(
    `SELECT r.id, r.text, r.created_at, u.username as from_user FROM reviews r 
     JOIN users u ON r.from_user_id = u.id WHERE r.to_user_id = ? ORDER BY r.created_at DESC`,
    [req.params.user_id],
    (err, reviews) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(reviews);
    }
  );
});

// 7. Get current user (check auth)
app.get('/api/auth/me', checkAuth, (req, res) => {
  db.get(`SELECT id, username, email, bio FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
