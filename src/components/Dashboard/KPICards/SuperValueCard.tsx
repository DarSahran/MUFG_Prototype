import React from 'react';
import { motion } from 'framer-motion';
import { Target, Plus } from 'lucide-react';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 sm:p-3 bg-green-100 rounded-lg group-hover:scale-110 transition-transform duration-200">
          <Target className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex items-center space-x-1">
          <Plus className="w-4 h-4 text-green-600" />
          <span className="text-xs sm:text-sm font-medium text-green-600">
            ${annualContribution.toLocaleString()}/year
          </span>
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
        ${value.toLocaleString()}
      </h3>
      <p className="text-sm text-slate-600">Superannuation Balance</p>
      
      {/* Monthly contribution indicator */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Monthly: ${monthlyContribution.toLocaleString()}</span>
        <span>Growing</span>
      </div>
    </motion.div>
  );
};