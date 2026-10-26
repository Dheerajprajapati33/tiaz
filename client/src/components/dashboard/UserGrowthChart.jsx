import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import Card from '../common/Card.jsx';
import { userGrowthData } from '../../mock/dashboard.js';

export default function UserGrowthChart({ data = userGrowthData }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
          <p className="text-slate-500 font-semibold">{label}</p>
          <p className="text-sky-700 font-bold tabular-nums">
            Total Users: {payload[0].value}k
          </p>
          <p className="text-emerald-700 font-bold tabular-nums">
            Active: {payload[1].value}k
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="User Base & Active Growth"
      subtitle="Monthly registered vs monthly active investors (in thousands)"
      bodyClassName="p-5"
    >
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="totalUserGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="activeUserGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="month"
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
              tickFormatter={(v) => `${v}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalUsers"
              name="Total Registered"
              stroke="#0284C7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#totalUserGradient)"
            />
            <Area
              type="monotone"
              dataKey="activeUsers"
              name="Active Investors"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#activeUserGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
