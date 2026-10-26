import React from 'react';
import { getStatusBadgeColor } from '../../utils/formatters.js';

export default function Badge({
  status,
  label,
  variant, // optional manual override: 'gold', 'success', 'warning', 'danger', 'info', 'neutral'
  size = 'sm',
  className = ''
}) {
  const displayLabel = label || status || 'Unknown';
  const colors = getStatusBadgeColor(status || variant || '');

  const customVariantStyles = {
    gold: 'bg-amber-50 text-amber-900 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const styleClass = variant ? customVariantStyles[variant] : `${colors.bg} ${colors.text} ${colors.border}`;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${styleClass} ${sizeClass} tracking-wide ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span>{displayLabel}</span>
    </span>
  );
}
