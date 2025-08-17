import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AllocationPieChartProps {
  allocation: { [key: string]: number };
  totalValue: number;
}

export const AllocationPieChart: React.FC<AllocationPieChartProps> = ({ 
  allocation, 
  totalValue 
}) => {
  const data = Object.entries(allocation).map(([type, percentage]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: percentage,
    rawValue: (totalValue * percentage) / 100,
  }));

  const COLORS = {
    stock: '#3b82f6',
    etf: '#10b981',
    bond: '#8b5cf6',
    property: '#f59e0b',
    crypto: '#ef4444',
    cash: '#6b7280',
    super: '#06b6d4',
    fd: '#84cc16',
    ppf: '#f97316',
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600">
            Value: ${data.rawValue.toLocaleString()}
          </p>
          <p className="text-sm text-slate-600">
            Percentage: {data.value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Asset Allocation</h2>
        <div className="text-sm text-slate-600">
          {Object.keys(allocation).length} asset types
        </div>
      </div>
      
      {data.length > 0 ? (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#64748b'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-6 space-y-3">
            {data.slice(0, 5).map((asset, index) => (
              <div key={asset.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: COLORS[asset.name.toLowerCase() as keyof typeof COLORS] || '#64748b' 
                    }}
                  />
                  <span className="text-sm font-medium text-slate-900">{asset.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    ${asset.rawValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {asset.value.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No assets to display</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};