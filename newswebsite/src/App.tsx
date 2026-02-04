import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import AdminLayout from "./components/AdminLayout/AdminLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/login" />} />

        {/* Login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <h1>Dashboard</h1>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/create-news"
          element={
            <AdminLayout>
              <h1>Create News</h1>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/manage-news"
          element={
            <AdminLayout>
              <h1>Manage News</h1>
            </AdminLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
