"use client";

import { useState, useRef, useCallback } from "react";
import { Folder, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CategoryForm } from "./CategoryForm";

interface ActionBarProps {
  initialQuery?: string;
}

export function ActionBar({ initialQuery = "" }: ActionBarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced search: only triggers router.replace from user input, never from effects
  const handleSearchChange = useCallback((value: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed) {
        router.replace(`/?q=${encodeURIComponent(trimmed)}`, { scroll: false });
      } else {
        router.replace("/", { scroll: false });
      }
    }, 300);
  }, [router]);

  const clearSearch = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
    clearTimeout(timerRef.current);
    router.replace("/", { scroll: false });
  }, [router]);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Folder className="w-6 h-6 text-indigo-500" />
          Content Categories
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
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
          >
            + New Category
          </button>
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
