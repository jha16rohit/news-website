import AdminSidebar from "../AdminSidebar/AdminSidebar";

const SIDEBAR_WIDTH = 284; // keep in sync with CSS

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Page Content */}
      <main
        style={{
          marginLeft: `${SIDEBAR_WIDTH}px`,
          minHeight: "100vh",
          padding: "24px",
          background: "#f5f5f5",
        }}
      >
        {children}
      </main>
    </>
  );
};

export default AdminLayout;
