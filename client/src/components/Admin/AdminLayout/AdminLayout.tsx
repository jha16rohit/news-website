import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "../AdminSidebar/AdminSidebar";
import AdminTopBar from "../AdminTopBar/AdminTopBar";
import { getMe } from "../../../api/auth";
import Preloader from "../Preloader/Preloder";

const SIDEBAR_WIDTH = 260;
const TOPBAR_HEIGHT = 60;

interface AuthUser {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  permissions?: string[];
}

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await getMe();

        setUser(res.user);
        setAuthenticated(true);
      } catch (error) {
        setUser(null);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // ⏳ Check authentication with backend
  if (loading) {
    return (
      <div style={{ height: "100vh" }}>
        <Preloader />
      </div>
    );
  }

  // ❌ Not authenticated
  if (!authenticated) {
    return <Navigate to="/admin/login-xyzsft" replace />;
  }

  return (
    <>
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: TOPBAR_HEIGHT,
          zIndex: 1000,
          background: "#fff",
        }}
        className="topbar-wrapper"
      >
        <AdminTopBar
          onMenuClick={() => setSidebarOpen(true)}
        />
      </div>

      <main
        className="admin-main"
        style={{
          paddingTop: TOPBAR_HEIGHT,
          minHeight: "100vh",
          background: "#f5f5f5",
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>

      <style>{`
        @media (min-width: 1025px) {
          .topbar-wrapper {
            left: ${SIDEBAR_WIDTH}px !important;
          }

          .admin-main {
            margin-left: ${SIDEBAR_WIDTH}px;
            padding: ${TOPBAR_HEIGHT}px 24px 24px;
          }
        }

        @media (max-width: 1024px) {
          .topbar-wrapper {
            left: 0 !important;
          }

          .admin-main {
            margin-left: 0;
            padding: ${TOPBAR_HEIGHT}px 16px 16px;
          }
        }
      `}</style>
    </>
  );
};

export default AdminLayout;