import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'amber' }) => {
  const colorMap = {
    amber: {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/5'
    },
    emerald: {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/5'
    },
    cyan: {
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/5'
    },
    rose: {
      border: 'border-rose-500/20',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/5'
    },
    purple: {
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/5'
    }
  };

  const c = colorMap[color] || colorMap.amber;

  return (
    <div className={`p-5 rounded-2xl bg-slate-900 border ${c.border} shadow-lg ${c.glow} flex items-start justify-between relative overflow-hidden group hover:border-slate-700 transition-all duration-200`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">{title}</p>
        <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 flex items-center space-x-1 pt-1 font-medium">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${c.bg} ${c.text}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
    </div>
  );
};

export default StatCard;
