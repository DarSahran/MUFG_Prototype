import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, DollarSign } from 'lucide-react';

interface AllocationPieChartProps {
  allocation: { [key: string]: number };
  totalValue: number;
}

export const AllocationPieChart: React.FC<AllocationPieChartProps> = ({
  allocation,
  totalValue
}) => {
  // Memoize data to prevent unnecessary re-calculations
  const data = useMemo(() => {
    if (!allocation || Object.keys(allocation).length === 0) {
      return [];
    }
    
    return Object.entries(allocation).map(([type, percentage]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: percentage,
      rawValue: (totalValue * percentage) / 100,
      type: type,
      // Add a stable key to prevent React from recreating elements
      key: `${type}-${percentage}-${totalValue}`
    }));
  }, [allocation, totalValue]);

  const COLORS = useMemo(() => ({
    stock: '#3b82f6',
    etf: '#10b981',
    bond: '#8b5cf6',
    property: '#f59e0b',
    crypto: '#ef4444',
    cash: '#6b7280',
    super: '#06b6d4',
    fd: '#84cc16',
    ppf: '#f97316',
    default: '#94a3b8'
  }), []);

  // Memoize tooltip to prevent recreation
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[data.type as keyof typeof COLORS] || COLORS.default }}
            />
            <h4 className="font-semibold text-slate-900">{data.name}</h4>
          </div>
          <p className="text-sm text-slate-600">
            Value: <span className="font-medium text-slate-900">${data.rawValue.toLocaleString()}</span>
          </p>
          <p className="text-sm text-slate-600">
            Percentage: <span className="font-medium text-slate-900">{data.value.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  }, [COLORS]);

  // Memoize label renderer to prevent recreation
  const renderCustomLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Hide labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  }, []);

  // Show empty state if no data
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 h-full flex flex-col items-center justify-center"
      >
        <PieChartIcon className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 mb-2">No Data Available</h3>
        <p className="text-slate-500 text-center">Add some assets to see your allocation breakdown</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PieChartIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Asset Allocation</h3>
            <p className="text-sm text-slate-600">{data.length} asset types</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-full">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">Portfolio</span>
        </div>
      </div>

      {/* Chart Container with Fixed Dimensions */}
      <div className="mb-6" style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              innerRadius={30}
              fill="#8884d8"
              dataKey="value"
              // Disable animation to prevent disappearing issue
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={entry.key} // Use stable key from data
                  fill={COLORS[entry.type as keyof typeof COLORS] || COLORS.default}
                />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-slate-700">Asset Breakdown</h4>
        <div className="space-y-2">
          {data.map((asset, index) => (
            <motion.div
              key={asset.key} // Use stable key
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: COLORS[asset.type as keyof typeof COLORS] || COLORS.default }}
                />
                <span className="text-sm font-medium text-slate-700">{asset.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  ${asset.rawValue.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  {asset.value.toFixed(1)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Total Portfolio Value</span>
          </div>
          <span className="text-xl font-bold text-slate-900">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
