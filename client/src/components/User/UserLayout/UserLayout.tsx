import React from "react";
import { Outlet, useLocation } from "react-router-dom";

import UserNavbar from "../UserNavbar/UserNavbar";
import UserFooter from "../UserFooter/UserFooter";
import SignIn from "../UserNavbar/SignIn/SignIn";

import { useAuth } from "../../../context/AuthContext";

import "./UserLayout.css";

const UserLayout: React.FC = () => {
  const location = useLocation();

  const hideFooter = location.pathname === "/profile";

  const {
    loginOpen,
    closeLogin,
    login,
  } = useAuth();

  return (
    <div className="user-layout">
      <UserNavbar />

      <main className="main-content">
        <Outlet />
      </main>

      {!hideFooter && <UserFooter />}

      {loginOpen && (
        <SignIn
          onClose={closeLogin}
          onSuccess={(user, token) => {
            // 👇 EXPERT FIX: Save Token to Local Storage as extra safeguard
            localStorage.setItem("authToken", token);
            login(user);
          }}
        />
      )}
    </div>
  );
};

export default UserLayout;