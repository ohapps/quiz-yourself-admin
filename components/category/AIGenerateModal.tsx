"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { generateMultipleQuestions } from "@/lib/actions/ai";
import { AlertModal } from "@/components/ui/AlertModal";
import { DifficultyLevel } from "@/lib/data/types";

interface AIGenerateModalProps {
  categoryId: string;
  categoryName: string;
  initialDifficulty?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AIGenerateModal({ categoryId, categoryName, initialDifficulty, onSuccess, onCancel }: AIGenerateModalProps) {
  const [count, setCount] = useState<number>(5);
  const [prompt, setPrompt] = useState<string>("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'Mixed'>((initialDifficulty as DifficultyLevel) || 'Mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'warning' | 'error' | 'success' }>({
    isOpen: false, title: "", message: "", type: "info"
  });

  const showAlert = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const handleGenerate = async () => {
    if (count < 1 || count > 20) {
      showAlert("Invalid Count", "Please select a number between 1 and 20.", "warning");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMultipleQuestions(categoryId, categoryName, count, prompt, difficulty);
      
      if (result.success) {
        onSuccess();
      } else {
        showAlert("Error", result.error || "Failed to generate questions.", "error");
      }
    } catch (error) {
      showAlert("Error", "An unexpected error occurred.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border-2 border-indigo-400 dark:border-indigo-600 overflow-hidden shadow-lg p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Generate with AI
          </h3>
          <button 
            onClick={onCancel}
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Number of Questions
            </label>
            <input 
              type="number" 
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">Generate up to 20 questions at a time.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | 'Mixed')}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Mixed">Mixed (Let AI Decide)</option>
              {Object.values(DifficultyLevel).map((level: string) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Additional Instructions (Optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Focus on historical facts, or make them funny..."
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-indigo-100 dark:border-indigo-800/30">
            <button 
              onClick={onCancel}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? `Generating...` : `Generate ${count} ${difficulty !== 'Mixed' ? difficulty + ' ' : ''}Questions`}
            </button>
          </div>
        </div>
      </div>

      <AlertModal 
        isOpen={alert.isOpen}
        onClose={() => setAlert(prev => ({ ...prev, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </>
  );
}
