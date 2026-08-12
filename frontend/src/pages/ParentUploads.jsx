import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { BookOpen, FileText, UploadCloud, Check, User, Clock, CheckCircle } from 'lucide-react';

export const ParentUploads = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [sentAssignments, setSentAssignments] = useState([]);

  // Form State
  const [selectedStudents, setSelectedStudents] = useState([]); // array of student IDs
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [contentType, setContentType] = useState('text'); // 'text' or 'file'
  const [textContent, setTextContent] = useState('');
  const [note, setNote] = useState('');
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
      const [studentsRes, subjectsRes, chaptersRes, sentRes] = await Promise.all([
        api.parent.getStudents(),
        api.getSubjects(),
        api.getChapters(),
        api.parent.getSentAssignments()
      ]);
      setStudents(studentsRes.students);
      setSubjects(subjectsRes.subjects);
      setChapters(chaptersRes.chapters);
      setSentAssignments(sentRes.assignments);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch syllabus data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setSubjectId(subId);
    setChapterId('');
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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (selectedStudents.length === 0) {
      setError('Please select at least one student.');
      setSubmitting(false);
      return;
    }

    if (contentType === 'text' && !textContent.trim()) {
      setError('Please enter plain text syllabus content.');
      setSubmitting(false);
      return;
    }

    if (contentType === 'file' && !selectedFile) {
      setError('Please select a file to upload.');
      setSubmitting(false);
      return;
    }

    try {
      let fileUrl = null;
      if (contentType === 'file' && selectedFile) {
        const uploadRes = await api.uploadFile(selectedFile);
        fileUrl = uploadRes.fileUrl;
      }

      await api.parent.uploadAssignment({
        studentIds: selectedStudents.map(id => parseInt(id)),
        subjectId: subjectId ? parseInt(subjectId) : null,
        chapterId: chapterId ? parseInt(chapterId) : null,
        contentType,
        textContent: contentType === 'text' ? textContent : null,
        fileUrl,
        note
      });

      setSuccess('Syllabus assignment/upload successfully sent to selected student(s)!');
      
      // Reset form
      setSelectedStudents([]);
      setSubjectId('');
      setChapterId('');
      setTextContent('');
      setNote('');
      setSelectedFile(null);
      
      // Refresh sent assignments list
      const sentRes = await api.parent.getSentAssignments();
      setSentAssignments(sentRes.assignments);

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to dispatch upload.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading syllabus upload forms...</div>;
  }

  return (
    <div className="main-content" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.8rem' }}>Create Custom Assignment / Syllabus Upload</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Assign custom syllabus notes, reading tasks, or worksheet files to your children.</p>
      </div>

      {success && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {students.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          Please link a child/student to your account first in order to assign tasks.
        </div>
      ) : (
        <>
          <div className="glass-panel">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Target Students Selection */}
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
                        padding: '0.5rem 1rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-lg)', 
                        cursor: 'pointer',
                        background: selectedStudents.includes(s.id.toString()) ? 'var(--accent-glow)' : 'transparent',
                        borderColor: selectedStudents.includes(s.id.toString()) ? 'var(--accent-color)' : 'var(--border-color)',
                        transition: 'var(--transition)'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(s.id.toString())}
                        onChange={() => handleStudentToggle(s.id.toString())}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{s.name} (Class {s.class_level})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject and Chapter Select */}
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject (Optional)</label>
                  <select 
                    className="form-control"
                    value={subjectId} 
                    onChange={handleSubjectChange}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Scope Chapter (Optional)</label>
                  <select 
                    className="form-control"
                    value={chapterId} 
                    onChange={(e) => setChapterId(e.target.value)}
                    disabled={!subjectId}
                  >
                    <option value="">Select Chapter</option>
                    {filteredChapters.map(c => <option key={c.id} value={c.id}>[{c.class_level}] {c.chapter_name}</option>)}
                  </select>
                </div>
              </div>

              {/* Type Picker */}
              <div className="form-group">
                <label className="form-label">Content Upload Type *</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setContentType('text')}
                    className={`btn ${contentType === 'text' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    Type Plain Text Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('file')}
                    className={`btn ${contentType === 'file' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    Upload Syllabus File (PDF/Image)
                  </button>
                </div>
              </div>

              {/* Content Input Fields */}
              {contentType === 'text' ? (
                <div className="form-group">
                  <label className="form-label">Syllabus Text Content *</label>
                  <textarea 
                    className="form-control" 
                    rows="4"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Type syllabus details or list of topics to focus on here..."
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Select Syllabus / Worksheet Document *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)' }}>
                    <UploadCloud size={24} style={{ color: 'var(--text-secondary)' }} />
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>Accepts images and PDF files (Max 10MB)</span>
                </div>
              )}

              {/* Optional notes */}
              <div className="form-group">
                <label className="form-label">Parent Custom Instructions / Deadlines (Optional)</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Focus on this by Friday evening, will cover this in Saturday test"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting & Uploading...' : 'Assign Syllabus Item'}
              </button>
            </form>
          </div>

          {/* Sent Assignments Tracker */}
          <div className="glass-panel" style={{ marginTop: '2.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} className="text-success" style={{ color: 'var(--success)' }} />
              <span>Sent Assignments & Student Completion Tracker</span>
            </h3>
            {sentAssignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No syllabus tasks assigned yet. Use the form above to assign notes or worksheets.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '680px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Assigned Child</th>
                      <th style={{ padding: '0.75rem' }}>Topic Scope</th>
                      <th style={{ padding: '0.75rem' }}>Sent Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Instructions/Note</th>
                      <th style={{ padding: '0.75rem' }}>Status / Practice Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentAssignments.map(ass => (
                      <tr key={ass.id}>
                        <td style={{ fontWeight: 600, textAlign: 'left', padding: '0.75rem' }}>{ass.student_name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className="badge badge-revision" style={{ fontSize: '0.7rem' }}>
                            {ass.subject_name || 'General'} {ass.chapter_name ? `• ${ass.chapter_name}` : ''}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(ass.created_at).toLocaleDateString()}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left', padding: '0.75rem' }}>
                          {ass.note || <span style={{ color: 'var(--text-muted)' }}>No additional note</span>}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {ass.status === 'completed' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
                              <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>Completed</span>
                              <strong style={{ fontSize: '0.72rem', color: 'var(--success)' }}>
                                {ass.sums_completed} sums solved
                              </strong>
                            </div>
                          ) : (
                            <span className="badge badge-not_started" style={{ fontSize: '0.7rem' }}>Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParentUploads;
