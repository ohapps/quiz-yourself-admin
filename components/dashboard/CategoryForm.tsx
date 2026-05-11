"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2, ChevronDown } from "lucide-react";
import { createCategory, updateCategory, getCategoriesAction } from "@/lib/actions/categories";
import { AlertModal } from "@/components/ui/AlertModal";

interface CategoryFormProps {
  initialData?: { id: string; name: string; parentId?: string | null };
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
}

export function CategoryForm({ initialData, onSuccess, onCancel, title }: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [parentId, setParentId] = useState<string | null>(initialData?.parentId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  
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

  useEffect(() => {
    async function loadCategories() {
      const result = await getCategoriesAction();
      if (result.success && result.data) {
        // Filter out the current category to prevent self-referencing
        const filtered = initialData 
          ? result.data.filter((cat: { id: string; name: string }) => cat.id !== initialData.id)
          : result.data;
        setAvailableCategories(filtered);
      }
      setIsLoadingCats(false);
    }
    loadCategories();
  }, [initialData]);

  const showAlert = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert("Empty Name", "Category name cannot be empty.", "warning");
      return;
    }
    
    setIsSaving(true);
    const result = initialData 
      ? await updateCategory(initialData.id, { name, parentId })
      : await createCategory({ name, parentId });
    setIsSaving(false);
    
    if (result.success) {
      onSuccess();
    } else {
      showAlert("Error", result.error || "Failed to save category", "error");
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title || (initialData ? "Edit Category" : "Create New Category")}</h3>
          <button 
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category Name</label>
              <input 
                type="text" 
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                placeholder="e.g. Science & Nature"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Parent Category (Optional)</label>
              <div className="relative">
                <select
                  value={parentId || ""}
                  onChange={(e) => setParentId(e.target.value || null)}
                  disabled={isLoadingCats}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:opacity-50"
                >
                  <option value="">None (Top Level)</option>
                  {availableCategories.map((cat: { id: string; name: string }) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Selecting a parent will make this a subcategory.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || !name.trim() || isLoadingCats}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSaving ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Category')}
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
