import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AssetHolding } from '../../../types/portfolio';

interface AssetTrendChartProps {
  holdings: AssetHolding[];
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
}

export const AssetTrendChart: React.FC<AssetTrendChartProps> = ({ 
  holdings, 
  timeframe 
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  useEffect(() => {
    generateMockTrendData();
  }, [holdings, selectedTimeframe]);

  const generateMockTrendData = () => {
    const days = selectedTimeframe === '1D' ? 1 : 
                 selectedTimeframe === '1W' ? 7 :
                 selectedTimeframe === '1M' ? 30 :
                 selectedTimeframe === '3M' ? 90 :
                 selectedTimeframe === '6M' ? 180 : 365;

    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dataPoint: any = {
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
      };

      // Generate trend data for each holding
      holdings.slice(0, 5).forEach((holding, index) => {
        const baseValue = holding.quantity * holding.currentPrice;
        const volatility = 0.02; // 2% daily volatility
        const trend = Math.sin(i / 10) * 0.1; // Long-term trend
        const randomWalk = (Math.random() - 0.5) * volatility;
        
        dataPoint[holding.symbol || holding.name] = Math.round(
          baseValue * (1 + trend + randomWalk)
        );
      });

      data.push(dataPoint);
    }

    setChartData(data);
  };

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Asset Performance</h2>
          <p className="text-sm text-slate-600">Track your investments over time</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {['1D', '1W', '1M', '3M', '6M', '1Y'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedTimeframe(period as any)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedTimeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date"
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-AU', { 
                month: 'short', 
                day: 'numeric' 
              })}
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`, 
                name
              ]}
              labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-AU')}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            {holdings.slice(0, 5).map((holding, index) => (
              <Line
                key={holding.id}
                type="monotone"
                dataKey={holding.symbol || holding.name}
                stroke={colors[index]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: colors[index] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};