import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';
import { UserProfile } from '../../../App';

interface ProjectedIncomeCardProps {
  userProfile: UserProfile;
  portfolioValue: number;
  inView: boolean;
  delay: number;
}

export const ProjectedIncomeCard: React.FC<ProjectedIncomeCardProps> = ({ 
  userProfile, 
  portfolioValue, 
  inView, 
  delay 
}) => {
  const yearsToRetirement = userProfile.retirementAge - userProfile.age;
  const projectedBalance = Math.round(
    portfolioValue + 
    (userProfile.monthlyContribution * 12 * yearsToRetirement * 1.07)
  );
  const monthlyIncome = Math.round(projectedBalance * 0.04 / 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 sm:p-3 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform duration-200">
          <TrendingUp className="w-6 h-6 text-purple-600" />
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span className="text-xs sm:text-sm font-medium text-purple-600">
            {yearsToRetirement} years
          </span>
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
        ${monthlyIncome.toLocaleString()}
      </h3>
      <p className="text-sm text-slate-600">Projected Monthly Income</p>
      
      {/* Retirement timeline */}
      <div className="mt-3 w-full bg-slate-200 rounded-full h-1">
        <div 
          className="bg-purple-600 h-1 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(((40 - yearsToRetirement) / 40) * 100, 100)}%` }}
        />
      </div>
    </motion.div>
  );
};