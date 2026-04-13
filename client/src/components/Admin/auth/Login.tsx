import "./Login.css";
import { FaUser, FaEye, FaEyeSlash, FaGlobeAsia } from "react-icons/fa";
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";



const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const togglePassword = (): void => {
    setShowPassword((prev) => !prev);
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
        {/* LEFT : LOGIN FORM */}
        <div className="login-form">
          <h2>Log in</h2>

          {/* Username */}
          <div className="input-group">
            <input type="text" placeholder="Username" />
            <FaUser className="end-icon" />
          </div>

          {/* Password */}
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
            />
            <span className="end-icon clickable" onClick={togglePassword}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            className="login-btn"
            onClick={() => navigate("/admin/dashboard")}
          >
            Log in
          </button>

        </div>

        {/* RIGHT : BRAND PANEL */}
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
