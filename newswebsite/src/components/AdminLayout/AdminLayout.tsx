import React from "react";
import AdminSidebar from "../AdminSidebar/AdminSidebar";
import AdminTopBar from "../AdminTopBar/AdminTopBar";
import AdminDashboard from "../AdminDashboard/AdminDashboard";

const SIDEBAR_WIDTH = 284; // must match sidebar css
const TOPBAR_HEIGHT = 80; // must match topbar css

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
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
          paddingTop: TOPBAR_HEIGHT ,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 24,
          minHeight: "100vh",
          background: "#f5f5f5",
          boxSizing: "border-box",
        }}
      >

        {/* LANDING PAGE AFTER SIGN-IN */}
        {children ? children : <AdminDashboard />}
      </main>
    </>
  );
};

export default AdminLayout;
