import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { run, get } from '../database/db.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'iit_prep_tracker_secret_key_2026';

// Helper to generate a 6-character random student code (e.g. IIT-7A9F2C)
function generateStudentCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, 0, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return `IIT-${code}`;
}

// REGISTER ENDPOINT
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role, classLevel } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  if (role !== 'parent' && role !== 'student') {
    return res.status(400).json({ error: 'Role must be either parent or student.' });
  }

  if (role === 'student' && !classLevel) {
    return res.status(400).json({ error: 'Class level (11th or 12th) is required for students.' });
  }

  try {
    // Check if user already exists
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertResult = await run(
      'INSERT INTO users (name, email, phone, password_hash, role, class_level) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, passwordHash, role, role === 'student' ? classLevel : null]
    );
    const userId = insertResult.id;

    let studentCode = null;
    if (role === 'student') {
      // Loop to guarantee code uniqueness
      let codeExists = true;
      while (codeExists) {
        studentCode = generateStudentCode();
        const codeCheck = await get('SELECT user_id FROM student_profiles WHERE student_code = ?', [studentCode]);
        if (!codeCheck) {
          codeExists = false;
        }
      }

      // Save student profile
      await run('INSERT INTO student_profiles (user_id, student_code) VALUES (?, ?)', [userId, studentCode]);
    }

    // Generate token
    const token = jwt.sign(
      { id: userId, name, email, role, classLevel: role === 'student' ? classLevel : null },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        name,
        email,
        role,
        classLevel: role === 'student' ? classLevel : null,
        studentCode
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Database error occurred during registration.' });
  }
});

// LOGIN ENDPOINT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let studentCode = null;
    if (user.role === 'student') {
      const profile = await get('SELECT student_code FROM student_profiles WHERE user_id = ?', [user.id]);
      if (profile) {
        studentCode = profile.student_code;
      }
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, classLevel: user.class_level },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        classLevel: user.class_level,
        studentCode
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Database error occurred during login.' });
  }
});

// GET PROFILE ENDPOINT
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, phone, role, class_level, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let studentCode = null;
    if (user.role === 'student') {
      const profile = await get('SELECT student_code FROM student_profiles WHERE user_id = ?', [user.id]);
      if (profile) {
        studentCode = profile.student_code;
      }
    }

    res.json({
      user: {
        ...user,
        studentCode
      }
    });
  } catch (err) {
    console.error('Profile retrieval error:', err.message);
    res.status(500).json({ error: 'Database error occurred retrieving profile.' });
  }
});

export default router;
