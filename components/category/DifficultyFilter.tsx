import Link from "next/link";
import { DifficultyLevel } from "@/lib/data/types";

interface DifficultyFilterProps {
  categoryId: string;
  currentDifficulty?: string;
}

export function DifficultyFilter({ categoryId, currentDifficulty }: DifficultyFilterProps) {
  const levels = ["All", ...Object.values(DifficultyLevel)];
  
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      <span className="text-sm font-medium text-slate-500 mr-2">Filter:</span>
      {levels.map((level: string) => {
        const isAll = level === "All";
        const isActive = isAll ? !currentDifficulty : currentDifficulty === level;
        const href = isAll ? `/category/${categoryId}` : `/category/${categoryId}?difficulty=${level}`;
        
        return (
          <Link
            key={level}
            href={href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {level}
          </Link>
        );
      })}
    </div>
  );
}
