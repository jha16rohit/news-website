import { Outlet } from "react-router-dom";
import AdminSidebar from "../AdminSidebar/AdminSidebar";
import AdminTopBar from "../AdminTopBar/AdminTopBar";

const SIDEBAR_WIDTH = 260; // must match sidebar css
const TOPBAR_HEIGHT = 60; // must match topbar css

const AdminLayout = () => {
  return (
    <>
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Fixed Topbar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: SIDEBAR_WIDTH,
          right: 0,
          height: TOPBAR_HEIGHT,
          zIndex: 1000,
          background: "#fff",
        }}
      >
        <AdminTopBar />
      </div>

      {/* Page Content */}
      <main
        style={{
          marginLeft: SIDEBAR_WIDTH,
          paddingTop: TOPBAR_HEIGHT,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 24,
          minHeight: "100vh",
          background: "#f5f5f5",
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>
    </>
  );
};

export default AdminLayout;
