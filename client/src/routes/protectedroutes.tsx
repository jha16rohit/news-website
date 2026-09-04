import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMe } from "../api/auth";
import type { ReactNode } from "react";
import Preloader from "../components/Admin/Preloader/Preloder";

interface User {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  permissions: string[];
}

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await getMe();
        setUser(res.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // ⏳ While checking authentication
  if (loading) {
    return (
      <div style={{ height: "100vh" }}>
        <Preloader />
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/admin/login-xyzsft" replace />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────────────────

  // Admin has full access.
  if (user.role === "ADMIN") {
    return children;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDITOR
  // ─────────────────────────────────────────────────────────────────────────

  // ❌ Editor cannot access Admin panel
  if (location.pathname.startsWith("/admin")) {
    return <Navigate to="/editor/editor-dashboard" replace />;
  }

  // ❌ Editor can only access Editor panel
  if (!location.pathname.startsWith("/editor")) {
    return <Navigate to="/editor/editor-dashboard" replace />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDITOR DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────

  if (
    location.pathname === "/editor" ||
    location.pathname === "/editor/editor-dashboard"
  ) {
    return children;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE NEWS
  // ─────────────────────────────────────────────────────────────────────────
  //
  // IMPORTANT:
  // This MUST come before the "/editor/news" permission route.
  // Create News is a separate capability and does not require
  // the "news" page permission.

  if (
    location.pathname === "/editor/news/create" ||
    location.pathname === "/editor/create" ||
    location.pathname.startsWith("/editor/news/create/")
  ) {
    if (!user.permissions?.includes("create-news")) {
      return (
        <Navigate
          to="/editor/editor-dashboard"
          replace
        />
      );
    }

    return children;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDITOR PERMISSION ROUTES
  // ─────────────────────────────────────────────────────────────────────────

  const permissionRoutes: Array<{
    path: string;
    permission: string;
  }> = [
    {
      path: "/editor/news",
      permission: "news",
    },
    {
      path: "/editor/breaking",
      permission: "breaking-news",
    },
    {
      path: "/editor/live",
      permission: "live-news",
    },
    {
      path: "/editor/trending",
      permission: "trending",
    },
    {
      path: "/editor/schedule",
      permission: "scheduled",
    },
    {
      path: "/editor/comments",
      permission: "comments",
    },
    {
      path: "/editor/categories",
      permission: "categories",
    },
    {
      path: "/editor/tags",
      permission: "tags",
    },
    {
      path: "/editor/medialibrary",
      permission: "media-library",
    },
    {
      path: "/editor/notification",
      permission: "notification",
    },
    {
      path: "/editor/profile",
      permission: "topic-profile",
    },
    {
      path: "/editor/user-insights",
      permission: "analytics",
    },
    {
      path: "/editor/footer-management",
      permission: "footer-management",
    },
    {
      path: "/editor/advertisement-manager",
      permission: "advertisement-manager",
    },
    {
      path: "/editor/contact-manager",
      permission: "contact-manager",
    },
  ];

  const matchedRoute = permissionRoutes.find(
    (route) =>
      location.pathname === route.path ||
      location.pathname.startsWith(`${route.path}/`)
  );

  if (matchedRoute) {
    const allowed =
      user.permissions?.includes(matchedRoute.permission) ?? false;

    if (!allowed) {
      return (
        <Navigate
          to="/editor/editor-dashboard"
          replace
        />
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FALLBACK
  // ─────────────────────────────────────────────────────────────────────────

  return children;
};

export default ProtectedRoute;