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
  readOnly?: boolean;
}

type PendingDelete = {
  id: string;
  name: string;
  questionCount: number;
  isSubcategory: boolean;
};

export function CategoryCard({ category, readOnly = false }: CategoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    parentId: string | null;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const result = await deleteCategory(target.id);
    if (!result.success) {
      setErrorModal({
        isOpen: true,
        message: result.error || "Failed to delete category",
      });
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
              {!readOnly && (
                <>
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
                          onClick={() => {
                            setEditingCategory({
                              id: category.id,
                              name: category.name,
                              parentId: category.parentId,
                            });
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Name
                        </button>
                        <button
                          onClick={() => {
                            setPendingDelete({
                              id: category.id,
                              name: category.name,
                              questionCount: category._count.questions,
                              isSubcategory: false,
                            });
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </>
                  )}
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
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Subcategories
              </h4>
              <div className="grid grid-cols-1 gap-1.5">
                {category.subCategories.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group/sub"
                  >
                    <Link
                      href={`/category/${sub.id}`}
                      className="flex flex-1 items-center justify-between p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium min-w-0"
                    >
                      <span className="truncate">{sub.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">{sub._count.questions}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover/sub:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                    {!readOnly && (
                      <div className="flex items-center pr-1.5">
                        <button
                          type="button"
                          title="Edit subcategory"
                          onClick={() =>
                            setEditingCategory({
                              id: sub.id,
                              name: sub.name,
                              parentId: category.id,
                            })
                          }
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete subcategory"
                          onClick={() =>
                            setPendingDelete({
                              id: sub.id,
                              name: sub.name,
                              questionCount: sub._count.questions,
                              isSubcategory: true,
                            })
                          }
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
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

      {editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <CategoryForm
              initialData={editingCategory}
              onSuccess={() => setEditingCategory(null)}
              onCancel={() => setEditingCategory(null)}
            />
          </div>
        </div>
      )}

      <AlertModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title={pendingDelete?.isSubcategory ? "Delete Subcategory" : "Delete Category"}
        message={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.name}"? All ${pendingDelete.questionCount} questions in this ${pendingDelete.isSubcategory ? "subcategory" : "category"} will be permanently removed.`
            : ""
        }
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
