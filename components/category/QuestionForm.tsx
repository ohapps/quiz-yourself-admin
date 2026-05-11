"use client";

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { type Question, DifficultyLevel } from "@/lib/data/types";
import { createQuestion, updateQuestion } from "@/lib/actions/questions";
import { AlertModal } from "@/components/ui/AlertModal";

interface QuestionFormProps {
  categoryId: string;
  initialData?: Question;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  index?: number;
}

export function QuestionForm({ categoryId, initialData, onSuccess, onCancel, title, index }: QuestionFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const [questionText, setQuestionText] = useState(initialData?.question || "");
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || DifficultyLevel.Easy);
  // Ensure we have exactly 4 options
  const [options, setOptions] = useState<string[]>(() => {
    if (initialData) return [...initialData.options, "", "", "", ""].slice(0, 4);
    return ["", "", "", ""];
  });
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(() => {
    if (!initialData) return 0;
    const idx = initialData.options.indexOf(initialData.correctAnswer);
    return idx >= 0 ? idx : 0;
  });

  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  const showAlert = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!questionText.trim() || options.some(opt => !opt.trim())) {
      showAlert("Incomplete Form", "Please fill out the question and all 4 options.", "warning");
      return;
    }

    setIsSaving(true);
    const payload = {
      question: questionText,
      difficulty,
      options,
      correctAnswer: options[correctAnswerIndex],
      categoryId
    };

    const result = initialData 
      ? await updateQuestion(initialData.id, payload)
      : await createQuestion(payload);
    
    setIsSaving(false);
    if (result.success) {
      onSuccess();
    } else {
      showAlert("Error", result.error || "Failed to save question", "error");
    }
  };

  return (
    <>
      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border-2 border-indigo-400 dark:border-indigo-600 overflow-hidden shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">
            {title || (initialData ? `Editing Question #${(index || 0) + 1}` : "Create New Question")}
          </h3>
          <button 
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Text</label>
            <input 
              type="text" 
              autoFocus={!initialData}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. What is the capital of France?"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.values(DifficultyLevel).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Options (Select the correct one)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((opt, idx) => (
                <div key={idx} className={`flex items-center gap-2 p-2 rounded-xl border ${correctAnswerIndex === idx ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                  <input 
                    type="radio" 
                    name={`correct-${initialData?.id || 'new'}`} 
                    checked={correctAnswerIndex === idx}
                    onChange={() => setCorrectAnswerIndex(idx)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 ml-2"
                  />
                  <input 
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-2 py-1 bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-indigo-100 dark:border-indigo-800/30">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSaving ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Question')}
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
