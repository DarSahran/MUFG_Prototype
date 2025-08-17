import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, X, TrendingUp, Target, DollarSign, Sliders } from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { portfolioEngine } from '../../utils/portfolioEngine';
import { AssetHolding } from '../../types/portfolio';
import { UserProfile } from '../../App';

interface ScenarioPanelProps {
  holdings: AssetHolding[];
  userProfile: UserProfile;
  onClose: () => void;
}

export const ScenarioPanel: React.FC<ScenarioPanelProps> = ({
  holdings,
  userProfile,
  onClose,
}) => {
  const [scenarioInputs, setScenarioInputs] = useState({
    monthlyContribution: userProfile.monthlyContribution,
    retirementAge: userProfile.retirementAge,
    additionalInvestment: 0,
    riskProfile: userProfile.riskTolerance,
  });

  const [scenarioResults, setScenarioResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    calculateScenario();
  }, [scenarioInputs]);

  const calculateScenario = async () => {
    setIsCalculating(true);
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

      const results = portfolioEngine.calculateWhatIfScenario(
        unifiedAssets,
        {
          monthlyContribution: scenarioInputs.monthlyContribution,
          retirementAge: scenarioInputs.retirementAge,
          additionalInvestment: scenarioInputs.additionalInvestment,
        },
        userProfile.age
      );

      setScenarioResults(results);
    } catch (error) {
      console.error('Error calculating scenario:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = (field: string, value: number) => {
    setScenarioInputs(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const currentFinalValue = scenarioResults?.current[scenarioResults.current.length - 1]?.totalValue || 0;
  const whatIfFinalValue = scenarioResults?.whatIf[scenarioResults.whatIf.length - 1]?.totalValue || 0;
  const valueDifference = whatIfFinalValue - currentFinalValue;
  const percentageDifference = currentFinalValue > 0 ? (valueDifference / currentFinalValue) * 100 : 0;

  const chartData = scenarioResults ? 
    scenarioResults.current.map((currentPoint: any, index: number) => ({
      year: currentPoint.year,
      current: currentPoint.totalValue,
      whatIf: scenarioResults.whatIf[index]?.totalValue || 0,
    })) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">What-If Scenario Analysis</h2>
                <p className="text-slate-600">Explore how changes impact your retirement outcome</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sliders className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Scenario Parameters</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Monthly Contribution
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="50"
                      value={scenarioInputs.monthlyContribution}
                      onChange={(e) => handleInputChange('monthlyContribution', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>$0</span>
                      <span className="font-semibold text-blue-600">
                        ${scenarioInputs.monthlyContribution.toLocaleString()}
                      </span>
                      <span>$5,000</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Retirement Age
                    </label>
                    <input
                      type="range"
                      min="55"
                      max="75"
                      step="1"
                      value={scenarioInputs.retirementAge}
                      onChange={(e) => handleInputChange('retirementAge', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>55</span>
                      <span className="font-semibold text-blue-600">
                        {scenarioInputs.retirementAge} years
                      </span>
                      <span>75</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Additional Investment
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="1000"
                      value={scenarioInputs.additionalInvestment}
                      onChange={(e) => handleInputChange('additionalInvestment', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>$0</span>
                      <span className="font-semibold text-blue-600">
                        ${scenarioInputs.additionalInvestment.toLocaleString()}
                      </span>
                      <span>$100K</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Impact Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Value Change</span>
                    <div className="text-right">
                      <div className={`font-bold ${valueDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {valueDifference >= 0 ? '+' : ''}{formatCurrency(valueDifference)}
                      </div>
                      <div className={`text-xs ${valueDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {valueDifference >= 0 ? '+' : ''}{percentageDifference.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Monthly Income Change</span>
                    <div className="text-right">
                      <div className={`font-bold ${valueDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {valueDifference >= 0 ? '+' : ''}{formatCurrency(valueDifference * 0.04 / 12)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Years to Goal</span>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        {scenarioInputs.retirementAge - userProfile.age}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Final Value</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(whatIfFinalValue)}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm ${valueDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {valueDifference >= 0 ? '+' : ''}{formatCurrency(valueDifference)} vs current
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Monthly Income</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency((whatIfFinalValue * 0.04) / 12)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    4% withdrawal rule
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Time to Goal</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {scenarioInputs.retirementAge - userProfile.age}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Years remaining
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Projection Comparison</h3>
                  {isCalculating && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Calculating...</span>
                    </div>
                  )}
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="year"
                        stroke="#64748b"
                        fontSize={12}
                      />
                      <YAxis 
                        tickFormatter={formatCurrency}
                        stroke="#64748b"
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value), 
                          name === 'current' ? 'Current Plan' : 'What-If Scenario'
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
                      
                      <Area
                        type="monotone"
                        dataKey="current"
                        stroke="#64748b"
                        fill="#64748b"
                        fillOpacity={0.1}
                        name="Current Plan"
                      />
                      
                      <Line
                        type="monotone"
                        dataKey="whatIf"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={false}
                        name="What-If Scenario"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Scenario Insights */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Key Changes</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Monthly contribution: ${scenarioInputs.monthlyContribution.toLocaleString()}</li>
                      <li>• Retirement age: {scenarioInputs.retirementAge}</li>
                      <li>• Additional investment: ${scenarioInputs.additionalInvestment.toLocaleString()}</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Impact</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Value difference: {formatCurrency(Math.abs(valueDifference))}</li>
                      <li>• Percentage change: {Math.abs(percentageDifference).toFixed(1)}%</li>
                      <li>• Monthly income change: {formatCurrency(Math.abs(valueDifference) * 0.04 / 12)}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};