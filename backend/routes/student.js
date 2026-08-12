import express from 'express';
import { run, query, get } from '../database/db.js';
import { authenticateJWT, isStudent } from '../middleware/auth.js';

const router = express.Router();

// Apply student auth guard to all routes here
router.use(authenticateJWT);
router.use(isStudent);

// 1. GET SYLLABUS WITH PROGRESS (FILTER OUT HIDDEN ITEMS)
router.get('/syllabus', async (req, res) => {
  const studentId = req.user.id;
  
  try {
    // Get all subjects
    const subjects = await query('SELECT * FROM subjects ORDER BY id');
    
    // Get all chapters (standard + student specific custom)
    const chapters = await query(
      'SELECT * FROM syllabus_chapters WHERE student_id IS NULL OR student_id = ? ORDER BY subject_id, class_level, chapter_order',
      [studentId]
    );
    
    // Get all topics and join with student progress status (excluding hidden ones)
    const topics = await query(`
      SELECT t.*, COALESCE(p.status, 'not_started') as status, COALESCE(p.added_by, 'master') as added_by, COALESCE(p.is_hidden, 0) as is_hidden, p.updated_at
      FROM syllabus_topics t
      LEFT JOIN student_topic_progress p ON t.id = p.topic_id AND p.student_id = ?
      WHERE (t.student_id IS NULL OR t.student_id = ?)
        AND (p.is_hidden IS NULL OR p.is_hidden = 0)
      ORDER BY t.chapter_id, t.topic_order
    `, [studentId, studentId]);

    // Build the hierarchical structure
    const syllabusTree = subjects.map(subj => {
      const subjChapters11th = chapters.filter(c => c.subject_id === subj.id && c.class_level === '11th').map(chap => {
        return {
          ...chap,
          topics: topics.filter(t => t.chapter_id === chap.id)
        };
      });

      const subjChapters12th = chapters.filter(c => c.subject_id === subj.id && c.class_level === '12th').map(chap => {
        return {
          ...chap,
          topics: topics.filter(t => t.chapter_id === chap.id)
        };
      });

      return {
        id: subj.id,
        name: subj.name,
        classes: {
          "11th": subjChapters11th,
          "12th": subjChapters12th
        }
      };
    });

    res.json({ syllabus: syllabusTree });
  } catch (err) {
    console.error('Syllabus retrieve error:', err.message);
    res.status(500).json({ error: 'Database error occurred retrieving syllabus.' });
  }
});

// 1.b ADD CUSTOM CHAPTER/TOPIC
router.post('/syllabus/custom', async (req, res) => {
  const studentId = req.user.id;
  const { subjectId, chapterName, topicName, classLevel } = req.body;

  if (!subjectId || !chapterName || !topicName) {
    return res.status(400).json({ error: 'subjectId, chapterName, and topicName are required.' });
  }

  const targetClassLevel = classLevel || req.user.classLevel;

  try {
    // Check if chapter exists (standard or custom for this student)
    let chapter = await get(
      'SELECT id FROM syllabus_chapters WHERE subject_id = ? AND chapter_name = ? AND (student_id IS NULL OR student_id = ?)',
      [subjectId, chapterName, studentId]
    );

    let chapterId;
    if (!chapter) {
      const maxOrderRow = await get(
        'SELECT COALESCE(MAX(chapter_order), 0) as max_order FROM syllabus_chapters WHERE subject_id = ? AND (student_id IS NULL OR student_id = ?)',
        [subjectId, studentId]
      );
      const nextOrder = (maxOrderRow.max_order || 0) + 1;

      const insertChap = await run(
        'INSERT INTO syllabus_chapters (subject_id, class_level, chapter_name, chapter_order, student_id) VALUES (?, ?, ?, ?, ?)',
        [subjectId, targetClassLevel, chapterName, nextOrder, studentId]
      );
      chapterId = insertChap.id;
    } else {
      chapterId = chapter.id;
    }

    // Insert custom topic
    const maxTopicOrderRow = await get(
      'SELECT COALESCE(MAX(topic_order), 0) as max_order FROM syllabus_topics WHERE chapter_id = ?',
      [chapterId]
    );
    const nextTopicOrder = (maxTopicOrderRow.max_order || 0) + 1;

    const insertTopic = await run(
      'INSERT INTO syllabus_topics (chapter_id, topic_name, topic_order, student_id) VALUES (?, ?, ?, ?)',
      [chapterId, topicName, nextTopicOrder, studentId]
    );
    const topicId = insertTopic.id;

    // Mark progress
    await run(
      'INSERT INTO student_topic_progress (student_id, topic_id, status, added_by, is_hidden) VALUES (?, ?, ?, ?, 0)',
      [studentId, topicId, 'not_started', 'student']
    );

    res.status(201).json({ message: 'Custom topic added successfully.', topicId, chapterId });
  } catch (err) {
    console.error('Custom topic create error:', err.message);
    res.status(500).json({ error: 'Database error creating custom topic.' });
  }
});

// 1.c HIDE/REMOVE TOPIC FROM TRACKER
router.post('/syllabus/hide', async (req, res) => {
  const studentId = req.user.id;
  const { topicId } = req.body;

  if (!topicId) {
    return res.status(400).json({ error: 'topicId is required.' });
  }

  try {
    const progress = await get(
      'SELECT id FROM student_topic_progress WHERE student_id = ? AND topic_id = ?',
      [studentId, topicId]
    );

    if (progress) {
      await run(
        'UPDATE student_topic_progress SET is_hidden = 1 WHERE student_id = ? AND topic_id = ?',
        [studentId, topicId]
      );
    } else {
      await run(
        'INSERT INTO student_topic_progress (student_id, topic_id, status, added_by, is_hidden) VALUES (?, ?, ?, ?, 1)',
        [studentId, topicId, 'not_started', 'master']
      );
    }

    res.json({ message: 'Topic hidden from tracker.' });
  } catch (err) {
    console.error('Hide topic error:', err.message);
    res.status(500).json({ error: 'Database error hiding topic.' });
  }
});

// 1.d RESTORE HIDE TOPIC
router.post('/syllabus/restore', async (req, res) => {
  const studentId = req.user.id;
  const { topicId } = req.body;

  if (!topicId) {
    return res.status(400).json({ error: 'topicId is required.' });
  }

  try {
    await run(
      'UPDATE student_topic_progress SET is_hidden = 0 WHERE student_id = ? AND topic_id = ?',
      [studentId, topicId]
    );
    res.json({ message: 'Topic restored to tracker.' });
  } catch (err) {
    console.error('Restore topic error:', err.message);
    res.status(500).json({ error: 'Database error restoring topic.' });
  }
});

// 2. UPDATE SYLLABUS TOPIC PROGRESS
router.post('/progress', async (req, res) => {
  const studentId = req.user.id;
  const { topicId, status } = req.body;

  if (!topicId || !status) {
    return res.status(400).json({ error: 'topicId and status are required.' });
  }

  const validStatuses = ['not_started', 'in_progress', 'completed', 'revision'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    // Check if topic exists
    const topic = await get('SELECT id FROM syllabus_topics WHERE id = ?', [topicId]);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    // Insert or replace progress
    await run(`
      INSERT INTO student_topic_progress (student_id, topic_id, status, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, topic_id) DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
    `, [studentId, topicId, status]);

    res.json({ message: 'Progress updated successfully', topicId, status });
  } catch (err) {
    console.error('Progress update error:', err.message);
    res.status(500).json({ error: 'Database error updating progress.' });
  }
});

