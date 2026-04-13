import "./Login.css";
import { FaUser, FaEye, FaEyeSlash, FaGlobeAsia } from "react-icons/fa";
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../api/auth";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    try {
      const res = await loginUser(form);

      console.log("Login success:", res);

      // ✅ store login
      localStorage.setItem("admin-auth", "true");

      // ✅ optionally store token
      if (res?.token) {
        localStorage.setItem("admin-token", res.token);
      }

      // ✅ redirect
      navigate("/admin/dashboard");

    } catch (err: any) {
      alert(err.message || "Login failed");
    }
  };

  return (
    <motion.div
      className="login-page"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <div className="login-card">
        <div className="login-form">
          <h2>Log in</h2>

          {/* EMAIL */}
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <FaUser className="end-icon" />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            <span className="end-icon clickable" onClick={togglePassword}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className="login-btn" onClick={handleLogin}>
            Log in
          </button>
        </div>

        <div className="login-welcome">
          <div className="brand branddd">
            <div className="brand-row">
              <span className="brand-text texttt">L</span>
              <FaGlobeAsia className="earth-icon" />
              <span className="brand-text">cal</span>
            </div>

            <div className="brand-text brand-newz">Newz</div>

            <p className="login-tagline">सच, साहस और सरोकार</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;