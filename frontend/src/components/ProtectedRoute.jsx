import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    
    if (allowedRole && user.role !== allowedRole) {
      // Redirect to correct dashboard based on role
      return <Navigate to={user.role === 'parent' ? '/parent' : '/student'} replace />;
    }

    return children;
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
