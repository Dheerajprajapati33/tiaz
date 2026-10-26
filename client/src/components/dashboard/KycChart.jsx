import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import Card from '../common/Card.jsx';
import { useKycStore } from '../../store/kycStore.js';

export default function KycChart({ data = null }) {
  const kycs = useKycStore((s) => s.kycs);

  // Compute live from store or fallback to global dashboard distribution
  const verifiedCount = kycs.filter((k) => k.status === 'Verified').length;
  const pendingCount = kycs.filter((k) => k.status === 'Pending').length;
  const reviewCount = kycs.filter((k) => k.status === 'Under Review').length;
  const rejectedCount = kycs.filter((k) => k.status === 'Rejected').length;

  const defaultChartData = [
    { name: 'Verified', value: 21800 + verifiedCount, color: '#16A34A' },
    { name: 'Pending', value: 1280 + pendingCount, color: '#D97706' },
    { name: 'Under Review', value: 840 + reviewCount, color: '#0284C7' },
    { name: 'Rejected', value: 650 + rejectedCount, color: '#DC2626' }
  ];

  const chartData = (data && data.length > 0) ? data : defaultChartData;

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-xl text-xs space-y-0.5">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="font-bold tabular-nums" style={{ color: data.color }}>
            {data.value.toLocaleString()} users ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="KYC Status Distribution"
      subtitle="Verification compliance pipeline breakdown"
      bodyClassName="p-5"
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-3">
          {chartData.map((item) => {
            const pct = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-semibold">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 tabular-nums">
                    {item.value.toLocaleString()}
                  </span>
                  <span className="text-slate-500 w-12 text-right tabular-nums">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
