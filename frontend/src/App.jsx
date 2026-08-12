import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentSyllabus from './pages/StudentSyllabus.jsx';
import StudentLogs from './pages/StudentLogs.jsx';
import StudentTests from './pages/StudentTests.jsx';

import ParentDashboard from './pages/ParentDashboard.jsx';
import ParentUploads from './pages/ParentUploads.jsx';
import ParentTests from './pages/ParentTests.jsx';

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';

// Root controller to determine landing page based on active role
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    if (user.role === 'parent') {
      return <Navigate to="/parent" replace />;
    } else {
      return <Navigate to="/student" replace />;
    }
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          {/* Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Student Protected Routes */}
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/syllabus" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentSyllabus />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/logs" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/tests" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentTests />
              </ProtectedRoute>
            } 
          />

          {/* Parent Protected Routes */}
          <Route 
            path="/parent" 
            element={
              <ProtectedRoute allowedRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parent/uploads" 
            element={
              <ProtectedRoute allowedRole="parent">
                <ParentUploads />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parent/tests" 
            element={
              <ProtectedRoute allowedRole="parent">
                <ParentTests />
              </ProtectedRoute>
            } 
          />

          {/* Default fallback */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
