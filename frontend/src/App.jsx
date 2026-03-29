import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./utils/ProtectedRoute";

import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Schedules from "./pages/Schedules";
import Billing from "./pages/Billing";
import Users from "./pages/Users";
import Tests from "./pages/Tests";
import MasterData from "./pages/Masterdata";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import Reports from "./pages/Reports";
import ActivityLog from "./pages/ActivityLog";

import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorQueue from "./pages/doctor/DoctorQueue";
import DoctorConsultation from "./pages/doctor/Consultation";
import ConsultationsList from "./pages/doctor/ConsultationsList";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Default redirect */}
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />

      {/* Protected — all roles */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={["ADMIN","RECEPTIONIST","CASHIER"]}>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["ADMIN","RECEPTIONIST","CASHIER"]}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/patients" element={
        <ProtectedRoute allowedRoles={["ADMIN","RECEPTIONIST","CASHIER"]}>
          <Patients />
        </ProtectedRoute>
      } />

      <Route path="/doctors" element={
        <ProtectedRoute allowedRoles={["ADMIN","RECEPTIONIST","CASHIER"]}>
          <Doctors />
        </ProtectedRoute>
      } />

      <Route path="/schedules" element={
        <ProtectedRoute allowedRoles={["ADMIN","RECEPTIONIST"]}>
          <Schedules />
        </ProtectedRoute>
      } />

      <Route path="/appointments" element={
        <ProtectedRoute allowedRoles={["ADMIN","RECEPTIONIST","CASHIER"]}>
          <Appointments />
        </ProtectedRoute>
      } />

      <Route path="/billing" element={
        <ProtectedRoute allowedRoles={["ADMIN","CASHIER"]}>
          <Billing />
        </ProtectedRoute>
      } />

      <Route path="/tests" element={
        <ProtectedRoute allowedRoles={["ADMIN","RECEPTIONIST","CASHIER"]}>
          <Tests />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <Users />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <MasterData />
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={["ADMIN","CASHIER"]}>
          <Reports />
        </ProtectedRoute>
      } />

      <Route path="/activity-log" element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <ActivityLog />
        </ProtectedRoute>
      } />

      {/* Doctor Portal Routes */}
      <Route path="/doctor/dashboard" element={
        <ProtectedRoute allowedRoles={["DOCTOR"]}>
          <DoctorDashboard />
        </ProtectedRoute>
      } />

      <Route path="/doctor/queue" element={
        <ProtectedRoute allowedRoles={["DOCTOR"]}>
          <DoctorQueue />
        </ProtectedRoute>
      } />

      <Route path="/doctor/consultation/:id" element={
        <ProtectedRoute allowedRoles={["DOCTOR"]}>
          <DoctorConsultation />
        </ProtectedRoute>
      } />

      <Route path="/doctor/consultations" element={
        <ProtectedRoute allowedRoles={["DOCTOR"]}>
          <ConsultationsList />
        </ProtectedRoute>
      } />

      <Route path="/doctor/patients" element={
        <ProtectedRoute allowedRoles={["DOCTOR"]}>
          <DoctorPatients />
        </ProtectedRoute>
      } />

      <Route path="/doctor/schedule" element={
        <ProtectedRoute allowedRoles={["DOCTOR"]}>
          <DoctorSchedule />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;