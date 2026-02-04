import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/login" />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<h1>Admin Dashboard</h1>} />
        <Route path="/admin/create-news" element={<h1>Create News</h1>} />
        <Route path="/admin/manage-news" element={<h1>Manage News</h1>} />

        {/* Fallback */}
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
