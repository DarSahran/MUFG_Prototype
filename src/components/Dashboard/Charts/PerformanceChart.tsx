import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { portfolioEngine } from '../../../utils/portfolioEngine';
import { AssetHolding } from '../../../types/portfolio';
import { UserProfile } from '../../../App';

interface PerformanceChartProps {
  holdings: AssetHolding[];
  userProfile: UserProfile;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  holdings, 
  userProfile 
}) => {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [showProjections, setShowProjections] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'value' | 'returns' | 'risk'>('value');

  useEffect(() => {
    generatePerformanceData();
  }, [holdings, userProfile, selectedMetric]);

  const generatePerformanceData = () => {
    try {
      // Convert holdings to unified assets
      const unifiedAssets = holdings.map(holding => ({
        id: holding.id,
        type: holding.type,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        purchasePrice: holding.purchasePrice,
        currentPrice: holding.currentPrice,
        value: holding.quantity * holding.currentPrice,
        currency: holding.currency,
        region: holding.region,
        exchange: holding.exchange,
        purchaseDate: holding.purchaseDate,
        expectedReturn: 0.075,
        volatility: 0.15,
        metadata: holding.metadata || {},
      }));

      const projections = portfolioEngine.calculatePortfolioProjections(
        unifiedAssets,
        userProfile.monthlyContribution,
        Math.min(userProfile.retirementAge - userProfile.age, 30)
      );

      // Format data for chart
      const chartData = projections.baseCase.map((projection, index) => ({
        year: projection.year,
        portfolioValue: projection.totalValue,
        contributions: projection.contributions,
        growth: projection.growth,
        optimistic: projections.optimistic[index]?.totalValue || 0,
        pessimistic: projections.pessimistic[index]?.totalValue || 0,
        benchmark: projection.totalValue * 1.02, // Mock benchmark
      }));

      setPerformanceData(chartData);
    } catch (error) {
      console.error('Error generating performance data:', error);
      // Fallback to simple mock data
      setPerformanceData(generateMockData());
    }
  };

  const generateMockData = () => {
    const data = [];
    const currentYear = new Date().getFullYear();
    let baseValue = portfolioEngine.calculatePortfolioValue(holdings.map(h => ({
      id: h.id,
      type: h.type,
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      purchasePrice: h.purchasePrice,
      currentPrice: h.currentPrice,
      value: h.quantity * h.currentPrice,
      currency: h.currency,
      region: h.region,
      exchange: h.exchange,
      purchaseDate: h.purchaseDate,
      expectedReturn: 0.075,
      volatility: 0.15,
      metadata: h.metadata || {},
    }))) || userProfile.currentSuper;

    for (let i = 0; i <= 10; i++) {
      baseValue *= 1.075; // 7.5% annual growth
      baseValue += userProfile.monthlyContribution * 12; // Annual contributions
      
      data.push({
        year: currentYear + i,
        portfolioValue: Math.round(baseValue),
        contributions: Math.round(userProfile.currentSuper + (userProfile.monthlyContribution * 12 * i)),
        growth: Math.round(baseValue - (userProfile.currentSuper + (userProfile.monthlyContribution * 12 * i))),
        optimistic: Math.round(baseValue * 1.2),
        pessimistic: Math.round(baseValue * 0.8),
        benchmark: Math.round(baseValue * 1.02),
      });
    }

    return data;
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Portfolio Performance</h2>
          <p className="text-sm text-slate-600">Historical and projected performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">View:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="value">Portfolio Value</option>
              <option value="returns">Returns</option>
              <option value="risk">Risk Analysis</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowProjections(!showProjections)}
            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
              showProjections
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Projections
          </button>
        </div>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="year"
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatValue}
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatValue(value), 
                name === 'portfolioValue' ? 'Portfolio Value' :
                name === 'contributions' ? 'Total Contributions' :
                name === 'growth' ? 'Investment Growth' :
                name === 'optimistic' ? 'Optimistic Scenario' :
                name === 'pessimistic' ? 'Pessimistic Scenario' :
                name === 'benchmark' ? 'Market Benchmark' : name
              ]}
              labelFormatter={(label) => `Year: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            
            {/* Main portfolio line */}
            <Line
              type="monotone"
              dataKey="portfolioValue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              name="Portfolio Value"
            />
            
            {/* Contributions area */}
            <Area
              type="monotone"
              dataKey="contributions"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
              name="Total Contributions"
            />
            
            {/* Projections */}
            {showProjections && (
              <>
                <Line
                  type="monotone"
                  dataKey="optimistic"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Optimistic"
                />
                <Line
                  type="monotone"
                  dataKey="pessimistic"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Pessimistic"
                />
              </>
            )}
            
            {/* Benchmark */}
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#64748b"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              name="Market Benchmark"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Performance Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">
            {performanceData.length > 0 ? formatValue(performanceData[performanceData.length - 1]?.portfolioValue || 0) : '$0'}
          </div>
          <div className="text-xs text-slate-600">Projected Value</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {performanceData.length > 0 ? formatValue(performanceData[performanceData.length - 1]?.growth || 0) : '$0'}
          </div>
          <div className="text-xs text-slate-600">Investment Growth</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">7.5%</div>
          <div className="text-xs text-slate-600">Expected Annual Return</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">15%</div>
          <div className="text-xs text-slate-600">Portfolio Volatility</div>
        </div>
      </div>
    </motion.div>
  );
};