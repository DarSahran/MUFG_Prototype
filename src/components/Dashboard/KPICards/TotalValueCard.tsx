import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 sm:p-3 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-200">
          <DollarSign className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex items-center space-x-1">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-xs sm:text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
        ${value.toLocaleString()}
      </h3>
      <p className="text-sm text-slate-600">Total Portfolio Value</p>
      
      {/* Progress indicator */}
      <div className="mt-3 w-full bg-slate-200 rounded-full h-1">
        <div 
          className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min((value / 1000000) * 100, 100)}%` }}
        />
      </div>
    </motion.div>
  );
};