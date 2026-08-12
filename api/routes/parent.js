import express from 'express';
import { run, query, get } from '../database/db.js';
import { authenticateJWT, isParent } from '../middleware/auth.js';

const router = express.Router();

// Apply parent auth guard to all routes here
router.use(authenticateJWT);
router.use(isParent);

// Memory cache to rate-limit code entry attempts to prevent brute-forcing student codes
const linkAttempts = {};

// 1. LINK STUDENT USING CODE
router.post('/link', async (req, res) => {
  const parentId = req.user.id;
  const { studentCode } = req.body;

  if (!studentCode) {
    return res.status(400).json({ error: 'Student Code is required.' });
  }

  // Rate limit check
  const now = Date.now();
  if (linkAttempts[parentId] && linkAttempts[parentId].lockUntil > now) {
    const minutesLeft = Math.ceil((linkAttempts[parentId].lockUntil - now) / 60000);
    return res.status(429).json({ 
      error: `Too many failed attempts. Linking capability locked. Try again in ${minutesLeft} minutes.` 
    });
  }

  // Format code to uppercase and trim
  const cleanCode = studentCode.trim().toUpperCase();

  try {
    // Find student profile by code
    const profile = await get('SELECT user_id FROM student_profiles WHERE student_code = ?', [cleanCode]);
    if (!profile) {
      // Record failed attempt
      if (!linkAttempts[parentId]) {
        linkAttempts[parentId] = { count: 0, lockUntil: 0 };
      }
      linkAttempts[parentId].count++;
      
      if (linkAttempts[parentId].count >= 5) {
        linkAttempts[parentId].lockUntil = now + 15 * 60 * 1000; // 15-minute lock
        linkAttempts[parentId].count = 0; // reset counter
        return res.status(429).json({ 
          error: 'Too many failed linking attempts. Linking capability locked for 15 minutes.' 
        });
      }
      
      const attemptsLeft = 5 - linkAttempts[parentId].count;
      return res.status(404).json({ 
        error: `Invalid Student Code. ${attemptsLeft} attempts remaining before lock.` 
      });
    }
    const studentId = profile.user_id;

    // Check if link already exists
    const existingLink = await get(
      'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );
    if (existingLink) {
      return res.status(400).json({ error: 'You are already linked to this student.' });
    }

    // Insert new link
    await run(
      'INSERT INTO parent_student_links (parent_id, student_id) VALUES (?, ?)',
      [parentId, studentId]
    );

    // Reset failed attempts on success
    if (linkAttempts[parentId]) {
      delete linkAttempts[parentId];
    }

    // Get student details
    const student = await get('SELECT id, name, email, class_level FROM users WHERE id = ?', [studentId]);

    res.status(201).json({
      message: 'Student linked successfully!',
      student
    });
  } catch (err) {
    console.error('Linking error:', err.message);
    res.status(500).json({ error: 'Database error occurred during linking.' });
  }
});

// 2. REMOVE STUDENT LINK
router.delete('/link/:studentId', async (req, res) => {
  const parentId = req.user.id;
  const { studentId } = req.params;

  try {
    const result = await run(
      'DELETE FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Link not found.' });
    }

    res.json({ message: 'Link removed successfully.' });
  } catch (err) {
    console.error('Unlinking error:', err.message);
    res.status(500).json({ error: 'Database error during link removal.' });
  }
});

