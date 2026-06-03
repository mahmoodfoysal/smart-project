import Link from "next/link";
import React from "react";

const Forbidden = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in font-sans">
      <div className="max-w-md w-full bg-card-bg border border-red-500/20 rounded-3xl p-10 shadow-[0_0_50px_rgba(239,68,68,0.1)] backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-black text-foreground uppercase tracking-widest mb-2">
            403
          </h1>
          <h2 className="text-xl font-bold text-red-400 uppercase tracking-widest mb-4">
            Access Denied
          </h2>

          <p className="text-sm font-bold text-text-muted mb-8 tracking-wide leading-relaxed">
            You do not have the necessary administrator privileges to view this
            page. If you believe this is an error, please contact your system
            administrator.
          </p>

          <Link
            href="/dashboard"
            className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 px-6 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-widest group"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
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
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
