import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Import pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import HospitalSignup from "./pages/HospitalSignup";
import StaffRequestAccess from "./pages/StaffRequestAccess";
import AccessPending from "./pages/AccessPending";
import HospitalDashboard from "./pages/HospitalDashboard";
import CountyDashboard from "./pages/CountyDashboard";
import WeeklyVisits from "./pages/WeeklyVisits";
import PatientManagement from "./pages/PatientManagement";
import AppointmentManagement from "./pages/AppointmentManagement";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/hospital-signup" element={<HospitalSignup />} />
            <Route
              path="/staff-request-access"
              element={<StaffRequestAccess />}
            />
            <Route path="/access-pending" element={<AccessPending />} />

            {/* Protected routes with layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <HospitalDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/county-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CountyDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/weekly-visits"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WeeklyVisits />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PatientManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AppointmentManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
