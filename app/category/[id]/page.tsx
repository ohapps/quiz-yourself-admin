import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { getCategoryWithQuestionsById } from "@/lib/data/categories";
import { Question } from "@/lib/data/types";
import { CategoryHeader } from "@/components/category/CategoryHeader";
import { EmptyState } from "@/components/category/EmptyState";
import { QuestionCard } from "@/components/category/QuestionCard";
import { DifficultyFilter } from "@/components/category/DifficultyFilter";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ difficulty?: string }>;
};

export default async function CategoryPage(props: PageProps) {
  await requireAuth();

  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const category = await getCategoryWithQuestionsById(params.id);
  if (!category) {
    notFound();
  }

  const difficultyFilter = searchParams.difficulty;
  const filteredQuestions = difficultyFilter 
    ? category.questions.filter((q: Question) => q.difficulty === difficultyFilter)
    : category.questions;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">
      
      <CategoryHeader 
        categoryId={category.id}
        categoryName={category.name} 
        questionCount={filteredQuestions.length} 
      />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        
        {category.questions.length > 0 && (
          <DifficultyFilter 
            categoryId={category.id} 
            currentDifficulty={difficultyFilter} 
          />
        )}

        {category.questions.length === 0 ? (
          <EmptyState />
        ) : filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No matches found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              There are no {difficultyFilter} questions in this category.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuestions.map((q: Question, index: number) => (
              <QuestionCard key={q.id} question={q} index={index} />
            ))}
          </div>
        )}
      </main>
      
    </div>
  );
}
