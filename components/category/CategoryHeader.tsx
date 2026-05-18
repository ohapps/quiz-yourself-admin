"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { QuestionForm } from "./QuestionForm";
import { AIGenerateModal } from "./AIGenerateModal";

interface CategoryHeaderProps {
  categoryId: string;
  categoryName: string;
  questionCount: number;
  currentDifficulty?: string;
}

export function CategoryHeader({ categoryId, categoryName, questionCount, currentDifficulty }: CategoryHeaderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              {categoryName}
            </h1>
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-500 dark:text-slate-400">
              {questionCount} Questions
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsGeneratingAI(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-md shadow-purple-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              + Add Question
            </button>
          </div>
        </div>
      </header>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
            <QuestionForm
              categoryId={categoryId}
              onSuccess={() => setIsAdding(false)}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        </div>
      )}

      {isGeneratingAI && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
            <AIGenerateModal
              categoryId={categoryId}
              categoryName={categoryName}
              initialDifficulty={currentDifficulty}
              onSuccess={() => setIsGeneratingAI(false)}
              onCancel={() => setIsGeneratingAI(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
