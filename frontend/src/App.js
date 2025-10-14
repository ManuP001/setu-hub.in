import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import EnterpriseDashboard from '@/pages/EnterpriseDashboard';
import VendorDashboard from '@/pages/VendorDashboard';
import JobSeekerDashboard from '@/pages/JobSeekerDashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const PrivateRoute = ({ children, allowedTypes }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (allowedTypes && !allowedTypes.includes(user.user_type)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/enterprise/*"
            element={
              <PrivateRoute allowedTypes={['enterprise']}>
                <EnterpriseDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/vendor/*"
            element={
              <PrivateRoute allowedTypes={['vendor']}>
                <VendorDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/job-seeker/*"
            element={
              <PrivateRoute allowedTypes={['job_seeker']}>
                <JobSeekerDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
