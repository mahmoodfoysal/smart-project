"use client";

import { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { useSelector } from "react-redux";
import Link from "next/link";
import { showError, showProcessing, showSuccess } from "@/components/pages/Alert";

export default function MyTasksPage() {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/smart-project/get-project-list");
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

  const handleStatusChange = async (taskToUpdate, newStatus, parentProject) => {
    try {
      showProcessing("Updating Task...", "Please wait");
      const updatedTasks = (parentProject.tasks || []).map(t => {
        if ((t.id || t._id) === (taskToUpdate.id || taskToUpdate._id)) {
          return { ...t, status: newStatus };
        }
        return t;
      });

      const updatedProject = { ...parentProject, tasks: updatedTasks };
      await apiClient.post("/api/smart-project/insert-update-project-list", updatedProject);
      showSuccess("Task Updated", `Moved to ${newStatus}`);
      fetchProjects(); // refresh data
    } catch (err) {
      console.error("Error updating status:", err);
      showError("Update Failed", "Could not change task status.");
    }
  };

  // Filter tasks assigned to the current user
  let myTasks = [];
  if (user?.email) {
    projects.forEach(proj => {
      (proj.tasks || []).forEach(t => {
        if (t.assigned_member === user.email) {
          myTasks.push({ ...t, parentProject: proj });
        }
      });
    });
  }

  const todoTasks = myTasks.filter(t => t.status === "Todo");
  const inProgressTasks = myTasks.filter(t => t.status === "In Progress");
  const completedTasks = myTasks.filter(t => t.status === "Completed");

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-sans p-2 md:p-6 overflow-y-auto bg-background/50">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">MY TASKS</h1>
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
            {todoTasks.length === 0 && <p className="text-xs text-text-muted font-semibold text-center mt-4">No pending tasks.</p>}
            {todoTasks.map(t => <TaskCard key={t.id || t._id} task={t} onStatusChange={handleStatusChange} />)}
          </div>
        </div>

        {/* In Progress Lane */}
        <div className="w-[350px] shrink-0 flex flex-col bg-card-bg/40 border border-card-border rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] h-full overflow-hidden">
          <div className="p-4 border-b border-card-border bg-card-bg flex justify-between items-center shrink-0">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> In Progress
            </h3>
            <span className="bg-background border border-card-border text-text-muted text-[10px] px-2 py-0.5 rounded-full font-bold">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inProgressTasks.length === 0 && <p className="text-xs text-text-muted font-semibold text-center mt-4">Nothing in progress.</p>}
            {inProgressTasks.map(t => <TaskCard key={t.id || t._id} task={t} onStatusChange={handleStatusChange} />)}
          </div>
        </div>

        {/* Completed Lane */}
        <div className="w-[350px] shrink-0 flex flex-col bg-card-bg/40 border border-card-border rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] h-full overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
          <div className="p-4 border-b border-card-border bg-card-bg flex justify-between items-center shrink-0">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Completed
            </h3>
            <span className="bg-background border border-card-border text-text-muted text-[10px] px-2 py-0.5 rounded-full font-bold">
              {completedTasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {completedTasks.length === 0 && <p className="text-xs text-text-muted font-semibold text-center mt-4">No completed tasks.</p>}
            {completedTasks.map(t => <TaskCard key={t.id || t._id} task={t} onStatusChange={handleStatusChange} />)}
          </div>
        </div>

      </div>
    </div>
  );
}

// Mini Task Card Component
function TaskCard({ task, onStatusChange }) {
  
  const isCompleted = task.status === "Completed";
  
  // Status Dropdown options
  const STATUSES = ["Todo", "In Progress", "Completed"];

  return (
    <div className={`bg-card-bg border ${isCompleted ? 'border-green-500/30' : 'border-card-border hover:border-primary/50'} rounded-xl p-4 shadow-sm transition-all relative group cursor-default`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-sm font-bold text-foreground leading-snug pr-8 ${isCompleted ? 'line-through text-text-muted' : ''}`}>
          {task.title}
        </h4>
      </div>

      <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-4 flex items-center gap-1">
         <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
         <Link href={`/dashboard/projects/${task.parentProject.project_id || task.parentProject._id}`} className="hover:text-primary transition-colors hover:underline">
            {task.parentProject.project_name}
         </Link>
      </div>
      
      <div className="flex justify-between items-end mt-4 pt-4 border-t border-card-border">
         <div className="flex flex-col gap-1.5">
           {task.priority && (
             <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block w-max ${
                task.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
             }`}>
                {task.priority} Priority
             </span>
           )}
           {task.due_date && (
             <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {new Date(task.due_date).toLocaleDateString()}
             </span>
           )}
         </div>

         {/* Quick Status Change */}
         <select
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value, task.parentProject)}
            className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 appearance-none border cursor-pointer focus:outline-none 
              ${isCompleted ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-background border-card-border text-foreground'}`}
         >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
         </select>
      </div>
    </div>
  );
}
