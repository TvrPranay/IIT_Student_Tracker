-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('parent', 'student')),
  class_level TEXT CHECK(class_level IN ('11th', '12th')), -- Nullable for parent
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Student profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id INTEGER PRIMARY KEY,
  student_code TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Parent-student linking table (Many-to-Many)
CREATE TABLE IF NOT EXISTS parent_student_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Syllabus Chapters table (with custom student chapter support)
CREATE TABLE IF NOT EXISTS syllabus_chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  class_level TEXT NOT NULL CHECK(class_level IN ('11th', '12th')),
  chapter_name TEXT NOT NULL,
  chapter_order INTEGER NOT NULL,
  student_id INTEGER, -- Nullable. If populated, this chapter is custom to that student
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Syllabus Topics table (with custom student topic support)
CREATE TABLE IF NOT EXISTS syllabus_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  topic_name TEXT NOT NULL,
  topic_order INTEGER NOT NULL,
  student_id INTEGER, -- Nullable. If populated, this topic is custom to that student
  FOREIGN KEY (chapter_id) REFERENCES syllabus_chapters(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student Topic Progress table (with added_by and is_hidden columns)
CREATE TABLE IF NOT EXISTS student_topic_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed', 'revision')),
  added_by TEXT NOT NULL DEFAULT 'master' CHECK(added_by IN ('master', 'parent', 'student')),
  is_hidden INTEGER NOT NULL DEFAULT 0 CHECK(is_hidden IN (0, 1)),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES syllabus_topics(id) ON DELETE CASCADE,
  UNIQUE(student_id, topic_id)
);

-- Daily Study Logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  log_date TEXT NOT NULL, -- YYYY-MM-DD
  subject_id INTEGER NOT NULL,
  chapter_id INTEGER, -- Nullable
  sums_solved INTEGER NOT NULL DEFAULT 0,
  sums_correct INTEGER DEFAULT 0,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES syllabus_chapters(id) ON DELETE SET NULL
);

-- Parent Custom Syllabus Notes/Files Upload table
CREATE TABLE IF NOT EXISTS parent_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  subject_id INTEGER,
  chapter_id INTEGER,
  content_type TEXT NOT NULL CHECK(content_type IN ('text', 'file')),
  text_content TEXT,
  file_url TEXT,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
  sums_completed INTEGER DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (chapter_id) REFERENCES syllabus_chapters(id) ON DELETE SET NULL
);

-- Weekly Tests table (created_by_parent_id is made nullable to support student self-logged tests)
CREATE TABLE IF NOT EXISTS weekly_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_by_parent_id INTEGER, -- Nullable if logged by student
  title TEXT NOT NULL,
  subject_id INTEGER, -- Nullable if multi-subject
  syllabus_scope TEXT NOT NULL, -- JSON string representation of chapter IDs e.g. '[1, 2]'
  test_date TEXT NOT NULL, -- YYYY-MM-DD
  total_marks INTEGER NOT NULL,
  file_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_parent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- Test Assignments table
CREATE TABLE IF NOT EXISTS test_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  FOREIGN KEY (test_id) REFERENCES weekly_tests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(test_id, student_id)
);

-- Test Results table
CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  subject_breakdown TEXT NOT NULL, -- JSON string e.g. '[{"subject":"Maths", "marks":10, "maxMarks":100, "correct":5, "incorrect":2, "unattempted":3}]'
  weak_topics TEXT,
  answer_sheet_file_url TEXT,
  time_taken_minutes INTEGER, -- Student duration
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES weekly_tests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(test_id, student_id)
);
