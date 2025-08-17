import React from 'react';
import { TrendingUp, DollarSign, Target, PieChart, AlertCircle, ThumbsUp, Calculator, Plus, Eye, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { PortfolioPieChart } from './charts/PortfolioPieChart';
import { PerformanceLineChart } from './charts/PerformanceLineChart';
import { WhatIfScenario } from './WhatIfScenario';
import { usePortfolio } from '../hooks/usePortfolio';
import { calculationEngine } from '../services/calculationEngine';
import { UserProfile } from '../App';

interface DashboardProps {
  userProfile: UserProfile | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const { holdings, goals, getTotalPortfolioValue, getAssetAllocation } = usePortfolio();
  const [showWhatIf, setShowWhatIf] = React.useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  
  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  if (!userProfile) return null;

  const totalPortfolioValue = getTotalPortfolioValue();
  const assetAllocation = getAssetAllocation();
  
  // Calculate projections
  const projections = React.useMemo(() => {
    return calculationEngine.calculatePortfolioProjections(holdings, userProfile.monthlyContribution, 30);
  }, [holdings, userProfile.monthlyContribution]);

  const projectedBalance = Math.round(
    userProfile.currentSuper + 
    (userProfile.monthlyContribution * 12 * (userProfile.retirementAge - userProfile.age) * 1.07)
  );

  const yearsToRetirement = userProfile.retirementAge - userProfile.age;
  const monthlyIncome = Math.round(projectedBalance * 0.04 / 12);

  // Transform asset allocation for pie chart
  const pieChartData = Object.entries(assetAllocation).map(([type, percentage], index) => {
    const colors = {
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
    
    return {
      id: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: percentage,
      color: colors[type as keyof typeof colors] || '#64748b',
      rawValue: (totalPortfolioValue * percentage) / 100,
    };
  });

  // Mock performance data for chart
  const performanceData = [{
    id: 'Portfolio',
    color: '#3b82f6',
    data: projections.baseCase.slice(0, 12).map(point => ({ x: point.year, y: point.totalValue })),
  }];

  const recommendations = [
    {
      type: 'Increase Contribution',
      description: 'Consider increasing your monthly contribution by $100 to boost your retirement savings',
      impact: '+$15,000 at retirement',
      priority: 'high'
    },
    {
      type: 'Rebalance Portfolio',
      description: 'Your current allocation could benefit from more international exposure',
      impact: 'Improved diversification',
      priority: 'medium'
    },
    {
      type: 'Tax Optimization',
      description: 'Salary sacrifice additional contributions for tax benefits',
      impact: 'Save $800 annually in tax',
      priority: 'high'
    }
  ];

  const portfolioAllocation = [
    { name: 'Australian Shares', percentage: 35, color: 'bg-blue-500' },
    { name: 'International Shares', percentage: 25, color: 'bg-green-500' },
    { name: 'Bonds', percentage: 20, color: 'bg-purple-500' },
    { name: 'Property', percentage: 15, color: 'bg-orange-500' },
    { name: 'Cash', percentage: 5, color: 'bg-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 relative">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Welcome back, {userProfile.name.split(' ')[0]}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Your portfolio is {totalPortfolioValue > userProfile.currentSuper ? 'growing' : 'ready for optimization'}
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowWhatIf(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">What-If Analysis</span>
                <span className="sm:hidden">What-If</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Investment</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div 
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8"
        >
          {[
            {
              icon: DollarSign,
              label: 'Total Portfolio',
              value: `$${totalPortfolioValue.toLocaleString()}`,
              change: '+7.2%',
              color: 'blue',
              bgColor: 'bg-blue-100',
              textColor: 'text-blue-600',
            },
            {
              icon: Target,
              label: 'Retirement Goal',
              value: `$${projectedBalance.toLocaleString()}`,
              change: `${yearsToRetirement} years`,
              color: 'green',
              bgColor: 'bg-green-100',
              textColor: 'text-green-600',
            },
            {
              icon: TrendingUp,
              label: 'Monthly Income',
              value: `$${monthlyIncome.toLocaleString()}`,
              change: 'At retirement',
              color: 'purple',
              bgColor: 'bg-purple-100',
              textColor: 'text-purple-600',
            },
            {
              icon: PieChart,
              label: 'Performance',
              value: '8.4%',
              change: 'Annual return',
              color: 'orange',
              bgColor: 'bg-orange-100',
              textColor: 'text-orange-600',
            },
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 sm:p-3 ${metric.bgColor} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-6 h-6 ${metric.textColor}`} />
                  </div>
                  <span className="text-xs sm:text-sm text-green-600 font-medium">{metric.change}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{metric.value}</h3>
                <p className="text-sm text-slate-600">{metric.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Portfolio Overview */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Portfolio Performance</h2>
              <div className="flex items-center space-x-2">
                {['1M', '3M', '6M', '1Y', 'ALL'].map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe as any)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>
            
            <PerformanceLineChart
              data={performanceData}
              height={300}
              showArea={true}
              yAxisLabel="Portfolio Value ($)"
              xAxisLabel="Time"
            />
          </motion.div>

          {/* Asset Allocation */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Asset Allocation</h2>
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
            
            {pieChartData.length > 0 ? (
              <PortfolioPieChart
                data={pieChartData}
                height={250}
                showLegend={false}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No holdings to display</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                    Add your first investment
                  </button>
                </div>
              </div>
            )}
            
            {/* Asset breakdown */}
            <div className="mt-6 space-y-3">
              {pieChartData.slice(0, 4).map((asset) => (
                <div key={asset.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="text-sm font-medium text-slate-900">{asset.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">
                      ${asset.rawValue?.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {asset.value.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Goals and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Financial Goals */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Financial Goals</h2>
              <button className="flex items-center space-x-2 px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Goal</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {goals.length > 0 ? (
                goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                      <span className="text-sm text-slate-500">
                        {goal.target_date ? new Date(goal.target_date).getFullYear() : 'No deadline'}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium">
                          ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{goal.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No financial goals set</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                    Create your first goal
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">AI Recommendations</h2>
            </div>
            
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{rec.type}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm mb-3">{rec.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 text-xs sm:text-sm font-medium">{rec.impact}</span>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* What-If Scenario Modal */}
        {showWhatIf && (
          <WhatIfScenario
            holdings={holdings}
            currentAge={userProfile.age}
            currentContribution={userProfile.monthlyContribution}
            currentRetirementAge={userProfile.retirementAge}
            onClose={() => setShowWhatIf(false)}
          />
        )}
      </div>
    </div>
  );
};