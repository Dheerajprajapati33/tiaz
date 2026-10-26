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
import { goldPriceData } from '../../mock/dashboard.js';
import { formatINR } from '../../utils/formatters.js';

export default function GoldChart({ currentRate = 15028.00, timeframeData }) {
  const [timeframe, setTimeframe] = useState('1M');
  const rawData = (timeframeData && timeframeData[timeframe]) || goldPriceData[timeframe] || goldPriceData['1M'];

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
        <div className="bg-white border border-amber-200 p-2.5 rounded-lg shadow-xl text-xs">
          <p className="text-slate-500 font-medium">{label}</p>
          <p className="text-sm font-bold text-amber-900 tabular-nums mt-0.5">
            {formatINR(payload[0].value)} / gram
          </p>
          <p className="text-[10px] text-slate-400">24 Karat 99.9% Pure Gold</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="24K Gold Price Benchmark"
      subtitle="Live historical bullion rates tracking IBJA / MMTC-PAMP fixing"
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
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              domain={['auto', 'auto']}
              tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#B8860B"
              strokeWidth={2.5}
              dot={{ fill: '#B8860B', r: 3, strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#D4AF37', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
