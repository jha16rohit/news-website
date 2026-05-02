import React, { useEffect, useState } from "react";
import "./Accountsettings.css";
import {
  getMe,
  updateProfile,
  changePassword,
  logoutUser,
} from "../../../api/auth";
import { useNavigate } from "react-router-dom";

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [password, setPassword] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(true);

  // ✅ FETCH USER DATA
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        const user = res.user || res.data?.user;

        const [firstName, lastName] = (user.name || "").split(" ");

        setProfile({
          firstName: firstName || "",
          lastName: lastName || "",
          email: user.email || "",
          phone: user.phone || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword({ ...password, [e.target.name]: e.target.value });
  };

  // ✅ SAVE PROFILE
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      await updateProfile({
        name: fullName,
        email: profile.email,
        phone: profile.phone,
      });

      alert("Profile saved!");
    } catch (err) {
      console.error(err);
      alert("Error saving profile ❌");
    }
  };

  // ✅ CHANGE PASSWORD + LOGOUT
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.newPass !== password.confirm) {
      return alert("Passwords do not match ❌");
    }

    try {
      await changePassword({
        currentPassword: password.current,
        newPassword: password.newPass,
      });

      // 🔥 Logout after password change
      await logoutUser();

      alert("Password updated! Please login again 🔐");

      navigate("/admin/login-xyzsft");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error updating password ❌");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1 className="settings-title">Account Settings</h1>
        <p className="settings-subtitle">
          Manage your profile and security
        </p>
      </div>

      {/* Wrapper for 1x2 Layout */}
      <div className="settings-cards-row">

        {/* Profile Information */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <div>
              <h2 className="card-title">Profile Information</h2>
              <p className="card-subtitle">Update your personal details</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  className="form-input"
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  placeholder="First Name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  className="form-input"
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                placeholder="Email Address"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                placeholder="Phone Number"
              />
            </div>

            <button type="submit" className="btn-primary">
              Save Profile
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div>
              <h2 className="card-title">Change Password</h2>
              <p className="card-subtitle">
                Update your password to keep your account secure
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="profile-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-input"
                type="password"
                name="current"
                value={password.current}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                name="newPass"
                value={password.newPass}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                name="confirm"
                value={password.confirm}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
              />
            </div>

            <button type="submit" className="btn-secondary">
              Update Password
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AccountSettings;