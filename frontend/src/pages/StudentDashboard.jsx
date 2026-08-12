import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { 
  Award, BookOpen, Clock, AlertTriangle, PlusCircle, CheckCircle, 
  Flame, HelpCircle, FileText, UploadCloud, ChevronRight, BarChart2 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid 
} from 'recharts';

export const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(0);
  const [syllabus, setSyllabus] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tests, setTests] = useState([]);
  
  // Quick Add Log State
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [logForm, setLogForm] = useState({
    subjectId: '',
    chapterId: '',
    sumsSolved: 0,
    sumsCorrect: 0,
    timeSpentMinutes: '',
    notes: '',
    logDate: new Date().toISOString().split('T')[0]
  });

  // Modal test submission state
  const [activeTest, setActiveTest] = useState(null); // test object
  const [testResultForm, setTestResultForm] = useState({
    totalScore: '',
    weakTopics: '',
    breakdownMaths: '',
    correctMaths: '',
    incorrectMaths: '',
    unattemptedMaths: '',
    maxMaths: '',
    breakdownPhysics: '',
    correctPhysics: '',
    incorrectPhysics: '',
    unattemptedPhysics: '',
    maxPhysics: '',
    breakdownChemistry: '',
    correctChemistry: '',
    incorrectChemistry: '',
    unattemptedChemistry: '',
    maxChemistry: '',
    timeTakenMinutes: ''
  });
  const [answerSheetFile, setAnswerSheetFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userProfile = JSON.parse(localStorage.getItem('user'));
      setProfile(userProfile);

      const [streakRes, syllabusRes, logsRes, testsRes, subjectsRes, chaptersRes] = await Promise.all([
        api.student.getStreak(),
        api.student.getSyllabus(),
        api.student.getLogs(),
        api.student.getTests(),
        api.getSubjects(),
        api.getChapters()
      ]);

      setStreak(streakRes.streak);
      setSyllabus(syllabusRes.syllabus);
      setLogs(logsRes.logs);
      setTests(testsRes.tests);
      setSubjects(subjectsRes.subjects);
      setChapters(chaptersRes.chapters);
      
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard content.');
    } finally {
      setLoading(false);
    }
  };

  // Filter chapters based on selected subject in study log form
  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setLogForm({ ...logForm, subjectId: subId, chapterId: '' });
    
    if (subId) {
      const filtered = chapters.filter(c => c.subject_id === parseInt(subId) && c.class_level === profile.classLevel);
      setFilteredChapters(filtered);
    } else {
      setFilteredChapters([]);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!logForm.subjectId || !logForm.sumsSolved || !logForm.timeSpentMinutes) {
      setError('Please fill in all required study log fields.');
      return;
    }

    try {
      await api.student.submitLog({
        logDate: logForm.logDate,
        subjectId: parseInt(logForm.subjectId),
        chapterId: logForm.chapterId ? parseInt(logForm.chapterId) : null,
        sumsSolved: parseInt(logForm.sumsSolved),
        sumsCorrect: logForm.sumsCorrect ? parseInt(logForm.sumsCorrect) : 0,
        timeSpentMinutes: parseInt(logForm.timeSpentMinutes),
        notes: logForm.notes
      });

      setSuccessMsg('Study log saved successfully!');
      
      // Reset form (keeping subject/chapter for quick logs but resetting values)
      setLogForm({
        ...logForm,
        sumsSolved: 0,
        sumsCorrect: 0,
        timeSpentMinutes: '',
        notes: ''
      });

      // Refresh dashboard
      const [streakRes, logsRes, syllabusRes] = await Promise.all([
        api.student.getStreak(),
        api.student.getLogs(),
        api.student.getSyllabus()
      ]);
      setStreak(streakRes.streak);
      setLogs(logsRes.logs);
      setSyllabus(syllabusRes.syllabus);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit study log.');
    }
  };

  // Handle PDF/Image answer sheet upload
  const handleFileChange = (e) => {
    setAnswerSheetFile(e.target.files[0]);
  };

  // Submit test results
  const handleTestResultSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setUploadingFile(true);

    try {
      let fileUrl = null;
      if (answerSheetFile) {
        const uploadRes = await api.uploadFile(answerSheetFile);
        fileUrl = uploadRes.fileUrl;
      }

      const breakdown = [
        {
          subject: 'Mathematics',
          marks: testResultForm.breakdownMaths ? parseInt(testResultForm.breakdownMaths) : 0,
          maxMarks: testResultForm.maxMaths ? parseInt(testResultForm.maxMaths) : 100,
          correct: testResultForm.correctMaths ? parseInt(testResultForm.correctMaths) : 0,
          incorrect: testResultForm.incorrectMaths ? parseInt(testResultForm.incorrectMaths) : 0,
          unattempted: testResultForm.unattemptedMaths ? parseInt(testResultForm.unattemptedMaths) : 0
        },
        {
          subject: 'Physics',
          marks: testResultForm.breakdownPhysics ? parseInt(testResultForm.breakdownPhysics) : 0,
          maxMarks: testResultForm.maxPhysics ? parseInt(testResultForm.maxPhysics) : 100,
          correct: testResultForm.correctPhysics ? parseInt(testResultForm.correctPhysics) : 0,
          incorrect: testResultForm.incorrectPhysics ? parseInt(testResultForm.incorrectPhysics) : 0,
          unattempted: testResultForm.unattemptedPhysics ? parseInt(testResultForm.unattemptedPhysics) : 0
        },
        {
          subject: 'Chemistry',
          marks: testResultForm.breakdownChemistry ? parseInt(testResultForm.breakdownChemistry) : 0,
          maxMarks: testResultForm.maxChemistry ? parseInt(testResultForm.maxChemistry) : 100,
          correct: testResultForm.correctChemistry ? parseInt(testResultForm.correctChemistry) : 0,
          incorrect: testResultForm.incorrectChemistry ? parseInt(testResultForm.incorrectChemistry) : 0,
          unattempted: testResultForm.unattemptedChemistry ? parseInt(testResultForm.unattemptedChemistry) : 0
        }
      ];

      await api.student.submitTestResult(activeTest.id, {
        totalScore: parseInt(testResultForm.totalScore),
        subjectBreakdown: breakdown,
        weakTopics: testResultForm.weakTopics,
        answerSheetFileUrl: fileUrl,
        timeTakenMinutes: testResultForm.timeTakenMinutes ? parseInt(testResultForm.timeTakenMinutes) : null
      });

      setSuccessMsg(`Score submitted successfully for test: ${activeTest.title}`);
      setActiveTest(null);
      setAnswerSheetFile(null);
      setTestResultForm({
        totalScore: '',
        weakTopics: '',
        breakdownMaths: '',
        correctMaths: '',
        incorrectMaths: '',
        unattemptedMaths: '',
        maxMaths: '',
        breakdownPhysics: '',
        correctPhysics: '',
        incorrectPhysics: '',
        unattemptedPhysics: '',
        maxPhysics: '',
        breakdownChemistry: '',
        correctChemistry: '',
        incorrectChemistry: '',
        unattemptedChemistry: '',
        maxChemistry: '',
        timeTakenMinutes: ''
      });

      // Refresh tests
      const testsRes = await api.student.getTests();
      setTests(testsRes.tests);
      
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit test results.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Calculations for progress rings/completion bars for 11th, 12th and Combined
  const getSyllabusStats = () => {
    let t11 = 0, c11 = 0;
    let t12 = 0, c12 = 0;
    
    const subjectsStats = {};

    syllabus.forEach(sub => {
      let subT11 = 0, subC11 = 0;
      let subT12 = 0, subC12 = 0;

      // 11th
      (sub.classes["11th"] || []).forEach(chap => {
        chap.topics.forEach(topic => {
          t11++;
          subT11++;
          if (topic.status === 'completed' || topic.status === 'revision') {
            c11++;
            subC11++;
          }
        });
      });

      // 12th
      (sub.classes["12th"] || []).forEach(chap => {
        chap.topics.forEach(topic => {
          t12++;
          subT12++;
          if (topic.status === 'completed' || topic.status === 'revision') {
            c12++;
            subC12++;
          }
        });
      });

      subjectsStats[sub.name] = {
        "11th": subT11 > 0 ? Math.round((subC11 / subT11) * 100) : 0,
        "12th": subT12 > 0 ? Math.round((subC12 / subT12) * 100) : 0,
        combined: (subT11 + subT12) > 0 ? Math.round(((subC11 + subC12) / (subT11 + subT12)) * 100) : 0,
        completed: subC11 + subC12,
        total: subT11 + subT12
      };
    });

    return {
      "11th": {
        percent: t11 > 0 ? Math.round((c11 / t11) * 100) : 0,
        completed: c11,
        total: t11
      },
      "12th": {
        percent: t12 > 0 ? Math.round((c12 / t12) * 100) : 0,
        completed: c12,
        total: t12
      },
      combined: {
        percent: (t11 + t12) > 0 ? Math.round(((c11 + c12) / (t11 + t12)) * 100) : 0,
        completed: c11 + c12,
        total: t11 + t12
      },
      subjects: subjectsStats
    };
  };

  // Chart data formatting
  // 1. Sums solved per day (last 7 logs)
  const getSolvedChartData = () => {
    const solvedMap = {};
    
    // Sort logs chronologically
    const sortedLogs = [...logs].reverse();
    
    // Group by log_date
    sortedLogs.forEach(log => {
      const date = log.log_date;
      if (!solvedMap[date]) {
        solvedMap[date] = { date, Physics: 0, Chemistry: 0, Maths: 0, total: 0 };
      }
      if (log.subject_name === 'Physics') solvedMap[date].Physics += log.sums_solved;
      if (log.subject_name === 'Chemistry') solvedMap[date].Chemistry += log.sums_solved;
      if (log.subject_name === 'Mathematics') solvedMap[date].Maths += log.sums_solved;
      solvedMap[date].total += log.sums_solved;
    });

    return Object.values(solvedMap).slice(-7); // return last 7 days of logs
  };

  // 2. Score Trends Chart (Subject-wise & Total)
  const getScoreChartData = () => {
    return tests
      .filter(t => t.result_id) // only tests with scores
      .map(t => {
        let mathP = 0, physP = 0, chemP = 0;
        try {
          const bd = typeof t.subject_breakdown === 'string' ? JSON.parse(t.subject_breakdown) : t.subject_breakdown;
          if (Array.isArray(bd)) {
            bd.forEach(item => {
              const max = item.maxMarks || 100;
              const pct = Math.round((item.marks / max) * 100);
              if (item.subject === 'Mathematics' || item.subject === 'Maths') mathP = pct;
              if (item.subject === 'Physics') physP = pct;
              if (item.subject === 'Chemistry') chemP = pct;
            });
          }
        } catch(e) {}

        return {
          name: t.title,
          Total: Math.round((t.total_score / t.total_marks) * 100),
          Maths: mathP,
          Physics: physP,
          Chemistry: chemP,
          raw: `${t.total_score}/${t.total_marks}`
        };
      })
      .reverse(); // chronological order
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading student dashboard...</div>;
  }

  const stats = getSyllabusStats();
  const solvedChartData = getSolvedChartData();
  const scoreChartData = getScoreChartData();

  return (
    <div className="main-content">
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.8rem' }}>Welcome, {profile?.name}!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Class {profile?.classLevel} IIT-JEE Preparation Dashboard</p>
        </div>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>My Student Code:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-color)', fontSize: '1rem', border: '1px dashed rgba(59,130,246,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            {profile?.studentCode}
          </span>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Overview Cards Row */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel metric-card">
          <div className="metric-icon warning">
            <Flame size={24} />
          </div>
          <div>
            <div className="metric-value">{streak} Days</div>
            <div className="metric-label">Study Streak</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="metric-value">{stats.combined.percent}%</div>
            <div className="metric-label">Combined Progress</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon success">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="metric-value">
              {logs.reduce((sum, l) => sum + (l.sums_solved || 0), 0)}
            </div>
            <div className="metric-label">Sums Solved Total</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon info">
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-value">
              {Math.round(logs.reduce((sum, l) => sum + (l.time_spent_minutes || 0), 0) / 60)} hrs
            </div>
            <div className="metric-label">Time Spent Studying</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        {/* Quick Add Log Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={20} className="text-blue-500" style={{ color: 'var(--accent-color)' }} />
            <span>Quick-Log Daily Study</span>
          </h3>

          <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subject *</label>
                <select 
                  className="form-control"
                  value={logForm.subjectId} 
                  onChange={handleSubjectChange} 
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Chapter (Optional)</label>
                <select 
                  className="form-control"
                  value={logForm.chapterId} 
                  onChange={(e) => setLogForm({ ...logForm, chapterId: e.target.value })}
                  disabled={!logForm.subjectId}
                >
                  <option value="">Select Chapter</option>
                  {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.chapter_name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Problems Solved *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="0"
                  value={logForm.sumsSolved || ''}
                  onChange={(e) => {
                    const solved = parseInt(e.target.value) || 0;
                    const correct = Math.min(logForm.sumsCorrect, solved);
                    setLogForm({ ...logForm, sumsSolved: solved, sumsCorrect: correct });
                  }}
                  placeholder="e.g. 20"
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Correct / Incorrect</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    max={logForm.sumsSolved}
                    value={logForm.sumsCorrect || ''}
                    onChange={(e) => {
                      const correct = parseInt(e.target.value) || 0;
                      const boundCorrect = Math.min(correct, logForm.sumsSolved);
                      setLogForm({ ...logForm, sumsCorrect: boundCorrect });
                    }}
                    placeholder="Correct"
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '70px', whiteSpace: 'nowrap' }}>
                    {logForm.sumsSolved - logForm.sumsCorrect} incorrect
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Time Spent (Minutes) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="1"
                  value={logForm.timeSpentMinutes}
                  onChange={(e) => setLogForm({ ...logForm, timeSpentMinutes: e.target.value })}
                  placeholder="e.g. 90"
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Study Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={logForm.logDate}
                  onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Doubt Notes / Difficulty Level</label>
              <textarea 
                className="form-control" 
                rows="2"
                value={logForm.notes}
                onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                placeholder="What was hard? Any particular doubts?"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
              Save Session Log
            </button>
          </form>
        </div>

        {/* Syllabus Progress Bars */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} className="text-purple-500" style={{ color: 'var(--info)' }} />
            <span>Syllabus Progress (Physics / Chemistry / Maths)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', justifyContent: 'center', flex: 1 }}>
            {syllabus.map(sub => {
              const subStats = stats.subjects[sub.name] || { percent: 0, completed: 0, total: 0 };
              let color = 'var(--accent-color)';
              if (sub.name === 'Chemistry') color = 'var(--warning)';
              if (sub.name === 'Mathematics') color = 'var(--info)';

              return (
                <div key={sub.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span>{sub.name} (Combined)</span>
                    <span style={{ color }}>{subStats.combined}% ({subStats.completed}/{subStats.total})</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${subStats.combined}%`, backgroundColor: color }}
                    ></div>
                  </div>
                </div>
              );
            })}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>11th Grade Syllabus</span>
                <span>{stats["11th"].percent}% ({stats["11th"].completed}/{stats["11th"].total} topics)</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${stats["11th"].percent}%`, backgroundColor: 'var(--accent-color)' }}
                ></div>
              </div>
            </div>

            <div style={{ paddingTop: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>12th Grade Syllabus</span>
                <span>{stats["12th"].percent}% ({stats["12th"].completed}/{stats["12th"].total} topics)</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${stats["12th"].percent}%`, backgroundColor: 'var(--info)' }}
                ></div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                <span>Combined Overall Completion</span>
                <span>{stats.combined.percent}%</span>
              </div>
              <div className="progress-bar-container" style={{ height: '10px' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${stats.combined.percent}%`, background: 'linear-gradient(135deg, var(--accent-color) 0%, var(--info) 100%)' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Tests & Guidance Checklist */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} className="text-blue-500" style={{ color: 'var(--accent-color)' }} />
          <span>My Weekly Tests & Assignments</span>
        </h3>

        {tests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No weekly tests assigned yet by your parent. Use this time to revise current syllabus.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {tests.map(test => (
              <div 
                key={test.id} 
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.01)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{test.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      Subject: **{test.subject_name || 'Multi-Subject'}** | Marks: **{test.total_marks}** | Assigned by: **{test.parent_name}** | Test Date: **{test.test_date}**
                    </p>
                  </div>
                  
                  <div>
                    {test.result_id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span className="badge badge-completed" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
                          Submitted: {test.total_score}/{test.total_marks} ({Math.round(test.total_score / test.total_marks * 100)}%)
                        </span>
                        {test.time_taken_minutes && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duration: {test.time_taken_minutes} mins</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setActiveTest(test)} 
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                        >
                          Submit Results
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Preparedness:</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: (test.preparedness || 0) >= 75 ? 'var(--success)' : (test.preparedness || 0) >= 40 ? 'var(--warning)' : 'var(--danger)' }}>{test.preparedness || 0}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preparation Guidance Checklist */}
                {!test.result_id && test.guidance && test.guidance.length > 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 0, 0, 0.02)', borderLeft: '3px solid var(--accent-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--accent-color)' }}>
                      <AlertTriangle size={14} />
                      <span>Prep Guidance (Test Preparedness: {test.preparedness || 0}%):</span>
                    </div>
                    {test.guidance.map((g, idx) => (
                      <p key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {g.message}
                      </p>
                    ))}
                  </div>
                )}

                {test.file_url && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a 
                      href={`http://localhost:5000${test.file_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex' }}
                    >
                      <FileText size={14} />
                      Download Test Questions PDF
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Analytics Charts */}
      {logs.length > 0 && (
        <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
          {/* Question Solved Bar Chart */}
          <div className="glass-panel" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} className="text-blue-500" style={{ color: 'var(--accent-color)' }} />
              <span>Questions Solved Trend (Last 7 Logs)</span>
            </h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              {solvedChartData.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '5rem', color: 'var(--text-secondary)' }}>Log study daily to see trend lines</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={solvedChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid var(--border-color)', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Physics" fill="var(--accent-color)" stackId="a" />
                    <Bar dataKey="Chemistry" fill="var(--warning)" stackId="a" />
                    <Bar dataKey="Maths" fill="var(--info)" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Weekly Test Performance Analytics */}
          <div className="glass-panel" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} className="text-success" style={{ color: 'var(--success)' }} />
              <span>Weekly Test Trends (Subject-wise & Total %)</span>
            </h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              {scoreChartData.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '5rem', color: 'var(--text-secondary)' }}>No scores submitted yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="var(--text-secondary)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', color: '#000', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Total" stroke="var(--accent-color)" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Maths" stroke="var(--info)" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Physics" stroke="var(--danger)" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Chemistry" stroke="var(--warning)" strokeWidth={1.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Syllabus Areas Needing Attention */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} className="text-danger" style={{ color: 'var(--danger)' }} />
          <span>Syllabus Areas Needing Improvement (&lt; 50% Completion)</span>
        </h3>
        
        <div className="grid-cols-2" style={{ gap: '1rem' }}>
          {(() => {
            const weakChapters = [];
            syllabus.forEach(sub => {
              ['11th', '12th'].forEach(cls => {
                (sub.classes[cls] || []).forEach(chap => {
                  const total = chap.topics.length;
                  const completed = chap.topics.filter(t => t.status === 'completed' || t.status === 'revision').length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  if (pct < 50 && total > 0) {
                    weakChapters.push({
                      subject: sub.name,
                      chapter: chap.chapter_name,
                      classLevel: cls,
                      percent: pct,
                      completed,
                      total
                    });
                  }
                });
              });
            });

            if (weakChapters.length === 0) {
              return (
                <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', padding: '1rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', gridColumn: 'span 2' }}>
                  Great work! All chapters are above 50% completion.
                </div>
              );
            }

            return weakChapters.slice(0, 4).map((chap, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)' }}>
                <div>
                  <span className="badge badge-student-added" style={{ fontSize: '0.6rem', marginRight: '0.5rem', textTransform: 'none', borderStyle: 'solid' }}>{chap.subject} • Class {chap.classLevel}</span>
                  <strong style={{ fontSize: '0.85rem' }}>{chap.chapter}</strong>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.85rem' }}>
                  {chap.percent}% Complete
                </span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Test Score Submission Modal */}
      {activeTest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Submit Test Score</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Upload results for **{activeTest.title}** ({activeTest.subject_name || 'Multi-Subject'})
            </p>

            <form onSubmit={handleTestResultSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">My Total Score *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    max={activeTest.total_marks}
                    value={testResultForm.totalScore}
                    onChange={(e) => setTestResultForm({ ...testResultForm, totalScore: e.target.value })}
                    placeholder={`Out of ${activeTest.total_marks}`}
                    required 
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Time Taken (Mins)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    value={testResultForm.timeTakenMinutes}
                    onChange={(e) => setTestResultForm({ ...testResultForm, timeTakenMinutes: e.target.value })}
                    placeholder="e.g. 180 mins"
                  />
                </div>
              </div>

              {/* Subject breakdowns table */}
              <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                <table style={{ margin: 0, width: '100%', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '0.35rem', textAlign: 'left' }}>Subject</th>
                      <th style={{ padding: '0.35rem', width: '70px' }}>Marks</th>
                      <th style={{ padding: '0.35rem', width: '70px' }}>Out Of</th>
                      <th style={{ padding: '0.35rem', width: '55px' }}>Corr</th>
                      <th style={{ padding: '0.35rem', width: '55px' }}>Incorr</th>
                      <th style={{ padding: '0.35rem', width: '55px' }}>Unatt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.35rem', fontWeight: 600 }}>Maths</td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.breakdownMaths} onChange={(e) => setTestResultForm({ ...testResultForm, breakdownMaths: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.maxMaths} onChange={(e) => setTestResultForm({ ...testResultForm, maxMaths: e.target.value })} placeholder="100" />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.correctMaths} onChange={(e) => setTestResultForm({ ...testResultForm, correctMaths: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.incorrectMaths} onChange={(e) => setTestResultForm({ ...testResultForm, incorrectMaths: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.unattemptedMaths} onChange={(e) => setTestResultForm({ ...testResultForm, unattemptedMaths: e.target.value })} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.35rem', fontWeight: 600 }}>Physics</td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.breakdownPhysics} onChange={(e) => setTestResultForm({ ...testResultForm, breakdownPhysics: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.maxPhysics} onChange={(e) => setTestResultForm({ ...testResultForm, maxPhysics: e.target.value })} placeholder="100" />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.correctPhysics} onChange={(e) => setTestResultForm({ ...testResultForm, correctPhysics: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.incorrectPhysics} onChange={(e) => setTestResultForm({ ...testResultForm, incorrectPhysics: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.unattemptedPhysics} onChange={(e) => setTestResultForm({ ...testResultForm, unattemptedPhysics: e.target.value })} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.35rem', fontWeight: 600 }}>Chem</td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.breakdownChemistry} onChange={(e) => setTestResultForm({ ...testResultForm, breakdownChemistry: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.maxChemistry} onChange={(e) => setTestResultForm({ ...testResultForm, maxChemistry: e.target.value })} placeholder="100" />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.correctChemistry} onChange={(e) => setTestResultForm({ ...testResultForm, correctChemistry: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.incorrectChemistry} onChange={(e) => setTestResultForm({ ...testResultForm, incorrectChemistry: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={testResultForm.unattemptedChemistry} onChange={(e) => setTestResultForm({ ...testResultForm, unattemptedChemistry: e.target.value })} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '0.25rem' }}>Answer Sheet Scan (PDF/Image)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px dashed var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <UploadCloud size={16} className="text-secondary" style={{ color: 'var(--text-secondary)' }} />
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    style={{ fontSize: '0.75rem', cursor: 'pointer', width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '0.25rem' }}>Weak Topics / Error Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={testResultForm.weakTopics}
                  onChange={(e) => setTestResultForm({ ...testResultForm, weakTopics: e.target.value })}
                  placeholder="e.g. Got stuck in Integration, missed p-block formulas"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setActiveTest(null);
                    setAnswerSheetFile(null);
                  }}
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.4rem 0.75rem' }}
                  disabled={uploadingFile}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.4rem 0.75rem' }}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? 'Uploading...' : 'Submit Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
