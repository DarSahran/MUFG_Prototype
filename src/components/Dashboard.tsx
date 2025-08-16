import React from 'react';
import { TrendingUp, DollarSign, Target, PieChart, AlertCircle, ThumbsUp } from 'lucide-react';
import { UserProfile } from '../App';

interface DashboardProps {
  userProfile: UserProfile | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  if (!userProfile) return null;

  const projectedBalance = Math.round(
    userProfile.currentSuper + 
    (userProfile.monthlyContribution * 12 * (userProfile.retirementAge - userProfile.age) * 1.07)
  );

  const yearsToRetirement = userProfile.retirementAge - userProfile.age;
  const monthlyIncome = Math.round(projectedBalance * 0.04 / 12);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Investment Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-600">Your personalized superannuation overview and recommendations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm text-green-600 font-medium">+7.2%</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">${userProfile.currentSuper.toLocaleString()}</h3>
            <p className="text-sm text-slate-600">Current Balance</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm text-blue-600 font-medium">{yearsToRetirement} years</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">${projectedBalance.toLocaleString()}</h3>
            <p className="text-sm text-slate-600">Projected at Retirement</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs sm:text-sm text-green-600 font-medium">Monthly</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">${monthlyIncome.toLocaleString()}</h3>
            <p className="text-sm text-slate-600">Retirement Income</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <PieChart className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs sm:text-sm text-blue-600 font-medium capitalize">{userProfile.riskTolerance}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">7.2%</h3>
            <p className="text-sm text-slate-600">Annual Return</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Portfolio Allocation */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6">Portfolio Allocation</h2>
            <div className="space-y-4">
              {portfolioAllocation.map((asset, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${asset.color}`} />
                    <span className="text-sm sm:text-base font-medium text-slate-900">{asset.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 sm:w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`${asset.color} h-2 rounded-full`}
                        style={{ width: `${asset.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600 w-8 text-right">{asset.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Profile */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6">Risk Profile</h2>
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full mb-4">
                <span className="text-xl sm:text-2xl font-bold text-white capitalize">{userProfile.riskTolerance.charAt(0)}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 capitalize">{userProfile.riskTolerance}</h3>
              <p className="text-slate-600 text-sm">Investment Approach</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-600">Growth Potential</span>
                <span className="font-medium">High</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-600">Volatility</span>
                <span className="font-medium">Moderate</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-600">Time Horizon</span>
                <span className="font-medium">{yearsToRetirement} years</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">AI Recommendations</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{rec.type}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm mb-3">{rec.description}</p>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 text-xs sm:text-sm font-medium">{rec.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};