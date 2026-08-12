-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('parent', 'student')),
  class_level VARCHAR(50) CHECK(class_level IN ('11th', '12th')), -- Nullable for parent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent-student linking table (Many-to-Many)
CREATE TABLE IF NOT EXISTS parent_student_links (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, student_id)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Syllabus Chapters table
CREATE TABLE IF NOT EXISTS syllabus_chapters (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_level VARCHAR(50) NOT NULL CHECK(class_level IN ('11th', '12th')),
  chapter_name VARCHAR(255) NOT NULL,
  chapter_order INTEGER NOT NULL,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Syllabus Topics table
CREATE TABLE IF NOT EXISTS syllabus_topics (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES syllabus_chapters(id) ON DELETE CASCADE,
  topic_name VARCHAR(255) NOT NULL,
  topic_order INTEGER NOT NULL,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Student Topic Progress table
CREATE TABLE IF NOT EXISTS student_topic_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES syllabus_topics(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed', 'revision')),
  added_by VARCHAR(50) NOT NULL DEFAULT 'master' CHECK(added_by IN ('master', 'parent', 'student')),
  is_hidden INTEGER NOT NULL DEFAULT 0 CHECK(is_hidden IN (0, 1)),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, topic_id)
);

-- Daily Study Logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date VARCHAR(50) NOT NULL, -- YYYY-MM-DD
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES syllabus_chapters(id) ON DELETE SET NULL,
  sums_solved INTEGER NOT NULL DEFAULT 0,
  sums_correct INTEGER DEFAULT 0,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent Custom Syllabus Notes/Files Upload table
CREATE TABLE IF NOT EXISTS parent_uploads (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id INTEGER REFERENCES syllabus_chapters(id) ON DELETE SET NULL,
  content_type VARCHAR(50) NOT NULL CHECK(content_type IN ('text', 'file')),
  text_content TEXT,
  file_url TEXT,
  note TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
  sums_completed INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Tests table
CREATE TABLE IF NOT EXISTS weekly_tests (
  id SERIAL PRIMARY KEY,
  created_by_parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  syllabus_scope TEXT NOT NULL, -- JSON string representation of chapter IDs
  test_date VARCHAR(50) NOT NULL, -- YYYY-MM-DD
  total_marks INTEGER NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Assignments table
CREATE TABLE IF NOT EXISTS test_assignments (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES weekly_tests(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(test_id, student_id)
);

-- Test Results table
CREATE TABLE IF NOT EXISTS test_results (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES weekly_tests(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  subject_breakdown TEXT NOT NULL, -- JSON string
  weak_topics TEXT,
  answer_sheet_file_url TEXT,
  time_taken_minutes INTEGER,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(test_id, student_id)
);
