"use client";

import ProtectedRoute from "@/routes/ProtectedRoute";
import Link from "next/link";
import { auth } from "@/firebase/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);
  const [isDark, setIsDark] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Check initial theme from localStorage or system preference
    const storedTheme = localStorage.getItem("theme");
    if (
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
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

  const menuItems = [
    {
      name: "OVERVIEW",
      path: "/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      name: "MANAGE USER",
      path: "/dashboard/admin",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      name: "Project Management",
      path: "/dashboard/projects",
      icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      name: "MANAGE BLOGS",
      path: "/dashboard/blogs",
      icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
    },
    {
      name: "MANAGE GUIDES",
      path: "/dashboard/guides",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      name: "MANAGE COUPONS",
      path: "/dashboard/coupons",
      icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
    },
    {
      name: "MANAGE REVIEWS",
      path: "/dashboard/reviews",
      icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    },
    {
      name: "MANAGE GALARY",
      path: "/dashboard/gallery",
      icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "MANAGE BOOKINGS",
      path: "/dashboard/bookings",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
  ];

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
            <Link
              href="/"
              title={isSidebarCollapsed ? "Back to Home" : undefined}
              className={`flex items-center gap-4 py-3 text-[13px] font-bold text-text-muted hover:text-foreground transition-colors rounded-xl hover:bg-background 
                ${isSidebarCollapsed ? "md:justify-center md:px-0 px-4" : "px-4"}`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
              <span className={`${isSidebarCollapsed ? "md:hidden" : ""}`}>
                BACK TO HOME
              </span>
            </Link>
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
          <header className="h-[80px] border-b border-card-border bg-card-bg flex items-center justify-between md:justify-end px-4 md:px-8 gap-4 md:gap-6 z-10 transition-colors duration-300">
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
                      {user?.displayName || "Foysal Mahmood"}
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
                          {user?.displayName || "Foysal Mahmood"}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {user?.email || "foysalset959@gmail.com"}
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
                        <Link
                          href="/dashboard/settings"
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
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            ></path>
                          </svg>
                          Account Settings
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
