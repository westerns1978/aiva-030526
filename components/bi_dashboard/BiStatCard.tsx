import React from 'react';

interface BiStatCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down';
  isPositive?: boolean;
}

const TrendIcon: React.FC<{ trend: 'up' | 'down' }> = ({ trend }) => {
  const isUp = trend === 'up';
  const classes = isUp ? 'text-green-500' : 'text-red-500';
  const path = isUp ? 'M4.5 15.75l7.5-7.5 7.5 7.5' : 'M19.5 8.25l-7.5 7.5-7.5-7.5';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ${classes}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
};

export const BiStatCard: React.FC<BiStatCardProps> = ({ title, value, trend, isPositive }) => {
  const valueColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-100';

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
        {trend && <TrendIcon trend={trend} />}
      </div>
    </div>
  );
};