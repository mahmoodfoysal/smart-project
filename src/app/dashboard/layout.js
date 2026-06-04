"use client";

import ProtectedRoute from "@/routes/ProtectedRoute";
import Link from "next/link";
import { auth } from "@/firebase/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { useNotifications } from "@/contexts/NotificationContext";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);
  const [isDark, setIsDark] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    // Check initial theme from localStorage or system preference
    const storedTheme = localStorage.getItem("theme");
    if (
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setTimeout(() => {
        setIsDark(true);
      }, 0);
      document.documentElement.classList.add("dark");
    } else {
      setTimeout(() => {
        setIsDark(false);
      }, 0);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setTimeout(() => {
      setIsMobileSidebarOpen(false);
    }, 0);
  }, [pathname]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const isTeamMember = user?.role === "Team Member";

  const menuItems = [
    {
      name: "Overview",
      path: "/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
      show: true,
    },
    {
      name: "Manage Users",
      path: "/dashboard/admin",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      show: !isTeamMember,
    },
    {
      name: "Project Management",
      path: "/dashboard/projects",
      icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
      show: !isTeamMember,
    },
    {
      name: "My Tasks",
      path: "/dashboard/tasks",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      show: true,
    },
  ].filter((item) => item.show);

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden transition-colors duration-300">
        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 md:relative transform transition-all duration-300 ease-in-out flex-shrink-0 bg-card-bg border-r border-card-border flex flex-col 
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
          ${isSidebarCollapsed ? "md:w-[88px] w-[280px]" : "w-[280px]"}`}
        >
          {/* Logo Area & Toggle */}
          <div
            className={`p-6 flex items-center ${isSidebarCollapsed ? "md:justify-center justify-between" : "justify-between"}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg leading-none">
                  S
                </span>
              </div>
              {/* Only hide text on md and collapsed */}
              <h2
                className={`font-bold text-xl tracking-wide uppercase truncate ${isSidebarCollapsed ? "md:hidden" : ""}`}
              >
                SMART PROJECT
              </h2>
            </div>

            {/* Close button for mobile inside sidebar */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-text-muted hover:text-foreground"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          {/* Collapse Toggle Button (Floating - Desktop Only) */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-primary rounded-full items-center justify-center cursor-pointer text-white shadow-lg hover:bg-primary-hover transition-colors z-30"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={`flex items-center gap-4 py-3.5 rounded-xl transition-all duration-200 text-[13px] font-bold tracking-wide 
                    ${isSidebarCollapsed ? "md:justify-center md:px-0 px-4" : "px-4"} 
                    ${
                      isActive
                        ? "bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                        : "text-text-muted hover:text-foreground hover:bg-background"
                    }`}
                >
                  <svg
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-text-muted"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={item.icon}
                    ></path>
                  </svg>
                  <span
                    className={`truncate ${isSidebarCollapsed ? "md:hidden" : ""}`}
                  >
                    {item.name}
                  </span>
                  {item.name === "MANAGE BOOKINGS" && (
                    <svg
                      className={`w-4 h-4 ml-auto text-text-muted opacity-50 flex-shrink-0 ${isSidebarCollapsed ? "md:hidden" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-1 border-t border-card-border pt-4 mt-auto">
            <button
              onClick={handleLogout}
              title={isSidebarCollapsed ? "Logout System" : undefined}
              className={`flex items-center gap-4 w-full py-3 text-[#f1416c] text-[13px] font-bold hover:bg-[#f1416c]/10 rounded-xl transition-colors uppercase 
                ${isSidebarCollapsed ? "md:justify-center md:px-0 px-4" : "px-4"}`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0 text-[#f1416c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                ></path>
              </svg>
              <span className={`${isSidebarCollapsed ? "md:hidden" : ""}`}>
                LOGOUT SYSTEM
              </span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background relative transition-colors duration-300">
          {/* Top Navbar */}
          <header className="h-[80px] border-b border-card-border bg-card-bg flex items-center justify-between md:justify-end px-4 md:px-8 gap-4 md:gap-6 relative z-50 transition-colors duration-300">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-foreground hover:bg-background rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>

            <div className="flex items-center gap-4 md:gap-6">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card-bg"></span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotifOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-80 bg-card-bg border border-card-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b border-card-border bg-background/50 flex justify-between items-center">
                        <p className="font-bold text-foreground text-sm">
                          Notifications
                        </p>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-text-muted text-xs">
                            No notifications yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-card-border">
                            {notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className={`p-4 cursor-pointer hover:bg-background transition-colors flex gap-3 ${!n.read ? "bg-primary/5" : ""}`}
                              >
                                <div
                                  className={`shrink-0 w-2 h-2 mt-1.5 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`}
                                ></div>
                                <div>
                                  <p
                                    className={`text-sm ${!n.read ? "font-bold text-foreground" : "text-foreground/80"}`}
                                  >
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                                    {n.message}
                                  </p>
                                  <p className="text-[10px] text-text-muted mt-2">
                                    {new Date(n.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    ></path>
                  </svg>
                )}
              </button>

              {/* User Avatar & Info with Dropdown */}
              <div className="relative">
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 md:gap-3 bg-background p-1.5 pr-2 md:pr-4 rounded-xl border border-card-border hover:border-primary/50 transition-colors cursor-pointer select-none"
                >
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-md bg-primary/20 overflow-hidden flex-shrink-0 flex items-center justify-center text-primary font-bold">
                    {user ? (
                      <img
                        src={user.photoUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : user?.displayName ? (
                      user.displayName.charAt(0).toUpperCase()
                    ) : (
                      "U"
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col justify-center">
                    <p className="text-foreground font-bold text-[13px] leading-tight truncate max-w-[120px]">
                      {user?.displayName}
                    </p>
                    <p className="text-[10px] text-text-muted truncate max-w-[120px]">
                      {user?.email || "foysalset959@gmail.com"}
                    </p>
                  </div>
                  <svg
                    className={`hidden sm:block w-4 h-4 text-text-muted transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-card-bg border border-card-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b border-card-border bg-background/50">
                        <p className="font-bold text-foreground text-sm truncate">
                          {user?.displayName}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {user?.email}
                        </p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-background rounded-lg transition-colors"
                        >
                          <svg
                            className="w-4 h-4 text-text-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                          </svg>
                          My Profile
                        </Link>
                      </div>
                      <div className="p-2 border-t border-card-border">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            ></path>
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
