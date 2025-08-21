import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, BarChart3, Settings, Eye, EyeOff, Target, AlertCircle } from 'lucide-react';

interface AssetHolding {
  id: string;
  type: string;
  symbol?: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currency: string;
  region?: string;
  exchange?: string;
  purchaseDate: string;
  metadata?: any;
}

interface UserProfile {
  monthlyContribution: number;
  retirementAge: number;
  age: number;
  currentSuper: number;
}

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generatePerformanceData();
  }, [holdings, userProfile, selectedMetric]);

  const generatePerformanceData = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      try {
        const data = generateEnhancedMockData();
        setPerformanceData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error generating performance data:', error);
        setPerformanceData(generateFallbackData());
        setIsLoading(false);
      }
    }, 800);
  };

  const generateEnhancedMockData = () => {
    const data = [];
    const currentYear = new Date().getFullYear();
    const yearsToProject = Math.min(userProfile.retirementAge - userProfile.age, 15);
    
    // Calculate current portfolio value
    let currentValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0) || userProfile.currentSuper;
    
    for (let i = 0; i <= yearsToProject; i++) {
      const year = currentYear + i;
      
      // Base scenario - 7.5% annual growth
      const baseGrowthRate = 0.075;
      const marketVolatility = (Math.random() - 0.5) * 0.03; // ±1.5% market variation
      const actualGrowthRate = baseGrowthRate + marketVolatility;
      
      currentValue = currentValue * (1 + actualGrowthRate);
      const annualContribution = userProfile.monthlyContribution * 12;
      currentValue += annualContribution;
      
      // Calculate different scenarios
      const optimisticValue = currentValue * 1.3; // 30% higher
      const pessimisticValue = currentValue * 0.75; // 25% lower
      const benchmarkValue = currentValue * 1.02; // Market benchmark
      
      // Calculate total contributions to date
      const totalContributions = userProfile.currentSuper + (annualContribution * i);
      const investmentGrowth = currentValue - totalContributions;
      
      data.push({
        year,
        portfolioValue: Math.round(currentValue),
        contributions: Math.round(totalContributions),
        growth: Math.round(Math.max(investmentGrowth, 0)),
        optimistic: Math.round(optimisticValue),
        pessimistic: Math.round(pessimisticValue),
        benchmark: Math.round(benchmarkValue),
        returnRate: ((currentValue - totalContributions) / totalContributions * 100),
        riskScore: Math.min(Math.max(30 + (i * 2) + (Math.random() * 20), 20), 80)
      });
    }

    return data;
  };

  const generateFallbackData = () => {
    const data = [];
    const currentYear = new Date().getFullYear();
    let baseValue = userProfile.currentSuper || 50000;

    for (let i = 0; i <= 10; i++) {
      baseValue *= 1.075;
      baseValue += userProfile.monthlyContribution * 12;

      data.push({
        year: currentYear + i,
        portfolioValue: Math.round(baseValue),
        contributions: Math.round(userProfile.currentSuper + (userProfile.monthlyContribution * 12 * i)),
        growth: Math.round(baseValue * 0.3),
        optimistic: Math.round(baseValue * 1.2),
        pessimistic: Math.round(baseValue * 0.8),
        benchmark: Math.round(baseValue * 1.02),
        returnRate: 7.5,
        riskScore: 50
      });
    }
    return data;
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200 min-w-64">
          <h4 className="font-semibold text-slate-900 mb-2">Year: {label}</h4>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-slate-600">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'returns':
        return performanceData.map(d => ({ ...d, displayValue: d.returnRate }));
      case 'risk':
        return performanceData.map(d => ({ ...d, displayValue: d.riskScore }));
      default:
        return performanceData;
    }
  };

  const currentProjection = performanceData[performanceData.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-slate-100"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Portfolio Performance</h3>
            <p className="text-sm text-slate-600">Historical and projected performance analysis</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-slate-600">View:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="value">Portfolio Value</option>
              <option value="returns">Returns %</option>
              <option value="risk">Risk Analysis</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowProjections(!showProjections)}
            className={`flex items-center space-x-2 px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
              showProjections
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {showProjections ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Projections</span>
          </button>
        </div>
      </div>

      {/* Performance Summary Cards */}
      {currentProjection && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Projected Value</p>
                <p className="text-xl font-bold text-blue-800">
                  {formatValue(currentProjection.portfolioValue)}
                </p>
              </div>
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Investment Growth</p>
                <p className="text-xl font-bold text-green-800">
                  {formatValue(currentProjection.growth)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Expected Return</p>
                <p className="text-xl font-bold text-purple-800">7.5%</p>
              </div>
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Portfolio Risk</p>
                <p className="text-xl font-bold text-orange-800">Medium</p>
              </div>
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-96 mb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-slate-600">Calculating projections...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={getMetricData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="year" 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={selectedMetric === 'returns' ? (value) => `${value.toFixed(1)}%` :
                              selectedMetric === 'risk' ? (value) => `${value}` :
                              formatValue}
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Main portfolio area */}
              <Area
                type="monotone"
                dataKey="contributions"
                stackId="1"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.3}
                name="Total Contributions"
              />
              
              <Area
                type="monotone"
                dataKey="growth"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Investment Growth"
              />

              {/* Main portfolio line */}
              <Line
                type="monotone"
                dataKey="portfolioValue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                name="Portfolio Value"
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
              />

              {/* Projections */}
              {showProjections && (
                <>
                  <Line
                    type="monotone"
                    dataKey="optimistic"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Optimistic Scenario"
                  />
                  <Line
                    type="monotone"
                    dataKey="pessimistic"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Pessimistic Scenario"
                  />
                </>
              )}

              {/* Benchmark */}
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#8b5cf6"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                name="Market Benchmark"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Analysis Insights */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p>Your portfolio is on track to meet retirement goals with consistent contributions.</p>
          </div>
          <div className="flex items-start space-x-2">
            <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p>Diversifying across asset classes helps reduce overall portfolio risk.</p>
          </div>
          <div className="flex items-start space-x-2">
            <BarChart3 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p>Regular rebalancing can help maintain optimal asset allocation.</p>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p>Consider increasing contributions during market downturns for better returns.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
