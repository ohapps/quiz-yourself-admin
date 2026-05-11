import { BookOpen } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No questions yet</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">
        This category doesn&apos;t have any questions configured. Click the &quot;Add Question&quot; button to get started.
      </p>
    </div>
  );
}
