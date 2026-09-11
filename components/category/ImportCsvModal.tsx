"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  RotateCcw,
  Check,
  Hash,
  ListFilter
} from "lucide-react";
import { parseQuestionsCsv, getSampleCsvTemplate, CsvParseResult, ParsedQuestionItem } from "@/lib/csv";
import { importQuestionsAction } from "@/lib/actions/questions";
import { AlertModal } from "@/components/ui/AlertModal";
import { DifficultyLevel } from "@/lib/data/types";

interface ImportCsvModalProps {
  categoryId: string;
  categoryName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ImportCsvModal({ categoryId, categoryName, onSuccess, onCancel }: ImportCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"valid" | "errors">("valid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "success" = "info"
  ) => {
    setAlert({ isOpen: true, title, message, type });
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      showAlert("Invalid File Type", "Please upload a valid .csv file.", "warning");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const result = parseQuestionsCsv(content);
        setParseResult(result);
        if (result.validQuestions.length === 0 && result.errors.length > 0) {
          setActiveTab("errors");
        } else {
          setActiveTab("valid");
        }
      }
    };
    reader.onerror = () => {
      showAlert("Error Reading File", "Failed to read the selected file.", "error");
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const template = getSampleCsvTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quiz_questions_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.validQuestions.length === 0) {
      showAlert("No Valid Questions", "There are no valid questions to import.", "warning");
      return;
    }

    setIsImporting(true);
    try {
      const result = await importQuestionsAction(categoryId, parseResult.validQuestions);

      if (result.success) {
        onSuccess();
      } else {
        showAlert("Import Failed", result.error || "Failed to import questions.", "error");
      }
    } catch {
      showAlert("Error", "An unexpected error occurred while importing questions.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const getDifficultyBadge = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.Easy:
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
      case DifficultyLevel.Medium:
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-800";
      case DifficultyLevel.Hard:
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-800";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden w-full max-w-4xl mx-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Import Questions from CSV
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{categoryName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-sm"
              title="Download sample CSV template"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
            <button
              onClick={onCancel}
              disabled={isImporting}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!parseResult ? (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]"
                  : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-16 h-16 mb-4 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                <Upload className="w-8 h-8 animate-bounce-subtle" />
              </div>
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Choose a CSV file or drag & drop here
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                Supports multiple choice (4 options) and numeric questions with automatic header mapping.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition-colors"
              >
                Browse Files
              </button>
            </div>
          ) : (
            /* Parsed File & Status Summary */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {file?.name}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {file ? `${(file.size / 1024).toFixed(1)} KB • ` : ""}
                      {parseResult.totalRows} row{parseResult.totalRows === 1 ? "" : "s"} processed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {parseResult.validQuestions.length} Valid
                    </span>
                    {parseResult.errors.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {parseResult.errors.length} Issue{parseResult.errors.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleReset}
                    disabled={isImporting}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                    title="Choose a different file"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("valid")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === "valid"
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  Valid Questions ({parseResult.validQuestions.length})
                </button>
                {parseResult.errors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("errors")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === "errors"
                        ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Validation Errors ({parseResult.errors.length})
                  </button>
                )}
              </div>

              {/* Tab Content */}
              {activeTab === "valid" ? (
                parseResult.validQuestions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
                    No valid questions found in this CSV. Please check the error tab.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {parseResult.validQuestions.map((q: ParsedQuestionItem, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                              #{idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getDifficultyBadge(
                                q.difficulty
                              )}`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              {q.type === "numeric" ? (
                                <>
                                  <Hash className="w-3 h-3" />
                                  Numeric
                                </>
                              ) : (
                                "Multiple Choice"
                              )}
                            </span>
                            {q.imageUrl && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                                Has Image
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                          {q.question}
                        </p>

                        {q.type === "numeric" ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            <Check className="w-3.5 h-3.5" />
                            Correct Answer: {q.correctAnswer}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = opt === q.correctAnswer;
                              return (
                                <div
                                  key={optIdx}
                                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between border ${
                                    isCorrect
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 font-semibold"
                                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  <span className="truncate">{opt}</span>
                                  {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Errors List */
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {parseResult.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-3"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-semibold text-rose-800 dark:text-rose-300">
                          Row {err.rowNumber}
                          {err.questionSnippet ? `: "${err.questionSnippet}"` : ""}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{err.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parseResult && parseResult.validQuestions.length > 0 && (
              <span>
                Ready to import <strong className="text-slate-700 dark:text-slate-200">{parseResult.validQuestions.length}</strong> question{parseResult.validQuestions.length === 1 ? "" : "s"}.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={isImporting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !parseResult || parseResult.validQuestions.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isImporting
                ? "Importing..."
                : `Import ${
                    parseResult && parseResult.validQuestions.length > 0
                      ? `${parseResult.validQuestions.length} `
                      : ""
                  }Questions`}
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert((prev) => ({ ...prev, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </>
  );
}
