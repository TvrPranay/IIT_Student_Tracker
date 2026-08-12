const API_BASE_URL = '/api';

// Helper to retrieve auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Generic fetch wrapper
const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    // If sending FormData (file uploads), delete Content-Type to let browser set it
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

export const api = {
  // Common
  getSubjects: () => request('/subjects'),
  getChapters: () => request('/chapters'),
  
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Authentication
  auth: {
    register: (payload) => request('/auth/register', {
      method: 'POST',
      body: payload
    }),
    login: (payload) => request('/auth/login', {
      method: 'POST',
      body: payload
    }),
    getProfile: () => request('/auth/profile')
  },

  // Student specific API calls
  student: {
    getSyllabus: () => request('/student/syllabus'),
    addCustomTopic: (payload) => request('/student/syllabus/custom', {
      method: 'POST',
      body: payload
    }),
    logExternalTest: (payload) => request('/student/tests/external', {
      method: 'POST',
      body: payload
    }),
    hideTopic: (topicId) => request('/student/syllabus/hide', {
      method: 'POST',
      body: { topicId }
    }),
    restoreTopic: (topicId) => request('/student/syllabus/restore', {
      method: 'POST',
      body: { topicId }
    }),
    updateProgress: (topicId, status) => request('/student/progress', {
      method: 'POST',
      body: { topicId, status }
    }),
    submitLog: (payload) => request('/student/logs', {
      method: 'POST',
      body: payload
    }),
    getLogs: () => request('/student/logs'),
    getStreak: () => request('/student/streak'),
    getTests: () => request('/student/tests'),
    submitTestResult: (testId, payload) => request(`/student/tests/${testId}/result`, {
      method: 'POST',
      body: payload
    }),
    getAssignments: () => request('/student/assignments'),
    completeAssignment: (id, sumsCompleted) => request(`/student/assignments/${id}/complete`, {
      method: 'POST',
      body: { sumsCompleted }
    })
  },

  // Parent specific API calls
  parent: {
    linkStudent: (studentCode) => request('/parent/link', {
      method: 'POST',
      body: { studentCode }
    }),
    getStudents: () => request('/parent/students'),
    getStudentOverview: (studentId) => request(`/parent/students/${studentId}/overview`),
    getStudentProgress: (studentId) => request(`/parent/students/${studentId}/progress`),
    getStudentLogs: (studentId) => request(`/parent/students/${studentId}/logs`),
    getStudentCharts: (studentId) => request(`/parent/students/${studentId}/charts`),
    uploadAssignment: (payload) => request('/parent/uploads', {
      method: 'POST',
      body: payload
    }),
    getSentAssignments: () => request('/parent/uploads'),
    createTest: (payload) => request('/parent/tests', {
      method: 'POST',
      body: payload
    })
  }
};

export default api;
