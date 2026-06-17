"use client";

import { useState } from "react";
import { AlertCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { type Question, DifficultyLevel } from "@/lib/data/types";
import { QuestionForm } from "./QuestionForm";
import { deleteQuestion } from "@/lib/actions/questions";
import { AlertModal } from "@/components/ui/AlertModal";

interface QuestionCardProps {
  question: Question;
  index: number;
  readOnly?: boolean;
}

export function QuestionCard({ question: q, index, readOnly = false }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  const showModal = (options: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    showCancel?: boolean;
    onConfirm?: () => void;
  }) => {
    setModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      showCancel: options.showCancel,
      onConfirm: options.onConfirm
    });
  };

  const handleDelete = async () => {
    showModal({
      title: "Delete Question",
      message: "Are you sure you want to permanently delete this question? This action cannot be undone.",
      type: "warning",
      showCancel: true,
      onConfirm: async () => {
        setIsDeleting(true);
        const result = await deleteQuestion(q.id, q.categoryId);
        setIsDeleting(false);

        if (!result.success) {
          showModal({
            title: "Delete Failed",
            message: result.error || "Failed to delete the question. Please try again.",
            type: "error"
          });
        }
      }
    });
  };

  if (isEditing) {
    return (
      <QuestionForm 
        categoryId={q.categoryId}
        initialData={q}
        index={index}
        onSuccess={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2">
                  {q.question}
                </h3>
                {q.imageUrl && (
                  <div className="mb-2 max-w-xs rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={q.imageUrl} alt="Question image" className="max-h-32 object-contain" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                ${q.difficulty === DifficultyLevel.Easy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                ${q.difficulty === DifficultyLevel.Medium ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                ${q.difficulty === DifficultyLevel.Hard ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : ''}
                ${!Object.values(DifficultyLevel).includes(q.difficulty as DifficultyLevel) ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' : ''}
              `}>
                {q.difficulty}
              </span>
              <div className={`${readOnly ? 'hidden' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex items-center gap-1`}>
                <button 
                  onClick={() => setIsEditing(true)}
                  disabled={isDeleting}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
            {q.type === "numeric" ? (
              <div className="px-4 py-3 rounded-xl border bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span className="text-sm font-medium">Answer: {q.correctAnswer}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Numeric</span>
              </div>
            ) : (
              q.options.map((option: string, idx: number) => {
                const isCorrect = option === q.correctAnswer;
                return (
                  <div 
                    key={idx} 
                    className={`px-4 py-3 rounded-xl border ${
                      isCorrect 
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300' 
                        : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    } flex items-center justify-between transition-colors`}
                  >
                    <span className="text-sm font-medium">{option}</span>
                    {isCorrect && (
                      <span className="flex items-center text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Correct
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AlertModal 
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        confirmText={modal.showCancel ? "Delete" : "OK"}
      />
    </>
  );
}
