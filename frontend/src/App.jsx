import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Profile from "./pages/Profile";

import Home from "./pages/Home";
import WorkerProfile from "./pages/WorkerProfile";
import BookingForm from "./pages/BookingForm";
import MyBookings from "./pages/MyBookings";
import BookingDetail from "./pages/BookingDetail";

import WorkerDashboard from "./pages/WorkerDashboard";
import JobDetail from "./pages/JobDetail";
import WorkerEarnings from "./pages/WorkerEarnings";

import AdminDashboard from "./pages/AdminDashboard";
import AdminLedger from "./pages/AdminLedger";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />

        {/* Customer */}
        <Route path="/home" element={<ProtectedRoute allowedRoles={["customer"]}><Home /></ProtectedRoute>} />
        <Route path="/workers/:id" element={<ProtectedRoute><WorkerProfile /></ProtectedRoute>} />
        <Route path="/book/:workerId" element={<ProtectedRoute allowedRoles={["customer"]}><BookingForm /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={["customer"]}><MyBookings /></ProtectedRoute>} />
        <Route path="/booking/:id" element={<ProtectedRoute allowedRoles={["customer"]}><BookingDetail /></ProtectedRoute>} />

        {/* Worker */}
        <Route path="/worker/dashboard" element={<ProtectedRoute allowedRoles={["worker"]}><WorkerDashboard /></ProtectedRoute>} />
        <Route path="/worker/job/:id" element={<ProtectedRoute allowedRoles={["worker"]}><JobDetail /></ProtectedRoute>} />
        <Route path="/worker/earnings" element={<ProtectedRoute allowedRoles={["worker"]}><WorkerEarnings /></ProtectedRoute>} />

        {/* Cooperative Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["coopAdmin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/ledger" element={<ProtectedRoute allowedRoles={["coopAdmin"]}><AdminLedger /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
