"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";
import Link from "next/link";
import { validateTaskSchema } from "@/lib/validations/taskSchema";
import {
  showProcessing,
  showError,
  showSuccess,
  showConfirmation,
} from "@/components/pages/Alert";
import { useNotifications } from "@/contexts/NotificationContext";
import { logActivity } from "@/utils/activityLogger";
import { useSelector } from "react-redux";

export default function ProjectTaskBoard() {
  const { user } = useSelector((state) => state.auth);
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id;

  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addNotification } = useNotifications();

  // Drawer & Form State for Tasks
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_member: "",
    due_date: "",
    priority: "Medium",
    status: "Todo",
    comments: [],
    attachments: [],
  });

  const [newComment, setNewComment] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [newAttachmentName, setNewAttachmentName] = useState("");

  // Filter state for Kanban Board
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [memberFilter, setMemberFilter] = useState("All");

  // Add Member State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch projects
      const projRes = await apiClient.get(
        "/api/smart-project/get-project-list",
      );
      const allProjects = projRes.data?.list_data || projRes.data || [];
      const currentProject = allProjects.find(
        (p) => (p._id || p.id) === projectId,
      );

      if (!currentProject) {
        setError("Project not found.");
        setIsLoading(false);
        return;
      }

      // Initialize tasks and members array if it doesn't exist
      if (!currentProject.tasks) {
        currentProject.tasks = [];
      }
      if (!currentProject.members) {
        currentProject.members = [];
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
    setFormErrors({});
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
        comments: task.comments || [],
        attachments: task.attachments || [],
      });
    } else {
      setFormData({
        title: "",
        description: "",
        assigned_member: "",
        due_date: "",
        priority: "Medium",
        status: "Todo",
        comments: [],
        attachments: [],
      });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleBlur = () => {
    setFormErrors(
      validateTaskSchema(formData, project?.tasks || [], selectedTask),
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      setFormErrors(
        validateTaskSchema(updated, project?.tasks || [], selectedTask),
      );
      return updated;
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: user?.email?.split("@")[0] || "User",
      timestamp: new Date().toISOString(),
    };
    setFormData((prev) => ({ ...prev, comments: [...prev.comments, comment] }));
    setNewComment("");
  };

  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim()) return;
    const attachment = {
      id: Date.now().toString(),
      url: newAttachmentUrl.trim(),
      name:
        newAttachmentName.trim() ||
        newAttachmentUrl.trim().split("/").pop() ||
        "Attachment",
      timestamp: new Date().toISOString(),
    };
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, attachment],
    }));
    setNewAttachmentUrl("");
    setNewAttachmentName("");
  };

  const generateTaskId = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  const saveProject = async (updatedProject, successMsg) => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.post(
        "/api/smart-project/insert-update-project-list",
        updatedProject,
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
        err.response?.data?.error ||
          err.message ||
          "An error occurred while saving.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateTaskSchema(
      formData,
      project?.tasks || [],
      selectedTask,
    );
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showError(
        "Validation Error",
        "Please fix the highlighted errors before submitting.",
      );
      return;
    }

    const action = selectedTask ? "Update Task" : "Create Task";
    const result = await showConfirmation(
      action,
      `Are you sure you want to ${action.toLowerCase()}?`,
      "Yes, proceed",
      "Cancel",
    );
    if (!result.isConfirmed) return;

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

    const isSaved = await saveProject(
      updatedProject,
      selectedTask ? "Task updated!" : "Task created!",
    );
    if (isSaved) {
      logActivity(
        selectedTask ? "assigned" : "created",
        `${selectedTask ? "Updated" : "Created"} task "${formData.title}" in ${project?.project_name}`,
      );
      addNotification(
        "Task Saved",
        `"${formData.title}" was successfully saved.`,
      );
      handleCloseDrawer();
    }
  };

  const handleDeleteTask = async (taskToDelete) => {
    const result = await showConfirmation(
      "Delete Task?",
      `Are you sure you want to permanently delete "${taskToDelete.title}"?`,
      "Yes, Delete",
      "Cancel",
    );

    if (!result.isConfirmed) return;

    showProcessing("Deleting Task...", "Please wait.");

    const updatedTasks = project.tasks.filter(
      (t) => (t.id || t._id) !== (taskToDelete.id || taskToDelete._id),
    );

    const updatedProject = { ...project, tasks: updatedTasks };
    const isSaved = await saveProject(
      updatedProject,
      "Task was successfully removed.",
    );
    if (isSaved) {
      logActivity("system", `Deleted task "${taskToDelete.title}"`);
    }
  };

  const handleStatusChange = async (taskToUpdate, newStatus) => {
    const result = await showConfirmation(
      "Change Task Status?",
      `Are you sure you want to change the status of "${taskToUpdate.title}" to ${newStatus}?`,
      "Yes, Change",
      "Cancel",
    );
    if (!result.isConfirmed) return;

    showProcessing("Updating Status...", "Please wait.");

    const updatedTasks = project.tasks.map((t) => {
      if ((t.id || t._id) === (taskToUpdate.id || taskToUpdate._id)) {
        return { ...t, status: newStatus };
      }
      return t;
    });

    const updatedProject = { ...project, tasks: updatedTasks };
    const isSaved = await saveProject(
      updatedProject,
      `Task moved to ${newStatus}`,
    );
    if (isSaved) {
      if (newStatus === "Completed") {
        logActivity("completed", `Completed task "${taskToUpdate.title}"`);
      } else {
        logActivity(
          "system",
          `Moved task "${taskToUpdate.title}" to ${newStatus}`,
        );
      }
    }
  };

  const handleAddMember = async () => {
    if (!selectedNewMember) return;
    if ((project.members || []).includes(selectedNewMember)) {
      showError("Already Added", "This member is already in the project.");
      return;
    }
    const result = await showConfirmation(
      "Add Member?",
      `Are you sure you want to add ${selectedNewMember} to this project?`,
      "Yes, Add",
      "Cancel",
    );
    if (!result.isConfirmed) return;

    const updatedMembers = [...(project.members || []), selectedNewMember];
    const updatedProject = { ...project, members: updatedMembers };
    showProcessing("Adding Member...", "Please wait.");
    const success = await saveProject(
      updatedProject,
      "Member added successfully.",
    );
    if (success) {
      logActivity(
        "assigned",
        `Added ${selectedNewMember} to ${project.project_name}`,
      );
      addNotification(
        "Member Added",
        `${selectedNewMember} joined the project.`,
      );
      setIsAddMemberOpen(false);
      setSelectedNewMember("");
    }
  };

  // Derive form validity to dynamically lock the Submit button
  const isFormValid =
    Object.keys(
      validateTaskSchema(formData, project?.tasks || [], selectedTask),
    ).length === 0;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-text-muted">
          <svg
            className="animate-spin h-8 w-8 text-primary mb-4"
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
          <span className="text-sm font-bold uppercase tracking-wider">
            Loading Project...
          </span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">
            {error || "Project Not Found"}
          </h2>
          <Link
            href="/dashboard/projects"
            className="text-primary hover:underline text-sm font-bold"
          >
            &larr; Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const filteredTasks = (project.tasks || []).filter((t) => {
    if (priorityFilter !== "All" && t.priority !== priorityFilter) return false;
    if (memberFilter !== "All" && t.assigned_member !== memberFilter)
      return false;
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === "Todo");
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === "In Progress",
  );
  const completedTasks = filteredTasks.filter((t) => t.status === "Completed");

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const renderTaskCard = (task) => {
    const isCompleted = task.status === "Completed";
    const user = users.find((u) => u.email === task.assigned_member) || {
      name: task.assigned_member,
    };

    return (
      <div
        key={task._id || task.id}
        className={`p-4 rounded-xl border ${isCompleted ? "bg-background/40 border-card-border/50" : "bg-background border-card-border shadow-sm"} flex flex-col gap-3 group relative`}
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}
            >
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              onClick={() => handleDeleteTask(task)}
              className="p-1.5 text-text-muted hover:text-[#f1416c] hover:bg-card-bg rounded-md transition-colors"
              title="Delete Task"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <h4
            className={`text-sm font-bold text-foreground ${isCompleted ? "line-through text-text-muted" : ""}`}
          >
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
              {user.name?.substring(0, 2) ||
                task.assigned_member?.substring(0, 2) ||
                "?"}
            </div>
            <span className="text-[10px] font-bold text-text-muted">
              {new Date(task.due_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
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
          <Link
            href="/dashboard/projects"
            className="text-text-muted hover:text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-2 transition-colors w-fit"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
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
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="bg-card-bg border border-card-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary appearance-none"
          >
            <option value="All">All Members</option>
            {(project.members || []).map((email) => {
              const u = users.find((user) => user.email === email) || {
                name: email,
              };
              return (
                <option key={email} value={email}>
                  {u.name || email}
                </option>
              );
            })}
          </select>

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
            Add Task
          </button>
        </div>
      </div>

      {/* Team Collaboration Workload Summary */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            Team Workload
          </h2>
          <div>
            {isAddMemberOpen ? (
              <div className="flex gap-2 items-center">
                <select
                  value={selectedNewMember}
                  onChange={(e) => setSelectedNewMember(e.target.value)}
                  className="bg-background border border-card-border text-xs font-bold text-foreground rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select User...
                  </option>
                  {users
                    .filter((u) => !(project.members || []).includes(u.email))
                    .map((u) => (
                      <option key={u.id || u._id} value={u.email}>
                        {u.name || u.email}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddMember}
                  className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-primary-hover"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddMemberOpen(false)}
                  className="bg-card-bg text-text-muted px-3 py-1.5 rounded-lg text-xs font-bold border border-card-border hover:bg-background"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="text-primary hover:text-primary-hover text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Add Member
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(project.members || []).length === 0 && (
            <div className="col-span-full p-6 border-2 border-dashed border-card-border rounded-xl text-center">
              <p className="text-xs font-bold uppercase text-text-muted tracking-wider">
                No team members assigned yet.
              </p>
            </div>
          )}
          {(project.members || []).map((memberEmail) => {
            const user = users.find((u) => u.email === memberEmail) || {
              name: memberEmail,
              email: memberEmail,
            };
            const memberTasks = (project.tasks || []).filter(
              (t) => t.assigned_member === memberEmail,
            );
            const completed = memberTasks.filter(
              (t) => t.status === "Completed",
            ).length;
            const total = memberTasks.length;
            const pending = total - completed;

            return (
              <div
                key={memberEmail}
                className="bg-card-bg border border-card-border shadow-sm rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="avatar placeholder">
                  <div className="bg-background text-foreground rounded-full w-12 border-2 border-primary shadow-sm flex items-center justify-center">
                    <span className="text-sm font-black uppercase">
                      {(user.name || user.email).substring(0, 2)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {user.name}
                  </h3>
                  <p className="text-[10px] text-text-muted truncate mb-2">
                    {user.email}
                  </p>
                  <div className="flex gap-1.5">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-background border border-card-border text-foreground"
                      title="Total Tasks"
                    >
                      T: {total}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20"
                      title="Completed Tasks"
                    >
                      D: {completed}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      title="Pending Tasks"
                    >
                      P: {pending}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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

          <div className="p-6 border-b border-card-border">
            <h2 className="text-xl font-bold text-foreground">
              {selectedTask ? "Edit Task" : "Create New Task"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
              {Object.keys(formErrors).length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold tracking-wide">
                  Please fix the highlighted errors.
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
                  onBlur={handleBlur}
                  required
                  className={`w-full bg-background border ${formErrors.title ? "border-red-500 focus:border-red-500" : "border-card-border focus:border-primary"} rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none transition-colors`}
                  placeholder="e.g. Design Landing Page"
                />
                {formErrors.title && (
                  <label className="label pb-0">
                    <span className="label-text-alt text-red-500 font-bold">
                      {formErrors.title}
                    </span>
                  </label>
                )}
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
                  onBlur={handleBlur}
                  required
                  disabled={selectedTask?.status === "Completed"}
                  className={`w-full bg-background border ${formErrors.assigned_member ? "border-red-500 focus:border-red-500" : "border-card-border focus:border-primary"} rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="" disabled>
                    Select a user...
                  </option>
                  {(project?.members || []).map((email, idx) => (
                    <option key={idx} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
                {formErrors.assigned_member && (
                  <label className="label pb-0">
                    <span className="label-text-alt text-red-500 font-bold">
                      {formErrors.assigned_member}
                    </span>
                  </label>
                )}
                {selectedTask?.status === "Completed" &&
                  !formErrors.assigned_member && (
                    <p className="text-[10px] text-red-400 mt-1 uppercase tracking-wider">
                      Completed tasks cannot be reassigned. Change status to
                      edit.
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
                    onBlur={handleBlur}
                    min={new Date().toISOString().split("T")[0]}
                    onClick={(e) => {
                      try {
                        e.target.showPicker();
                      } catch (err) {
                        // ignore
                      }
                    }}
                    className={`w-full bg-background border ${formErrors.due_date ? "border-red-500 focus:border-red-500" : "border-card-border focus:border-primary"} rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none transition-colors`}
                  />
                  {formErrors.due_date && (
                    <label className="label pb-0">
                      <span className="label-text-alt text-red-500 font-bold">
                        {formErrors.due_date}
                      </span>
                    </label>
                  )}
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

            {/* Comments and Attachments Sections */}
            <div className="mt-8 space-y-8 border-t border-card-border pt-6">
              {/* Attachments Section */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  Attachments
                </h3>

                {formData.attachments.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between bg-background border border-card-border p-3 rounded-xl hover:border-primary/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
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
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          </div>
                          <div className="truncate text-sm font-semibold text-foreground">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary hover:underline transition-colors"
                            >
                              {att.name}
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              attachments: prev.attachments.filter(
                                (a) => a.id !== att.id,
                              ),
                            }))
                          }
                          className="text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
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
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      placeholder="File Name (optional)"
                      className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <input
                      type="url"
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      placeholder="Paste File URL (e.g. Google Drive link)"
                      className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    disabled={!newAttachmentUrl.trim()}
                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-xl px-4 text-xs font-bold transition-all disabled:opacity-50 shrink-0 self-end h-[34px]"
                  >
                    Add Link
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Activity & Comments
                </h3>

                {formData.comments.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    {formData.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-background border border-card-border p-3 rounded-xl group relative"
                      >
                        <div className="flex justify-between items-center mb-1 pr-6">
                          <span className="text-xs font-bold text-foreground">
                            {comment.author}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap pr-6">
                          {comment.text}
                        </p>
                        <button
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              comments: prev.comments.filter((c) => c.id !== comment.id),
                            }))
                          }
                          className="absolute top-3 right-3 text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
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
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic mb-4">
                    No comments yet. Start the conversation!
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="self-end bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-xl px-4 py-1.5 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
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
                disabled={!isFormValid || isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
