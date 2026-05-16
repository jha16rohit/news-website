// client/src/components/User/SignIn/SignIn.tsx
// ──────────────────────────────────────────────────────────────
// Google Sign-In uses the GSI (Google Identity Services) SDK.
// The SDK is loaded once lazily when the modal opens.
// On button click → google.accounts.id.prompt() triggers the
// native Google account picker (one-tap or popup).
// The returned credential (id_token) is sent to our backend.

import React, { useState, useEffect, useCallback } from "react";
import { X, Mail, Lock, Phone, User, ArrowLeft, Loader2 } from "lucide-react";
import "./SignIn.css";
import { registerUser, loginUser, googleAuth } from "../../../../api/user/userauth";
import type { AuthUser } from "../../../../api/user/userauth";

// ─── Put your Google Client ID here (or in .env as VITE_GOOGLE_CLIENT_ID) ───
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface SignInProps {
  onClose: () => void;
  onSuccess: (user: AuthUser, token: string) => void;
}

// Extend window for GSI types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void;
          prompt: (cb?: (n: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void) => void;
          renderButton: (el: HTMLElement, cfg: object) => void;
          cancel: () => void;
        };
      };
    };
  }
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const SignIn: React.FC<SignInProps> = ({ onClose, onSuccess }) => {
  const [activeView, setActiveView]     = useState<"login" | "signup">("login");
  const [loginMethod, setLoginMethod]   = useState<"email" | "phone">("email");
  const [step, setStep]                 = useState<"form" | "otp">("form");

  // Form fields
  const [nameInput,     setNameInput]     = useState("");
  const [emailInput,    setEmailInput]    = useState("");
  const [phoneInput,    setPhoneInput]    = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPass,   setConfirmPass]   = useState("");

  // UX state
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [gsiReady,      setGsiReady]      = useState(false);

  // ── Load Google GSI script once ─────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not set — Google login disabled.");
      return;
    }

    // Already loaded?
    if (window.google?.accounts?.id) {
      initializeGSI();
      return;
    }

    const script = document.createElement("script");
    script.src   = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGSI();
    };
    document.head.appendChild(script);

    return () => {
      // Cancel any pending prompt when modal closes
      window.google?.accounts?.id?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Initialise GSI with our client ID & credential callback ──
  const initializeGSI = useCallback(() => {
    window.google!.accounts.id.initialize({
      client_id:         GOOGLE_CLIENT_ID,
      callback:          handleGoogleCredential,
      auto_select:       true,   // auto-selects if only one account is signed in
      cancel_on_tap_outside: false,
    });
    setGsiReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Called by GSI when user picks an account ─────────────────
  const handleGoogleCredential = async (response: { credential: string }) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await googleAuth(response.credential);
      onSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Trigger Google account picker on button click ─────────────
  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google login is not configured. Please contact support.");
      return;
    }
    if (!gsiReady || !window.google?.accounts?.id) {
      setError("Google is still loading. Please try again in a moment.");
      return;
    }

    setError(null);
    // Prompt shows the native Google account chooser
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: render a hidden div-based button and click it
        // (happens when browser blocks one-tap, e.g. third-party cookie restrictions)
        triggerGooglePopupFallback();
      }
    });
  };

  // ── Fallback: use Google's renderButton approach ──────────────
  const triggerGooglePopupFallback = () => {
    const container = document.getElementById("google-btn-hidden-container");
    if (!container) return;
    // Clear and re-render the button, then auto-click it
    container.innerHTML = "";
    window.google!.accounts.id.renderButton(container, {
      type:  "standard",
      theme: "outline",
      size:  "large",
    });
    // The rendered button is a real <div> — click its child iframe/button
    const btn = container.querySelector("div[role='button']") as HTMLElement | null;
    btn?.click();
  };

  // ── helpers ───────────────────────────────────────────────────

  const resetError = () => setError(null);

  const handleViewChange = (view: "login" | "signup") => {
    setActiveView(view);
    setStep("form");
    resetError();
  };

  const handleMethodChange = (method: "email" | "phone") => {
    setLoginMethod(method);
    setStep("form");
    resetError();
  };

  // ── OTP flow ─────────────────────────────────────────────────

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setStep("otp");
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.value && index < 5) {
      (document.getElementById(`otp-${index + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      (document.getElementById(`otp-${index - 1}`) as HTMLInputElement)?.focus();
    }
  };

  // ── LOGIN ────────────────────────────────────────────────────

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();

    if (!emailInput || !passwordInput) {
      setError("Email aur password dono zaroori hain.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ email: emailInput, password: passwordInput });
      onSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ─────────────────────────────────────────────────

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();

    if (!nameInput.trim()) { setError("Please enter your full name."); return; }
    if (!emailInput || !passwordInput) { setError("Email aur password dono zaroori hain."); return; }
    if (passwordInput.length < 6) { setError("Password kam se kam 6 characters ka hona chahiye."); return; }
    if (passwordInput !== confirmPass) { setError("Passwords match nahi kar rahe."); return; }

    setLoading(true);
    try {
      const res = await registerUser({
        name:     nameInput.trim(),
        email:    emailInput,
        password: passwordInput,
        phone:    phoneInput || undefined,
      });
      onSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("Phone login coming soon!");
  };

  // ── RENDER ───────────────────────────────────────────────────

  const isAnyLoading = loading || googleLoading;

  return (
    <div className="signin-overlay">
      <div className="signin-modal">

        <button className="signin-close-btn" onClick={onClose} disabled={isAnyLoading}>
          <X size={20} />
        </button>

        <div className="signin-header">
          <h2>Welcome to Local Newz</h2>
          <p>Sign in to save articles and get personalised insights.</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="signin-error-banner">
            <span>{error}</span>
            <button onClick={resetError}><X size={13} /></button>
          </div>
        )}

        {step === "form" && (
          <>
            {/* Login / Signup toggle */}
            <div className="signin-toggle-wrapper">
              <div className="signin-toggle">
                <button
                  className={`toggle-btn ${activeView === "login" ? "active" : ""}`}
                  onClick={() => handleViewChange("login")}
                  disabled={isAnyLoading}
                >
                  Login
                </button>
                <button
                  className={`toggle-btn ${activeView === "signup" ? "active" : ""}`}
                  onClick={() => handleViewChange("signup")}
                  disabled={isAnyLoading}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* ── Google Button ── */}
            <button
              className="google-auth-btn"
              onClick={handleGoogleClick}
              disabled={isAnyLoading || !gsiReady}
            >
              {googleLoading ? (
                <Loader2 size={18} className="spin-icon" />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? "Signing in with Google..." : "Continue with Google"}
            </button>

            {/* Hidden container used as fallback for GSI renderButton */}
            <div id="google-btn-hidden-container" style={{ display: "none" }} />

            <div className="signin-divider"><span>or</span></div>
          </>
        )}

        {/* ═══════════ LOGIN VIEW ═══════════ */}
        {activeView === "login" && step === "form" && (
          <>
            <div className="signin-method-toggle">
              <button
                className={`method-btn ${loginMethod === "email" ? "active" : ""}`}
                onClick={() => handleMethodChange("email")}
                disabled={isAnyLoading}
              >
                Email
              </button>
              <button
                className={`method-btn ${loginMethod === "phone" ? "active" : ""}`}
                onClick={() => handleMethodChange("phone")}
                disabled={isAnyLoading}
              >
                Phone
              </button>
            </div>

            {loginMethod === "email" ? (
              <form className="signin-form" onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={e => { setEmailInput(e.target.value); resetError(); }}
                      required
                      disabled={isAnyLoading}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={e => { setPasswordInput(e.target.value); resetError(); }}
                      required
                      disabled={isAnyLoading}
                    />
                  </div>
                </div>
                <button type="submit" className="signin-submit-btn" disabled={isAnyLoading}>
                  {loading ? <><Loader2 size={16} className="spin-icon" /> Logging in...</> : "Login"}
                </button>
              </form>
            ) : (
              <form className="signin-form" onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label>Phone number</label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      required
                      disabled={isAnyLoading}
                    />
                  </div>
                </div>
                <button type="submit" className="signin-submit-btn" disabled={isAnyLoading}>
                  Send OTP
                </button>
              </form>
            )}
          </>
        )}

        {/* ═══════════ OTP VIEW ═══════════ */}
        {step === "otp" && (
          <div className="otp-view-container">
            <button className="otp-back-btn" onClick={() => setStep("form")}>
              <ArrowLeft size={16} /> Back
            </button>
            <div className="otp-content">
              <h3>Verify your phone</h3>
              <p>We sent a 6-digit code to <strong>{phoneInput}</strong>. Enter it below.</p>
              <form onSubmit={handleOtpVerify}>
                <div className="otp-inputs">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      className="otp-box"
                      onChange={e => handleOtpChange(e, i)}
                      onKeyDown={e => handleOtpKeyDown(e, i)}
                    />
                  ))}
                </div>
                <button type="submit" className="signin-submit-btn">
                  Verify &amp; Login
                </button>
              </form>
              <div className="otp-footer">
                <span>Didn't receive the code?</span>
                <button className="resend-btn" type="button">Resend OTP</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SIGN UP VIEW ═══════════ */}
        {activeView === "signup" && step === "form" && (
          <form className="signin-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={nameInput}
                  onChange={e => { setNameInput(e.target.value); resetError(); }}
                  required
                  disabled={isAnyLoading}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); resetError(); }}
                  required
                  disabled={isAnyLoading}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Phone (optional)</label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  disabled={isAnyLoading}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={passwordInput}
                  onChange={e => { setPasswordInput(e.target.value); resetError(); }}
                  required
                  disabled={isAnyLoading}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPass}
                  onChange={e => { setConfirmPass(e.target.value); resetError(); }}
                  required
                  disabled={isAnyLoading}
                />
              </div>
            </div>
            <button type="submit" className="signin-submit-btn" disabled={isAnyLoading}>
              {loading
                ? <><Loader2 size={16} className="spin-icon" /> Creating account...</>
                : "Create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignIn;