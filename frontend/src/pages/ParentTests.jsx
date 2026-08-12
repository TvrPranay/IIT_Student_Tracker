import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Award, Calendar, UploadCloud, ChevronRight } from 'lucide-react';

export const ParentTests = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);

  // Form State
  const [selectedStudents, setSelectedStudents] = useState([]); // Array of student IDs
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [syllabusScope, setSyllabusScope] = useState([]); // Array of chapter IDs
  const [testDate, setTestDate] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Statuses
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, subjectsRes, chaptersRes] = await Promise.all([
        api.parent.getStudents(),
        api.getSubjects(),
        api.getChapters()
      ]);
      setStudents(studentsRes.students);
      setSubjects(subjectsRes.subjects);
      setChapters(chaptersRes.chapters);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch test creation data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setSubjectId(subId);
    setSyllabusScope([]); // Reset scope chapters
    
    if (subId) {
      setFilteredChapters(chapters.filter(c => c.subject_id === parseInt(subId)));
    } else {
      setFilteredChapters([]);
    }
  };

  const handleStudentToggle = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleChapterToggle = (chapterId) => {
    if (syllabusScope.includes(chapterId)) {
      setSyllabusScope(syllabusScope.filter(id => id !== chapterId));
    } else {
      setSyllabusScope([...syllabusScope, chapterId]);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (selectedStudents.length === 0) {
      setError('Please select at least one child to assign this test.');
      setSubmitting(false);
      return;
    }

    if (!title.trim() || !testDate || !totalMarks) {
      setError('Title, test date, and total marks are required.');
      setSubmitting(false);
      return;
    }

    try {
      let fileUrl = null;
      if (selectedFile) {
        const uploadRes = await api.uploadFile(selectedFile);
        fileUrl = uploadRes.fileUrl;
      }

      await api.parent.createTest({
        title,
        subjectId: subjectId ? parseInt(subjectId) : null,
        syllabusScope: syllabusScope.map(id => parseInt(id)),
        testDate,
        totalMarks: parseInt(totalMarks),
        fileUrl,
        studentIds: selectedStudents.map(id => parseInt(id))
      });

      setSuccess('Weekly test successfully created and assigned to selected student(s)!');
      
      // Reset form
      setSelectedStudents([]);
      setTitle('');
      setSubjectId('');
      setSyllabusScope([]);
      setTestDate('');
      setTotalMarks('');
      setSelectedFile(null);
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create weekly test.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading test creation forms...</div>;
  }

  return (
    <div className="main-content" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.8rem' }}>Create Weekly Practice Test</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Design weekly tests and tag the chapters covered. Student dashboards will generate prep lists accordingly.</p>
      </div>

      {success && (
        <div style={{ backgroundColor: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {students.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          Please link a child/student to your account first in order to assign tests.
        </div>
      ) : (
        <div className="glass-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Target Students */}
            <div className="form-group">
              <label className="form-label">Assign To Child/Children *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                {students.map(s => (
                  <label 
                    key={s.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      padding: '0.5rem 0.75rem', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-sm)', 
                      cursor: 'pointer',
                      background: selectedStudents.includes(s.id.toString()) ? 'var(--accent-glow)' : 'transparent',
                      borderColor: selectedStudents.includes(s.id.toString()) ? 'var(--accent-color)' : 'var(--border-color)'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(s.id.toString())}
                      onChange={() => handleStudentToggle(s.id.toString())}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.name} (Class {s.class_level})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Test Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">Test Title *</label>
              <input 
                type="text" 
                id="title"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Assessment - Kinematics and Laws of Motion"
                required
              />
            </div>

            {/* Subject Select */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subject *</label>
                <select 
                  className="form-control"
                  value={subjectId} 
                  onChange={handleSubjectChange}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Total Marks *</label>
                <input 
                  type="number" 
                  className="form-control"
                  min="1"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  placeholder="e.g. 100"
                  required
                />
              </div>
            </div>

            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label">Test Date *</label>
              <input 
                type="date" 
                className="form-control"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
              />
            </div>

            {/* Syllabus Chapters scope selection */}
            {subjectId && filteredChapters.length > 0 && (
              <div className="form-group">
                <label className="form-label">Select Syllabus Scope (Chapters Covered in Test)</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                  gap: '0.75rem', 
                  marginTop: '0.5rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.15)'
                }}>
                  {filteredChapters.map(chap => (
                    <label 
                      key={chap.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: syllabusScope.includes(chap.id) ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={syllabusScope.includes(chap.id)}
                        onChange={() => handleChapterToggle(chap.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>[{chap.class_level}] {chap.chapter_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* File PDF Attachment */}
            <div className="form-group">
              <label className="form-label">Attach Test Question Sheet PDF (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.1)' }}>
                <UploadCloud size={24} style={{ color: 'var(--text-secondary)' }} />
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={submitting}
            >
              {submitting ? 'Creating Weekly Test...' : 'Create & Assign Test'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ParentTests;