// 3. GET ALL LINKED STUDENTS
router.get('/students', async (req, res) => {
  const parentId = req.user.id;

  try {
    const students = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.class_level, p.student_code, l.linked_at
      FROM users u
      JOIN parent_student_links l ON u.id = l.student_id
      JOIN student_profiles p ON u.id = p.user_id
      WHERE l.parent_id = ?
      ORDER BY u.name
    `, [parentId]);

    res.json({ students });
  } catch (err) {
    console.error('Get students error:', err.message);
    res.status(500).json({ error: 'Database error fetching students.' });
  }
});

// Helper: Reuse student streak calculator
async function getStudentStreak(studentId) {
  const logs = await query(
    'SELECT DISTINCT log_date FROM daily_logs WHERE student_id = ? ORDER BY log_date DESC',
    [studentId]
  );
  if (logs.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const logDates = logs.map(l => l.log_date);
  if (!logDates.includes(todayStr) && !logDates.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let currentDate = logDates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);

  while (true) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const checkStr = `${year}-${month}-${day}`;

    if (logDates.includes(checkStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// 4. GET STUDENT OVERVIEW (METRICS)
router.get('/students/:studentId/overview', async (req, res) => {
  const parentId = req.user.id;
  const { studentId } = req.params;

  try {
    // Verify parent-student relationship
    const linkCheck = await get(
      'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );
    if (!linkCheck) {
      return res.status(403).json({ error: 'Unauthorized. This student is not linked to you.' });
    }

    // Get Student Profile
    const student = await get('SELECT id, name, class_level FROM users WHERE id = ?', [studentId]);

    // Calculate Streak
    const streak = await getStudentStreak(studentId);

    // Calculate Syllabus completion percentage (Overall and per-subject)
    // 1. Total topics in their active tracker (standard + custom - hidden)
    const totalTopicsCountRow = await get(`
      SELECT COUNT(t.id) as count 
      FROM syllabus_topics t
      JOIN syllabus_chapters c ON t.chapter_id = c.id
      LEFT JOIN student_topic_progress p ON t.id = p.topic_id AND p.student_id = ?
      WHERE (c.student_id IS NULL OR c.student_id = ?)
        AND (t.student_id IS NULL OR t.student_id = ?)
        AND (p.is_hidden IS NULL OR p.is_hidden = 0)
    `, [studentId, studentId, studentId]);
    const totalTopicsCount = totalTopicsCountRow.count || 1; // avoid division by 0

    // 2. Completed / Revision topics (non-hidden)
    const completedTopicsCountRow = await get(`
      SELECT COUNT(t.id) as count
      FROM student_topic_progress p
      JOIN syllabus_topics t ON p.topic_id = t.id
      JOIN syllabus_chapters c ON t.chapter_id = c.id
      WHERE p.student_id = ? AND p.status IN ('completed', 'revision') AND p.is_hidden = 0
    `, [studentId]);
    const completedTopicsCount = completedTopicsCountRow.count || 0;

    const overallSyllabusPercent = Math.round((completedTopicsCount / totalTopicsCount) * 100);

    // Subject breakdown completion
    const subjectProgress = await query(`
      SELECT 
        s.id as subject_id,
        s.name as subject_name,
        COUNT(t.id) as total_topics,
        SUM(CASE WHEN p.status IN ('completed', 'revision') AND p.is_hidden = 0 THEN 1 ELSE 0 END) as completed_topics
      FROM subjects s
      JOIN syllabus_chapters c ON s.id = c.subject_id
      JOIN syllabus_topics t ON c.id = t.chapter_id
      LEFT JOIN student_topic_progress p ON t.id = p.topic_id AND p.student_id = ?
      WHERE (c.student_id IS NULL OR c.student_id = ?)
        AND (t.student_id IS NULL OR t.student_id = ?)
        AND (p.is_hidden IS NULL OR p.is_hidden = 0)
      GROUP BY s.id, s.name
    `, [studentId, studentId, studentId]);

    const subjectCompletion = subjectProgress.map(row => ({
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      percent: Math.round((row.completed_topics / (row.total_topics || 1)) * 100)
    }));

    // Sums solved this week (last 7 days including today)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const dateLimitStr = sevenDaysAgo.toISOString().split('T')[0];

    const sumsSolvedRow = await query(`
      SELECT s.name as subject_name, SUM(l.sums_solved) as total_solved
      FROM daily_logs l
      JOIN subjects s ON l.subject_id = s.id
      WHERE l.student_id = ? AND l.log_date >= ?
      GROUP BY s.id, s.name
    `, [studentId, dateLimitStr]);

    const sumsSolvedThisWeek = { Physics: 0, Chemistry: 0, Mathematics: 0 };
    sumsSolvedRow.forEach(r => {
      if (sumsSolvedThisWeek[r.subject_name] !== undefined) {
        sumsSolvedThisWeek[r.subject_name] = r.total_solved || 0;
      }
    });

    // Last test score
    const lastTest = await get(`
      SELECT r.total_score, t.total_marks, t.title, r.submitted_at
      FROM test_results r
      JOIN weekly_tests t ON r.test_id = t.id
      WHERE r.student_id = ?
      ORDER BY r.submitted_at DESC
      LIMIT 1
    `, [studentId]);

    // Check if student has been active in the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
    const recentLog = await get(
      'SELECT id FROM daily_logs WHERE student_id = ? AND log_date >= ? LIMIT 1',
      [studentId, threeDaysAgoStr]
    );

    const flags = [];
    if (!recentLog) {
      flags.push({
        type: 'danger',
        message: 'No study activity logged in the last 3 days.'
      });
    }

    if (lastTest) {
      const lastTestPercent = (lastTest.total_score / lastTest.total_marks) * 100;
      if (lastTestPercent < 50) {
        flags.push({
          type: 'danger',
          message: `Low score on recent test "${lastTest.title}": Scored ${Math.round(lastTestPercent)}% (below 50%).`
        });
      }
    }

    // Check for weak subjects (test average < 60%)
    const subjectAverages = await query(`
      SELECT 
        s.name as subject_name,
        AVG(CAST(r.total_score AS REAL) / t.total_marks * 100) as avg_percent
      FROM test_results r
      JOIN weekly_tests t ON r.test_id = t.id
      JOIN subjects s ON t.subject_id = s.id
      WHERE r.student_id = ?
      GROUP BY s.id, s.name
    `, [studentId]);

    subjectAverages.forEach(avg => {
      if (avg.avg_percent < 60) {
        flags.push({
          type: 'warning',
          message: `Weak performance in ${avg.subject_name}: Average test score is ${Math.round(avg.avg_percent)}% (below 60%).`
        });
      }
    });

    res.json({
      student: {
        id: student.id,
        name: student.name,
        classLevel: student.class_level
      },
      metrics: {
        streak,
        overallSyllabusPercent,
        subjectCompletion,
        sumsSolvedThisWeek,
        lastTest: lastTest ? {
          title: lastTest.title,
          score: lastTest.total_score,
          totalMarks: lastTest.total_marks,
          date: lastTest.submitted_at
        } : null,
        flags
      }
    });
  } catch (err) {
    console.error('Overview retrieval error:', err.message);
    res.status(500).json({ error: 'Database error fetching overview metrics.' });
  }
});

// 5. GET STUDENT DETAILED PROGRESS
router.get('/students/:studentId/progress', async (req, res) => {
  const parentId = req.user.id;
  const { studentId } = req.params;

  try {
    const linkCheck = await get(
      'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );
    if (!linkCheck) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const student = await get('SELECT class_level FROM users WHERE id = ?', [studentId]);

    const progress = await query(`
      SELECT 
        s.name as subject_name,
        c.id as chapter_id,
        c.chapter_name,
        c.class_level,
        t.id as topic_id,
        t.topic_name,
        COALESCE(p.status, 'not_started') as status,
        COALESCE(p.added_by, 'master') as added_by,
        COALESCE(p.is_hidden, 0) as is_hidden
      FROM syllabus_chapters c
      JOIN subjects s ON c.subject_id = s.id
      JOIN syllabus_topics t ON c.id = t.chapter_id
      LEFT JOIN student_topic_progress p ON t.id = p.topic_id AND p.student_id = ?
      WHERE (c.student_id IS NULL OR c.student_id = ?)
        AND (t.student_id IS NULL OR t.student_id = ?)
      ORDER BY s.id, c.chapter_order, t.topic_order
    `, [studentId, studentId, studentId]);

    res.json({ progress });
  } catch (err) {
    console.error('Progress tracker error:', err.message);
    res.status(500).json({ error: 'Database error fetching syllabus details.' });
  }
});

// 6. GET STUDENT DAILY STUDY LOGS
router.get('/students/:studentId/logs', async (req, res) => {
  const parentId = req.user.id;
  const { studentId } = req.params;

  try {
    const linkCheck = await get(
      'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );
    if (!linkCheck) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const logs = await query(`
      SELECT l.*, s.name as subject_name, c.chapter_name
      FROM daily_logs l
      JOIN subjects s ON l.subject_id = s.id
      LEFT JOIN syllabus_chapters c ON l.chapter_id = c.id
      WHERE l.student_id = ?
      ORDER BY l.log_date DESC, l.created_at DESC
    `, [studentId]);

    res.json({ logs });
  } catch (err) {
    console.error('Logs retrieval error:', err.message);
    res.status(500).json({ error: 'Database error fetching study logs.' });
  }
});

// 7. GET STUDENT CHART METRICS & HEATMAP
router.get('/students/:studentId/charts', async (req, res) => {
  const parentId = req.user.id;
  const { studentId } = req.params;

  try {
    const linkCheck = await get(
      'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );
    if (!linkCheck) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    // Heatmap calendar view (daily activity counts over last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 364);
    const startDateStr = oneYearAgo.toISOString().split('T')[0];

    const heatmap = await query(`
      SELECT log_date, COUNT(*) as log_count, SUM(sums_solved) as total_sums, SUM(time_spent_minutes) as total_time
      FROM daily_logs
      WHERE student_id = ? AND log_date >= ?
      GROUP BY log_date
      ORDER BY log_date
    `, [studentId, startDateStr]);

    // Sums solved per subject over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const sumsSolvedTrend = await query(`
      SELECT l.log_date, s.name as subject_name, SUM(l.sums_solved) as total_sums
      FROM daily_logs l
      JOIN subjects s ON l.subject_id = s.id
      WHERE l.student_id = ? AND l.log_date >= ?
      GROUP BY l.log_date, s.name
      ORDER BY l.log_date
    `, [studentId, thirtyDaysAgoStr]);

    // Weekly test scores trend
    const testScores = await query(`
      SELECT t.id, t.title, t.test_date, s.name as subject_name, t.total_marks, 
             r.total_score, r.submitted_at, r.subject_breakdown, r.weak_topics, 
             r.answer_sheet_file_url, r.time_taken_minutes
      FROM test_results r
      JOIN weekly_tests t ON r.test_id = t.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE r.student_id = ?
      ORDER BY t.test_date ASC
    `, [studentId]);

    // Time spent per subject (Total aggregate)
    const timeSpent = await query(`
      SELECT s.name as name, SUM(l.time_spent_minutes) as value
      FROM daily_logs l
      JOIN subjects s ON l.subject_id = s.id
      WHERE l.student_id = ?
      GROUP BY s.id, s.name
    `, [studentId]);

    // Fetch all assigned tests to see preparedness & completion status (upcoming + completed)
    const assignedTests = await query(`
      SELECT t.id, t.title, t.test_date, s.name as subject_name, t.total_marks, 
             t.syllabus_scope, r.id as result_id, r.total_score
      FROM weekly_tests t
      JOIN test_assignments a ON t.id = a.test_id
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN test_results r ON t.id = r.test_id AND r.student_id = ?
      WHERE a.student_id = ?
      ORDER BY t.test_date DESC
    `, [studentId, studentId]);

    const assignedTestsWithPreparedness = [];
    for (const test of assignedTests) {
      let chapterIds = [];
      try {
        chapterIds = JSON.parse(test.syllabus_scope);
      } catch (e) {
        chapterIds = [];
      }

      let preparedness = 0;
      if (chapterIds.length > 0) {
        const placeholders = chapterIds.map(() => '?').join(',');
        const topics = await query(`
          SELECT t.id, COALESCE(p.status, 'not_started') as status
          FROM syllabus_topics t
          JOIN syllabus_chapters c ON t.chapter_id = c.id
          LEFT JOIN student_topic_progress p ON t.id = p.topic_id AND p.student_id = ?
          WHERE c.id IN (${placeholders})
            AND (t.student_id IS NULL OR t.student_id = ?)
        `, [studentId, ...chapterIds, studentId]);
        
        const total = topics.length;
        const completed = topics.filter(t => t.status === 'completed' || t.status === 'revision').length;
        preparedness = total > 0 ? Math.round((completed / total) * 100) : 0;
      }

      assignedTestsWithPreparedness.push({
        ...test,
        preparedness
      });
    }

    res.json({
      heatmap,
      sumsSolvedTrend,
      testScores,
      timeSpent,
      assignedTests: assignedTestsWithPreparedness
    });
  } catch (err) {
    console.error('Chart metrics retrieval error:', err.message);
    res.status(500).json({ error: 'Database error fetching chart analytics.' });
  }
});

// 8. UPLOAD SYLLABUS CUSTOM ITEMS / ASSIGNMENTS
router.post('/uploads', async (req, res) => {
  const parentId = req.user.id;
  const { studentIds, subjectId, chapterId, contentType, textContent, fileUrl, note } = req.body;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !contentType) {
    return res.status(400).json({ error: 'studentIds (array) and contentType are required.' });
  }

  try {
    for (const studentId of studentIds) {
      // Verify relationship
      const linkCheck = await get(
        'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
        [parentId, studentId]
      );
      if (!linkCheck) {
        continue; // Skip unauthorized students
      }

      await run(`
        INSERT INTO parent_uploads (parent_id, student_id, subject_id, chapter_id, content_type, text_content, file_url, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [parentId, studentId, subjectId || null, chapterId || null, contentType, textContent || null, fileUrl || null, note || null]);
    }

    res.status(201).json({ message: 'Custom syllabus/assignment uploaded successfully.' });
  } catch (err) {
    console.error('Custom assignment upload error:', err.message);
    res.status(500).json({ error: 'Database error creating parent uploads.' });
  }
});

