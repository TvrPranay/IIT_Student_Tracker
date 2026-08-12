import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { 
  BookOpen, ChevronDown, ChevronRight, CheckCircle, Clock, 
  RotateCcw, Circle, Plus, Trash2 
} from 'lucide-react';

export const StudentSyllabus = () => {
  const [syllabus, setSyllabus] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  // Custom Topic Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [customChapterName, setCustomChapterName] = useState('');
  const [customTopicName, setCustomTopicName] = useState('');
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState('11th');

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      setProfile(user);
      setSelectedClass(user?.classLevel || '11th');

      const res = await api.student.getSyllabus();
      setSyllabus(res.syllabus);

      if (res.syllabus.length > 0) {
        setActiveSubject(res.syllabus[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve syllabus tree.');
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapters({
      ...expandedChapters,
      [chapterId]: !expandedChapters[chapterId]
    });
  };

  const handleStatusChange = async (topicId, newStatus) => {
    setUpdatingId(topicId);
    try {
      await api.student.updateProgress(topicId, newStatus);
      const res = await api.student.getSyllabus();
      setSyllabus(res.syllabus);
    } catch (err) {
      console.error(err);
      setError('Could not update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddCustomTopic = async (e) => {
    e.preventDefault();
    if (!customChapterName.trim() || !customTopicName.trim()) {
      setError('Please fill in both chapter name and topic name.');
      return;
    }

    setCustomSubmitting(true);
    setError('');
    try {
      await api.student.addCustomTopic({
        subjectId: activeSubject,
        chapterName: customChapterName.trim(),
        topicName: customTopicName.trim(),
        classLevel: selectedClass
      });

      setCustomChapterName('');
      setCustomTopicName('');
      setShowAddForm(false);

      // Refresh
      const res = await api.student.getSyllabus();
      setSyllabus(res.syllabus);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add custom topic.');
    } finally {
      setCustomSubmitting(false);
    }
  };

  const handleHideTopic = async (topicId) => {
    if (!window.confirm("Are you sure you want to remove/hide this topic from your progress tracker? (This will hide it from your tracker, but your parent will still see it marked as 'Hidden by Student').")) {
      return;
    }

    setError('');
    try {
      await api.student.hideTopic(topicId);
      // Refresh
      const res = await api.student.getSyllabus();
      setSyllabus(res.syllabus);
    } catch (err) {
      console.error(err);
      setError('Failed to hide topic.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} style={{ color: 'var(--success)' }} />;
      case 'revision':
        return <RotateCcw size={16} style={{ color: 'var(--info)' }} />;
      case 'in_progress':
        return <Clock size={16} style={{ color: 'var(--warning)' }} />;
      default:
        return <Circle size={16} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading syllabus tracker...</div>;
  }

  const subjectData = syllabus.find(s => s.id === activeSubject);
  const classChapters = subjectData?.classes[selectedClass] || [];

  return (
    <div className="main-content">
      {/* Welcome / Header row with Class Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.8rem' }}>IIT-JEE Syllabus Tracker</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Update topic status as you study. Tracking Class {selectedClass} Syllabus.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', background: '#f3f4f6', padding: '0.25rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => {
              setSelectedClass('11th');
              setError('');
            }} 
            className={`btn ${selectedClass === '11th' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', border: 'none', boxShadow: 'none' }}
          >
            11th Class
          </button>
          <button 
            onClick={() => {
              setSelectedClass('12th');
              setError('');
            }} 
            className={`btn ${selectedClass === '12th' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', border: 'none', boxShadow: 'none' }}
          >
            12th Class
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(156,42,42,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Tabs list with Add custom topic action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="tab-list" style={{ marginBottom: 0 }}>
          {syllabus.map(sub => (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubject(sub.id);
                setError('');
              }}
              className={`tab-trigger ${activeSubject === sub.id ? 'active' : ''}`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setError('');
          }}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
        >
          <Plus size={14} />
          <span>{showAddForm ? 'Close Add Form' : 'Add Custom Topic'}</span>
        </button>
      </div>

      {/* Add Custom Form */}
      {showAddForm && (
        <div className="glass-panel" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--border-dark)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Add Student Custom Chapter / Topic
          </h3>
          <form onSubmit={handleAddCustomTopic} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Chapter Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={customChapterName}
                  onChange={(e) => setCustomChapterName(e.target.value)}
                  placeholder="e.g. Coaching Module - Integration Extras"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Topic Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={customTopicName}
                  onChange={(e) => setCustomTopicName(e.target.value)}
                  placeholder="e.g. Reduction Formulas Practice"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', padding: '0.5rem 1.25rem' }}
              disabled={customSubmitting}
            >
              {customSubmitting ? 'Saving Topic...' : 'Save Custom Topic'}
            </button>
          </form>
        </div>
      )}

      {/* Chapters & Topics List */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        {classChapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No chapters seeded for this subject.
          </div>
        ) : (
          classChapters.map(chap => {
            const isExpanded = !!expandedChapters[chap.id];
            
            // Calculate chapter-wise status
            const total = chap.topics.length;
            const completed = chap.topics.filter(t => t.status === 'completed' || t.status === 'revision').length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={chap.id} className="syllabus-chapter-row">
                {/* Chapter Accordion Trigger Header */}
                <div onClick={() => toggleChapter(chap.id)} className="syllabus-chapter-header">
                  <div className="syllabus-chapter-title">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span>{chap.chapter_name}</span>
                    {chap.student_id && (
                      <span className="badge badge-student-added" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>
                        Custom Chapter
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Completion tag */}
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: percent === 100 ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {percent}% ({completed}/{total})
                    </span>

                    {/* Quick progress bar */}
                    <div style={{ width: '80px', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{ width: `${percent}%`, height: '100%', backgroundColor: percent === 100 ? 'var(--success)' : 'var(--accent-color)' }}></div>
                    </div>
                  </div>
                </div>

                {/* Sub-Topics List */}
                {isExpanded && (
                  <div className="syllabus-topics-list">
                    {chap.topics.map(topic => (
                      <div key={topic.id} className="syllabus-topic-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getStatusIcon(topic.status)}
                          <span className="syllabus-topic-name">{topic.topic_name}</span>
                          {topic.student_id && (
                            <span className="badge badge-student-added" style={{ fontSize: '0.6rem' }}>
                              Added by Student
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {updatingId === topic.id ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updating...</span>
                          ) : (
                            <select
                              value={topic.status}
                              onChange={(e) => handleStatusChange(topic.id, e.target.value)}
                              className="form-control"
                              style={{ 
                                padding: '0.2rem 0.5rem', 
                                fontSize: '0.75rem', 
                                width: '130px' 
                              }}
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="revision">Revision Done</option>
                            </select>
                          )}

                          <button 
                            type="button"
                            onClick={() => handleHideTopic(topic.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem', borderColor: 'transparent', color: 'var(--danger)' }}
                            title="Remove topic from my tracker"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentSyllabus;
