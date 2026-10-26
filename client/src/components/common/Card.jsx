import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
  headerClassName = 'px-5 py-4 border-b border-slate-100',
  footer,
  footerClassName = 'px-5 py-3 border-t border-slate-100 bg-slate-50/70'
}) {
  return (
    <div className={`bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs transition-all duration-150 ${className}`}>
      {(title || subtitle || action) && (
        <div className={`flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && <div className={footerClassName}>{footer}</div>}
    </div>
  );
}
