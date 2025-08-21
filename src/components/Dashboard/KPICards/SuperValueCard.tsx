import React from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, TrendingUp, Calendar } from 'lucide-react';

interface SuperValueCardProps {
  value: number;
  monthlyContribution: number;
  inView: boolean;
  delay: number;
}

export const SuperValueCard: React.FC<SuperValueCardProps> = ({
  value,
  monthlyContribution,
  inView,
  delay
}) => {
  const annualContribution = monthlyContribution * 12;
  const projectedGrowth = 0.075; // 7.5% annual growth
  const nextYearValue = value * (1 + projectedGrowth) + annualContribution;
  const yearlyGrowth = nextYearValue - value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.6, type: "spring", stiffness: 100 }}
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 group overflow-hidden relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <motion.div 
            className="p-3 bg-green-100 rounded-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Target className="w-5 h-5 text-green-600" />
          </motion.div>
          <div>
            <h3 className="text-sm font-medium text-slate-600">Superannuation Balance</h3>
            <p className="text-xs text-slate-500">Retirement savings</p>
          </div>
        </div>
        <motion.div 
          className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-full"
          initial={{ opacity: 0, x: 10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: delay + 0.2 }}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-semibold">+{((yearlyGrowth / value) * 100).toFixed(1)}%</span>
        </motion.div>
      </div>

      {/* Value */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.3, duration: 0.8 }}
        className="mb-4"
      >
        <div className="text-3xl font-bold text-slate-900 mb-1">
          ${value.toLocaleString()}
        </div>
        <div className="text-sm text-green-600 font-medium">
          +${annualContribution.toLocaleString()}/year contributing
        </div>
      </motion.div>

      {/* Contribution Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Monthly Contribution</span>
          </div>
          <span className="text-sm font-semibold text-green-700">
            ${monthlyContribution.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">Next Year Projection</span>
          </div>
          <span className="text-sm font-semibold text-blue-700">
            ${Math.round(nextYearValue).toLocaleString()}
          </span>
        </div>
      </div>



      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <Target className="w-full h-full text-green-600" />
      </div>
    </motion.div>
  );
};
