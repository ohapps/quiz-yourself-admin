"use client";

import { useState, useRef, useCallback } from "react";
import { Folder, Search, X, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { CategoryForm } from "./CategoryForm";

interface ActionBarProps {
  initialQuery?: string;
  source?: string;
  readOnly?: boolean;
}

export function ActionBar({ initialQuery = "", source = "system", readOnly = false }: ActionBarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = useCallback((value: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      if (source === "user") params.set("source", "user");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    }, 300);
  }, [router, source]);

  const clearSearch = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
    clearTimeout(timerRef.current);
    const params = new URLSearchParams();
    if (source === "user") params.set("source", "user");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, source]);

  const toggleSource = useCallback(() => {
    const newSource = source === "system" ? "user" : "system";
    const params = new URLSearchParams();
    if (newSource === "user") params.set("source", "user");
    if (inputRef.current?.value.trim()) params.set("q", inputRef.current.value.trim());
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, source]);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Folder className="w-6 h-6 text-indigo-500" />
          {source === "user" ? "User-Created Content" : "Content Categories"}
          {readOnly && (
            <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
              Read Only
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              defaultValue={initialQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
            {initialQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={toggleSource}
            className={`px-3 py-2 rounded-xl font-medium border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              source === "user"
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-300"
            }`}
            title={source === "user" ? "Viewing user content — click to show system content" : "Show user-created content"}
          >
            <Users className="w-4 h-4" />
            {source === "user" ? "User" : "System"}
          </button>
          {!readOnly && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
            >
              + New Category
            </button>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <CategoryForm
              onSuccess={() => setIsCreating(false)}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
