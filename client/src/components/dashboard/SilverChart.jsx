import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import Card from '../common/Card.jsx';
import { silverPriceData } from '../../mock/silverRates.js';
import { formatINR } from '../../utils/formatters.js';

export default function SilverChart({ currentRate = 235.00, timeframeData }) {
  const [timeframe, setTimeframe] = useState('1M');
  const rawData = (timeframeData && timeframeData[timeframe]) || silverPriceData[timeframe] || silverPriceData['1M'];

  const data = React.useMemo(() => {
    if (!Array.isArray(rawData)) return [];
    return rawData.map((item) => {
      const val = item.rate !== undefined ? item.rate : (item.price !== undefined ? item.price : currentRate);
      return {
        ...item,
        rate: Number(val),
        price: Number(val)
      };
    });
  }, [rawData, currentRate]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-300 p-2.5 rounded-lg shadow-xl text-xs">
          <p className="text-slate-500 font-medium">{label}</p>
          <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
            {formatINR(payload[0].value)} / gram
          </p>
          <p className="text-[10px] text-slate-500">999 Fine Silver (₹{formatINR(payload[0].value * 1000)}/KG)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="999 Fine Silver Price Benchmark"
      subtitle="Live historical bullion rates tracking IBJA / MCX fixing"
      action={
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {['1D', '7D', '1M', '3M', '1Y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      }
      bodyClassName="p-5"
    >
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v}`}
              domain={['dataMin - 1', 'dataMax + 1']}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#475569"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: '#334155', stroke: '#F8FAFC', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 animate-pulse" />
          <span>Live Reference: <strong>₹{currentRate.toFixed(2)}/g</strong> (₹{(currentRate * 1000).toLocaleString()}/KG)</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Source: IBJA Spot + MMTC-PAMP Fixing
        </div>
      </div>
    </Card>
  );
}
