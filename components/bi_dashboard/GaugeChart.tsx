import React from 'react';

interface GaugeChartProps {
  value: number; // 0-100
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ value }) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (circumference * 0.75); // Use 3/4 of the circle
  const strokeDashoffset = arcLength - (clampedValue / 100) * arcLength;

  const getColor = (val: number) => {
    if (val < 50) return '#ef4444'; // red
    if (val < 80) return '#f59e0b'; // amber
    return '#22c55e'; // green
  };

  const color = getColor(clampedValue);

  return (
    <div className="relative w-40 h-40">
      <svg viewBox="0 0 200 200" className="w-full h-full" style={{ transform: 'rotate(135deg)' }}>
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="20"
          strokeDasharray={arcLength}
          strokeDashoffset={0}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="20"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">{Math.round(clampedValue)}%</span>
      </div>
    </div>
  );
};