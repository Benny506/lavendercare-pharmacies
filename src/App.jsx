import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UiProvider } from './context/UiContext';
import { AuthProvider } from './context/AuthContext';
import AutoLogin from './components/auth/AutoLogin';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import Profile from './pages/dashboard/Profile';
import InventorySetup from './pages/dashboard/inventory/InventorySetup';
import Drugs from './pages/dashboard/inventory/Drugs';
import Stock from './pages/dashboard/inventory/Stock';
import './App.css';
import Orders from './pages/dashboard/orders/Orders';

function App() {
  return (
    <Router>
      <UiProvider>
        <AuthProvider>
          <Routes>
            <Route element={<AutoLogin />}>
              {/* Public/Auth Routes */}
              <Route path="/" element={<Navigate to="/auth/login" replace />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/verify-otp" element={<VerifyOtp />} />

              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route path="profile" element={<Profile />} />
                <Route path="inventory/setup" element={<InventorySetup />} />
                <Route path="inventory/drugs" element={<Drugs />} />
                <Route path="inventory/stock" element={<Stock />} />
                <Route path="orders" element={<Orders />} />
                {/* Fallback for dashboard root */}
                <Route index element={<Navigate to="profile" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </UiProvider>
    </Router>
  );
}

export default App;
