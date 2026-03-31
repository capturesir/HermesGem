import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import ToastContainer from './components/ui/Toast';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import Users from './pages/users/Users';
import UserForm from './pages/users/UserForm';
import Settings from './pages/settings/Settings';
import Patients from './pages/patients/Patients';
import PatientForm from './pages/patients/PatientForm';
import PatientDetail from './pages/patients/PatientDetail';
import PatientAlerts from './pages/patients/PatientAlerts';
import PatientVitals from './pages/patients/PatientVitals';
import PatientAllergies from './pages/patients/PatientAllergies';
import PatientSOAP from './pages/patients/PatientSOAP';
import PatientPrescriptions from './pages/patients/PatientPrescriptions';
import PatientDocuments from './pages/patients/PatientDocuments';
import PatientMedicalRecords from './pages/patients/PatientMedicalRecords';
import Appointments from './pages/appointments/Appointments';
import AppointmentForm from './pages/appointments/AppointmentForm';
import Statistics from './pages/statistics/Statistics';
import Lookup from './pages/lookup/Lookup';
import PrintLabels from './pages/print/PrintLabels';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// App Content
const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />

        {/* Admin Routes */}
        <Route
          path="users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <AdminRoute>
              <UserForm />
            </AdminRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <AdminRoute>
              <UserForm />
            </AdminRoute>
          }
        />
        <Route
          path="settings"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />

        {/* Patient Routes */}
        <Route path="patients" element={<Patients />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/alerts" element={<PatientAlerts />} />
        <Route path="patients/:id/vitals" element={<PatientVitals />} />
        <Route path="patients/:id/allergies" element={<PatientAllergies />} />
        <Route path="patients/:id/soap" element={<PatientSOAP />} />
        <Route path="patients/:id/prescriptions" element={<PatientPrescriptions />} />
        <Route path="patients/:id/documents" element={<PatientDocuments />} />
        <Route path="patients/:id/records" element={<PatientMedicalRecords />} />

        {/* Appointment Routes */}
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/new" element={<AppointmentForm />} />

        {/* Statistics Routes */}
        <Route path="statistics" element={<Statistics />} />

        {/* Lookup Routes */}
        <Route path="lookup" element={<Lookup />} />

        {/* Print Routes */}
        <Route path="print" element={<PrintLabels />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <AppContent />
            <ToastContainer />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
