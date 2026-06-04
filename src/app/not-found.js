import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans p-6">
      <div className="max-w-md w-full bg-card-bg border border-card-border rounded-3xl p-10 shadow-2xl flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <svg
            className="w-12 h-12 text-red-500"
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
        </div>
        
        <h1 className="text-4xl font-black mb-3 tracking-tight text-foreground">
          404
        </h1>
        <h2 className="text-xl font-bold mb-4 text-foreground uppercase tracking-wide">
          Page Not Found
        </h2>
        <p className="text-sm text-text-muted mb-8 leading-relaxed">
          Oops! It looks like you've wandered into an unknown route. The page you are looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 w-full uppercase tracking-wider"
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Return to Home
        </Link>
      </div>
    </div>
  );
}
