import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calculator, Plus, Edit3, Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { AssetHolding } from '../../../types/portfolio';
import { UserProfile } from '../../../App';
import { usePortfolio } from '../../../hooks/usePortfolio';
import { SuperAssetModal } from '../../SuperAssetModal';

interface SuperTabProps {
  holdings: AssetHolding[];
  userProfile: UserProfile;
}

export const SuperTab: React.FC<SuperTabProps> = ({ holdings, userProfile }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributionCalculator, setShowContributionCalculator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { updateHolding, deleteHolding } = usePortfolio();

  const superHoldings = holdings.filter(h => h.type === 'super');
  const totalSuperValue = superHoldings.reduce((sum, holding) => 
    sum + (holding.quantity * holding.currentPrice), 0
  );

  const yearsToRetirement = userProfile.retirementAge - userProfile.age;
  const currentContribution = userProfile.monthlyContribution * 12;
  const projectedBalance = Math.round(
    totalSuperValue * Math.pow(1.075, yearsToRetirement) +
    (currentContribution * ((Math.pow(1.075, yearsToRetirement) - 1) / 0.075))
  );

  const handleRefreshSuper = async () => {
    setRefreshing(true);
    try {
      // Simulate API call to super fund for balance updates
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update super holdings with latest values
      for (const holding of superHoldings) {
        try {
          // Simulate realistic super fund growth (0.05% to 0.2% daily)
          const dailyGrowthRate = (Math.random() * 0.0015) + 0.0005; // 0.05% to 0.2%
          const growth = holding.currentPrice * dailyGrowthRate;
          
          await updateHolding(holding.id, { 
            currentPrice: holding.currentPrice + growth 
          });
        } catch (error) {
          console.error(`Error updating super fund ${holding.id}:`, error);
        }
      }
      
      console.log('Super fund balances refreshed successfully');
    } catch (error) {
      console.error('Error refreshing super data:', error);
      alert('Failed to refresh super fund data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteStock = async (holdingId: string) => {
    if (confirm('Are you sure you want to remove this super fund from your portfolio?')) {
      const result = await deleteHolding(holdingId);
      if (result.error) {
        alert('Error removing super fund: ' + result.error);
      }
    }
  };

  const contributionStrategies = [
    {
      title: 'Salary Sacrifice',
      description: 'Contribute pre-tax dollars to reduce taxable income',
      currentAmount: currentContribution,
      recommendedAmount: currentContribution + 2400,
      taxSaving: 600,
      retirementBoost: 45000,
      priority: 'high'
    },
    {
      title: 'After-tax Contributions',
      description: 'Personal contributions that may qualify for government co-contribution',
      currentAmount: 0,
      recommendedAmount: 1000,
      taxSaving: 0,
      retirementBoost: 18000,
      priority: 'medium'
    },
    {
      title: 'Spouse Contributions',
      description: 'Contribute to spouse\'s super for tax offset',
      currentAmount: 0,
      recommendedAmount: 3000,
      taxSaving: 540,
      retirementBoost: 55000,
      priority: 'medium'
    }
  ];

  const superInsights = [
    {
      type: 'opportunity',
      title: 'Contribution Cap Utilization',
      message: `You're using ${((currentContribution / 27500) * 100).toFixed(0)}% of your concessional cap`,
      action: 'Increase contributions',
      impact: 'High'
    },
    {
      type: 'warning',
      title: 'Insurance Review',
      message: 'Review your super insurance to ensure adequate coverage',
      action: 'Check insurance',
      impact: 'Medium'
    },
    {
      type: 'info',
      title: 'Investment Options',
      message: 'Consider reviewing your super fund\'s investment options',
      action: 'Review options',
      impact: 'Medium'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Super Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={handleRefreshSuper}
              disabled={refreshing}
              className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50 bg-white/50 rounded-lg hover:bg-white/80 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            ${totalSuperValue.toLocaleString()}
          </h3>
          <p className="text-sm text-blue-700">Current Balance</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            ${projectedBalance.toLocaleString()}
          </h3>
          <p className="text-sm text-green-700">Projected at Retirement</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            ${currentContribution.toLocaleString()}
          </h3>
          <p className="text-sm text-purple-700">Annual Contributions</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {yearsToRetirement}
          </h3>
          <p className="text-sm text-orange-700">Years to Retirement</p>
        </div>
      </div>

      {/* Super Holdings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Superannuation Funds</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Super Fund</span>
          </button>
        </div>

        {superHoldings.length > 0 ? (
          <div className="space-y-4">
            {superHoldings.map((superFund) => {
              const currentValue = superFund.quantity * superFund.currentPrice;
              const purchaseValue = superFund.quantity * superFund.purchasePrice;
              const gain = currentValue - purchaseValue;
              const gainPercent = purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0;

              return (
                <div key={superFund.id} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{superFund.name}</h4>
                        <p className="text-sm text-slate-600">
                          {superFund.metadata?.investmentOption || 'Balanced Option'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900">
                        ${currentValue.toLocaleString()}
                      </div>
                      <div className={`text-sm font-medium ${
                        gain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Fund Type</span>
                      <p className="font-medium">{superFund.metadata?.fundType || 'Industry Fund'}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Investment Option</span>
                      <p className="font-medium">{superFund.metadata?.investmentOption || 'Balanced'}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Contribution Rate</span>
                      <p className="font-medium">{superFund.metadata?.contributionRate || 11}%</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Expected Return</span>
                      <p className="font-medium text-green-600">
                        {superFund.metadata?.expectedReturn || 7.5}%
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-200">
                    <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteStock(superFund.id)}
                      className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No superannuation funds tracked</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your super fund
            </button>
          </div>
        )}
      </div>

      {/* Contribution Strategies */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Contribution Optimization</h3>
          <button
            onClick={() => setShowContributionCalculator(!showContributionCalculator)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculator</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contributionStrategies.map((strategy, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900">{strategy.title}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  strategy.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {strategy.priority}
                </span>
              </div>
              
              <p className="text-sm text-slate-600 mb-4">{strategy.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Current</span>
                  <span className="font-medium">${strategy.currentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Recommended</span>
                  <span className="font-medium text-blue-600">${strategy.recommendedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax Saving</span>
                  <span className="font-medium text-green-600">${strategy.taxSaving.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Retirement Boost</span>
                  <span className="font-medium text-purple-600">${strategy.retirementBoost.toLocaleString()}</span>
                </div>
              </div>
              
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Implement Strategy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Super Insights */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Superannuation Insights</h3>
        <div className="space-y-4">
          {superInsights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              insight.type === 'opportunity' ? 'border-green-500 bg-green-50' :
              insight.type === 'warning' ? 'border-orange-500 bg-orange-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {insight.type === 'opportunity' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : insight.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  ) : (
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-medium text-slate-900">{insight.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    insight.impact === 'High' ? 'bg-red-100 text-red-700' :
                    insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {insight.impact}
                  </span>
                  <button className="block mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    {insight.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Super Asset Modal */}
      <SuperAssetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userProfile={userProfile}
      />
    </div>
  );
};