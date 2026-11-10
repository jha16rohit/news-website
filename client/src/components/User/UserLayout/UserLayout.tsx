import React, { createContext, useContext, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import UserNavbar from "../UserNavbar/UserNavbar";
import UserFooter from "../UserFooter/UserFooter";
import SignIn from "../UserNavbar/SignIn/SignIn";
import Preloader from "../../Admin/Preloader/Preloder";

import { useAuth } from "../../../context/AuthContext";

import "./UserLayout.css";

interface HomepageLoadingContextValue {
  setIsHomepageLoading: (loading: boolean) => void;
}

const HomepageLoadingContext = createContext<HomepageLoadingContextValue | null>(
  null
);

export function useHomepageLoading() {
  const ctx = useContext(HomepageLoadingContext);
  if (!ctx) {
    throw new Error(
      "useHomepageLoading must be used within UserLayout"
    );
  }
  return ctx;
}

const UserLayout: React.FC = () => {
  const location = useLocation();

  const isHomepage = location.pathname === "/";
  const hideFooter = location.pathname === "/profile";

  const [isHomepageLoading, setIsHomepageLoading] = useState(isHomepage);

  // Reset loading state to true whenever entering the homepage so the
  // preloader shows on every fresh homepage entry (including return visits).
  useEffect(() => {
    if (isHomepage) {
      setIsHomepageLoading(true);
    }
  }, [isHomepage]);

  const {
    loginOpen,
    closeLogin,
    login,
  } = useAuth();

  return (
    <HomepageLoadingContext.Provider
      value={{ setIsHomepageLoading }}
    >
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

        {/* Full-screen preloader overlay on the homepage while initial data loads */}
        {isHomepage && isHomepageLoading && <Preloader />}
      </div>
    </HomepageLoadingContext.Provider>
  );
};

export default UserLayout;