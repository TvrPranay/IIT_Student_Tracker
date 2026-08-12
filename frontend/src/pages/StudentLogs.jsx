import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Calendar, Clock, BookOpen, MessageSquare, AlertCircle } from 'lucide-react';

export const StudentLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.student.getLogs();
      setLogs(res.logs);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch study logs.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading study log history...</div>;
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.8rem' }}>Study Logs History</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review all logged study sessions and problem counts.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No study sessions logged yet. Head to your Dashboard to log your first session!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Subject</th>
                <th style={{ padding: '0.75rem 1rem' }}>Chapter</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Time Spent</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Problems Solved</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Accuracy</th>
                <th style={{ padding: '0.75rem 1rem' }}>Notes & Doubts</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const accuracy = log.sums_solved > 0 && log.sums_correct !== null
                  ? Math.round((log.sums_correct / log.sums_solved) * 100)
                  : null;

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} className="text-secondary" style={{ color: 'var(--text-secondary)' }} />
                        <span>{log.log_date}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge badge-${log.subject_name === 'Physics' ? 'not_started' : log.subject_name === 'Chemistry' ? 'in_progress' : 'revision'}`} style={{ textTransform: 'none' }}>
                        {log.subject_name}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: log.chapter_name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {log.chapter_name || 'General Practice'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                        <span>{log.time_spent_minutes} mins</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                      {log.sums_solved}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {accuracy !== null ? (
                        <span style={{ fontWeight: 600, color: accuracy >= 80 ? 'var(--success)' : accuracy >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                          {accuracy}% ({log.sums_correct}/{log.sums_solved})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>
                      {log.notes ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <MessageSquare size={14} style={{ marginTop: '3px', color: 'var(--text-muted)' }} />
                          <span>{log.notes}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No notes</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentLogs;
