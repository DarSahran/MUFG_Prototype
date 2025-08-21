import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Clock, Target } from 'lucide-react';
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
  const yearsToRetirement = Math.max(userProfile.retirementAge - userProfile.age, 0);
  const projectedBalance = Math.round(
    portfolioValue * Math.pow(1.07, yearsToRetirement) +
    (userProfile.monthlyContribution * 12 * yearsToRetirement * 1.07)
  );
  const monthlyIncome = Math.round(projectedBalance * 0.04 / 12);
  const weeklyIncome = Math.round(monthlyIncome / 4.33);

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
            className="p-3 bg-purple-100 rounded-lg"
            whileHover={{ scale: 1.05, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </motion.div>
          <div>
            <h3 className="text-sm font-medium text-slate-600">Projected Monthly Income</h3>
            <p className="text-xs text-slate-500">At retirement age {userProfile.retirementAge}</p>
          </div>
        </div>
        <motion.div 
          className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full"
          initial={{ opacity: 0, x: 10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: delay + 0.2 }}
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">{yearsToRetirement} years</span>
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
          ${monthlyIncome.toLocaleString()}
        </div>
        <div className="text-sm text-purple-600 font-medium">
          per month (${weeklyIncome.toLocaleString()}/week)
        </div>
      </motion.div>

      {/* Retirement Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">Projected Balance</span>
          </div>
          <span className="text-sm font-semibold text-purple-700">
            ${projectedBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">Withdrawal Rate</span>
          </div>
          <span className="text-sm font-semibold text-blue-700">4.0% annually</span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-600 mb-2">
          <span>Retirement Progress</span>
          <span>{Math.round(((userProfile.age - 25) / (userProfile.retirementAge - 25)) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={inView ? { 
              width: `${Math.min(((userProfile.age - 25) / (userProfile.retirementAge - 25)) * 100, 100)}%` 
            } : {}}
            transition={{ delay: delay + 0.5, duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
          />
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <TrendingUp className="w-full h-full text-purple-600" />
      </div>
    </motion.div>
  );
};
