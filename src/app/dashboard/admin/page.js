"use client";

import { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { useSelector } from "react-redux";
import {
  showProcessing,
  showError,
  showSuccess,
  showConfirmation,
} from "@/components/pages/Alert";

const ROLE_MAP = {
  200: "Admin",
  201: "Project Manager",
  202: "Team Member",
};

export default function ManageAdminPage() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer & Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUser = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    email: "",
    role_id: 200,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDrawer = (user = null) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email || "",
        role_id: selectedUser.role_id ? Number(selectedUser.role_id) : 200,
      });
    } else {
      setFormData({
        email: "",
        role_id: 200,
      });
    }
  }, [selectedUser, isDrawerOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "role_id" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await showConfirmation(
      "Save User?",
      "Are you sure you want to save this user's details?",
      "Yes, Save",
      "Cancel",
    );

    if (!result.isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    showProcessing("Saving User...", "Please wait while the data is saved.");

    try {
      const payload = {
        email: formData.email,
        role: ROLE_MAP[formData.role_id],
        role_id: formData.role_id,
        user_info: currentUser?.email || "unknown", // String from logged in user
      };

      // If editing, include the user's _id
      if (selectedUser?._id) {
        payload._id = selectedUser._id;
      } else if (selectedUser?.id) {
        payload._id = selectedUser.id;
      }

      const response = await apiClient.post(
        "/api/admin/insert-update-user",
        payload,
      );

      if (response) {
        showSuccess(
          selectedUser ? "User Updated!" : "User Created!",
          "The user was saved successfully.",
        );
        fetchAdmins();
        handleCloseDrawer();
      }
    } catch (err) {
      console.error("Error saving user:", err);
      showError(
        "Save Failed",
        err.response?.data?.error ||
          err.message ||
          "An error occurred while saving.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/admin/get-admin-list/");
      if (response) {
        setAdmins(response.data.list_data);
      } else {
        setError("Failed to fetch admin list.");
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
      setError(
        err.response?.data?.error || "An error occurred while fetching data.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userToDelete) => {
    const result = await showConfirmation(
      "Delete User?",
      "Are you sure you want to permanently delete this user? This action cannot be undone.",
      "Yes, Delete",
      "Cancel",
    );

    if (!result.isConfirmed) {
      return;
    }

    showProcessing(
      "Deleting User...",
      "Please wait while we remove this user.",
    );

    try {
      const id = userToDelete._id || userToDelete.id;
      const response = await apiClient.delete(
        `/api/admin/delete-user-list/${id}`,
      );

      if (response) {
        showSuccess("User Deleted!", "The user was successfully removed.");
        fetchAdmins();
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      showError(
        "Delete Failed",
        err.response?.data?.error ||
          err.message ||
          "An error occurred while deleting.",
      );
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Filter logic
  const filteredAdmins = admins.filter((admin) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    // Search across all values in the admin object
    return Object.values(admin).some(
      (val) =>
        val !== null &&
        val !== undefined &&
        String(val).toLowerCase().includes(q),
    );
  });

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
            MANAGE USER
          </h1>
          <p className="text-text-muted mt-1 text-[11px] font-bold uppercase tracking-wider">
            USER DIRECTORY & ROLES
          </p>
        </div>

        <button
          onClick={() => handleOpenDrawer()}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-wide"
        >
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
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Add User
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-card-bg border border-card-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-card-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
            User List
          </h3>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH USERS..."
              className="bg-background border border-card-border rounded-lg pl-9 pr-10 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors w-[300px]"
            />
            <svg
              className="w-4 h-4 text-text-muted absolute left-3 top-2.5 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-text-muted hover:text-foreground transition-colors focus:outline-none"
                title="Clear search"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-card-border text-[10px] uppercase tracking-wider text-text-muted">
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Role ID</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <svg
                        className="animate-spin h-6 w-6 text-primary mb-3"
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
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Loading Data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-red-500 text-sm font-semibold"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-text-muted text-sm font-semibold"
                  >
                    <p>No users found matching your search.</p>
                    <div className="mt-4">
                      <button
                        onClick={() => setSearchQuery("")}
                        className="px-4 py-2 bg-background border border-card-border rounded-lg text-text-muted hover:text-foreground hover:bg-card-border/50 transition-colors text-xs uppercase tracking-wider font-bold shadow-sm"
                      >
                        Clear Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id || admin._id}
                    className="hover:bg-background/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {admin.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-foreground bg-background px-2.5 py-1 rounded-md border border-card-border">
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-text-muted">
                        {admin.role_id || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenDrawer(admin)}
                        className="text-text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-background inline-flex"
                      >
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
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        className="text-text-muted hover:text-[#f1416c] transition-colors p-2 rounded-lg hover:bg-background inline-flex ml-1"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Drawer */}
      <>
        {/* Overlay backdrop */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={handleCloseDrawer}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed top-0 right-0 h-full w-full max-w-md bg-card-bg border-l border-card-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Close button positioned outside to the left */}
          <button
            onClick={handleCloseDrawer}
            className={`absolute -left-14 top-6 w-10 h-10 flex items-center justify-center rounded-xl bg-card-bg text-text-muted hover:text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-card-border transition-all duration-300 z-50 ${
              isDrawerOpen ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>

          <div className="p-6 border-b border-card-border">
            <h2 className="text-xl font-bold text-foreground">
              {selectedUser ? "Edit User" : "Add New User"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form
              id="add-admin-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Role
                </label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value={200}>Admin</option>
                  <option value={201}>Project Manager</option>
                  <option value={202}>Team Member</option>
                </select>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-card-border bg-card-bg/50">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex-1 px-4 py-3 rounded-xl border border-card-border text-sm font-bold text-text-muted hover:text-foreground hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-admin-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-primary-hover transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
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
                  "Save User"
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}
