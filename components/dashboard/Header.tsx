import { Database, LogOut, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  user?: {
    name?: string;
    email?: string;
    picture?: string;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <Database className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
            Quiz Yourself Admin
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            Reports
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={user.name || "User"}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border-2 border-indigo-200 dark:border-indigo-700"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
                  {user.name || user.email}
                </span>
              </div>
              <a
                href="/auth/logout"
                className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
