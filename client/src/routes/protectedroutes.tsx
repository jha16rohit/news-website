import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMe } from "../api/auth";
import type { ReactNode } from "react";
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}



const ProtectedRoute = ({ children }: { children: ReactNode }) => {
      const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await getMe();
        setUser(res.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // ⏳ While checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Logged in
  return children;
};

export default ProtectedRoute;