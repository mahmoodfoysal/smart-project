"use client";

import { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  showError,
  showProcessing,
  showSuccess,
  showConfirmation,
} from "@/components/pages/Alert";
import MemberRoute from "@/routes/MemberRoute";

export default function MyTasksPage() {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(
        "/api/smart-project/get-project-list",
      );
      if (response && response.data && response.data.list_data) {
        setProjects(response.data.list_data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load your tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchProjects();
    }, 0);
  }, [user]);

  const handleStatusChange = async (taskToUpdate, newStatus, parentProject) => {
    const result = await showConfirmation(
      "Change Task Status?",
      `Are you sure you want to change the status to ${newStatus}?`,
      "Yes, Change",
      "Cancel",
    );
    if (!result.isConfirmed) return;

    try {
      showProcessing("Updating Task...", "Please wait");
      const updatedTasks = (parentProject.tasks || []).map((t) => {
        if ((t.id || t._id) === (taskToUpdate.id || taskToUpdate._id)) {
          return { ...t, status: newStatus };
        }
        return t;
      });

      const updatedProject = { ...parentProject, tasks: updatedTasks };
      await apiClient.post(
        "/api/smart-project/insert-update-project-list",
        updatedProject,
      );
      showSuccess("Task Updated", `Moved to ${newStatus}`);
      fetchProjects(); // refresh data
    } catch (err) {
      console.error("Error updating status:", err);
      showError("Update Failed", "Could not change task status.");
    }
  };

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

  // Filter tasks assigned to the current user
  let myTasks = [];
  if (user?.email) {
    projects.forEach((proj) => {
      (proj.tasks || []).forEach((t) => {
        if (t.assigned_member === user.email) {
          myTasks.push({ ...t, parentProject: proj });
        }
      });
    });
  }

  const todoTasks = myTasks.filter((t) => t.status === "Todo");
  const inProgressTasks = myTasks.filter((t) => t.status === "In Progress");
  const completedTasks = myTasks.filter((t) => t.status === "Completed");

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <MemberRoute>
      <div className="h-full flex flex-col font-sans p-2 md:p-6 overflow-y-auto bg-background/50">
        <div className="flex justify-between items-end mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              MY TASKS
            </h1>
            <p className="text-text-muted mt-1 text-xs font-bold uppercase tracking-wider">
              YOUR ASSIGNED WORKLOAD ACROSS ALL PROJECTS
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
            {myTasks.length} Total Assigned
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Simplified Personal Kanban */}
        <div className="flex gap-6 overflow-x-auto pb-4 h-full">
          {/* Todo Lane */}
          <div className="w-[350px] shrink-0 flex flex-col bg-card-bg/40 border border-card-border rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] h-full overflow-hidden">
            <div className="p-4 border-b border-card-border bg-card-bg flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Todo
              </h3>
              <span className="bg-background border border-card-border text-text-muted text-[10px] px-2 py-0.5 rounded-full font-bold">
                {todoTasks.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {todoTasks.length === 0 && (
                <p className="text-xs text-text-muted font-semibold text-center mt-4">
                  No pending tasks.
                </p>
              )}
              {todoTasks.map((t) => (
                <TaskCard
                  key={t.id || t._id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onProjectClick={handleOpenDetails}
                />
              ))}
            </div>
          </div>

          {/* In Progress Lane */}
          <div className="w-[350px] shrink-0 flex flex-col bg-card-bg/40 border border-card-border rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] h-full overflow-hidden">
            <div className="p-4 border-b border-card-border bg-card-bg flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> In
                Progress
              </h3>
              <span className="bg-background border border-card-border text-text-muted text-[10px] px-2 py-0.5 rounded-full font-bold">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {inProgressTasks.length === 0 && (
                <p className="text-xs text-text-muted font-semibold text-center mt-4">
                  Nothing in progress.
                </p>
              )}
              {inProgressTasks.map((t) => (
                <TaskCard
                  key={t.id || t._id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onProjectClick={handleOpenDetails}
                />
              ))}
            </div>
          </div>

          {/* Completed Lane */}
          <div className="w-[350px] shrink-0 flex flex-col bg-card-bg/40 border border-card-border rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] h-full overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
            <div className="p-4 border-b border-card-border bg-card-bg flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>{" "}
                Completed
              </h3>
              <span className="bg-background border border-card-border text-text-muted text-[10px] px-2 py-0.5 rounded-full font-bold">
                {completedTasks.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {completedTasks.length === 0 && (
                <p className="text-xs text-text-muted font-semibold text-center mt-4">
                  No completed tasks.
                </p>
              )}
              {completedTasks.map((t) => (
                <TaskCard
                  key={t.id || t._id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onProjectClick={handleOpenDetails}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Embedded Details Modal */}
        {isDetailsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={handleCloseDetails}
            />

            <div className="bg-card-bg border border-card-border rounded-2xl shadow-2xl z-10 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
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
                        {projectDetails.description ||
                          "No description provided."}
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
                      {projectDetails.tasks &&
                      projectDetails.tasks.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {projectDetails.tasks.map((task, idx) => (
                            <div
                              key={idx}
                              className="bg-background border border-card-border p-3 rounded-xl flex flex-col gap-3 hover:border-primary/50 transition-colors"
                            >
                              <div className="flex justify-between items-start gap-4">
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

                              {/* Details: Comments & Attachments */}
                              {(task.comments?.length > 0 ||
                                task.attachments?.length > 0) && (
                                <div className="mt-1 pt-2 border-t border-card-border grid grid-cols-1 gap-2">
                                  {task.comments?.length > 0 && (
                                    <div>
                                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                        Comments ({task.comments.length})
                                      </p>
                                      <div className="space-y-1">
                                        {task.comments.map((c) => (
                                          <div
                                            key={c.id}
                                            className="bg-card-bg p-2 rounded-lg text-[10px]"
                                          >
                                            <span className="font-bold text-primary mr-1">
                                              {c.author}:
                                            </span>
                                            <span className="text-foreground">
                                              {c.text}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {task.attachments?.length > 0 && (
                                    <div
                                      className={
                                        task.comments?.length > 0 ? "mt-2" : ""
                                      }
                                    >
                                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                        Attachments ({task.attachments.length})
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {task.attachments.map((a) => (
                                          <a
                                            key={a.id}
                                            href={a.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 bg-card-bg border border-card-border hover:border-primary/50 text-[10px] font-bold text-foreground px-2 py-1 rounded-lg transition-colors"
                                          >
                                            <svg
                                              className="w-3 h-3 text-primary"
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
                                            {a.name}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
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

              <div className="p-4 border-t border-card-border bg-card-bg/50 flex justify-between items-center">
                <Link
                  href={`/dashboard/projects/${projectDetails?._id || projectDetails?.id || projectDetails?.project_id}`}
                  className="px-5 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary hover:text-white transition-colors"
                >
                  Open Kanban Board
                </Link>
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
      </div>
    </MemberRoute>
  );
}

// Mini Task Card Component
function TaskCard({ task, onStatusChange, onProjectClick }) {
  const isCompleted = task.status === "Completed";

  // Status Dropdown options
  const STATUSES = ["Todo", "In Progress", "Completed"];

  return (
    <div
      className={`bg-card-bg border ${isCompleted ? "border-green-500/30" : "border-card-border hover:border-primary/50"} rounded-xl p-4 shadow-sm transition-all relative group cursor-default`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4
          className={`text-sm font-bold text-foreground leading-snug pr-8 ${isCompleted ? "line-through text-text-muted" : ""}`}
        >
          {task.title}
        </h4>
      </div>

      <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-4 flex items-center gap-1">
        <svg
          className="w-3 h-3 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <button
          onClick={() => onProjectClick(task.parentProject)}
          className="hover:text-primary transition-colors hover:underline text-left"
        >
          {task.parentProject.project_name}
        </button>
      </div>

      <div className="flex justify-between items-end mt-4 pt-4 border-t border-card-border">
        <div className="flex flex-col gap-1.5">
          {task.priority && (
            <span
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block w-max ${
                task.priority === "High"
                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                  : task.priority === "Medium"
                    ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
              }`}
            >
              {task.priority} Priority
            </span>
          )}
          {task.due_date && (
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {new Date(task.due_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Quick Status Change */}
        <select
          value={task.status}
          onChange={(e) =>
            onStatusChange(task, e.target.value, task.parentProject)
          }
          className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 appearance-none border cursor-pointer focus:outline-none 
              ${isCompleted ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-background border-card-border text-foreground"}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-background text-foreground">
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
