import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subvalue,
  change,
  trend = 'neutral', // 'up', 'down', 'neutral'
  icon: Icon,
  badgeText,
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/90 hover:border-[#D4AF37] hover:shadow-md rounded-xl p-5 transition-all duration-150 flex flex-col justify-between shadow-xs ${
        onClick ? 'cursor-pointer hover:bg-slate-50/50' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B8860B] shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {value}
          </span>
          {subvalue && (
            <span className="text-xs text-slate-500 tabular-nums font-medium">
              {subvalue}
            </span>
          )}
        </div>

        {(change || badgeText) && (
          <div className="flex items-center gap-1.5 pt-1 text-xs">
            {trend === 'up' && (
              <span className="inline-flex items-center text-emerald-700 font-semibold tabular-nums gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {change}
              </span>
            )}
            {trend === 'down' && (
              <span className="inline-flex items-center text-rose-700 font-semibold tabular-nums gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {change}
              </span>
            )}
            {trend === 'neutral' && change && (
              <span className="text-slate-500 tabular-nums font-medium">
                {change}
              </span>
            )}
            {badgeText && (
              <span className="text-[11px] text-slate-400 ml-1">
                {badgeText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
