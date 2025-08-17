import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, Target, DollarSign, Sliders, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PerformanceLineChart } from './charts/PerformanceLineChart';
import { calculationEngine } from '../services/calculationEngine';
import { AssetHolding } from '../types/portfolio';

const scenarioSchema = z.object({
  monthlyContribution: z.number().min(0).max(10000),
  retirementAge: z.number().min(50).max(80),
  additionalInvestment: z.number().min(0).max(1000000),
  riskProfile: z.enum(['conservative', 'balanced', 'aggressive']),
});

type ScenarioForm = z.infer<typeof scenarioSchema>;

interface WhatIfScenarioProps {
  holdings: AssetHolding[];
  currentAge: number;
  currentContribution: number;
  currentRetirementAge: number;
  onClose?: () => void;
}

export const WhatIfScenario: React.FC<WhatIfScenarioProps> = ({
  holdings,
  currentAge,
  currentContribution,
  currentRetirementAge,
  onClose,
}) => {
  const [scenarioResults, setScenarioResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    register,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ScenarioForm>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      monthlyContribution: currentContribution,
      retirementAge: currentRetirementAge,
      additionalInvestment: 0,
      riskProfile: 'balanced',
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    const calculateScenario = async () => {
      setIsCalculating(true);
      try {
        const results = calculationEngine.calculateWhatIfScenario(holdings, {
          monthlyContribution: watchedValues.monthlyContribution,
          retirementAge: watchedValues.retirementAge,
          riskProfile: watchedValues.riskProfile,
          additionalInvestment: watchedValues.additionalInvestment,
        });
        setScenarioResults(results);
      } catch (error) {
        console.error('Error calculating scenario:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    const debounceTimer = setTimeout(calculateScenario, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedValues, holdings]);

  const resetToDefaults = () => {
    reset({
      monthlyContribution: currentContribution,
      retirementAge: currentRetirementAge,
      additionalInvestment: 0,
      riskProfile: 'balanced',
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const getDifference = (current: number, whatIf: number) => {
    const diff = whatIf - current;
    const percentage = current > 0 ? (diff / current) * 100 : 0;
    return { diff, percentage };
  };

  const currentFinalValue = scenarioResults?.current[scenarioResults.current.length - 1]?.totalValue || 0;
  const whatIfFinalValue = scenarioResults?.whatIf[scenarioResults.whatIf.length - 1]?.totalValue || 0;
  const { diff: valueDiff, percentage: valuePercentage } = getDifference(currentFinalValue, whatIfFinalValue);

  const chartData = scenarioResults ? [
    {
      id: 'Current Plan',
      color: '#64748b',
      data: scenarioResults.current.map((point: any) => ({
        x: point.year,
        y: point.totalValue,
      })),
    },
    {
      id: 'What-If Scenario',
      color: '#3b82f6',
      data: scenarioResults.whatIf.map((point: any) => ({
        x: point.year,
        y: point.totalValue,
      })),
    },
  ] : [];

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
                <p className="text-slate-600">Explore how changes to your strategy impact your retirement outcome</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetToDefaults}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
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
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="50"
                        {...register('monthlyContribution', { valueAsNumber: true })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>$0</span>
                        <span className="font-semibold text-blue-600">
                          ${watchedValues.monthlyContribution?.toLocaleString()}
                        </span>
                        <span>$5,000</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Retirement Age
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="55"
                        max="75"
                        step="1"
                        {...register('retirementAge', { valueAsNumber: true })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>55</span>
                        <span className="font-semibold text-blue-600">
                          {watchedValues.retirementAge} years
                        </span>
                        <span>75</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      One-time Investment
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100000"
                        step="1000"
                        {...register('additionalInvestment', { valueAsNumber: true })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>$0</span>
                        <span className="font-semibold text-blue-600">
                          ${watchedValues.additionalInvestment?.toLocaleString()}
                        </span>
                        <span>$100K</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Risk Profile
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['conservative', 'balanced', 'aggressive'].map((profile) => (
                        <button
                          key={profile}
                          type="button"
                          onClick={() => setValue('riskProfile', profile as any)}
                          className={`p-3 text-xs font-medium rounded-lg border-2 transition-all ${
                            watchedValues.riskProfile === profile
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {profile.charAt(0).toUpperCase() + profile.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Impact Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Retirement Value Change</span>
                    <div className="text-right">
                      <div className={`font-bold ${valueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {valueDiff >= 0 ? '+' : ''}{formatCurrency(valueDiff)}
                      </div>
                      <div className={`text-xs ${valueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {valueDiff >= 0 ? '+' : ''}{valuePercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Monthly Income Change</span>
                    <div className="text-right">
                      <div className={`font-bold ${valueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {valueDiff >= 0 ? '+' : ''}{formatCurrency(valueDiff * 0.04 / 12)}
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
                  <div className={`text-sm ${valueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {valueDiff >= 0 ? '+' : ''}{formatCurrency(valueDiff)} vs current plan
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
                      <p className="text-sm text-slate-600">Years to Goal</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {watchedValues.retirementAge - currentAge}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Investment timeline
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
                
                <AnimatePresence mode="wait">
                  {scenarioResults && (
                    <motion.div
                      key="chart"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <PerformanceLineChart
                        data={chartData}
                        height={400}
                        showArea={true}
                        yAxisLabel="Portfolio Value"
                        xAxisLabel="Year"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </motion.div>
  );
};