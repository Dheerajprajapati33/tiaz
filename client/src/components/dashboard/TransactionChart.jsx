import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import Card from '../common/Card.jsx';
import { buyVsSellData } from '../../mock/dashboard.js';

export default function TransactionChart({
  data = buyVsSellData,
  assetName = 'Gold',
  buyColor = '#D4AF37',
  sellColor = '#10B981'
}) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
          <p className="text-slate-500 font-semibold">{label}</p>
          <p className="text-slate-900 font-bold tabular-nums">
            {assetName} Buy: ₹{payload[0].value} Lakhs
          </p>
          <p className="text-emerald-700 font-bold tabular-nums">
            {assetName} Sell: ₹{payload[1].value} Lakhs
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title={`${assetName} Buy vs Sell Volume`}
      subtitle={`Monthly ${assetName.toLowerCase()} bullion order volume turnover (₹ in Lakhs)`}
      bodyClassName="p-5"
    >
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              tickFormatter={(v) => `₹${v}L`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />
            <Bar dataKey="buyAmount" name={`${assetName} Buy`} fill={buyColor} radius={[4, 4, 0, 0]} />
            <Bar dataKey="sellAmount" name={`${assetName} Sell`} fill={sellColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
