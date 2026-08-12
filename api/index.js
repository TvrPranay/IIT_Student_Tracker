import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { put } from '@vercel/blob';
import dotenv from 'dotenv';
import { query } from './database/db.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import parentRoutes from './routes/parent.js';

// Load local environmental variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer memory storage setup (Vercel serverless has a read-only filesystem)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// File Upload endpoint using Vercel Blob cloud storage
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Upload memory buffer directly to Vercel Blob
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    res.json({
      message: 'File uploaded successfully to cloud storage',
      fileUrl: blob.url // Secure CDN URL
    });
  } catch (err) {
    console.error('Vercel Blob upload error:', err.message);
    res.status(500).json({ error: 'Cloud storage upload failed.' });
  }
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Retrieve list of subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await query('SELECT * FROM subjects ORDER BY id');
    res.json({ subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error retrieving subjects.' });
  }
});

// Retrieve list of chapters
app.get('/api/chapters', async (req, res) => {
  try {
    const chapters = await query(`
      SELECT c.*, s.name as subject_name 
      FROM syllabus_chapters c 
      JOIN subjects s ON c.subject_id = s.id 
      ORDER BY c.subject_id, c.class_level, c.chapter_order
    `);
    res.json({ chapters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error retrieving chapters.' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start Express listener in local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`IIT Prep Tracker local backend server running on port ${PORT}`);
  });
}

export default app;
