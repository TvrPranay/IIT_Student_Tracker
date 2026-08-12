import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { Award, Lock, Mail, Phone, User, Copy, Check } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // 'student' or 'parent'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    classLevel: '11th'
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Registration success state (to display student code)
  const [registeredCode, setRegisteredCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCopyCode = () => {
    if (registeredCode) {
      navigator.clipboard.writeText(registeredCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Log in
        const res = await api.auth.login({
          email: formData.email,
          password: formData.password
        });
        
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        
        if (res.user.role === 'parent') {
          navigate('/parent');
        } else {
          navigate('/student');
        }
      } else {
        // Register
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          role
        };

        if (role === 'student') {
          payload.classLevel = formData.classLevel;
        }

        const res = await api.auth.register(payload);
        
        if (role === 'student' && res.user.studentCode) {
          // Keep token, but show success screen
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          setRegisteredCode(res.user.studentCode);
        } else {
          // For parents or regular logs
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          navigate('/parent');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostRegistrationProceed = () => {
    navigate('/student');
  };

  // If student registration is successful, show the Code Screen
  if (registeredCode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg-primary)' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', textAlign: 'center', padding: '2.5rem' }}>
          <div className="metric-icon success" style={{ margin: '0 auto 1.5rem', width: '4rem', height: '4rem' }}>
            <Award size={32} />
          </div>
          
          <h2 style={{ marginBottom: '0.75rem', fontWeight: 800 }}>Registration Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Here is your unique **Student Link Code**. Give this code to your parent so they can link to your dashboard and track your progress.
          </p>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '2px dashed var(--success)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '1.25rem', 
            fontSize: '1.6rem', 
            fontWeight: 800, 
            letterSpacing: '2px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <span>{registeredCode}</span>
            <button 
              onClick={handleCopyCode}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: copied ? 'var(--success)' : 'var(--text-secondary)' }}
              title="Copy to clipboard"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            {copied ? 'Code copied to clipboard!' : 'Click the copy icon to copy code'}
          </p>

          <button onClick={handlePostRegistrationProceed} className="btn btn-primary" style={{ width: '100%' }}>
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1rem', 
      background: 'var(--bg-primary)' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Award size={36} className="text-blue-500" style={{ color: 'var(--accent-color)' }} />
        <h1 style={{ fontWeight: 800, fontSize: '2rem', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          IIT Prep Tracker
        </h1>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {isLogin ? 'Log in to track your prep journey' : 'Register to get started today'}
        </p>

        {error && (
          <div style={{ 
            backgroundColor: 'var(--danger-glow)', 
            color: 'var(--danger)', 
            border: '1px solid rgba(239,68,68,0.2)',
            padding: '0.75rem', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '0.85rem', 
            marginBottom: '1.25rem',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              {/* Role Picker */}
              <div className="form-group">
                <label className="form-label">Are you registering as a Student or Parent?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`btn ${role === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem' }}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('parent')}
                    className={`btn ${role === 'parent' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem' }}
                  >
                    Parent
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Class Level (only for Student) */}
              {role === 'student' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="classLevel">Class Level</label>
                  <select
                    id="classLevel"
                    name="classLevel"
                    value={formData.classLevel}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="11th">11th Grade (Inter 1st Year)</option>
                    <option value="12th">12th Grade (Inter 2nd Year)</option>
                  </select>
                </div>
              )}

              {/* Phone (optional) */}
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', height: '2.75rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}
          >
            {isLogin ? 'Register Here' : 'Log In Here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
