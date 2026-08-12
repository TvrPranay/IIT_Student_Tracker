import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, BookOpen, Calendar, Shield, Award, Clipboard } from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    // Read user details from localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch (e) {
        console.error(e);
      }
    }

    // Initialize Theme
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const isLight = storedTheme === 'light' || (!storedTheme && systemPrefersLight);
    
    setIsLightTheme(isLight);
    if (isLight) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [location.pathname]);

  const toggleTheme = () => {
    const newLightMode = !isLightTheme;
    setIsLightTheme(newLightMode);
    if (newLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={user.role === 'parent' ? '/parent' : '/student'} className="navbar-logo">
          <Award className="h-6 w-6 text-blue-500" />
          <span>IIT Prep Tracker</span>
        </Link>

        <div className="navbar-links">
          {user.role === 'student' ? (
            <>
              <Link 
                to="/student" 
                className={`navbar-link ${location.pathname === '/student' ? 'active' : ''}`}
              >
                <Clipboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/student/syllabus" 
                className={`navbar-link ${location.pathname === '/student/syllabus' ? 'active' : ''}`}
              >
                <BookOpen size={16} />
                <span>Syllabus</span>
              </Link>
              <Link 
                to="/student/logs" 
                className={`navbar-link ${location.pathname === '/student/logs' ? 'active' : ''}`}
              >
                <Calendar size={16} />
                <span>Study Log</span>
              </Link>
              <Link 
                to="/student/tests" 
                className={`navbar-link ${location.pathname === '/student/tests' ? 'active' : ''}`}
              >
                <Award size={16} />
                <span>Weekly Tests</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/parent" 
                className={`navbar-link ${location.pathname === '/parent' ? 'active' : ''}`}
              >
                <Shield size={16} />
                <span>Parent Dashboard</span>
              </Link>
              <Link 
                to="/parent/uploads" 
                className={`navbar-link ${location.pathname === '/parent/uploads' ? 'active' : ''}`}
              >
                <BookOpen size={16} />
                <span>Syllabus Notes</span>
              </Link>
              <Link 
                to="/parent/tests" 
                className={`navbar-link ${location.pathname === '/parent/tests' ? 'active' : ''}`}
              >
                <Award size={16} />
                <span>Create Test</span>
              </Link>
            </>
          )}

          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }}></div>

          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {user.name} ({user.role})
          </span>

          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            title="Toggle Light/Dark Theme"
          >
            {isLightTheme ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
