"use client";

import { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  showProcessing,
  showError,
  showSuccess,
  showConfirmation,
} from "@/components/pages/Alert";

export default function ManageProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer & Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [formData, setFormData] = useState({
    project_id: "",
    project_name: "",
    description: "",
    dead_line: "",
    status: "Active",
    tasks: [], // Store tasks if creating from scratch, usually empty
  });
  
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDrawer = (project = null) => {
    setSelectedProject(project);
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    if (selectedProject) {
      // Format date for date input (YYYY-MM-DD)
      let formattedDate = "";
      if (selectedProject.dead_line) {
        const d = new Date(selectedProject.dead_line);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split("T")[0];
        }
      }

      setFormData({
        project_id: selectedProject.project_id || "",
        project_name: selectedProject.project_name || "",
        description: selectedProject.description || "",
        dead_line: formattedDate,
        status: selectedProject.status || "Active",
        tasks: selectedProject.tasks || [],
      });
    } else {
      setFormData({
        project_id: "",
        project_name: "",
        description: "",
        dead_line: "",
        status: "Active",
        tasks: [],
      });
    }
  }, [selectedProject, isDrawerOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (formError) setFormError("");
  };

  const validateForm = () => {
    if (!formData.project_name.trim()) {
      setFormError("Project Name is required.");
      return false;
    }

    // Check if deadline is in the past (if provided)
    if (formData.dead_line) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // reset time to midnight for accurate comparison
      const selectedDate = new Date(formData.dead_line);
      if (selectedDate < today) {
        setFormError("Please select a valid deadline (cannot be in the past).");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await showConfirmation(
      "Save Project?",
      "Are you sure you want to save this project?",
      "Yes, Save",
      "Cancel"
    );

    if (!result.isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    showProcessing("Saving Project...", "Please wait while the data is saved.");

    try {
      const payload = {
        project_id: formData.project_id ? Number(formData.project_id) : null,
        project_name: formData.project_name,
        description: formData.description,
        dead_line: formData.dead_line,
        status: formData.status,
        tasks: formData.tasks && formData.tasks.length > 0 ? formData.tasks : null,
      };

      // If editing, include the project's _id
      if (selectedProject?._id) {
        payload._id = selectedProject._id;
      } else if (selectedProject?.id) {
        payload._id = selectedProject.id;
      }

      const response = await apiClient.post(
        "/api/smart-project/insert-update-project-list",
        payload,
      );

      if (response) {
        showSuccess(
          selectedProject ? "Project Updated!" : "Project Created!",
          "The project was saved successfully.",
        );
        fetchProjects();
        handleCloseDrawer();
      }
    } catch (err) {
      console.error("Error saving project:", err);
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

  const handleDelete = async (projectToDelete) => {
    const result = await showConfirmation(
      "Delete Project?",
      "Are you sure you want to permanently delete this project and all its tasks? This action cannot be undone.",
      "Yes, Delete",
      "Cancel"
    );

    if (!result.isConfirmed) {
      return;
    }

    showProcessing("Deleting Project...", "Please wait while we remove this project.");

    try {
      const id = projectToDelete._id || projectToDelete.id;
      const response = await apiClient.delete(`/api/smart-project/delete-project-list/${id}`);
      
      if (response) {
        showSuccess("Project Deleted!", "The project was successfully removed.");
        fetchProjects();
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      showError(
        "Delete Failed",
        err.response?.data?.error || err.message || "An error occurred while deleting."
      );
    }
  };

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/smart-project/get-project-list");
      if (response) {
        // Adjust based on actual API payload (assuming response.data.list_data like admin)
        setProjects(response.data.list_data || response.data || []);
      } else {
        setError("Failed to fetch project list.");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(
        err.response?.data?.error || "An error occurred while fetching data.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter logic
  const filteredProjects = Array.isArray(projects) ? projects.filter((project) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(project).some(
      (val) =>
        val !== null &&
        val !== undefined &&
        String(val).toLowerCase().includes(q)
    );
  }) : [];

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "Active": return "bg-primary text-white border-primary";
      case "Completed": return "bg-green-500 text-white border-green-500";
      case "On Hold": return "bg-yellow-500 text-white border-yellow-500";
      default: return "bg-background text-foreground border-card-border";
    }
  };

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
            PROJECT MANAGEMENT
          </h1>
          <p className="text-text-muted mt-1 text-[11px] font-bold uppercase tracking-wider">
            PROJECT & TASK DIRECTORY
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
          Add Project
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-card-bg border border-card-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-card-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
            Project List
          </h3>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH PROJECTS..."
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-card-border text-[10px] uppercase tracking-wider text-text-muted">
                <th className="px-6 py-4 font-bold">Project Info</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Deadline</th>
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
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-text-muted text-sm font-semibold"
                  >
                    <p>No projects found matching your search.</p>
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
                filteredProjects.map((project) => (
                  <tr
                    key={project.id || project._id}
                    className="hover:bg-background/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-foreground">
                          {project.project_name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-text-muted truncate max-w-xs">
                            {project.description}
                          </p>
                        )}
                        <p className="text-[10px] uppercase font-bold text-text-muted mt-1">
                          {project.tasks?.length || 0} Tasks
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusBadgeColor(project.status)} uppercase tracking-wider`}>
                        {project.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-text-muted">
                        {project.dead_line ? new Date(project.dead_line).toLocaleDateString() : "No Deadline"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link 
                        href={`/dashboard/projects/${project._id || project.id}`}
                        className="text-text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-background inline-flex mr-1"
                        title="View Tasks"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button 
                        onClick={() => handleOpenDrawer(project)}
                        className="text-text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-background inline-flex"
                        title="Edit Project"
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
                        onClick={() => handleDelete(project)}
                        className="text-text-muted hover:text-[#f1416c] transition-colors p-2 rounded-lg hover:bg-background inline-flex ml-1"
                        title="Delete Project"
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
              {selectedProject ? "Edit Project" : "Create New Project"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form
              id="project-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Form Validation Error Message */}
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold tracking-wide">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Project ID
                </label>
                <input
                  type="number"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. 1001"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="project_name"
                  value={formData.project_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Website Redesign"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Optional project details..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  name="dead_line"
                  value={formData.dead_line}
                  onChange={handleChange}
                  onClick={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      // ignore
                    }
                  }}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Project Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
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
                form="project-form"
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
                  "Save Project"
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}