// 3. CREATE DAILY STUDY LOG
router.post('/logs', async (req, res) => {
  const studentId = req.user.id;
  const { logDate, subjectId, chapterId, sumsSolved, sumsCorrect, timeSpentMinutes, notes } = req.body;

  if (!logDate || !subjectId || sumsSolved === undefined || !timeSpentMinutes) {
    return res.status(400).json({ error: 'logDate, subjectId, sumsSolved, and timeSpentMinutes are required.' });
  }

  try {
    const insertResult = await run(`
      INSERT INTO daily_logs (student_id, log_date, subject_id, chapter_id, sums_solved, sums_correct, time_spent_minutes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [studentId, logDate, subjectId, chapterId || null, sumsSolved, sumsCorrect !== undefined ? sumsCorrect : null, timeSpentMinutes, notes || null]);

    res.status(201).json({
      message: 'Study log saved successfully',
      logId: insertResult.id
    });
  } catch (err) {
    console.error('Log creation error:', err.message);
    res.status(500).json({ error: 'Database error saving study log.' });
  }
});

// 4. GET DAILY STUDY LOGS
router.get('/logs', async (req, res) => {
  const studentId = req.user.id;

  try {
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
    res.status(500).json({ error: 'Database error retrieving logs.' });
  }
});

// 5. GET STREAK COUNTER
router.get('/streak', async (req, res) => {
  const studentId = req.user.id;

  try {
    const logs = await query(
      'SELECT DISTINCT log_date FROM daily_logs WHERE student_id = ? ORDER BY log_date DESC',
      [studentId]
    );

    if (logs.length === 0) {
      return res.json({ streak: 0 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const logDates = logs.map(l => l.log_date);

    // Streak broken if neither today nor yesterday has a log
    if (!logDates.includes(todayStr) && !logDates.includes(yesterdayStr)) {
      return res.json({ streak: 0 });
    }

    let streak = 0;
    // Start count from today (if logged) or yesterday (if logged and today is empty)
    let currentDate = logDates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);

    while (true) {
      // Create offset-independent local date string YYYY-MM-DD
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

    res.json({ streak });
  } catch (err) {
    console.error('Streak retrieval error:', err.message);
    res.status(500).json({ error: 'Database error calculating streak.' });
  }
});

// 6. GET WEEKLY TESTS & GUIDANCE
router.get('/tests', async (req, res) => {
  const studentId = req.user.id;

  try {
    // Fetch tests assigned to this student (using LEFT JOIN so student self-logged tests are also returned)
    const tests = await query(`
      SELECT t.*, u.name as parent_name, s.name as subject_name, r.id as result_id, r.total_score, r.submitted_at
      FROM weekly_tests t
      JOIN test_assignments a ON t.id = a.test_id
      LEFT JOIN users u ON t.created_by_parent_id = u.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN test_results r ON t.id = r.test_id AND r.student_id = ?
      WHERE a.student_id = ?
      ORDER BY t.test_date DESC, t.created_at DESC
    `, [studentId, studentId]);

    // For each test, generate the custom prep guidance
    const testsWithGuidance = [];
    for (const test of tests) {
      // Parse syllabus scope (JSON array of chapter IDs)
      let chapterIds = [];
      try {
        chapterIds = JSON.parse(test.syllabus_scope);
      } catch (e) {
        chapterIds = [];
      }

      let guidance = [];
      let preparedness = 0;

      if (chapterIds.length > 0) {
        // Query topics in these chapters and cross-reference with this student's progress
        const placeholders = chapterIds.map(() => '?').join(',');
        const topicsProgress = await query(`
          SELECT t.id, t.topic_name, c.chapter_name, COALESCE(p.status, 'not_started') as status
          FROM syllabus_topics t
          JOIN syllabus_chapters c ON t.chapter_id = c.id
          LEFT JOIN student_topic_progress p ON t.id = p.topic_id AND p.student_id = ?
          WHERE c.id IN (${placeholders})
        `, [studentId, ...chapterIds]);

        // Calculate preparedness percentage
        const totalCount = topicsProgress.length;
        const completedCount = topicsProgress.filter(t => t.status === 'completed' || t.status === 'revision').length;
        preparedness = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Aggregate by status to provide actionable warnings
        const notStarted = topicsProgress.filter(t => t.status === 'not_started');
        const inProgress = topicsProgress.filter(t => t.status === 'in_progress');

        if (notStarted.length > 0) {
          guidance.push({
            type: 'warning',
            message: `You have ${notStarted.length} topics in this test's scope that are "Not Started" (e.g., "${notStarted[0].topic_name}" in chapter "${notStarted[0].chapter_name}"). Prioritize these!`
          });
        }
        if (inProgress.length > 0) {
          guidance.push({
            type: 'info',
            message: `You have ${inProgress.length} topics currently "In Progress" (e.g., "${inProgress[0].topic_name}" in chapter "${inProgress[0].chapter_name}"). Finish these up before the test.`
          });
        }
        if (completedCount > 0 && notStarted.length === 0 && inProgress.length === 0) {
          guidance.push({
            type: 'success',
            message: `Great! You've marked all topics covered by this test as Completed/Revision. Keep practicing and review your weak areas.`
          });
        }
      } else {
        guidance.push({
          type: 'info',
          message: 'No specific syllabus scope tagged. Study general topics for this subject.'
        });
      }

      testsWithGuidance.push({
        ...test,
        guidance,
        preparedness,
        parent_name: test.parent_name || 'Student (Self)'
      });
    }

    res.json({ tests: testsWithGuidance });
  } catch (err) {
    console.error('Tests retrieve error:', err.message);
    res.status(500).json({ error: 'Database error retrieving weekly tests.' });
  }
});

