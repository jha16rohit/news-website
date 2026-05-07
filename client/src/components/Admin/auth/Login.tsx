import "./Login.css";
import { FaUser, FaEye, FaEyeSlash, FaGlobeAsia } from "react-icons/fa";
import { Mail, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../api/auth";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Screen =
  | "login"
  | "forgot-choose"   // choose email or phone
  | "forgot-otp"      // enter OTP
  | "reset-password"; // set new password

// ─── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(endpoint: string, body: object) {
  const res = await fetch(`http://localhost:5001${endpoint}`, {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Something went wrong");
  return data;
}

// ─── OTP input component ───────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const arr  = digits.map((d) => (d === " " ? "" : d));
    arr[i]     = char;
    onChange(arr.join("").replace(/ /g, ""));
    if (char && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  return (
    <div className="otp-row">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          className="otp-cell"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const Login: React.FC = () => {
  const navigate = useNavigate();

  // ── Login form ──────────────────────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  // ── Forgot flow ─────────────────────────────────────────────────────────────
  const [screen,       setScreen]       = useState<Screen>("login");
  const [otpMethod,    setOtpMethod]    = useState<"email" | "phone" | null>(null);
  const [contactValue, setContactValue] = useState("");  // email or phone entered
  const [otp,          setOtp]          = useState("");
  const [resetToken,   setResetToken]   = useState("");  // returned after OTP verified
  const [newPassword,  setNewPassword]  = useState("");
  const [confirmPwd,   setConfirmPwd]   = useState("");
  const [showNewPwd,   setShowNewPwd]   = useState(false);
  const [showConfPwd,  setShowConfPwd]  = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [resendCd, setResendCd] = useState(0); // resend countdown

  // resend countdown timer
  useEffect(() => {
    if (resendCd <= 0) return;
    const t = setTimeout(() => setResendCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCd]);

  const showMsg = (type: "error" | "success", text: string) => setMessage({ type, text });
  const clearMsg = () => setMessage(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    clearMsg();
    if (!form.email || !form.password) { showMsg("error", "All fields are required"); return; }
    setLoading(true);
    try {
      const res = await loginUser(form);
      localStorage.setItem("admin-auth", "true");
      if (res?.token) localStorage.setItem("admin-token", res.token);
      navigate("/admin/dashboard");
    } catch (err: any) {
      showMsg("error", err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    clearMsg();
    if (!otpMethod)    { showMsg("error", "Please choose a method"); return; }
    if (!contactValue) { showMsg("error", otpMethod === "email" ? "Enter your email" : "Enter your phone number"); return; }
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: otpMethod, contact: contactValue });
      showMsg("success", `OTP sent to your ${otpMethod === "email" ? "email" : "phone"}`);
      setScreen("forgot-otp");
      setResendCd(60);
    } catch (e: any) {
      showMsg("error", e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    clearMsg();
    if (otp.length < 6) { showMsg("error", "Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/verify-otp", { method: otpMethod, contact: contactValue, otp });
      setResetToken(res.resetToken);
      showMsg("success", "OTP verified! Set your new password.");
      setScreen("reset-password");
    } catch (e: any) {
      showMsg("error", e.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCd > 0) return;
    clearMsg();
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: otpMethod, contact: contactValue });
      showMsg("success", "OTP resent!");
      setResendCd(60);
      setOtp("");
    } catch (e: any) {
      showMsg("error", e.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    clearMsg();
    if (!newPassword || newPassword.length < 6) { showMsg("error", "Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPwd) { showMsg("error", "Passwords do not match"); return; }
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", { resetToken, newPassword });
      showMsg("success", "Password reset successfully! Redirecting to login…");
      setTimeout(() => {
        setScreen("login");
        setOtp(""); setContactValue(""); setOtpMethod(null); setResetToken("");
        setNewPassword(""); setConfirmPwd("");
        clearMsg();
      }, 2000);
    } catch (e: any) {
      showMsg("error", e.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // ── Slide animation variants ─────────────────────────────────────────────
  const slide = {
    initial:    { opacity: 0, x: 30 },
    animate:    { opacity: 1, x: 0 },
    exit:       { opacity: 0, x: -30 },
    transition: { duration: 0.28, ease: "easeInOut" as const },
  } as const;

  // ── Render left panel based on screen ─────────────────────────────────────
  const renderLeftPanel = () => {
    switch (screen) {

      // ── LOGIN ────────────────────────────────────────────────────────────
      case "login":
        return (
          <motion.div key="login" className="login-form" {...slide}>
            <h2>Log in</h2>

            {message && (
              <div className={`lf-message lf-message--${message.type}`}>{message.text}</div>
            )}

            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <FaUser className="end-icon" />
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <span className="end-icon clickable" onClick={() => setShowPassword((p) => !p)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="forgot-link-wrap">
              <button
                className="forgot-link"
                onClick={() => { setScreen("forgot-choose"); clearMsg(); }}
              >
                Forgot password?
              </button>
            </div>

            <button className="login-btn" onClick={handleLogin} disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </motion.div>
        );

      // ── FORGOT — CHOOSE METHOD ───────────────────────────────────────────
      case "forgot-choose":
        return (
          <motion.div key="forgot-choose" className="login-form login-form--relative" {...slide}>
            <button className="back-btn back-btn--corner" onClick={() => { setScreen("login"); clearMsg(); setOtpMethod(null); setContactValue(""); }}>
              <ArrowLeft size={15} /> Back
            </button>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Reset Password</h2>
            <p className="lf-desc">Choose how you'd like to receive your OTP</p>

            {message && (
              <div className={`lf-message lf-message--${message.type}`}>{message.text}</div>
            )}

            <div className="otp-method-row">
              <button
                className={`otp-method-card ${otpMethod === "email" ? "otp-method-card--active" : ""}`}
                onClick={() => { setOtpMethod("email"); setContactValue(""); clearMsg(); }}
              >
                <Mail size={22} className="otp-method-icon" />
                <span>Click For Email</span>
              </button>
              
            </div>

            {otpMethod && (
              <motion.div
                className="input-group"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ marginTop: 14 }}
              >
                <input
                  type={otpMethod === "email" ? "email" : "tel"}
                  placeholder={otpMethod === "email" ? "Enter registered email" : "Enter registered phone number"}
                  value={contactValue}
                  onChange={(e) => { setContactValue(e.target.value); clearMsg(); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  autoFocus
                />
              </motion.div>
            )}

            <button
              className="login-btn"
              onClick={handleSendOtp}
              disabled={loading || !otpMethod}
              style={{ marginTop: otpMethod ? 0 : 18 }}
            >
              {loading ? "Sending OTP…" : "Send OTP"}
            </button>
          </motion.div>
        );

      // ── FORGOT — ENTER OTP ───────────────────────────────────────────────
      case "forgot-otp":
        return (
          <motion.div key="forgot-otp" className="login-form login-form--relative" {...slide}>
            <button className="back-btn back-btn--corner" onClick={() => { setScreen("forgot-choose"); clearMsg(); setOtp(""); }}>
              <ArrowLeft size={15} /> Back
            </button>
            <h2 style={{ fontSize: 22, marginBottom: 6 }}>Enter OTP</h2>
            <p className="lf-desc">
              A 6-digit code was sent to <strong>{contactValue}</strong>
            </p>

            {message && (
              <div className={`lf-message lf-message--${message.type}`}>{message.text}</div>
            )}

            <OtpInput value={otp} onChange={setOtp} />

            <button className="login-btn" onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
              {loading ? "Verifying…" : "Verify OTP"}
            </button>

            <div className="resend-wrap">
              {resendCd > 0 ? (
                <span className="resend-countdown">Resend OTP in {resendCd}s</span>
              ) : (
                <button className="forgot-link" onClick={handleResendOtp} disabled={loading}>
                  Resend OTP
                </button>
              )}
            </div>
          </motion.div>
        );

      // ── RESET PASSWORD ───────────────────────────────────────────────────
      case "reset-password":
        return (
          <motion.div key="reset-password" className="login-form" {...slide}>
            <h2 style={{ fontSize: 22, marginBottom: 6 }}>New Password</h2>
            <p className="lf-desc">Choose a strong new password</p>

            {message && (
              <div className={`lf-message lf-message--${message.type}`}>{message.text}</div>
            )}

            <div className="input-group">
              <input
                type={showNewPwd ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); clearMsg(); }}
              />
              <span className="end-icon clickable" onClick={() => setShowNewPwd((p) => !p)}>
                {showNewPwd ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="input-group">
              <input
                type={showConfPwd ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value); clearMsg(); }}
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
              />
              <span className="end-icon clickable" onClick={() => setShowConfPwd((p) => !p)}>
                {showConfPwd ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {newPassword && (
              <div className="pwd-strength">
                <div
                  className={`pwd-bar ${
                    newPassword.length >= 10 ? "pwd-bar--strong"
                    : newPassword.length >= 6 ? "pwd-bar--medium"
                    : "pwd-bar--weak"
                  }`}
                />
                <span>
                  {newPassword.length >= 10 ? "Strong" : newPassword.length >= 6 ? "Medium" : "Weak"}
                </span>
              </div>
            )}

            <button className="login-btn" onClick={handleResetPassword} disabled={loading} style={{ marginTop: 10 }}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </motion.div>
        );
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
        <AnimatePresence mode="wait">
          {renderLeftPanel()}
        </AnimatePresence>

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