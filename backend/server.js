import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { initDb, query } from './database/db.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import parentRoutes from './routes/parent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors());

// Body parser
app.use(express.json());

// Ensure the local uploads folder exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration for local file uploads (PDFs, images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep extension, sanitise filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// File Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Returns path that can be requested statically
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    message: 'File uploaded successfully',
    fileUrl
  });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Retrieve list of subjects (Common for drop-downs in frontend)
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await query('SELECT * FROM subjects ORDER BY id');
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: 'Database error retrieving subjects.' });
  }
});

// Retrieve list of chapters (Common for scope tagging in frontend)
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
    res.status(500).json({ error: 'Database error retrieving chapters.' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Initialize database and start listening
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`IIT Prep Tracker backend server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start backend server:', err.message);
    process.exit(1);
  }
};

startServer();
