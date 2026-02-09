import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import AdminLayout from "./components/AdminLayout/AdminLayout";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import CommentsPage from "./components/CommentsPage/CommentsPage";
import AllNews from "./components/AllNews/AllNews";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin landing (Dashboard) */}
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />

        {/* Explicit dashboard route (optional but good) */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />

        {/* Create News */}
        <Route
          path="/admin/create-news"
          element={
            <AdminLayout>
              <h1>Create News</h1>
            </AdminLayout>
          }
        />

        {/* Manage News */}
        <Route
          path="/admin/manage-news"
          element={
            <AdminLayout>
              <h1>Manage News</h1>
            </AdminLayout>
          }
        />
        <Route
          path="/admin/comments"
          element={
            <AdminLayout>
              <CommentsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/news"
          element={
            <AdminLayout>
              <AllNews />
            </AdminLayout>
          }
        />


        {/* Fallback */}
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
