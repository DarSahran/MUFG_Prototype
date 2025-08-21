import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TotalValueCardProps {
  value: number;
  change: number;
  inView: boolean;
  delay: number;
}

export const TotalValueCard: React.FC<TotalValueCardProps> = ({
  value,
  change,
  inView,
  delay
}) => {
  const isPositive = change >= 0;
  const isNeutral = Math.abs(change) < 0.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.6, type: "spring", stiffness: 100 }}
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <motion.div 
            className={`p-3 rounded-lg ${
              isPositive ? 'bg-green-100' : isNeutral ? 'bg-blue-100' : 'bg-red-100'
            }`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <DollarSign className={`w-5 h-5 ${
              isPositive ? 'text-green-600' : isNeutral ? 'text-blue-600' : 'text-red-600'
            }`} />
          </motion.div>
          <div>
            <h3 className="text-sm font-medium text-slate-600">Total Portfolio Value</h3>
            <p className="text-xs text-slate-500">All investments combined</p>
          </div>
        </div>
        <motion.div 
          className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-50 text-green-700' : 
            isNeutral ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
          }`}
          initial={{ opacity: 0, x: 10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: delay + 0.2 }}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : isNeutral ? (
            <Activity className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
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
        <div className="text-sm text-slate-600">
          {isPositive ? 'Strong performance' : isNeutral ? 'Stable value' : 'Needs attention'}
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-600">
          <span>Performance</span>
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={inView ? { width: `${Math.min(Math.abs(change) * 10, 100)}%` } : {}}
            transition={{ delay: delay + 0.5, duration: 1.2, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isPositive ? 'bg-gradient-to-r from-green-500 to-green-600' : 
              isNeutral ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
              'bg-gradient-to-r from-red-500 to-red-600'
            }`}
          />
        </div>
      </div>

      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10" />
    </motion.div>
  );
};
