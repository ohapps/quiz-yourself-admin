"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Edit, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { QuestionForm } from "@/components/category/QuestionForm";
import type { Question, Category } from "@/lib/data/types";

interface ReportCardProps {
  report: {
    id: string;
    questionId: string;
    description: string;
    createdAt: Date;
    resolved: boolean;
  };
  question: (Question & { category: Category | null }) | null;
}

export function ReportCard({ report, question }: ReportCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleResolve = async () => {
    await fetch(`/api/reports/${report.id}`, { method: "PATCH" });
    router.refresh();
  };

  const handleEditSuccess = async () => {
    setIsEditing(false);
    // Auto-resolve after editing
    await handleResolve();
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-900 rounded-xl border p-5 ${
          report.resolved
            ? "border-slate-100 dark:border-slate-800 opacity-60"
            : "border-rose-200 dark:border-rose-800"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {report.resolved ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span className="text-xs font-medium text-slate-400">
                {new Date(report.createdAt).toLocaleDateString()} · {question?.category?.name ?? "Unknown Category"}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
              Q: {question?.question ?? "Deleted question"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              &ldquo;{report.description}&rdquo;
            </p>
          </div>
          {!report.resolved && (
            <div className="flex items-center gap-2 shrink-0">
              {question && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Edit & Resolve
                </button>
              )}
              <button
                onClick={handleResolve}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                Resolve
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing && question && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
            <QuestionForm
              categoryId={question.categoryId}
              initialData={question}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditing(false)}
              title="Fix Reported Question"
            />
          </div>
        </div>
      )}
    </>
  );
}
