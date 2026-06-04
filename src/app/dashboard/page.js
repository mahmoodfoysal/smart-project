"use client";

import { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { getActivities } from "@/utils/activityLogger";
import { useSelector } from "react-redux";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to prevent SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/smart-project/get-project-list");
      if (response && response.data && response.data.list_data) {
        setProjects(response.data.list_data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load dashboard insights.");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Role-Based Filtering
  const isTeamMember = user?.role === "Team Member";

  const filteredProjects = projects
    .filter((proj) => {
      if (isTeamMember) {
        return proj.members && proj.members.includes(user.email);
      }
      return true; // Admin/PM see all projects
    })
    .map((proj) => {
      if (isTeamMember) {
        // Only keep tasks assigned to them
        return {
          ...proj,
          tasks: (proj.tasks || []).filter((t) => t.assigned_member === user.email),
        };
      }
      return proj;
    });

  // --- 1. Data Aggregation for KPIs & Charts ---
  const totalProjects = filteredProjects.length;
  let totalTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;

  // Chart Data Stores
  let priorityCounts = { High: 0, Medium: 0, Low: 0 };
  let statusCounts = { Todo: 0, "In Progress": 0, Completed: 0 };
  let memberProductivity = {}; // { "email": { total: 0, completed: 0 } }
  
  // Supplementary Lists
  const upcomingDeadlines = [];
  const highPriorityTasks = [];
  const activities = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  filteredProjects.forEach((proj) => {
    const tasks = proj.tasks || [];
    totalTasks += tasks.length;
    
    // Project Level Deadlines
    if (proj.dead_line) {
      const projDate = new Date(proj.dead_line);
      const daysDiff = Math.ceil((projDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (daysDiff >= 0 && daysDiff <= 3) {
        upcomingDeadlines.push({ title: proj.project_name, type: "Project", days: daysDiff });
      }
    }

    // Process members
    (proj.members || []).forEach(m => {
       if (!memberProductivity[m]) memberProductivity[m] = { total: 0, completed: 0 };
    });

    tasks.forEach(t => {
      // 1. Status processing
      if (t.status === "Completed") {
        completedTasks++;
        statusCounts.Completed++;
      } else {
        pendingTasks++;
        if (t.status === "Todo") statusCounts.Todo++;
        if (t.status === "In Progress") statusCounts["In Progress"]++;
        
        if (t.due_date && new Date(t.due_date) < today) overdueTasks++;

        // High priority tracking
        if (t.priority === "High") {
          highPriorityTasks.push(t);
        }
      }

      // 2. Priority processing
      if (t.priority === "High") priorityCounts.High++;
      else if (t.priority === "Medium") priorityCounts.Medium++;
      else if (t.priority === "Low") priorityCounts.Low++;

      // 3. Member Productivity
      if (t.assigned_member) {
        if (!memberProductivity[t.assigned_member]) memberProductivity[t.assigned_member] = { total: 0, completed: 0 };
        memberProductivity[t.assigned_member].total++;
        if (t.status === "Completed") memberProductivity[t.assigned_member].completed++;
      }
    });
  });

  // Get real persistent activities
  let allActivities = getActivities();
  if (isTeamMember && user?.email) {
    allActivities = allActivities.filter(a => a.message.toLowerCase().includes(user.email.toLowerCase()));
  }
  const recentActivities = allActivities.slice(0, 5);

  // --- 2. Chart Configurations (ApexCharts) ---

  const commonChartOptions = {
    chart: { 
      toolbar: { show: false }, 
      background: "transparent", 
      fontFamily: "inherit",
      animations: { enabled: false } 
    },
    tooltip: { theme: "dark" },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    grid: { borderColor: "rgba(128,128,128,0.1)", strokeDashArray: 4 },
  };

  // Chart A: Task Status Distribution (Bar)
  const statusOptions = {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: "bar" },
    colors: ["#3b82f6", "#8b5cf6", "#10b981"], // Todo, In Progress, Completed
    plotOptions: { bar: { borderRadius: 6, distributed: true, columnWidth: "50%" } },
    xaxis: { 
      categories: ["Todo", "In Progress", "Completed"],
      labels: { style: { colors: "var(--text-muted)", fontWeight: "bold" } }
    },
    yaxis: { labels: { style: { colors: "var(--text-muted)" } } },
    legend: { show: false }
  };
  const statusSeries = [{ name: "Tasks", data: [statusCounts.Todo, statusCounts["In Progress"], statusCounts.Completed] }];

  // Chart B: Tasks by Priority (Donut)
  const priorityOptions = {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: "donut" },
    labels: ["High", "Medium", "Low"],
    colors: ["#ef4444", "#f59e0b", "#10b981"],
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: true, color: "var(--text-muted)", fontSize: "12px" },
            value: { show: true, color: "var(--foreground)", fontSize: "20px", fontWeight: "bold" },
            total: { show: true, label: "Total Tasks", color: "var(--text-muted)", fontSize: "10px" }
          }
        }
      }
    },
    stroke: { show: true, colors: ["var(--card-bg)"], width: 2 },
    legend: { position: "bottom", labels: { colors: "var(--foreground)" } }
  };
  const prioritySeries = [priorityCounts.High, priorityCounts.Medium, priorityCounts.Low];

  // Chart C: Team Productivity (Horizontal Bar)
  const memberEntries = Object.entries(memberProductivity).sort((a, b) => b[1].total - a[1].total).slice(0, 5); // Top 5
  const productivityOptions = {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: "bar", stacked: true },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "40%" } },
    colors: ["#10b981", "#3b82f6"], // Completed, Pending
    xaxis: { labels: { style: { colors: "var(--text-muted)" } } },
    yaxis: { 
      categories: memberEntries.map(e => e[0].split('@')[0]), // short names
      labels: { style: { colors: "var(--foreground)", fontWeight: "bold" } }
    },
    legend: { position: "top", labels: { colors: "var(--foreground)" } }
  };
  const productivitySeries = [
    { name: "Completed", data: memberEntries.map(e => e[1].completed) },
    { name: "Pending", data: memberEntries.map(e => e[1].total - e[1].completed) }
  ];

  // Chart D: Progress Trend (Area Line - Simulated Trajectory)
  // Generating a smooth curve representing cumulative completion
  const trendOptions = {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: "area" },
    colors: ["#8b5cf6"],
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] }
    },
    xaxis: { 
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      labels: { style: { colors: "var(--text-muted)" } },
      axisBorder: { show: false }, axisTicks: { show: false }
    },
    yaxis: { show: false }
  };
  const trendSeries = [{ name: "Velocity", data: [5, 12, 25, 40, 58, 72, completedTasks || 85] }];


  if (isLoading || !isMounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500 font-bold">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-sans p-2 md:p-6 overflow-y-auto bg-background/50">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            DASHBOARD OVERVIEW
          </h1>
          <p className="text-text-muted mt-1 text-xs font-bold uppercase tracking-wider">
            ANALYTICS & INTELLIGENCE CENTER
          </p>
        </div>
      </div>
      
      {/* KPI Metric Ribbons (Premium Design) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 shrink-0">
        {[
          { label: "Total Projects", val: totalProjects, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Total Tasks", val: totalTasks, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          { label: "Completed Tasks", val: completedTasks, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
          { label: "Pending Tasks", val: pendingTasks, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
          { label: "Overdue Tasks", val: overdueTasks, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: overdueTasks > 0 ? "text-red-500" : "text-text-muted", bg: overdueTasks > 0 ? "bg-red-500/10" : "bg-card-bg", border: overdueTasks > 0 ? "border-red-500/20" : "border-card-border" }
        ].map((kpi, i) => (
          <div key={i} className={`rounded-2xl p-5 border shadow-sm backdrop-blur-md transition-transform hover:-translate-y-1 ${kpi.bg} ${kpi.border}`}>
            <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center bg-card-bg shadow-sm border border-card-border ${kpi.color}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={kpi.icon}></path></svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{kpi.label}</p>
            <p className={`text-3xl font-black ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Charts Area (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Top 2x2 Grid for Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm p-5 flex flex-col">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Task Status Distribution</h3>
              <div className="flex-1 min-h-[220px]">
                <Chart options={statusOptions} series={statusSeries} type="bar" height="100%" width="100%" />
              </div>
            </div>

            <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm p-5 flex flex-col">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Priority Breakdown</h3>
              <div className="flex-1 min-h-[220px] flex items-center justify-center">
                <Chart options={priorityOptions} series={prioritySeries} type="donut" height="100%" width="100%" />
              </div>
            </div>

            <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm p-5 flex flex-col">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Team Productivity Overlay</h3>
              <div className="flex-1 min-h-[220px]">
                <Chart options={productivityOptions} series={productivitySeries} type="bar" height="100%" width="100%" />
              </div>
            </div>

            <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm p-5 flex flex-col">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Project Velocity Trend</h3>
              <div className="flex-1 min-h-[220px]">
                <Chart options={trendOptions} series={trendSeries} type="area" height="100%" width="100%" />
              </div>
            </div>

          </div>

          {/* Member Workload Summary Progress Bars */}
          <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm p-6">
             <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                Member Workload Capacity
             </h3>
             <div className="space-y-5">
                {memberEntries.length === 0 && <p className="text-xs text-text-muted">No member assignments yet.</p>}
                {memberEntries.map(e => {
                  const name = e[0].split('@')[0];
                  const { total, completed } = e[1];
                  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
                  return (
                    <div key={e[0]}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-foreground uppercase">{name}</span>
                        <span className="text-[10px] font-bold text-text-muted">{completed} / {total} tasks ({pct}%)</span>
                      </div>
                      <progress className="progress progress-primary w-full bg-background border border-card-border" value={pct} max="100"></progress>
                    </div>
                  )
                })}
             </div>
          </div>
        </div>

        {/* Secondary Control Panes (1/3 width) */}
        <div className="space-y-6">
          
          {/* High Priority Alerts */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Action Required
            </h3>
            <div className="space-y-3">
              {highPriorityTasks.length === 0 ? (
                <p className="text-[11px] text-text-muted font-semibold">No high priority pending tasks.</p>
              ) : (
                highPriorityTasks.slice(0,4).map((t, i) => (
                  <div key={i} className="bg-card-bg border border-red-500/30 rounded-xl p-3 flex justify-between items-center shadow-sm">
                    <span className="text-xs font-bold text-foreground truncate mr-2">{t.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold uppercase shrink-0">High</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm p-6">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Impending Deadlines
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-[11px] text-text-muted font-semibold">No deadlines within 72 hours.</p>
              ) : (
                upcomingDeadlines.slice(0,4).map((d, i) => (
                  <div key={i} className="bg-background border border-card-border rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground truncate mr-2">{d.title}</span>
                    <span className={`text-[10px] font-black uppercase shrink-0 ${d.days === 0 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                      {d.days === 0 ? 'Today' : `${d.days} Days`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm p-6">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6">Recent Activity</h3>
            {recentActivities.length === 0 ? (
               <p className="text-[11px] text-text-muted font-semibold">No recent activity logged.</p>
            ) : (
              <ul className="timeline timeline-vertical timeline-compact">
                {recentActivities.map((act, index) => {
                  let colorClass = act.type === "completed" ? "text-green-500" : act.type === "assigned" ? "text-blue-500" : "text-primary";
                  let icon = act.type === "completed" ? "M5 13l4 4L19 7" : act.type === "assigned" ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" : "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z";

                  return (
                    <li key={act.id + index}>
                      {index !== 0 && <hr className="bg-card-border" />}
                      <div className="timeline-middle">
                        <div className={`w-6 h-6 rounded-full bg-background border border-card-border flex items-center justify-center ${colorClass}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} /></svg>
                        </div>
                      </div>
                      <div className="timeline-end bg-transparent border-none shadow-none text-xs text-foreground p-2 pl-4">
                         <div className="font-semibold text-[11px] leading-snug">
                           {act.message}
                         </div>
                      </div>
                      {index !== recentActivities.length - 1 && <hr className="bg-card-border" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
