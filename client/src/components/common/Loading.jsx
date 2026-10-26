import React from 'react';

export default function Loading({ text = 'Loading data...', rows = 5 }) {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-[#1F2633]" />
        <div className="h-4 bg-[#1F2633] rounded w-48" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-[#161B24] rounded-lg w-full" />
        ))}
      </div>
      <p className="text-xs text-[#64748B] text-center pt-2">{text}</p>
    </div>
  );
}
