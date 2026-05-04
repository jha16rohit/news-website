import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import UserNavbar from "../UserNavbar/UserNavbar";
import UserFooter from "../UserFooter/UserFooter";
import "./UserLayout.css";

const UserLayout: React.FC = () => {
  const location = useLocation();
  const hideFooter = location.pathname === "/profile";

  return (
    <div className="user-layout">
      <UserNavbar />

      <main className="main-content">
        <Outlet />
      </main>

      {!hideFooter && <UserFooter />}
    </div>
  );
};

export default UserLayout;