// 8.b GET ALL SENT CUSTOM SYLLABUS / ASSIGNMENTS
router.get('/uploads', async (req, res) => {
  const parentId = req.user.id;

  try {
    const assignments = await query(`
      SELECT a.*, u.name as student_name, s.name as subject_name, c.chapter_name
      FROM parent_uploads a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN syllabus_chapters c ON a.chapter_id = c.id
      WHERE a.parent_id = ?
      ORDER BY a.created_at DESC
    `, [parentId]);

    res.json({ assignments });
  } catch (err) {
    console.error('Sent assignments retrieve error:', err.message);
    res.status(500).json({ error: 'Database error retrieving sent assignments.' });
  }
});

// 9. CREATE & ASSIGN WEEKLY TEST
router.post('/tests', async (req, res) => {
  const parentId = req.user.id;
  const { title, subjectId, syllabusScope, testDate, totalMarks, fileUrl, studentIds } = req.body;

  if (!title || !testDate || !totalMarks || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'title, testDate, totalMarks, and studentIds (array) are required.' });
  }

  // Convert syllabusScope (array of chapter IDs) to string representation
  const scopeStr = syllabusScope && Array.isArray(syllabusScope) ? JSON.stringify(syllabusScope) : '[]';

  try {
    // Insert into weekly_tests
    const insertTest = await run(`
      INSERT INTO weekly_tests (created_by_parent_id, title, subject_id, syllabus_scope, test_date, total_marks, file_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [parentId, title, subjectId || null, scopeStr, testDate, totalMarks, fileUrl || null]);
    const testId = insertTest.id;

    // Link test assignments
    for (const studentId of studentIds) {
      // Verify relation
      const linkCheck = await get(
        'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
        [parentId, studentId]
      );
      if (linkCheck) {
        await run(`
          INSERT INTO test_assignments (test_id, student_id)
          VALUES (?, ?)
        `, [testId, studentId]);
      }
    }

    res.status(201).json({
      message: 'Weekly test created and assigned successfully.',
      testId
    });
  } catch (err) {
    console.error('Test creation error:', err.message);
    res.status(500).json({ error: 'Database error creating weekly test.' });
  }
});

export default router;
