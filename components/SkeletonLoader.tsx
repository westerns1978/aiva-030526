
import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6 p-6 h-full">
    {/* Header skeleton */}
    <div className="animate-pulse flex items-center gap-4 mb-8">
      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
      </div>
    </div>
    
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    
    {/* Content skeleton */}
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse mt-6">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
      <div className="space-y-4">
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    </div>
  </div>
);
