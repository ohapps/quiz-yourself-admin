import { Layers, BookOpen, RefreshCw } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getCategoriesWithQuestionCount } from "@/lib/data/categories";
import { getContentVersion } from "@/lib/data/app-state";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActionBar } from "@/components/dashboard/ActionBar";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { CategoryWithCounts } from "@/lib/data/types";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const session = await requireAuth();

  const { q } = await searchParams;
  const categories = await getCategoriesWithQuestionCount(q);
  const version = await getContentVersion();

  const totalQuestions = categories.reduce((sum: number, cat: CategoryWithCounts) => sum + cat._count.questions, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">
      
      <Header version={version} user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Total Categories" 
            value={categories.length} 
            icon={<Layers className="w-6 h-6 text-emerald-500" />} 
            trend="+2 this month"
            gradient="from-emerald-500/10 to-teal-500/5"
          />
          <StatCard 
            title="Total Questions" 
            value={totalQuestions} 
            icon={<BookOpen className="w-6 h-6 text-blue-500" />} 
            trend="+14 this week"
            gradient="from-blue-500/10 to-cyan-500/5"
          />
          <StatCard 
            title="Content Version" 
            value={version} 
            icon={<RefreshCw className="w-6 h-6 text-purple-500" />} 
            trend="Synced"
            gradient="from-purple-500/10 to-fuchsia-500/5"
          />
        </div>

        <ActionBar initialQuery={q} />

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: CategoryWithCounts) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No categories found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {q ? `No matches found for "${q}". Try a different search term.` : "Start by creating your first category."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
