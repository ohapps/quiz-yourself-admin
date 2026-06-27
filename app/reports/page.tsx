import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReportCard } from "@/components/reports/ReportCard";

export default async function ReportsPage() {
  await requireAuth();

  const reports = await prisma.questionReport.findMany({
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
  });

  const questionIds = [...new Set(reports.map((r) => r.questionId))];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { category: true },
  });
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
            Reported Issues
          </h1>
          <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/30 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400">
            {reports.filter((r) => !r.resolved).length} Open
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No reports yet.</div>
        ) : (
          reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              question={questionMap.get(report.questionId) ?? null}
            />
          ))
        )}
      </main>
    </div>
  );
}
