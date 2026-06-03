"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";
import Link from "next/link";
import {
  showProcessing,
  showError,
  showSuccess,
  showConfirmation,
} from "@/components/pages/Alert";

export default function ProjectTaskBoard() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id;

  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawer & Form State for Tasks
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_member: "",
    due_date: "",
    priority: "Medium",
    status: "Todo",
  });

  // Filter state for Kanban Board
  const [priorityFilter, setPriorityFilter] = useState("All");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch projects
      const projRes = await apiClient.get("/api/smart-project/get-project-list");
      const allProjects = projRes.data?.list_data || projRes.data || [];
      const currentProject = allProjects.find((p) => (p._id || p.id) === projectId);
      
      if (!currentProject) {
        setError("Project not found.");
        setIsLoading(false);
        return;
      }
      
      // Initialize tasks array if it doesn't exist
      if (!currentProject.tasks) {
        currentProject.tasks = [];
      }
      setProject(currentProject);

      // Fetch users for assignment
      const userRes = await apiClient.get("/api/admin/get-admin-list/");
      if (userRes.data?.list_data) {
        setUsers(userRes.data.list_data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.error || "Failed to load project details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  // Drawer Handlers
  const handleOpenDrawer = (task = null) => {
    setFormError("");
    setSelectedTask(task);
    
    if (task) {
      let formattedDate = "";
      if (task.due_date) {
        const d = new Date(task.due_date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split("T")[0];
        }
      }

      setFormData({
        id: task.id || task._id,
        title: task.title || "",
        description: task.description || "",
        assigned_member: task.assigned_member || "",
        due_date: formattedDate,
        priority: task.priority || "Medium",
        status: task.status || "Todo",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        assigned_member: "",
        due_date: "",
        priority: "Medium",
        status: "Todo",
      });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const validateTaskForm = () => {
    if (!formData.title.trim()) {
      setFormError("Task Title is required.");
      return false;
    }
    if (!formData.assigned_member) {
      setFormError("Assigned Member is required.");
      return false;
    }

    // 1. No Duplicate Task Titles
    const isDuplicate = project.tasks.some(
      (t) =>
        t.title.toLowerCase() === formData.title.toLowerCase() &&
        (selectedTask ? (t.id || t._id) !== (selectedTask.id || selectedTask._id) : true)
    );
    if (isDuplicate) {
      setFormError("This task already exists in the project.");
      return false;
    }

    // 2. No Re-assigning Completed Tasks
    if (selectedTask && selectedTask.status === "Completed" && formData.status === "Completed") {
      if (formData.assigned_member !== selectedTask.assigned_member) {
        setFormError("Completed tasks cannot be reassigned.");
        return false;
      }
    }

    // 3. No Past Deadlines
    if (formData.due_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.due_date);
      if (selectedDate < today) {
        setFormError("Please select a valid deadline (cannot be in the past).");
        return false;
      }
    }

    return true;
  };

  const generateTaskId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const saveProject = async (updatedProject, successMsg) => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.post(
        "/api/smart-project/insert-update-project-list",
        updatedProject
      );

      if (response) {
        showSuccess("Success!", successMsg);
        setProject(updatedProject);
        return true;
      }
    } catch (err) {
      console.error("Error saving project:", err);
      showError(
        "Operation Failed",
        err.response?.data?.error || err.message || "An error occurred while saving."
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateTaskForm()) return;

    showProcessing("Saving Task...", "Please wait.");

    let updatedTasks = [...(project.tasks || [])];

    if (selectedTask) {
      // Update existing
      updatedTasks = updatedTasks.map((t) => {
        if ((t.id || t._id) === (selectedTask.id || selectedTask._id)) {
          return { ...t, ...formData };
        }
        return t;
      });
    } else {
      // Create new
      const newTask = {
        _id: generateTaskId(),
        ...formData,
      };
      updatedTasks.push(newTask);
    }

    const updatedProject = { ...project, tasks: updatedTasks };
    
    const isSaved = await saveProject(updatedProject, selectedTask ? "Task updated!" : "Task created!");
    if (isSaved) {
      handleCloseDrawer();
    }
  };

  const handleDeleteTask = async (taskToDelete) => {
    const result = await showConfirmation(
      "Delete Task?",
      `Are you sure you want to permanently delete "${taskToDelete.title}"?`,
      "Yes, Delete",
      "Cancel"
    );

    if (!result.isConfirmed) return;

    showProcessing("Deleting Task...", "Please wait.");

    const updatedTasks = project.tasks.filter(
      (t) => (t.id || t._id) !== (taskToDelete.id || taskToDelete._id)
    );

    const updatedProject = { ...project, tasks: updatedTasks };
    await saveProject(updatedProject, "Task was successfully removed.");
  };

  const handleStatusChange = async (taskToUpdate, newStatus) => {
    showProcessing("Updating Status...", "Please wait.");

    const updatedTasks = project.tasks.map((t) => {
      if ((t.id || t._id) === (taskToUpdate.id || taskToUpdate._id)) {
        return { ...t, status: newStatus };
      }
      return t;
    });

    const updatedProject = { ...project, tasks: updatedTasks };
    await saveProject(updatedProject, `Task moved to ${newStatus}`);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-text-muted">
          <svg className="animate-spin h-8 w-8 text-primary mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-bold uppercase tracking-wider">Loading Project...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">{error || "Project Not Found"}</h2>
          <Link href="/dashboard/projects" className="text-primary hover:underline text-sm font-bold">
            &larr; Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const filteredTasks = (project.tasks || []).filter((t) => {
    if (priorityFilter === "All") return true;
    return t.priority === priorityFilter;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === "Todo");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "In Progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "Completed");

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Low": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const renderTaskCard = (task) => {
    const isCompleted = task.status === "Completed";
    const user = users.find(u => u.email === task.assigned_member) || { name: task.assigned_member };

    return (
      <div key={task._id || task.id} className={`p-4 rounded-xl border ${isCompleted ? 'bg-background/40 border-card-border/50' : 'bg-background border-card-border shadow-sm'} flex flex-col gap-3 group relative`}>
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            {isCompleted && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-green-500/10 text-green-500 border-green-500/20">
                Done
              </span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button 
              onClick={() => handleOpenDrawer(task)}
              className="p-1.5 text-text-muted hover:text-primary hover:bg-card-bg rounded-md transition-colors"
              title="Edit Task"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button 
              onClick={() => handleDeleteTask(task)}
              className="p-1.5 text-text-muted hover:text-[#f1416c] hover:bg-card-bg rounded-md transition-colors"
              title="Delete Task"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <div>
          <h4 className={`text-sm font-bold text-foreground ${isCompleted ? 'line-through text-text-muted' : ''}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-1 pt-3 border-t border-card-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary uppercase border border-primary/30">
              {user.name?.substring(0, 2) || task.assigned_member?.substring(0, 2) || "?"}
            </div>
            <span className="text-[10px] font-bold text-text-muted">
              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <select
            value={task.status}
            onChange={(e) => handleStatusChange(task, e.target.value)}
            className="text-[10px] font-bold text-foreground bg-card-bg border border-card-border rounded px-2 py-1 appearance-none focus:outline-none focus:border-primary cursor-pointer uppercase tracking-wider"
          >
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard/projects" className="text-text-muted hover:text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-2 transition-colors w-fit">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Projects
          </Link>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide flex items-center gap-3">
            {project.project_name}
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
              {project.status}
            </span>
          </h1>
          {project.description && (
            <p className="text-text-muted mt-2 text-sm max-w-2xl">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-card-bg border border-card-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary appearance-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <button
            onClick={() => handleOpenDrawer()}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full">
          {/* Lane: Todo */}
          <div className="w-80 flex flex-col gap-4 bg-card-bg/50 rounded-2xl p-4 border border-card-border">
            <div className="flex items-center justify-between pb-2 border-b border-card-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Todo
              </h3>
              <span className="text-xs font-bold text-text-muted bg-background px-2 py-0.5 rounded-md border border-card-border">
                {todoTasks.length}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
              {todoTasks.map(renderTaskCard)}
              {todoTasks.length === 0 && (
                <div className="text-center py-8 text-text-muted text-xs font-bold uppercase tracking-wider border-2 border-dashed border-card-border rounded-xl">
                  No Tasks
                </div>
              )}
            </div>
          </div>

          {/* Lane: In Progress */}
          <div className="w-80 flex flex-col gap-4 bg-card-bg/50 rounded-2xl p-4 border border-card-border">
            <div className="flex items-center justify-between pb-2 border-b border-card-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                In Progress
              </h3>
              <span className="text-xs font-bold text-text-muted bg-background px-2 py-0.5 rounded-md border border-card-border">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
              {inProgressTasks.map(renderTaskCard)}
              {inProgressTasks.length === 0 && (
                <div className="text-center py-8 text-text-muted text-xs font-bold uppercase tracking-wider border-2 border-dashed border-card-border rounded-xl">
                  No Tasks
                </div>
              )}
            </div>
          </div>

          {/* Lane: Completed */}
          <div className="w-80 flex flex-col gap-4 bg-card-bg/50 rounded-2xl p-4 border border-card-border">
            <div className="flex items-center justify-between pb-2 border-b border-card-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Completed
              </h3>
              <span className="text-xs font-bold text-text-muted bg-background px-2 py-0.5 rounded-md border border-card-border">
                {completedTasks.length}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
              {completedTasks.map(renderTaskCard)}
              {completedTasks.length === 0 && (
                <div className="text-center py-8 text-text-muted text-xs font-bold uppercase tracking-wider border-2 border-dashed border-card-border rounded-xl">
                  No Tasks
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Drawer */}
      <>
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={handleCloseDrawer}
          />
        )}

        <div
          className={`fixed top-0 right-0 h-full w-full max-w-md bg-card-bg border-l border-card-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            onClick={handleCloseDrawer}
            className={`absolute -left-14 top-6 w-10 h-10 flex items-center justify-center rounded-xl bg-card-bg text-text-muted hover:text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-card-border transition-all duration-300 z-50 ${
              isDrawerOpen ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="p-6 border-b border-card-border">
            <h2 className="text-xl font-bold text-foreground">
              {selectedTask ? "Edit Task" : "Create New Task"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold tracking-wide">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Design Landing Page"
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
                  placeholder="Optional details..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Assigned Member <span className="text-red-500">*</span>
                </label>
                <select
                  name="assigned_member"
                  value={formData.assigned_member}
                  onChange={handleChange}
                  required
                  disabled={selectedTask?.status === "Completed"}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select a user...</option>
                  {users.map(u => (
                    <option key={u.id || u._id} value={u.email}>
                      {u.name ? `${u.name} (${u.email})` : u.email}
                    </option>
                  ))}
                </select>
                {selectedTask?.status === "Completed" && (
                  <p className="text-[10px] text-red-400 mt-1 uppercase tracking-wider">
                    Completed tasks cannot be reassigned. Change status to edit.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
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
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Task Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
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
                form="task-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-primary-hover transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Saving..." : "Save Task"}
              </button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}
