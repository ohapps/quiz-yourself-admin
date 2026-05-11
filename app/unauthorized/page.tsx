import { ShieldX, LogOut } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-10 text-center">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
          Access Denied
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Your account is not authorized to access the Quiz Yourself Admin dashboard.
          Please contact an administrator if you believe this is an error.
        </p>
        <a
          href="/auth/logout"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl font-semibold shadow-md transition-all hover:shadow-lg"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </a>
      </div>
    </div>
  );
}