// 7. SUBMIT TEST RESULT
router.post('/tests/:testId/result', async (req, res) => {
  const studentId = req.user.id;
  const { testId } = req.params;
  const { totalScore, subjectBreakdown, weakTopics, answerSheetFileUrl, timeTakenMinutes } = req.body;

  if (totalScore === undefined || !subjectBreakdown) {
    return res.status(400).json({ error: 'totalScore and subjectBreakdown are required.' });
  }

  try {
    // Verify assignment exists
    const assignment = await get('SELECT id FROM test_assignments WHERE test_id = ? AND student_id = ?', [testId, studentId]);
    if (!assignment) {
      return res.status(403).json({ error: 'You are not assigned to this test.' });
    }

    // Insert or replace test results
    await run(`
      INSERT INTO test_results (test_id, student_id, total_score, subject_breakdown, weak_topics, answer_sheet_file_url, time_taken_minutes, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(test_id, student_id) DO UPDATE SET 
        total_score = excluded.total_score,
        subject_breakdown = excluded.subject_breakdown,
        weak_topics = excluded.weak_topics,
        answer_sheet_file_url = excluded.answer_sheet_file_url,
        time_taken_minutes = excluded.time_taken_minutes,
        submitted_at = CURRENT_TIMESTAMP
    `, [testId, studentId, totalScore, JSON.stringify(subjectBreakdown), weakTopics || null, answerSheetFileUrl || null, timeTakenMinutes ? parseInt(timeTakenMinutes) : null]);

    res.json({ message: 'Test results submitted successfully.' });
  } catch (err) {
    console.error('Test result submit error:', err.message);
    res.status(500).json({ error: 'Database error submitting test results.' });
  }
});

// 7.b SUBMIT EXTERNAL TEST (LOG TEST CREATED BY STUDENT)
router.post('/tests/external', async (req, res) => {
  const studentId = req.user.id;
  const { title, subjectId, syllabusScope, testDate, totalMarks, totalScore, subjectBreakdown, weakTopics, answerSheetFileUrl, timeTakenMinutes } = req.body;

  if (!title || !testDate || !totalMarks || totalScore === undefined || !subjectBreakdown) {
    return res.status(400).json({ error: 'Title, testDate, totalMarks, totalScore, and subjectBreakdown are required.' });
  }

  try {
    // 1. Insert into weekly_tests (created_by_parent_id = NULL)
    const syllabusScopeStr = Array.isArray(syllabusScope) ? JSON.stringify(syllabusScope) : '[]';
    const testResult = await run(`
      INSERT INTO weekly_tests (created_by_parent_id, title, subject_id, syllabus_scope, test_date, total_marks, file_url)
      VALUES (NULL, ?, ?, ?, ?, ?, NULL)
    `, [title, subjectId || null, syllabusScopeStr, testDate, totalMarks]);
    
    const testId = testResult.id;

    // 2. Insert into test_assignments for this student
    await run(`
      INSERT INTO test_assignments (test_id, student_id)
      VALUES (?, ?)
    `, [testId, studentId]);

    // 3. Insert into test_results
    await run(`
      INSERT INTO test_results (test_id, student_id, total_score, subject_breakdown, weak_topics, answer_sheet_file_url, time_taken_minutes, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [testId, studentId, totalScore, JSON.stringify(subjectBreakdown), weakTopics || null, answerSheetFileUrl || null, timeTakenMinutes ? parseInt(timeTakenMinutes) : null, testDate]);

    res.status(201).json({ message: 'External test and results logged successfully.', testId });
  } catch (err) {
    console.error('External test logging error:', err.message);
    res.status(500).json({ error: 'Database error logging external test.' });
  }
});

// 8. GET PARENT UPLOADS / ASSIGNMENTS
router.get('/assignments', async (req, res) => {
  const studentId = req.user.id;

  try {
    const assignments = await query(`
      SELECT a.*, u.name as parent_name, s.name as subject_name, c.chapter_name
      FROM parent_uploads a
      JOIN users u ON a.parent_id = u.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN syllabus_chapters c ON a.chapter_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.created_at DESC
    `, [studentId]);

    res.json({ assignments });
  } catch (err) {
    console.error('Assignments retrieve error:', err.message);
    res.status(500).json({ error: 'Database error retrieving parent uploads.' });
  }
});

// 8.b MARK PARENT UPLOAD / ASSIGNMENT AS COMPLETED WITH SUMS TRACKING
router.post('/assignments/:id/complete', async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;
  const { sumsCompleted } = req.body;

  try {
    // Verify assignment exists and is owned by the student
    const assignment = await get('SELECT id FROM parent_uploads WHERE id = ? AND student_id = ?', [id, studentId]);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found or unauthorized.' });
    }

    await run(`
      UPDATE parent_uploads 
      SET status = 'completed', 
          sums_completed = ?, 
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [sumsCompleted ? parseInt(sumsCompleted) : 0, id]);

    res.json({ message: 'Assignment successfully marked as completed.' });
  } catch (err) {
    console.error('Assignment complete submit error:', err.message);
    res.status(500).json({ error: 'Database error updating assignment progress.' });
  }
});

export default router;
