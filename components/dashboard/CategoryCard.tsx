"use client";

import { useState } from "react";
import { Folder, Settings, Edit, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CategoryWithCounts } from "@/lib/data/types";
import { CategoryForm } from "./CategoryForm";
import { AlertModal } from "@/components/ui/AlertModal";
import { deleteCategory } from "@/lib/actions/categories";

interface CategoryCardProps {
  category: CategoryWithCounts;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: "" });

  const handleDelete = async () => {
    setIsDeleting(false);
    const result = await deleteCategory(category.id);
    if (!result.success) {
      setErrorModal({ isOpen: true, message: result.error || "Failed to delete category" });
    }
  };

  const hasSubcategories = category.subCategories && category.subCategories.length > 0;

  return (
    <>
      <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 flex flex-col relative">
        <div className="p-6 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Folder className="w-6 h-6" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Name
                    </button>
                    <button 
                      onClick={() => { setIsDeleting(true); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {category.name}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
            {category._count.questions} questions available.
          </p>

          {hasSubcategories && (
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subcategories</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {category.subCategories.map((sub: any) => (
                  <Link 
                    key={sub.id} 
                    href={`/category/${sub.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-medium group/sub"
                  >
                    <span>{sub.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{sub._count.questions}</span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover/sub:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-auto">
          <Link 
            href={`/category/${category.id}`}
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:gap-2 transition-all"
          >
            View Questions <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <CategoryForm 
              initialData={{ id: category.id, name: category.name, parentId: category.parentId }}
              onSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      )}

      <AlertModal 
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${category.name}"? All ${category._count.questions} questions in this category will be permanently removed.`}
        type="warning"
        showCancel={true}
        confirmText="Delete"
      />

      <AlertModal 
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
        title="Error"
        message={errorModal.message}
        type="error"
      />
    </>
  );
}
