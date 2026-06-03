"use client";

import { useState, useEffect, useMemo } from "react";
import apiClient from "@/utils/apiClient";
import Link from "next/link";
import {
  showProcessing,
  showError,
  showSuccess,
  showConfirmation,
} from "@/components/pages/Alert";
import ManagerRoute from "@/routes/ManagerRoute";

export default function ManageProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All"); // All, Upcoming, Overdue
  const [sortBy, setSortBy] = useState("Newest"); // Newest, Nearest Deadline, Name A-Z

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Drawer & Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [formData, setFormData] = useState({
    project_id: "",
    project_name: "",
    description: "",
    dead_line: "",
    status: "Active",
    tasks: [],
    members: "",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Projects
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(
        "/api/smart-project/get-project-list",
      );
      if (response) {
        setProjects(response.data.list_data || response.data || []);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, timeFilter, sortBy]);

  // Drawer Handlers
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
        members: selectedProject.members?.join(", ") || "",
      });
    } else {
      setFormData({
        project_id: "",
        project_name: "",
        description: "",
        dead_line: "",
        status: "Active",
        tasks: [],
        members: "",
      });
    }
  }, [selectedProject, isDrawerOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const validateForm = () => {
    if (!formData.project_name.trim()) {
      setFormError("Project Name is required.");
      return false;
    }
    if (formData.dead_line) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.dead_line);
      if (selectedDate < today) {
        setFormError("Deadline cannot be in the past.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = {
        project_name: formData.project_name,
        description: formData.description,
        dead_line: formData.dead_line,
        status: formData.status,
        tasks:
          formData.tasks && formData.tasks.length > 0 ? formData.tasks : null,
        members: formData.members
          ? formData.members
              .split(",")
              .map((m) => m.trim())
              .filter(Boolean)
          : null,
      };

      if (selectedProject) {
        payload._id = selectedProject._id || selectedProject.id;
        if (formData.project_id) {
          payload.project_id = Number(formData.project_id);
        }
      } else {
        if (formData.project_id) {
          payload.project_id = Number(formData.project_id);
        } else {
          payload.project_id = Math.floor(Math.random() * 1000000);
        }
      }

      const response = await apiClient.post(
        "/api/smart-project/insert-update-project-list",
        payload,
      );

      if (response) {
        showSuccess(
          selectedProject ? "Project Updated!" : "Project Created!",
          "The operation was completed successfully.",
        );
        fetchProjects();
        handleCloseDrawer();
      }
    } catch (err) {
      console.error("Save error:", err);
      setFormError(
        err.response?.data?.error || err.message || "An error occurred.",
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
      "Cancel",
    );

    if (!result.isConfirmed) return;

    showProcessing(
      "Deleting Project...",
      "Please wait while we remove this project.",
    );
    try {
      const id = projectToDelete._id || projectToDelete.id;
      const response = await apiClient.delete(
        `/api/smart-project/delete-project-list/${id}`,
      );
      if (response) {
        showSuccess(
          "Project Deleted!",
          "The project was successfully removed.",
        );
        fetchProjects();
      }
    } catch (err) {
      console.error("Delete error:", err);
      showError(
        "Delete Failed",
        err.response?.data?.error ||
          err.message ||
          "An error occurred while deleting.",
      );
    }
  };

  const handleInlineStatusChange = async (project, newStatus) => {
    try {
      const payload = { ...project, status: newStatus };
      await apiClient.post(
        "/api/smart-project/insert-update-project-list",
        payload,
      );
      setProjects((prev) =>
        prev.map((p) =>
          (p._id || p.id) === (project._id || project.id)
            ? { ...p, status: newStatus }
            : p,
        ),
      );
      showSuccess(
        "Status Updated",
        `${project.project_name} is now ${newStatus}`,
      );
    } catch (err) {
      console.error(err);
      showError("Update Failed", "Could not change status.");
    }
  };

  // Details Modal Handlers
  const handleOpenDetails = async (project) => {
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    setProjectDetails(null);
    try {
      const id = project._id || project.id || project.project_id;
      const response = await apiClient.get(
        `/api/smart-project/get-project-details/${id}`,
      );
      if (response && response.data) {
        const data =
          response.data.details_data || response.data.data || response.data;
        setProjectDetails(Array.isArray(data) ? data[0] : data);
      } else {
        showError("Error", "Could not fetch project details.");
      }
    } catch (err) {
      console.error(err);
      showError("Error", "Failed to load project details.");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  // --- Processing Pipeline (Filter, Sort, Paginate) ---
  const processedProjects = useMemo(() => {
    let result = Array.isArray(projects) ? [...projects] : [];

    // 1. Search Filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          (p.project_name && p.project_name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    // 2. Status Filter
    if (statusFilter !== "All") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // 3. Time/Deadline Filter
    if (timeFilter !== "All") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      result = result.filter((p) => {
        if (!p.dead_line) return false;
        const d = new Date(p.dead_line);
        if (timeFilter === "Overdue") return d < today;
        if (timeFilter === "Upcoming")
          return (
            d >= today &&
            d <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          );
        return true;
      });
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === "Name A-Z")
        return (a.project_name || "").localeCompare(b.project_name || "");
      if (sortBy === "Nearest Deadline") {
        if (!a.dead_line) return 1;
        if (!b.dead_line) return -1;
        return new Date(a.dead_line) - new Date(b.dead_line);
      }
      // Default Newest (Assuming ID represents creation order if no createdAt exists, or fallback to name)
      return (b._id || "").localeCompare(a._id || "");
    });

    return result;
  }, [projects, debouncedSearch, statusFilter, timeFilter, sortBy]);

  // 5. Paginate
  const totalPages = Math.ceil(processedProjects.length / itemsPerPage) || 1;
  const paginatedProjects = processedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-primary text-white border-primary";
      case "Completed":
        return "bg-green-500 text-white border-green-500";
      case "On Hold":
        return "bg-yellow-500 text-white border-yellow-500";
      default:
        return "bg-background text-foreground border-card-border";
    }
  };

  return (
    <ManagerRoute>
    <div className="h-full flex flex-col font-sans p-2 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            PROJECTS
          </h1>
          <p className="text-text-muted mt-1 text-xs font-bold uppercase tracking-wider">
            Manage, Search, and Filter Workspaces
          </p>
        </div>
        <button
          onClick={() => handleOpenDrawer()}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center gap-2"
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
              strokeWidth="3"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          New Project
        </button>
      </div>

      {/* Unified Search & Control Bar */}
      <div className="bg-card-bg border border-card-border p-4 rounded-2xl mb-6 flex flex-col xl:flex-row gap-4 shadow-sm shrink-0 items-center justify-between">
        {/* Search */}
        <div className="relative w-full xl:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-card-border rounded-xl leading-5 bg-background text-foreground placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
            placeholder="Search projects by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-foreground"
            >
              <svg
                className="h-4 w-4"
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

        {/* Matrix Filters */}
        <div className="flex flex-wrap gap-2 xl:gap-4 items-center">
          <div className="flex items-center gap-2 border border-card-border bg-background rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-bold text-text-muted uppercase">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-foreground text-xs font-bold outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border border-card-border bg-background rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-bold text-text-muted uppercase">
              Time:
            </span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-foreground text-xs font-bold outline-none cursor-pointer"
            >
              <option value="All">Any Time</option>
              <option value="Upcoming">Due within 7 Days</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border border-card-border bg-background rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-bold text-text-muted uppercase">
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-foreground text-xs font-bold outline-none cursor-pointer"
            >
              <option value="Newest">Newest First</option>
              <option value="Nearest Deadline">Nearest Deadline</option>
              <option value="Name A-Z">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 bg-card-bg border border-card-border rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/80 backdrop-blur border-b border-card-border text-xs uppercase tracking-wider text-text-muted">
                <th className="px-6 py-4 font-bold w-1/3">Project Identity</th>
                <th className="px-6 py-4 font-bold">Progress</th>
                <th className="px-6 py-4 font-bold w-32">Status</th>
                <th className="px-6 py-4 font-bold w-32">Deadline</th>
                <th className="px-6 py-4 font-bold w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-red-500 text-sm font-bold"
                  >
                    {error}
                  </td>
                </tr>
              ) : paginatedProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-text-muted text-sm font-semibold"
                  >
                    <p>No projects found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project) => {
                  // Calculate progress
                  const tasks = project.tasks || [];
                  const total = tasks.length;
                  const completed = tasks.filter(
                    (t) => t.status === "Completed",
                  ).length;
                  const pct =
                    total === 0 ? 0 : Math.round((completed / total) * 100);

                  return (
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
                            <p className="text-xs text-text-muted truncate max-w-[250px]">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <progress
                            className={`progress w-24 ${pct === 100 ? "progress-success" : "progress-primary"} bg-background border border-card-border`}
                            value={pct}
                            max="100"
                          ></progress>
                          <span className="text-[10px] font-bold text-text-muted">
                            {completed}/{total}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={project.status || "Active"}
                          onChange={(e) =>
                            handleInlineStatusChange(project, e.target.value)
                          }
                          className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider appearance-none cursor-pointer focus:outline-none ${getStatusBadgeColor(project.status || "Active")}`}
                        >
                          <option
                            value="Active"
                            className="bg-background text-foreground"
                          >
                            ACTIVE
                          </option>
                          <option
                            value="Completed"
                            className="bg-background text-foreground"
                          >
                            COMPLETED
                          </option>
                          <option
                            value="On Hold"
                            className="bg-background text-foreground"
                          >
                            ON HOLD
                          </option>
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold ${
                            project.dead_line &&
                            new Date(project.dead_line) <
                              new Date().setHours(0, 0, 0, 0)
                              ? "text-red-500 flex items-center gap-1"
                              : "text-text-muted"
                          }`}
                        >
                          {project.dead_line ? (
                            <>
                              {new Date(project.dead_line) <
                                new Date().setHours(0, 0, 0, 0) && (
                                <svg
                                  className="w-3 h-3 animate-pulse"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                              )}
                              {new Date(project.dead_line).toLocaleDateString()}
                            </>
                          ) : (
                            "None"
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 items-center">
                          <button
                            onClick={() => handleOpenDetails(project)}
                            className="text-text-muted hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-background"
                            title="Quick Info"
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
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                          <Link
                            href={`/dashboard/projects/${project._id || project.id}`}
                            className="text-text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-background"
                            title="Open Kanban Board"
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
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                              />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleOpenDrawer(project)}
                            className="text-text-muted hover:text-yellow-500 transition-colors p-1.5 rounded-lg hover:bg-background"
                            title="Edit Metadata"
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
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(project)}
                            className="text-text-muted hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-background"
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
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Client-Side Pagination Footer */}
        {!isLoading && !error && processedProjects.length > 0 && (
          <div className="p-4 border-t border-card-border bg-background/50 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, processedProjects.length)}{" "}
              of {processedProjects.length}
            </span>
            <div className="join">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="join-item btn btn-sm bg-card-bg border-card-border text-foreground hover:bg-background"
              >
                «
              </button>
              <button className="join-item btn btn-sm bg-card-bg border-card-border text-foreground pointer-events-none">
                Page {currentPage}
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="join-item btn btn-sm bg-card-bg border-card-border text-foreground hover:bg-background"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- DRAWERS & MODALS --- */}

      {/* Embedded Details Modal */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDetails}
          />

          <div className="bg-card-bg border border-card-border rounded-2xl shadow-2xl z-10 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-card-border flex justify-between items-center bg-card-bg/50">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Project Details
              </h2>
              <button
                onClick={handleCloseDetails}
                className="text-text-muted hover:text-foreground p-1 rounded-lg hover:bg-background transition-colors"
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
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {isDetailsLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Loading details...
                  </p>
                </div>
              ) : projectDetails ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                      Project Name
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {projectDetails.project_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                      Description
                    </p>
                    <p className="text-sm text-foreground bg-background p-3 rounded-xl border border-card-border">
                      {projectDetails.description || "No description provided."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                        Status
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusBadgeColor(projectDetails.status)} uppercase tracking-wider`}
                      >
                        {projectDetails.status || "Active"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                        Deadline
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {projectDetails.dead_line
                          ? new Date(
                              projectDetails.dead_line,
                            ).toLocaleDateString()
                          : "None"}
                      </p>
                    </div>
                  </div>

                  {/* Team Members */}
                  {projectDetails.members &&
                    projectDetails.members.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                          Assigned Team Members
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {projectDetails.members.map((email, idx) => (
                            <span
                              key={idx}
                              className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                            >
                              <svg
                                className="w-3.5 h-3.5"
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
                              {email.split("@")[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Tasks List */}
                  <div className="pt-2 border-t border-card-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                      Project Tasks ({projectDetails.tasks?.length || 0})
                    </p>
                    {projectDetails.tasks && projectDetails.tasks.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {projectDetails.tasks.map((task, idx) => (
                          <div
                            key={idx}
                            className="bg-background border border-card-border p-3 rounded-xl flex justify-between items-start gap-4 hover:border-primary/50 transition-colors"
                          >
                            <div>
                              <p
                                className={`text-sm font-bold leading-snug mb-1 ${task.status === "Completed" ? "line-through text-text-muted" : "text-foreground"}`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${task.priority === "High" ? "bg-red-500/10 text-red-500" : task.priority === "Medium" ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"}`}
                                >
                                  {task.priority}
                                </span>
                                {task.assigned_member && (
                                  <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                                    <svg
                                      className="w-3 h-3"
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
                                    {task.assigned_member.split("@")[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider shrink-0 px-2 py-1 rounded-md border ${task.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : task.status === "In Progress" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" : "bg-background text-text-muted border-card-border"}`}
                            >
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic bg-background p-3 rounded-xl border border-card-border text-center">
                        No tasks added to this project yet.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-red-500 font-bold text-sm">
                  Failed to load details.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-card-border bg-card-bg/50 flex justify-end">
              <button
                onClick={handleCloseDetails}
                className="px-5 py-2 rounded-xl border border-card-border text-xs font-bold text-text-muted hover:text-foreground hover:bg-background transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseDrawer}
        />
        <div
          className={`relative w-full max-w-md bg-background h-full shadow-2xl flex flex-col transform transition-transform duration-300 ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-card-border bg-card-bg/50 flex justify-between items-center">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
              {selectedProject ? "Edit Project" : "New Project"}
            </h2>
            <button
              onClick={handleCloseDrawer}
              className="text-text-muted hover:text-foreground p-2 rounded-xl hover:bg-background transition-colors"
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
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start text-red-500">
                <svg
                  className="w-5 h-5 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm font-bold">{formError}</p>
              </div>
            )}

            <form
              id="project-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="project_name"
                  value={formData.project_name}
                  onChange={handleChange}
                  placeholder="e.g. Website Redesign"
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Project ID (Optional)
                </label>
                <input
                  type="number"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  placeholder="Numeric ID"
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Briefly describe the goals of this project..."
                  rows="4"
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Team Members (Comma separated emails)
                </label>
                <input
                  type="text"
                  name="members"
                  value={formData.members}
                  onChange={handleChange}
                  placeholder="e.g. user@example.com, admin@example.com"
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Deadline Date
                </label>
                <input
                  type="date"
                  name="dead_line"
                  value={formData.dead_line}
                  onChange={handleChange}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
                  onClick={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      console.log("showPicker not supported");
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
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
      </div>
    </div>
    </ManagerRoute>
  );
}
