import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Award, Calendar, AlertTriangle, FileText, UploadCloud, Plus, X, Check } from 'lucide-react';

export const StudentTests = () => {
  const [activeTab, setActiveTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Data for external tests creation
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);

  // Modal active test submission state
  const [activeTest, setActiveTest] = useState(null); // test object
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [sumsInput, setSumsInput] = useState('');

  const [testResultForm, setTestResultForm] = useState({
    totalScore: '',
    weakTopics: '',
    breakdownMaths: '',
    correctMaths: '',
    incorrectMaths: '',
    unattemptedMaths: '',
    maxMaths: '100',
    breakdownPhysics: '',
    correctPhysics: '',
    incorrectPhysics: '',
    unattemptedPhysics: '',
    maxPhysics: '100',
    breakdownChemistry: '',
    correctChemistry: '',
    incorrectChemistry: '',
    unattemptedChemistry: '',
    maxChemistry: '100',
    timeTakenMinutes: ''
  });

  const [externalForm, setExternalForm] = useState({
    title: '',
    subjectId: '',
    testDate: new Date().toISOString().split('T')[0],
    totalMarks: '',
    totalScore: '',
    weakTopics: '',
    breakdownMaths: '',
    correctMaths: '',
    incorrectMaths: '',
    unattemptedMaths: '',
    maxMaths: '100',
    breakdownPhysics: '',
    correctPhysics: '',
    incorrectPhysics: '',
    unattemptedPhysics: '',
    maxPhysics: '100',
    breakdownChemistry: '',
    correctChemistry: '',
    incorrectChemistry: '',
    unattemptedChemistry: '',
    maxChemistry: '100',
    timeTakenMinutes: ''
  });

  const [answerSheetFile, setAnswerSheetFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Statuses
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, assignmentsRes, subjectsRes, chaptersRes] = await Promise.all([
        api.student.getTests(),
        api.student.getAssignments(),
        api.getSubjects(),
        api.getChapters()
      ]);
      setTests(testsRes.tests);
      setAssignments(assignmentsRes.assignments);
      setSubjects(subjectsRes.subjects);
      setChapters(chaptersRes.chapters);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tests data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setAnswerSheetFile(e.target.files[0]);
  };

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setExternalForm({ ...externalForm, subjectId: subId });
    setSelectedChapters([]);
    if (subId) {
      setFilteredChapters(chapters.filter(c => c.subject_id === parseInt(subId)));
    } else {
      setFilteredChapters([]);
    }
  };

  const handleChapterToggle = (chapId) => {
    if (selectedChapters.includes(chapId)) {
      setSelectedChapters(selectedChapters.filter(id => id !== chapId));
    } else {
      setSelectedChapters([...selectedChapters, chapId]);
    }
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
        maxMaths: '100',
        breakdownPhysics: '',
        correctPhysics: '',
        incorrectPhysics: '',
        unattemptedPhysics: '',
        maxPhysics: '100',
        breakdownChemistry: '',
        correctChemistry: '',
        incorrectChemistry: '',
        unattemptedChemistry: '',
        maxChemistry: '100',
        timeTakenMinutes: ''
      });

      // Refresh tests list
      const testsRes = await api.student.getTests();
      setTests(testsRes.tests);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit test score.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit external test
  const handleExternalSubmit = async (e) => {
    e.preventDefault();
    if (!externalForm.title || !externalForm.testDate || !externalForm.totalMarks || externalForm.totalScore === '') {
      setError('Please fill in all required fields.');
      return;
    }

    setUploadingFile(true);
    setError('');
    setSuccessMsg('');

    try {
      let fileUrl = null;
      if (answerSheetFile) {
        const uploadRes = await api.uploadFile(answerSheetFile);
        fileUrl = uploadRes.fileUrl;
      }

      const breakdown = [
        {
          subject: 'Mathematics',
          marks: externalForm.breakdownMaths ? parseInt(externalForm.breakdownMaths) : 0,
          maxMarks: externalForm.maxMaths ? parseInt(externalForm.maxMaths) : 100,
          correct: externalForm.correctMaths ? parseInt(externalForm.correctMaths) : 0,
          incorrect: externalForm.incorrectMaths ? parseInt(externalForm.incorrectMaths) : 0,
          unattempted: externalForm.unattemptedMaths ? parseInt(externalForm.unattemptedMaths) : 0
        },
        {
          subject: 'Physics',
          marks: externalForm.breakdownPhysics ? parseInt(externalForm.breakdownPhysics) : 0,
          maxMarks: externalForm.maxPhysics ? parseInt(externalForm.maxPhysics) : 100,
          correct: externalForm.correctPhysics ? parseInt(externalForm.correctPhysics) : 0,
          incorrect: externalForm.incorrectPhysics ? parseInt(externalForm.incorrectPhysics) : 0,
          unattempted: externalForm.unattemptedPhysics ? parseInt(externalForm.unattemptedPhysics) : 0
        },
        {
          subject: 'Chemistry',
          marks: externalForm.breakdownChemistry ? parseInt(externalForm.breakdownChemistry) : 0,
          maxMarks: externalForm.maxChemistry ? parseInt(externalForm.maxChemistry) : 100,
          correct: externalForm.correctChemistry ? parseInt(externalForm.correctChemistry) : 0,
          incorrect: externalForm.incorrectChemistry ? parseInt(externalForm.incorrectChemistry) : 0,
          unattempted: externalForm.unattemptedChemistry ? parseInt(externalForm.unattemptedChemistry) : 0
        }
      ];

      await api.student.logExternalTest({
        title: externalForm.title,
        subjectId: externalForm.subjectId ? parseInt(externalForm.subjectId) : null,
        syllabusScope: selectedChapters,
        testDate: externalForm.testDate,
        totalMarks: parseInt(externalForm.totalMarks),
        totalScore: parseInt(externalForm.totalScore),
        subjectBreakdown: breakdown,
        weakTopics: externalForm.weakTopics,
        answerSheetFileUrl: fileUrl,
        timeTakenMinutes: externalForm.timeTakenMinutes ? parseInt(externalForm.timeTakenMinutes) : null
      });

      setSuccessMsg(`Self/External test logged successfully!`);
      setShowExternalModal(false);
      setAnswerSheetFile(null);
      setSelectedChapters([]);
      setExternalForm({
        title: '',
        subjectId: '',
        testDate: new Date().toISOString().split('T')[0],
        totalMarks: '',
        totalScore: '',
        weakTopics: '',
        breakdownMaths: '',
        correctMaths: '',
        incorrectMaths: '',
        unattemptedMaths: '',
        maxMaths: '100',
        breakdownPhysics: '',
        correctPhysics: '',
        incorrectPhysics: '',
        unattemptedPhysics: '',
        maxPhysics: '100',
        breakdownChemistry: '',
        correctChemistry: '',
        incorrectChemistry: '',
        unattemptedChemistry: '',
        maxChemistry: '100',
        timeTakenMinutes: ''
      });

      // Refresh
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to log external test.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Complete parent custom syllabus assignment
  const handleAssignmentCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!activeAssignment) return;

    setError('');
    setSuccessMsg('');
    setUploadingFile(true);

    try {
      await api.student.completeAssignment(activeAssignment.id, parseInt(sumsInput) || 0);
      setSuccessMsg(`Assignment "${activeAssignment.note || 'Custom Task'}" marked as completed!`);
      setActiveAssignment(null);
      setSumsInput('');

      // Refresh assignments list
      const assignmentsRes = await api.student.getAssignments();
      setAssignments(assignmentsRes.assignments);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to complete assignment.');
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading tests & assignments...</div>;
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.8rem' }}>Weekly Tests & Assignments</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Log score breakdowns or practice with exam sheets shared by your parent.</p>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Tabs navigation list & external button header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid var(--border-color)', marginBottom: '1.75rem' }}>
        <div className="tab-list" style={{ borderBottom: 'none', marginBottom: 0 }}>
          <button 
            onClick={() => setActiveTab('tests')} 
            className={`tab-trigger ${activeTab === 'tests' ? 'active' : ''}`}
          >
            Weekly Tests ({tests.length})
          </button>
          <button 
            onClick={() => setActiveTab('assignments')} 
            className={`tab-trigger ${activeTab === 'assignments' ? 'active' : ''}`}
          >
            Assignments from Parent ({assignments.length})
          </button>
        </div>

        {activeTab === 'tests' && (
          <button 
            onClick={() => setShowExternalModal(true)}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}
          >
            <Plus size={14} />
            <span>Log Self/External Test</span>
          </button>
        )}
      </div>

      {/* Tests Section */}
      {activeTab === 'tests' && (
        <div className="glass-panel">
          {tests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No weekly tests logged yet. Click "Log Self/External Test" to add one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{test.title}</h3>
                        {test.created_by_parent_id === null && (
                          <span className="badge badge-student-added" style={{ fontSize: '0.65rem' }}>Self Logged</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Subject: **{test.subject_name || 'Multi-Subject'}**</span>
                        <span>Date: **{test.test_date}**</span>
                        <span>Total Marks: **{test.total_marks}**</span>
                        <span>Assigned by: **{test.parent_name}**</span>
                      </div>
                    </div>

                    <div>
                      {test.result_id ? (
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-completed">
                            Score: {test.total_score}/{test.total_marks} ({Math.round(test.total_score / test.total_marks * 100)}%)
                          </span>
                          {test.time_taken_minutes && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Duration: {test.time_taken_minutes} mins</div>
                          )}
                          {test.answer_sheet_file_url && (
                            <div style={{ marginTop: '0.25rem' }}>
                              <a 
                                href={`http://localhost:5000${test.answer_sheet_file_url}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ fontSize: '0.75rem', color: 'var(--accent-color)', textDecoration: 'underline' }}
                              >
                                View Answer Sheet
                              </a>
                            </div>
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
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', borderLeft: '3px solid var(--accent-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem', color: 'var(--accent-color)' }}>
                        <AlertTriangle size={14} />
                        <span>Prep Guidance (Syllabus Preparedness: {test.preparedness || 0}%):</span>
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
                        rel="noreferrer"
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
      )}

      {/* Assignments Section */}
      {activeTab === 'assignments' && (
        <div className="glass-panel">
          {assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No custom parent materials or text assignments.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {assignments.map(ass => (
                <div key={ass.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-revision">
                      {ass.subject_name || 'General'} {ass.chapter_name ? `• ${ass.chapter_name}` : ''}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Shared: {new Date(ass.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {ass.note && <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{ass.note}</p>}
                  
                  {ass.content_type === 'text' ? (
                    <div style={{ padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                      {ass.text_content}
                    </div>
                  ) : (
                    <div>
                      <a 
                        href={`http://localhost:5000${ass.file_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex' }}
                      >
                        <FileText size={14} />
                        View Attached File
                      </a>
                    </div>
                  )}

                  {/* Completion and sums solved tracking */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div>
                      {ass.status === 'completed' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)' }}>
                          <Check size={16} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Completed ({ass.sums_completed} sums solved)
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status: Pending completion</span>
                      )}
                    </div>

                    <div>
                      {ass.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setActiveAssignment(ass);
                            setSumsInput('');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Result Modal */}
      {activeTest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontWeight: 700 }}>Submit Test Score</h3>
              <button onClick={() => { setActiveTest(null); setAnswerSheetFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Log breakdown for **{activeTest.title}** ({activeTest.subject_name || 'Multi-Subject'})
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
                <label className="form-label" style={{ marginBottom: '0.25rem' }}>Upload Answer Sheet Scan (PDF/Image)</label>
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
                  placeholder="e.g. Silly calculation errors in Chem, got confused in integration"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setActiveTest(null); setAnswerSheetFile(null); }}
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.5rem' }}
                  disabled={uploadingFile}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.5rem' }}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? 'Uploading...' : 'Submit Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Self / External Test Modal */}
      {showExternalModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontWeight: 700 }}>Log Self/External Test Score</h3>
              <button onClick={() => { setShowExternalModal(false); setAnswerSheetFile(null); setSelectedChapters([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Enter scores from mock tests or coaching centers to keep stats consolidated.
            </p>

            <form onSubmit={handleExternalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Test Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={externalForm.title} 
                  onChange={(e) => setExternalForm({ ...externalForm, title: e.target.value })}
                  placeholder="e.g. FIITJEE Phase Test 1, Self Practice integration"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Exam Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={externalForm.testDate} 
                    onChange={(e) => setExternalForm({ ...externalForm, testDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject</label>
                  <select className="form-control" value={externalForm.subjectId} onChange={handleSubjectChange}>
                    <option value="">Multi-Subject / Full Test</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Total Max Marks *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="1"
                    value={externalForm.totalMarks} 
                    onChange={(e) => setExternalForm({ ...externalForm, totalMarks: e.target.value })}
                    placeholder="e.g. 300"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Total Score Obtained *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    max={externalForm.totalMarks || 1000}
                    value={externalForm.totalScore} 
                    onChange={(e) => setExternalForm({ ...externalForm, totalScore: e.target.value })}
                    placeholder="e.g. 185"
                    required
                  />
                </div>
              </div>

              {/* Test Syllabus Scope Chapters checkboxes */}
              {filteredChapters.length > 0 && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Test Syllabus Scope (Chapters)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-xs)', background: 'var(--bg-primary)' }}>
                    {filteredChapters.map(chap => (
                      <label key={chap.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedChapters.includes(chap.id)} 
                          onChange={() => handleChapterToggle(chap.id)}
                        />
                        <span>{chap.chapter_name} (Class {chap.class_level})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                          value={externalForm.breakdownMaths} onChange={(e) => setExternalForm({ ...externalForm, breakdownMaths: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.maxMaths} onChange={(e) => setExternalForm({ ...externalForm, maxMaths: e.target.value })} placeholder="100" />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.correctMaths} onChange={(e) => setExternalForm({ ...externalForm, correctMaths: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.incorrectMaths} onChange={(e) => setExternalForm({ ...externalForm, incorrectMaths: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.unattemptedMaths} onChange={(e) => setExternalForm({ ...externalForm, unattemptedMaths: e.target.value })} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.35rem', fontWeight: 600 }}>Physics</td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.breakdownPhysics} onChange={(e) => setExternalForm({ ...externalForm, breakdownPhysics: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.maxPhysics} onChange={(e) => setExternalForm({ ...externalForm, maxPhysics: e.target.value })} placeholder="100" />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.correctPhysics} onChange={(e) => setExternalForm({ ...externalForm, correctPhysics: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.incorrectPhysics} onChange={(e) => setExternalForm({ ...externalForm, incorrectPhysics: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.unattemptedPhysics} onChange={(e) => setExternalForm({ ...externalForm, unattemptedPhysics: e.target.value })} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.35rem', fontWeight: 600 }}>Chem</td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.breakdownChemistry} onChange={(e) => setExternalForm({ ...externalForm, breakdownChemistry: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.maxChemistry} onChange={(e) => setExternalForm({ ...externalForm, maxChemistry: e.target.value })} placeholder="100" />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.correctChemistry} onChange={(e) => setExternalForm({ ...externalForm, correctChemistry: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.incorrectChemistry} onChange={(e) => setExternalForm({ ...externalForm, incorrectChemistry: e.target.value })} />
                      </td>
                      <td style={{ padding: '0.2rem' }}>
                        <input type="number" className="form-control" style={{ padding: '0.15rem 0.3rem', fontSize: '0.8rem' }}
                          value={externalForm.unattemptedChemistry} onChange={(e) => setExternalForm({ ...externalForm, unattemptedChemistry: e.target.value })} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="form-row">
                  <div style={{ marginBottom: 0 }}>
                    <label className="form-label">Duration Taken (Mins)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={externalForm.timeTakenMinutes} 
                      onChange={(e) => setExternalForm({ ...externalForm, timeTakenMinutes: e.target.value })}
                      placeholder="e.g. 180"
                    />
                  </div>
                  <div style={{ marginBottom: 0 }}>
                    <label className="form-label">Answer Sheet Scan (PDF/Image)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px dashed var(--border-color)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <UploadCloud size={14} className="text-secondary" />
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        style={{ fontSize: '0.7rem', cursor: 'pointer', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Weak Topics / Error Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={externalForm.weakTopics}
                  onChange={(e) => setExternalForm({ ...externalForm, weakTopics: e.target.value })}
                  placeholder="e.g. Missed vectors in Mathematics, got confused in inorganic reactions"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowExternalModal(false); setAnswerSheetFile(null); setSelectedChapters([]); }}
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.5rem' }}
                  disabled={uploadingFile}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.5rem' }}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? 'Saving Test...' : 'Save & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Assignment Prompt Modal */}
      {activeAssignment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontWeight: 700 }}>Mark Task Completed</h3>
              <button onClick={() => { setActiveAssignment(null); setSumsInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Enter how many practice sums you solved for this parent assignment.
            </p>

            <form onSubmit={handleAssignmentCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Practice Sums Solved</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="0"
                  value={sumsInput} 
                  onChange={(e) => setSumsInput(e.target.value)}
                  placeholder="e.g. 15"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setActiveAssignment(null); setSumsInput(''); }}
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.45rem' }}
                  disabled={uploadingFile}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.45rem' }}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTests;
