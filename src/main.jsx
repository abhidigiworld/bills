import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom'
import WelcomePage from './assets/component/Welcome.jsx'
import InvoiceForm from './assets/component/InvoiceForm.jsx'
import Login from './assets/component/Login.jsx'
import Bills from './assets/component/Bills.jsx'
import AddEmployee from './assets/component/AddEmployee.jsx'
import SalarySlip from './assets/component/SalarySlip.jsx'
import ErrorPage from './assets/component/ErrorPage.jsx'
import SignUp from './assets/component/SignUp.jsx'
import ForgotPassword from './assets/component/ForgotPassword.jsx'
import AttendanceRegister from './assets/component/AttendanceRegister.jsx'
import ManagePayrolls from './assets/component/ManagePayrolls.jsx'
import BulkUpload from './assets/component/BulkUpload.jsx'
import ManageUsers from './assets/component/ManageUsers.jsx'
import AICopilot from './assets/component/AICopilot.jsx'
import DashboardLayout from './assets/component/DashboardLayout.jsx'
import SupervisorAttendance from './assets/component/SupervisorAttendance.jsx'
import axios from 'axios'

// Setup Axios Interceptors
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => {
    const token = response.headers['x-refresh-token'];
    if (token) {
      localStorage.setItem('token', token);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Protected Route Wrapper Component
const ProtectedRoute = ({ children, requireAdmin }) => {
  const sessionUser = localStorage.getItem('user');
  if (!sessionUser) {
    return <Navigate to="/" replace />;
  }
  const user = JSON.parse(sessionUser);
  if (requireAdmin && user.role !== 'admin') {
    // Regular users trying to access admin screens are redirected back to employee home
    return <Navigate to="/Main" replace />;
  }
  return (
    <>
      {children}
      <AICopilot />
    </>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login/>
  },
  {
    path: '/signup',
    element: <SignUp/>
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword/>
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/Main',
        element: <ProtectedRoute><WelcomePage /></ProtectedRoute>
      },
      {
        path: '/existing-bills',
        element: <ProtectedRoute requireAdmin><Bills /></ProtectedRoute>
      },
      {
        path: '/new-bill',
        element: <ProtectedRoute requireAdmin><InvoiceForm /></ProtectedRoute>
      },
      {
        path: '/new-employee',
        element: <ProtectedRoute requireAdmin><AddEmployee /></ProtectedRoute>
      },
      {
        path: '/new-Salary',
        element: <ProtectedRoute requireAdmin><SalarySlip /></ProtectedRoute>
      },
      {
        path: '/attendance-register',
        element: <ProtectedRoute requireAdmin><AttendanceRegister /></ProtectedRoute>
      },
      {
        path: '/manage-payrolls',
        element: <ProtectedRoute requireAdmin><ManagePayrolls /></ProtectedRoute>
      },
      {
        path: '/manage-users',
        element: <ProtectedRoute requireAdmin><ManageUsers /></ProtectedRoute>
      },
      {
        path: '/bulk-upload',
        element: <ProtectedRoute requireAdmin><BulkUpload /></ProtectedRoute>
      }
    ]
  },
  {
    path: '/supervisor-attendance',
    element: <SupervisorAttendance />
  },
  {
    path: '*',
    element: <ErrorPage />
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
