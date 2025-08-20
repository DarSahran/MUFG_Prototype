import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Target, DollarSign, Calendar, BarChart3, Download, Settings, AlertTriangle, CheckCircle, Zap, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from 'recharts';
import { usePortfolio } from '../hooks/usePortfolio';
import { portfolioEngine } from '../utils/portfolioEngine';
import { UserProfile } from '../App';

interface ForecastingToolProps {
  userProfile: UserProfile;
}

export const ForecastingTool: React.FC<ForecastingToolProps> = ({ userProfile }) => {
  const { holdings, getTotalPortfolioValue } = usePortfolio();
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [monteCarloData, setMonteCarloData] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'moderate' | 'optimistic'>('moderate');
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [retirementGoal, setRetirementGoal] = useState(800000);
  const [customInputs, setCustomInputs] = useState({
    initialAmount: getTotalPortfolioValue() || userProfile.currentSuper || 50000,
    monthlyContribution: userProfile.monthlyContribution || 500,
    annualReturn: 7.5,
    inflationRate: 2.5,
    yearsToForecast: (userProfile.retirementAge || 65) - (userProfile.age || 30),
    contributionIncrease: 3.0,
    feeRate: 0.75 // Annual fee percentage
  });

  const scenarios = {
    conservative: { label: 'Conservative', return: 5.5, description: 'Lower risk, steady growth' },
    moderate: { label: 'Moderate', return: 7.5, description: 'Balanced risk and return' },
    optimistic: { label: 'Optimistic', return: 9.5, description: 'Higher risk, maximum growth' },
  };

  useEffect(() => {
    calculateForecast();
    if (showMonteCarlo) {
      runMonteCarloSimulation();
    }
  }, [selectedScenario, customInputs]);

  useEffect(() => {
    // Update initial amount when portfolio value changes
    const currentPortfolioValue = getTotalPortfolioValue();
    if (currentPortfolioValue > 0) {
      setCustomInputs(prev => ({
        ...prev,
        initialAmount: currentPortfolioValue
      }));
    }
  }, [getTotalPortfolioValue()]);
  const calculateForecast = () => {
    try {
      console.log('Calculating forecast with inputs:', customInputs);
      
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
        customInputs.monthlyContribution,
        customInputs.yearsToForecast,
        retirementGoal
      );
      
      // Use the appropriate scenario data
      const scenarioData = selectedScenario === 'conservative' ? projections.pessimistic :
                          selectedScenario === 'optimistic' ? projections.optimistic :
                          projections.baseCase;
      
      setForecastData(scenarioData);
      setMonteCarloData(projections.monteCarlo);
    } catch (error) {
      console.error('Error calculating forecast:', error);
      // Fallback to simple calculation
      console.log('Using fallback calculation method');
      setForecastData(calculateSimpleForecast());
    }
  };

  const calculateSimpleForecast = () => {
    console.log('Calculating simple forecast with scenario:', selectedScenario);
    const scenario = scenarios[selectedScenario];
    const annualReturn = scenario.return / 100;
    const monthlyReturn = annualReturn / 12;
    const data = [];
    let value = customInputs.initialAmount;
    let monthlyContribution = customInputs.monthlyContribution;
    
    for (let year = 0; year <= customInputs.yearsToForecast; year++) {
      if (year > 0) {
        // Apply contribution increases
        monthlyContribution *= (1 + customInputs.contributionIncrease / 100);
        
        for (let month = 0; month < 12; month++) {
          value = value * (1 + monthlyReturn) + monthlyContribution;
        }
        
        // Apply fees
        value *= (1 - customInputs.feeRate / 100);
      }
      
      data.push({
        year: new Date().getFullYear() + year,
        totalValue: Math.round(value),
        contributions: Math.round(customInputs.initialAmount + (monthlyContribution * 12 * year)),
        growth: Math.round(value - (customInputs.initialAmount + (monthlyContribution * 12 * year))),
        fees: Math.round(value * customInputs.feeRate / 100),
      });
    }
    
    console.log('Generated forecast data:', data.slice(0, 3)); // Log first 3 years
    return data;
  };

  const runMonteCarloSimulation = () => {
    console.log('Running Monte Carlo simulation...');
    const data = [];
    const baseValue = customInputs.initialAmount;
    const annualReturn = scenarios[selectedScenario].return / 100;
    const volatility = 0.15; // 15% volatility
    
    for (let year = 1; year <= Math.min(customInputs.yearsToForecast, 10); year++) {
      // Generate multiple scenarios for this year
      const scenarios = [];
      for (let i = 0; i < 1000; i++) {
        let value = baseValue;
        for (let y = 1; y <= year; y++) {
          // Apply random return with volatility
          const randomReturn = annualReturn + (Math.random() - 0.5) * volatility * 2;
          value *= (1 + randomReturn);
          value += customInputs.monthlyContribution * 12;
        }
        scenarios.push(value);
      }
      
      scenarios.sort((a, b) => a - b);
      
      data.push({
        year: new Date().getFullYear() + year,
        percentile10: Math.round(scenarios[Math.floor(scenarios.length * 0.1)]),
        percentile25: Math.round(scenarios[Math.floor(scenarios.length * 0.25)]),
        percentile50: Math.round(scenarios[Math.floor(scenarios.length * 0.5)]),
        percentile75: Math.round(scenarios[Math.floor(scenarios.length * 0.75)]),
        percentile90: Math.round(scenarios[Math.floor(scenarios.length * 0.9)]),
        probabilityOfSuccess: scenarios.filter(v => v >= retirementGoal).length / scenarios.length
      });
    }
    
    console.log('Monte Carlo simulation completed:', data.slice(0, 3));
    setMonteCarloData(data);
  };

  const finalValue = forecastData[forecastData.length - 1]?.totalValue || 0;
  const totalContributions = forecastData[forecastData.length - 1]?.contributions || 0;
  const totalGrowth = finalValue - totalContributions;
  const monthlyRetirementIncome = (finalValue * 0.04) / 12; // 4% withdrawal rule
  const goalAchievementProbability = finalValue >= retirementGoal ? 95 : Math.max(20, 80 - ((retirementGoal - finalValue) / retirementGoal) * 60);

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const renderScenarioComparison = () => {
    const comparisonData = Object.entries(scenarios).map(([key, scenario]) => {
      const annualReturn = scenario.return / 100;
      const monthlyReturn = annualReturn / 12;
      let value = customInputs.initialAmount;
      let monthlyContribution = customInputs.monthlyContribution;
      
      for (let year = 0; year < customInputs.yearsToForecast; year++) {
        for (let month = 0; month < 12; month++) {
          value = value * (1 + monthlyReturn) + monthlyContribution;
        }
        monthlyContribution *= (1 + customInputs.contributionIncrease / 100);
      }
      
      return {
        scenario: scenario.label,
        description: scenario.description,
        value: Math.round(value),
        monthlyIncome: Math.round((value * 0.04) / 12),
        probability: key === 'conservative' ? 85 : key === 'moderate' ? 70 : 55
      };
    });

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Scenario Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisonData.map((data, index) => (
            <div key={data.scenario} className={`p-4 rounded-lg border-2 ${
              index === 0 ? 'border-red-200 bg-red-50 hover:border-red-300' :
              index === 1 ? 'border-blue-200 bg-blue-50 hover:border-blue-300' :
              'border-green-200 bg-green-50 hover:border-green-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{data.scenario.split('(')[0]}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  index === 0 ? 'bg-red-100 text-red-700' :
                  index === 1 ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {data.probability}% likely
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">{data.description}</p>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-slate-600">Final Value</span>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(data.value)}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Monthly Income</span>
                  <p className="text-lg font-semibold text-slate-700">{formatCurrency(data.monthlyIncome)}</p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className={`flex items-center space-x-1 text-xs ${
                    data.value >= retirementGoal ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {data.value >= retirementGoal ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    <span>{data.value >= retirementGoal ? 'Goal Achieved' : 'Below Goal'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonteCarloChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Monte Carlo Simulation</h3>
          <p className="text-sm text-slate-600">1,000 scenarios showing range of possible outcomes</p>
        </div>
        <button
          onClick={() => setShowMonteCarlo(!showMonteCarlo)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            showMonteCarlo ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{showMonteCarlo ? 'Hide' : 'Show'} Simulation</span>
        </button>
      </div>
      
      {showMonteCarlo && (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monteCarloData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'percentile50' ? 'Median Outcome' :
                  name === 'percentile10' ? '10th Percentile' :
                  name === 'percentile90' ? '90th Percentile' :
                  name
                ]}
                labelFormatter={(label) => `Year: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="percentile90"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="percentile10"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.1}
              />
              <Line
                type="monotone"
                dataKey="percentile50"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                name="Total Portfolio Value"
              />
              <Bar
                dataKey="probabilityOfSuccess"
                fill="#8b5cf6"
                opacity={0.3}
                yAxisId="right"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
        
      {/* Forecast Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Scenario Analysis</h4>
          <p className="text-sm text-blue-700">
            {selectedScenario === 'conservative' ? 'Lower risk approach with steady, predictable growth' :
             selectedScenario === 'moderate' ? 'Balanced strategy with moderate risk and solid returns' :
             'Higher risk strategy targeting maximum long-term growth'}
          </p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Key Metrics</h4>
          <div className="space-y-1 text-sm text-green-700">
            <div>Expected Return: {scenarios[selectedScenario].return}%</div>
            <div>Final Value: {formatCurrency(finalValue)}</div>
            <div>Total Growth: {formatCurrency(totalGrowth)}</div>
          </div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">Retirement Income</h4>
          <div className="space-y-1 text-sm text-purple-700">
            <div>Monthly Income: {formatCurrency(monthlyRetirementIncome)}</div>
            <div>Goal Achievement: {goalAchievementProbability.toFixed(0)}%</div>
            <div>Years to Goal: {customInputs.yearsToForecast}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Investment Forecasting Tool</h1>
          <p className="text-slate-600">Advanced portfolio projections and scenario analysis</p>
        </div>

        {/* Scenario Comparison */}
        {renderScenarioComparison()}

        {/* Monte Carlo Chart */}
        {renderMonteCarloChart()}

        {/* Main Forecast Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Portfolio Forecast</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span>Scenario:</span>
                <span className="font-medium capitalize text-blue-600">{selectedScenario}</span>
              </div>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="conservative">Conservative (5.5% return)</option>
                <option value="moderate">Moderate (7.5% return)</option>
                <option value="optimistic">Optimistic (9.5% return)</option>
              </select>
              <button
                onClick={calculateForecast}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recalculate</span>
              </button>
            </div>
          </div>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  stroke="#64748b"
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'totalValue' ? 'Portfolio Value' :
                    name === 'contributions' ? 'Total Contributions' :
                    name === 'growth' ? 'Investment Growth' : name
                  ]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="contributions"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="growth"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.8}
                />
                <Line
                  type="monotone"
                  dataKey="totalValue"
                  stroke="#1f2937"
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};