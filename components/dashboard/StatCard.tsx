import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  gradient: string;
}

export function StatCard({ title, value, icon, trend, gradient }: StatCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden shadow-sm`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`}></div>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</h4>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl shadow-sm backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <div className="relative z-10 mt-4 flex items-center text-xs font-medium text-slate-500">
        <span className="text-emerald-500 mr-2">{trend}</span>
      </div>
    </div>
  );
}
