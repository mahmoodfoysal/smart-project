"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import ProtectedRoute from "@/routes/ProtectedRoute";
import apiClient from "@/utils/apiClient";
import { setUser } from "@/store/authSlice";
import {
  showProcessing,
  showSuccess,
  showError,
  showConfirmation,
} from "@/components/pages/Alert";
import { auth } from "@/firebase/firebase";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

export default function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: "",
    photoUrl: "",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setProfileForm({
          name: user.displayName || user.name || user.full_name || "",
          photoUrl: user.photoUrl || user.photo_url || "",
        });
      }, 0);
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showError("Validation Error", "Name cannot be empty.");
      return;
    }

    const result = await showConfirmation(
      "Update Profile?",
      "Are you sure you want to save these changes to your profile?",
      "Yes, Save",
      "Cancel",
    );
    if (!result.isConfirmed) return;

    setIsProfileSubmitting(true);
    showProcessing(
      "Updating Profile...",
      "Please wait while we save your changes.",
    );

    try {
      if (!auth.currentUser) {
        throw new Error("No authenticated user found.");
      }

      await updateProfile(auth.currentUser, {
        displayName: profileForm.name,
        photoURL: profileForm.photoUrl,
      });

      showSuccess(
        "Profile Updated!",
        "Your profile information has been updated.",
      );

      // Update Redux state with new user info
      dispatch(
        setUser({
          ...user,
          displayName: profileForm.name,
          name: profileForm.name,
          photoUrl: profileForm.photoUrl,
        }),
      );
    } catch (err) {
      console.error("Profile update error:", err);
      showError(
        "Update Failed",
        err.message || "Could not update your profile.",
      );
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError(
        "Validation Error",
        "New password and confirm password do not match.",
      );
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError(
        "Validation Error",
        "New password must be at least 6 characters long.",
      );
      return;
    }

    const result = await showConfirmation(
      "Update Password?",
      "Are you sure you want to change your password? You will use the new password next time you log in.",
      "Yes, Change Password",
      "Cancel",
    );
    if (!result.isConfirmed) return;

    setIsPasswordSubmitting(true);
    showProcessing("Updating Password...", "Please wait.");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated.");

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Change password
      await updatePassword(currentUser, passwordForm.newPassword);

      showSuccess(
        "Password Updated!",
        "Your password was successfully changed.",
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password update error:", err);

      let errorMessage = "Could not change your password.";
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        errorMessage = "Your current password is incorrect.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      showError("Update Failed", errorMessage);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col font-sans p-2 md:p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
            My Profile
          </h1>
          <p className="text-text-muted mt-1 text-xs font-bold uppercase tracking-wider">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Account Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-card-bg border border-card-border rounded-3xl p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
              {/* Decorative background element */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500 pointer-events-none"></div>

              <div className="relative mb-6">
                {profileForm.photoUrl || user?.photoUrl || user?.photo_url ? (
                  <img
                    src={
                      profileForm.photoUrl || user?.photoUrl || user?.photo_url
                    }
                    alt={user?.name || "User Avatar"}
                    className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-xl ring-2 ring-primary/20"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                {/* Fallback Initials Avatar (shows if no photoUrl, or if img errors out) */}
                <div
                  className={`w-32 h-32 rounded-full bg-gradient-to-br from-primary to-purple-600 border-4 border-background shadow-xl items-center justify-center text-4xl font-black text-white ${profileForm.photoUrl || user?.photoUrl || user?.photo_url ? "hidden" : "flex"}`}
                >
                  {getInitials(
                    user?.displayName || user?.name || user?.full_name,
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">
                {user?.displayName ||
                  user?.name ||
                  user?.full_name ||
                  "User Name"}
              </h2>
              <p className="text-sm text-text-muted mb-4 font-medium">
                {user?.email || "user@example.com"}
              </p>

              <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                {user?.role || "Member"}
              </span>
            </div>
          </div>

          {/* Right Column: Update Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Update Form */}
            <div className="bg-card-bg border border-card-border rounded-3xl p-8 shadow-sm">
              <h3 className="text-lg font-black text-foreground uppercase tracking-wide mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                Personal Information
              </h3>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="photoUrl"
                    value={profileForm.photoUrl}
                    onChange={handleProfileChange}
                    placeholder="https://example.com/your-photo.jpg"
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isProfileSubmitting}
                    className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300 disabled:opacity-70 flex items-center gap-2"
                  >
                    {isProfileSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Update Form */}
            <div className="bg-card-bg border border-card-border rounded-3xl p-8 shadow-sm">
              <h3 className="text-lg font-black text-foreground uppercase tracking-wide mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                Security Details
              </h3>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Enter current password"
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Min. 6 characters"
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Confirm new password"
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="bg-background border border-card-border hover:bg-card-border text-foreground px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-70 flex items-center gap-2"
                  >
                    {isPasswordSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-text-muted"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
