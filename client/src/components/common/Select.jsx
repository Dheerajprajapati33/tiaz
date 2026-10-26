import React from 'react';

export default function Select({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full bg-white text-slate-900 text-sm rounded-lg border shadow-xs appearance-none px-3.5 py-2 pr-9 transition-colors duration-150 focus:outline-none focus:ring-1 ${
            error
              ? 'border-rose-400 focus:border-rose-500'
              : 'border-slate-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 hover:border-slate-400'
          } disabled:opacity-50 disabled:bg-slate-50 cursor-pointer`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt} className="bg-white text-slate-900">
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
