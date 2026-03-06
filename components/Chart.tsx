import React from 'react';

type ChartData = { label: string; value: number; color: string }[];

interface ChartProps {
  type: 'donut' | 'bar';
  data: ChartData;
  title?: string;
}

const DonutChart: React.FC<{ data: ChartData }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return <div className="text-center text-slate-500">No data available</div>;
  }

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" className="-rotate-90">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${(percentage * circumference) / 100} ${circumference}`;
          
          // Calculate cumulative percentage up to this item
          const previousPercentage = data
            .slice(0, index)
            .reduce((sum, d) => sum + (d.value / total) * 100, 0);
            
          const strokeDashoffset = (-previousPercentage * circumference) / 100;
          
          return (
            <circle
              key={index}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth="20"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{`${Math.round((data[0].value / total) * 100)}%`}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">Complete</span>
      </div>
    </div>
  );
};

const BarChart: React.FC<{ data: ChartData }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 100);

  return (
    <div className="w-full h-48 flex items-end justify-around gap-2 px-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center group">
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${(item.value / maxValue) * 100}%`,
              backgroundColor: item.color,
            }}
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs text-center bg-black/50 rounded-md p-1 -mt-8">
              {item.value.toFixed(1)}%
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export const Chart: React.FC<ChartProps> = ({ type, data, title }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col">
        {title && <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>}
        <div className="flex-1 flex items-center justify-center">
             {type === 'donut' ? <DonutChart data={data} /> : <BarChart data={data} />}
        </div>
    </div>
);
