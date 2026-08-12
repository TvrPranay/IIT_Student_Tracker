import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { 
  Award, Link, BookOpen, Clock, AlertTriangle, Users, Calendar, 
  Flame, CheckCircle, PlusCircle, TrendingUp, BarChart2, PieChart as PieIcon, List 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

export const ParentDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Link code input
  const [studentCodeInput, setStudentCodeInput] = useState('');
  
  // Selected Student stats
  const [overview, setOverview] = useState(null);
  const [progress, setProgress] = useState([]);
  const [logs, setLogs] = useState([]);
  const [chartsData, setChartsData] = useState(null);

  // Active view tab for detailed student analysis
  const [detailTab, setDetailTab] = useState('syllabus'); // 'syllabus' or 'logs'

  const [loading, setLoading] = useState(true);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // Syllabus tracker filters
  const [syllabusFilter, setSyllabusFilter] = useState('All');

  useEffect(() => {
    fetchParentData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentDetails(selectedStudentId);
    } else {
      setOverview(null);
      setProgress([]);
      setLogs([]);
      setChartsData(null);
    }
  }, [selectedStudentId]);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const res = await api.parent.getStudents();
      setStudents(res.students);
      if (res.students.length > 0) {
        setSelectedStudentId(res.students[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch linked students.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const [overviewRes, progressRes, logsRes, chartsRes] = await Promise.all([
        api.parent.getStudentOverview(studentId),
        api.parent.getStudentProgress(studentId),
        api.parent.getStudentLogs(studentId),
        api.parent.getStudentCharts(studentId)
      ]);
      setOverview(overviewRes.metrics);
      setProgress(progressRes.progress);
      setLogs(logsRes.logs);
      setChartsData(chartsRes);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve child study metrics.');
    }
  };

  const handleLinkStudent = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    setLinkingLoading(true);

    if (!studentCodeInput.trim()) {
      setLinkError('Please enter a student linking code.');
      setLinkingLoading(false);
      return;
    }

    try {
      const res = await api.parent.linkStudent(studentCodeInput);
      setLinkSuccess(`Linked successfully to student: ${res.student.name}!`);
      setStudentCodeInput('');
      
      // Refresh students list
      const studentsRes = await api.parent.getStudents();
      setStudents(studentsRes.students);
      
      // Auto select newly linked student
      setSelectedStudentId(res.student.id.toString());
      
      setTimeout(() => setLinkSuccess(''), 4000);
    } catch (err) {
      setLinkError(err.message || 'Failed to link code.');
    } finally {
      setLinkingLoading(false);
    }
  };

  // Heatmap generation
  const renderHeatmap = () => {
    if (!chartsData || !chartsData.heatmap) return null;

    const heatmapData = chartsData.heatmap;
    const cells = [];
    const today = new Date();
    
    // Create 364 days backwards (52 weeks)
    for (let i = 364; i >= 0; i--) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Search activity in date
      const activity = heatmapData.find(h => h.log_date === dateStr);
      const sums = activity ? activity.total_sums : 0;
      const count = activity ? activity.log_count : 0;

      let level = 0;
      if (sums > 0 && sums <= 10) level = 1;
      else if (sums > 10 && sums <= 25) level = 2;
      else if (sums > 25 && sums <= 50) level = 3;
      else if (sums > 50) level = 4;

      cells.push({
        date: dateStr,
        sums,
        count,
        level
      });
    }

    return (
      <div className="heatmap-container">
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          <span>Less</span>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <div className="heatmap-cell heatmap-level-0"></div>
            <div className="heatmap-cell heatmap-level-1"></div>
            <div className="heatmap-cell heatmap-level-2"></div>
            <div className="heatmap-cell heatmap-level-3"></div>
            <div className="heatmap-cell heatmap-level-4"></div>
          </div>
          <span>More</span>
          <span style={{ marginLeft: 'auto' }}>*Grid squares show daily sums solved*</span>
        </div>
        
        <div className="heatmap-grid">
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={`heatmap-cell heatmap-level-${cell.level}`}
              data-tooltip={`${cell.date}: ${cell.sums} problems solved (${cell.count} logs)`}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  // Recharts Pie Chart variables (Muted Academic Palette)
  const COLORS = ['#2d6a4f', '#444444', '#b25e00', '#71717a', '#52b788'];

  // Track parent filters
  const [classFilter, setClassFilter] = useState('All');
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);

  const getParentProgressStats = () => {
    if (progress.length === 0) return { "11th": 0, "12th": 0, combined: 0 };
    let t11 = 0, c11 = 0;
    let t12 = 0, c12 = 0;
    
    progress.forEach(p => {
      if (p.class_level === '11th') {
        t11++;
        if (p.status === 'completed' || p.status === 'revision') c11++;
      } else if (p.class_level === '12th') {
        t12++;
        if (p.status === 'completed' || p.status === 'revision') c12++;
      }
    });
    
    return {
      "11th": t11 > 0 ? Math.round((c11 / t11) * 100) : 0,
      "12th": t12 > 0 ? Math.round((c12 / t12) * 100) : 0,
      combined: (t11 + t12) > 0 ? Math.round(((c11 + c12) / (t11 + t12)) * 100) : 0
    };
  };

  const getFilteredProgress = () => {
    let list = progress;
    if (syllabusFilter !== 'All') {
      list = list.filter(p => p.subject_name === syllabusFilter);
    }
    if (classFilter !== 'All') {
      list = list.filter(p => p.class_level === classFilter);
    }
    return list;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading parent dashboard...</div>;
  }

  const selectedStudent = students.find(s => s.id.toString() === selectedStudentId);
  const filteredProgress = getFilteredProgress();

  return (
    <div className="main-content">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.8rem' }}>Parent Portal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor IIT-JEE syllabus completion, weekly tests, and daily study metrics.</p>
        </div>

        {/* Switcher & Code Link Box */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {students.length > 0 && (
            <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <Users size={16} className="text-blue-500" style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Child:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="form-control"
                style={{ padding: '0.25rem 0.5rem', width: '150px', background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem' }}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Class {s.class_level})</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Link Code Form */}
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <form onSubmit={handleLinkStudent} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value={studentCodeInput}
                onChange={(e) => setStudentCodeInput(e.target.value)}
                placeholder="Student Code (IIT-XXXXXX)"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '180px' }}
                disabled={linkingLoading}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                disabled={linkingLoading}
              >
                {linkingLoading ? 'Linking...' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Link success/error messages */}
      {(linkSuccess || linkError) && (
        <div style={{ marginBottom: '1.5rem' }}>
          {linkSuccess && (
            <div style={{ backgroundColor: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
              {linkSuccess}
            </div>
          )}
          {linkError && (
            <div style={{ backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
              {linkError}
            </div>
          )}
        </div>
      )}

      {students.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <Link size={48} className="text-secondary" style={{ color: 'var(--text-secondary)', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>No Students Linked</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 2rem', fontSize: '0.9rem' }}>
            To monitor progress, ask your child for their **Student Code** (available on their dashboard or profile, e.g. `IIT-7F3K9Q`). Enter the code in the box above to link their account.
          </p>
        </div>
      ) : (
        <>
          {/* Flags / Alerts Section */}
          {overview?.flags && overview.flags.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {overview.flags.map((flag, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    backgroundColor: flag.type === 'danger' ? 'var(--danger-glow)' : 'var(--warning-glow)', 
                    color: flag.type === 'danger' ? 'var(--danger)' : 'var(--warning)', 
                    border: flag.type === 'danger' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)',
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{flag.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Overview Stats Cards */}
          {(() => {
            const parentStats = getParentProgressStats();
            return (
              <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel metric-card" style={{ flex: '1.2' }}>
                  <div className="metric-icon">
                    <BookOpen size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{parentStats.combined}%</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Combined</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <span>11th: <strong>{parentStats["11th"]}%</strong></span>
                      <span>12th: <strong>{parentStats["12th"]}%</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Child Metric Summary Cards */}
          <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
            <div className="glass-panel metric-card">
              <div className="metric-icon warning">
                <Flame size={24} />
              </div>
              <div>
                <div className="metric-value">{overview?.streak || 0} Days</div>
                <div className="metric-label">Study Streak</div>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon">
                <BookOpen size={24} />
              </div>
              <div>
                <div className="metric-value">{overview?.overallSyllabusPercent || 0}%</div>
                <div className="metric-label">Syllabus Completion</div>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon success">
                <CheckCircle size={24} />
              </div>
              <div>
                <div className="metric-value">
                  {overview?.sumsSolvedThisWeek ? 
                    (overview.sumsSolvedThisWeek.Physics + overview.sumsSolvedThisWeek.Chemistry + overview.sumsSolvedThisWeek.Mathematics) : 0
                  }
                </div>
                <div className="metric-label">Problems Solved (This Week)</div>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon info">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="metric-value">
                  {overview?.lastTest ? 
                    `${overview.lastTest.score}/${overview.lastTest.totalMarks}` : 'N/A'
                  }
                </div>
                <div className="metric-label">
                  {overview?.lastTest ? `Last Test (${Math.round(overview.lastTest.score / overview.lastTest.totalMarks * 100)}%)` : 'No test score logged'}
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap Contribution Graph */}
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} className="text-blue-500" style={{ color: 'var(--accent-color)' }} />
              <span>Daily Study Activity Heatmap ({selectedStudent?.name})</span>
            </h3>
            {renderHeatmap()}
          </div>

          {/* Analytics Charts */}
          {chartsData && (
            <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
              {/* Daily Sums Trend */}
              <div className="glass-panel" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Problems Solved over Time (30 Days)</h4>
                <div style={{ flex: 1, minHeight: 0 }}>
                  {chartsData.sumsSolvedTrend && chartsData.sumsSolvedTrend.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No logging activity recorded</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartsData.sumsSolvedTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <XAxis dataKey="log_date" stroke="var(--text-secondary)" fontSize={10} />
                        <YAxis stroke="var(--text-secondary)" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', fontSize: 11 }} />
                        <Bar dataKey="total_sums" fill="var(--accent-color)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Test Score Trend */}
              <div className="glass-panel" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Weekly Test Accuracy Trends (%)</h4>
                <div style={{ flex: 1, minHeight: 0 }}>
                  {chartsData.testScores && chartsData.testScores.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No weekly test scores submitted</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={chartsData.testScores.map(t => {
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
                            Chemistry: chemP
                          };
                        })} 
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={9} />
                        <YAxis domain={[0, 100]} stroke="var(--text-secondary)" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', color: '#000', fontSize: 10 }} />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        <Line type="monotone" dataKey="Total" stroke="var(--accent-color)" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Maths" stroke="var(--info)" strokeWidth={1} dot={{ r: 1 }} />
                        <Line type="monotone" dataKey="Physics" stroke="var(--danger)" strokeWidth={1} dot={{ r: 1 }} />
                        <Line type="monotone" dataKey="Chemistry" stroke="var(--warning)" strokeWidth={1} dot={{ r: 1 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Time Spent Pie Chart */}
              <div className="glass-panel" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Time Distribution per Subject (Mins)</h4>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {chartsData.timeSpent && chartsData.timeSpent.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No study logs submitted</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartsData.timeSpent}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartsData.timeSpent.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Syllabus Areas Needing Attention */}
          <div className="glass-panel" style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} className="text-danger" style={{ color: 'var(--danger)' }} />
              <span>Syllabus Areas Needing Improvement (&lt; 50% Completion)</span>
            </h3>
            
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              {(() => {
                const chaptersMap = {};
                progress.forEach(item => {
                  const key = `${item.chapter_id}`;
                  if (!chaptersMap[key]) {
                    chaptersMap[key] = {
                      chapterId: item.chapter_id,
                      chapterName: item.chapter_name,
                      subjectName: item.subject_name,
                      classLevel: item.class_level,
                      total: 0,
                      completed: 0
                    };
                  }
                  chaptersMap[key].total++;
                  if (item.status === 'completed' || item.status === 'revision') {
                    chaptersMap[key].completed++;
                  }
                });

                const weak = [];
                Object.values(chaptersMap).forEach(chap => {
                  const pct = chap.total > 0 ? Math.round((chap.completed / chap.total) * 100) : 0;
                  if (pct < 50 && chap.total > 0) {
                    weak.push({
                      ...chap,
                      percent: pct
                    });
                  }
                });

                if (weak.length === 0) {
                  return (
                    <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', padding: '1rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', gridColumn: 'span 2' }}>
                      Great progress! {selectedStudent?.name} has completed 50% or more topics in every single chapter.
                    </div>
                  );
                }

                return weak.slice(0, 4).map((chap, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)' }}>
                    <div>
                      <span className="badge badge-student-added" style={{ fontSize: '0.6rem', marginRight: '0.5rem', textTransform: 'none', borderStyle: 'solid' }}>{chap.subjectName} • Class {chap.classLevel}</span>
                      <strong style={{ fontSize: '0.85rem' }}>{chap.chapterName}</strong>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.85rem' }}>
                      {chap.percent}% Complete ({chap.completed}/{chap.total})
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Child Detailed Analysis Tab view */}
          <div className="tab-list">
            <button
              onClick={() => setDetailTab('syllabus')}
              className={`tab-trigger ${detailTab === 'syllabus' ? 'active' : ''}`}
            >
              Detailed Syllabus Status
            </button>
            <button
              onClick={() => setDetailTab('logs')}
              className={`tab-trigger ${detailTab === 'logs' ? 'active' : ''}`}
            >
              Child Study Session Logs
            </button>
            <button
              onClick={() => setDetailTab('tests')}
              className={`tab-trigger ${detailTab === 'tests' ? 'active' : ''}`}
            >
              Weekly Test Results
            </button>
          </div>

          {/* Syllabus Details Tracker */}
          {detailTab === 'syllabus' && (
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h4 style={{ fontWeight: 700, margin: 0 }}>Chapter-by-Chapter Tracker</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['All', 'Physics', 'Chemistry', 'Mathematics'].map(subj => (
                    <button
                      key={subj}
                      onClick={() => setSyllabusFilter(subj)}
                      className={`btn ${syllabusFilter === subj ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      {subj}
                    </button>
                  ))}
                  
                  <span style={{ borderLeft: '1px solid var(--border-color)', margin: '0 0.25rem' }}></span>

                  {['All', '11th', '12th'].map(cls => (
                    <button
                      key={cls}
                      onClick={() => setClassFilter(cls)}
                      className={`btn ${classFilter === cls ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      {cls === 'All' ? 'All Classes' : `${cls} Class`}
                    </button>
                  ))}
                </div>
              </div>

              {filteredProgress.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No syllabus items matches filter.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Group progress into chapters */}
                  {Object.values(filteredProgress.reduce((acc, item) => {
                    if (!acc[item.chapter_id]) {
                      acc[item.chapter_id] = {
                        chapterName: item.chapter_name,
                        subjectName: item.subject_name,
                        topics: []
                      };
                    }
                    acc[item.chapter_id].topics.push(item);
                    return acc;
                  }, {})).map((chap, idx) => {
                    const total = chap.topics.length;
                    const completed = chap.topics.filter(t => t.status === 'completed' || t.status === 'revision').length;
                    const percent = Math.round((completed / total) * 100);

                    return (
                      <div 
                        key={idx} 
                        style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <span className={`badge badge-${chap.subjectName === 'Physics' ? 'not_started' : chap.subjectName === 'Chemistry' ? 'in_progress' : 'revision'}`} style={{ marginRight: '0.5rem', textTransform: 'none' }}>
                              {chap.subjectName}
                            </span>
                            <span style={{ fontWeight: 700 }}>{chap.chapterName}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: percent === 100 ? 'var(--success)' : 'var(--text-secondary)' }}>
                            Completion: {percent}% ({completed}/{total} topics)
                          </span>
                        </div>

                        {/* Topics badges inline */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {chap.topics.map((t, tIdx) => {
                            let badgeClass = `badge badge-${t.status}`;
                            let extraLabel = null;
                            if (t.added_by === 'student') {
                              extraLabel = <span className="badge badge-student-added" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', marginLeft: '0.2rem' }}>Added by Student</span>;
                            }
                            if (t.is_hidden === 1) {
                              badgeClass += " badge-hidden";
                              extraLabel = <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', marginLeft: '0.2rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Hidden by Student</span>;
                            }
                            return (
                              <div key={tIdx} style={{ display: 'flex', alignItems: 'center' }}>
                                <span 
                                  className={badgeClass}
                                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
                                >
                                  {t.topic_name}
                                </span>
                                {extraLabel}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Child Logs tracker */}
          {detailTab === 'logs' && (
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No study logs registered by child yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.75rem' }}>Date</th>
                      <th style={{ padding: '0.75rem' }}>Subject</th>
                      <th style={{ padding: '0.75rem' }}>Chapter</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Duration</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Problems Solved</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Accuracy</th>
                      <th style={{ padding: '0.75rem' }}>Notes & Doubts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const acc = log.sums_solved > 0 && log.sums_correct !== null
                        ? Math.round((log.sums_correct / log.sums_solved) * 100)
                        : null;

                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{log.log_date}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className={`badge badge-${log.subject_name === 'Physics' ? 'not_started' : log.subject_name === 'Chemistry' ? 'in_progress' : 'revision'}`} style={{ textTransform: 'none' }}>
                              {log.subject_name}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{log.chapter_name || 'General Study'}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{log.time_spent_minutes} mins</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>{log.sums_solved}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {acc !== null ? (
                              <span style={{ fontWeight: 600, color: acc >= 80 ? 'var(--success)' : acc >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                                {acc}% ({log.sums_correct}/{log.sums_solved})
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{log.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {/* Weekly Test Results Tab View */}
          {detailTab === 'tests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Assigned Tests & Preparedness */}
              <div className="glass-panel">
                <h4 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Assigned Weekly Tests & Student Preparedness</h4>
                {(!chartsData?.assignedTests || chartsData.assignedTests.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                    No weekly tests assigned to this student yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chartsData.assignedTests.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{t.title}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Subject: <strong>{t.subject_name || 'Multi-Subject'}</strong> | Date: <strong>{t.test_date}</strong> | Max Marks: <strong>{t.total_marks}</strong>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          {/* Preparedness */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Preparedness:</span>
                              <strong style={{ fontSize: '0.8rem', color: t.preparedness >= 75 ? 'var(--success)' : t.preparedness >= 45 ? 'var(--warning)' : 'var(--danger)' }}>
                                {t.preparedness}%
                              </strong>
                            </div>
                            <div style={{ width: '80px', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border-color)', marginTop: '0.2rem' }}>
                              <div style={{ width: `${t.preparedness}%`, height: '100%', backgroundColor: t.preparedness >= 75 ? 'var(--success)' : t.preparedness >= 45 ? 'var(--warning)' : 'var(--danger)' }}></div>
                            </div>
                          </div>
                          
                          {/* Submission Status */}
                          <div>
                            {t.result_id ? (
                              <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>
                                Score: {t.total_score}/{t.total_marks}
                              </span>
                            ) : (
                              <span className="badge badge-in_progress" style={{ fontSize: '0.75rem' }}>
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weekly Test Submission Records Table */}
              <div className="glass-panel">
                <h4 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Weekly Test Submission Records</h4>
                {(!chartsData?.testScores || chartsData.testScores.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No weekly test results logged for this student.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Test Title</th>
                          <th>Subject Scope</th>
                          <th>Test Date</th>
                          <th>Marks Obtained</th>
                          <th>Time Taken</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartsData.testScores.map((t, idx) => {
                          const percent = Math.round((t.total_score / t.total_marks) * 100);
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{t.title}</td>
                              <td style={{ textAlign: 'center' }}>{t.subject_name || 'Multi-Subject'}</td>
                              <td style={{ textAlign: 'center' }}>{t.test_date}</td>
                              <td style={{ textAlign: 'center', fontWeight: 700, color: percent >= 75 ? 'var(--success)' : percent >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                                {t.total_score} / {t.total_marks} ({percent}%)
                              </td>
                              <td style={{ textAlign: 'center' }}>{t.time_taken_minutes ? `${t.time_taken_minutes} mins` : '-'}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  onClick={() => setSelectedTestDetail(t)} 
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  View Breakdown
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Test Detail Breakdown Modal */}
      {selectedTestDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Test Result Breakdown</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Detailed submission for <strong>{selectedTestDetail.title}</strong> ({selectedTestDetail.test_date})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-panel metric-card" style={{ padding: '0.75rem', marginBottom: 0 }}>
                  <div>
                    <div className="metric-value">{selectedTestDetail.total_score} / {selectedTestDetail.total_marks}</div>
                    <div className="metric-label">Total Score ({Math.round(selectedTestDetail.total_score / selectedTestDetail.total_marks * 100)}%)</div>
                  </div>
                </div>
                <div className="glass-panel metric-card" style={{ padding: '0.75rem', marginBottom: 0 }}>
                  <div>
                    <div className="metric-value">{selectedTestDetail.time_taken_minutes ? `${selectedTestDetail.time_taken_minutes} m` : 'N/A'}</div>
                    <div className="metric-label">Time Taken</div>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div>
                <h5 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Subject Analysis</h5>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                  <table style={{ margin: 0, width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '0.35rem', textAlign: 'left' }}>Subject</th>
                        <th style={{ padding: '0.35rem' }}>Score</th>
                        <th style={{ padding: '0.35rem' }}>Out Of</th>
                        <th style={{ padding: '0.35rem' }}>Percent</th>
                        <th style={{ padding: '0.35rem' }}>Correct</th>
                        <th style={{ padding: '0.35rem' }}>Incorrect</th>
                        <th style={{ padding: '0.35rem' }}>Unattempted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        try {
                          const breakdown = typeof selectedTestDetail.subject_breakdown === 'string' 
                            ? JSON.parse(selectedTestDetail.subject_breakdown) 
                            : selectedTestDetail.subject_breakdown;
                          
                          if (Array.isArray(breakdown)) {
                            return breakdown.map((item, idx) => {
                              const max = item.maxMarks || 100;
                              const pct = Math.round((item.marks / max) * 100);
                              return (
                                <tr key={idx}>
                                  <td style={{ padding: '0.35rem', fontWeight: 600 }}>{item.subject}</td>
                                  <td style={{ padding: '0.35rem', textAlign: 'center' }}>{item.marks}</td>
                                  <td style={{ padding: '0.35rem', textAlign: 'center' }}>{max}</td>
                                  <td style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 700 }}>{pct}%</td>
                                  <td style={{ padding: '0.35rem', textAlign: 'center', color: 'var(--success)' }}>{item.correct}</td>
                                  <td style={{ padding: '0.35rem', textAlign: 'center', color: 'var(--danger)' }}>{item.incorrect}</td>
                                  <td style={{ padding: '0.35rem', textAlign: 'center', color: 'var(--text-muted)' }}>{item.unattempted}</td>
                                </tr>
                              );
                            });
                          } else if (breakdown && typeof breakdown === 'object') {
                            // Support legacy breakdown structure
                            return Object.entries(breakdown).map(([subj, val], idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '0.35rem', fontWeight: 600 }}>{subj}</td>
                                <td style={{ padding: '0.35rem', textAlign: 'center' }}>{val}</td>
                                <td style={{ padding: '0.35rem', textAlign: 'center' }}>100</td>
                                <td style={{ padding: '0.35rem', textAlign: 'center' }}>{val}%</td>
                                <td style={{ padding: '0.35rem', textAlign: 'center' }}>-</td>
                                <td style={{ padding: '0.35rem', textAlign: 'center' }}>-</td>
                                <td style={{ padding: '0.35rem', textAlign: 'center' }}>-</td>
                              </tr>
                            ));
                          }
                        } catch (e) {
                          console.error(e);
                        }
                        return <tr><td colSpan="7" style={{ textAlign: 'center', padding: '0.5rem' }}>No breakdown detail available</td></tr>;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedTestDetail.weak_topics && (
                <div>
                  <h5 style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Weak Areas / Doubt Notes</h5>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem' }}>
                    {selectedTestDetail.weak_topics}
                  </div>
                </div>
              )}

              {selectedTestDetail.answer_sheet_file_url && (
                <div>
                  <h5 style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Uploaded Answer Sheet</h5>
                  <a 
                    href={`http://localhost:5000${selectedTestDetail.answer_sheet_file_url}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', padding: '0.4rem 0.75rem', textDecoration: 'none', fontSize: '0.8rem' }}
                  >
                    View / Download Answer Sheet Scan
                  </a>
                </div>
              )}

              <button 
                type="button" 
                onClick={() => setSelectedTestDetail(null)}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.5rem' }}
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
