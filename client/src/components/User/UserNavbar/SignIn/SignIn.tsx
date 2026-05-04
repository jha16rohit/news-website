import React, { useState } from "react";
import { X, Mail, Lock, Phone, User, ArrowLeft } from "lucide-react";
import "./SignIn.css";

interface SignInProps {
  onClose: () => void;
  // 👇 NEW: onSuccess now expects the name and email you typed!
  onSuccess: (name: string, email: string) => void;
}

const SignIn: React.FC<SignInProps> = ({ onClose, onSuccess }) => {
  const [activeView, setActiveView] = useState<"login" | "signup">("login");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"form" | "otp">("form");

  // 👇 NEW: State to capture what you type
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  const handleViewChange = (view: "login" | "signup") => {
    setActiveView(view);
    setStep("form");
  };

  const handleMethodChange = (method: "email" | "phone") => {
    setLoginMethod(method);
    setStep("form"); 
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("otp"); 
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 👇 NEW: Logic to figure out what name/email to pass up
    let finalName = nameInput;
    let finalEmail = emailInput;

    if (activeView === "login") {
      if (loginMethod === "email") {
        // If logging in with email, just use the first part of the email as the name!
        finalName = emailInput ? emailInput.split("@")[0] : "Reader";
      } else {
        finalName = "Mobile User";
        finalEmail = phoneInput;
      }
    }

    // Fallbacks just in case you leave it empty
    if (!finalName) finalName = "New User";
    if (!finalEmail) finalEmail = "user@localnewz.com";

    // Pass the real data up to the Navbar!
    onSuccess(finalName, finalEmail);
  };

  return (
    <div className="signin-overlay">
      <div className="signin-modal">
        
        <button className="signin-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="signin-header">
          <h2>Welcome to Local Newz</h2>
          <p>Sign in to save articles and get personalised insights.</p>
        </div>

        {step === "form" && (
          <>
            <div className="signin-toggle-wrapper">
              <div className="signin-toggle">
                <button className={`toggle-btn ${activeView === "login" ? "active" : ""}`} onClick={() => handleViewChange("login")}>Login</button>
                <button className={`toggle-btn ${activeView === "signup" ? "active" : ""}`} onClick={() => handleViewChange("signup")}>Sign Up</button>
              </div>
            </div>

            <button className="google-auth-btn" onClick={handleFinalSubmit}>
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="signin-divider"><span>or</span></div>
          </>
        )}

        {/* ================= LOGIN VIEW ================= */}
        {activeView === "login" && step === "form" && (
          <>
            <div className="signin-method-toggle">
              <button className={`method-btn ${loginMethod === "email" ? "active" : ""}`} onClick={() => handleMethodChange("email")}>Email</button>
              <button className={`method-btn ${loginMethod === "phone" ? "active" : ""}`} onClick={() => handleMethodChange("phone")}>Phone</button>
            </div>

            <form className="signin-form" onSubmit={loginMethod === "phone" ? handleSendOtp : handleFinalSubmit}>
              {loginMethod === "email" ? (
                <>
                  <div className="form-group">
                    <label>Email</label>
                    <div className="input-wrapper">
                      <Mail size={18} className="input-icon" />
                      {/* 👇 Bound to State 👇 */}
                      <input type="email" placeholder="you@example.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <button type="submit" className="signin-submit-btn">Login</button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Phone number</label>
                    <div className="input-wrapper">
                      <Phone size={18} className="input-icon" />
                      {/* 👇 Bound to State 👇 */}
                      <input type="tel" placeholder="+91 98765 43210" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="signin-submit-btn">Send OTP</button>
                </>
              )}
            </form>
          </>
        )}

        {/* ================= OTP VERIFICATION VIEW ================= */}
        {step === "otp" && (
          <div className="otp-view-container">
            <button className="otp-back-btn" onClick={() => setStep("form")}>
              <ArrowLeft size={16} /> Back
            </button>
            <div className="otp-content">
              <h3>Verify your phone</h3>
              <p>We sent a 6-digit code to your phone number. Enter it below to login.</p>
              <div className="otp-inputs">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input key={index} id={`otp-${index}`} type="text" maxLength={1} className="otp-box" onChange={(e) => handleOtpChange(e, index)} onKeyDown={(e) => handleOtpKeyDown(e, index)} />
                ))}
              </div>
              <button className="signin-submit-btn" onClick={handleFinalSubmit}>Verify & Login</button>
              <div className="otp-footer">
                <span>Didn't receive the code?</span>
                <button className="resend-btn">Resend OTP</button>
              </div>
            </div>
          </div>
        )}

        {/* ================= SIGN UP VIEW ================= */}
        {activeView === "signup" && step === "form" && (
          <form className="signin-form" onSubmit={handleFinalSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                {/* 👇 Bound to State 👇 */}
                <input type="text" placeholder="Your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input type="email" placeholder="you@example.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input type="password" placeholder="Create a strong password" />
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input type="password" placeholder="Confirm your password" />
              </div>
            </div>
            <button type="submit" className="signin-submit-btn">Create account</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignIn;