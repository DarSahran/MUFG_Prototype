import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, TrendingDown, Activity } from 'lucide-react';

interface RiskProfileCardProps {
  riskProfile: string;
  riskScore: number;
  inView: boolean;
  delay: number;
}

export const RiskProfileCard: React.FC<RiskProfileCardProps> = ({
  riskProfile,
  riskScore,
  inView,
  delay
}) => {
  const getRiskConfig = (profile: string) => {
    switch (profile.toLowerCase()) {
      case 'conservative': 
        return { 
          bg: 'bg-green-100', 
          text: 'text-green-600', 
          icon: CheckCircle, 
          color: 'green',
          description: 'Low risk, steady growth',
          recommendation: 'Safe investments'
        };
      case 'balanced': 
        return { 
          bg: 'bg-blue-100', 
          text: 'text-blue-600', 
          icon: Shield, 
          color: 'blue',
          description: 'Moderate risk & returns',
          recommendation: 'Diversified portfolio'
        };
      case 'growth': 
        return { 
          bg: 'bg-orange-100', 
          text: 'text-orange-600', 
          icon: Activity, 
          color: 'orange',
          description: 'Higher risk & returns',
          recommendation: 'Growth-focused'
        };
      case 'aggressive': 
        return { 
          bg: 'bg-red-100', 
          text: 'text-red-600', 
          icon: AlertTriangle, 
          color: 'red',
          description: 'High risk, high reward',
          recommendation: 'Monitor closely'
        };
      default: 
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-600', 
          icon: Shield, 
          color: 'gray',
          description: 'Balanced approach',
          recommendation: 'Review strategy'
        };
    }
  };

  const riskConfig = getRiskConfig(riskProfile);
  const RiskIcon = riskConfig.icon;

  const getRiskLevel = (score: number) => {
    if (score <= 30) return 'Low';
    if (score <= 60) return 'Medium';
    if (score <= 80) return 'High';
    return 'Very High';
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'from-green-500 to-green-600';
    if (score <= 60) return 'from-blue-500 to-blue-600';
    if (score <= 80) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

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
            className={`p-3 ${riskConfig.bg} rounded-lg`}
            whileHover={{ scale: 1.05, rotate: 10 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <RiskIcon className={`w-5 h-5 ${riskConfig.text}`} />
          </motion.div>
          <div>
            <h3 className="text-sm font-medium text-slate-600">Risk Profile</h3>
            <p className="text-xs text-slate-500">{riskConfig.description}</p>
          </div>
        </div>
        <motion.div 
          className={`flex items-center space-x-1 px-2 py-1 ${riskConfig.bg} ${riskConfig.text} rounded-full`}
          initial={{ opacity: 0, x: 10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: delay + 0.2 }}
        >
          <span className="text-sm font-semibold">{getRiskLevel(riskScore)}</span>
        </motion.div>
      </div>

      {/* Value */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.3, duration: 0.8 }}
        className="mb-4"
      >
        <div className="text-3xl font-bold text-slate-900 mb-1 capitalize">
          {riskProfile}
        </div>
        <div className={`text-sm font-medium ${riskConfig.text}`}>
          Score: {riskScore}/100
        </div>
      </motion.div>

      {/* Risk Metrics */}
      <div className="space-y-3">
        <div className={`flex items-center justify-between p-3 ${riskConfig.bg} rounded-lg`}>
          <span className={`text-sm ${riskConfig.text}`}>Risk Level</span>
          <span className={`text-sm font-semibold ${riskConfig.text}`}>
            {getRiskLevel(riskScore)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-sm text-slate-700">Recommendation</span>
          <span className="text-sm font-semibold text-slate-700">
            {riskConfig.recommendation}
          </span>
        </div>
      </div>

      {/* Risk Score Indicator */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-600 mb-2">
          <span>Risk Score</span>
          <span>{riskScore}/100</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={inView ? { width: `${riskScore}%` } : {}}
            transition={{ delay: delay + 0.5, duration: 1.2, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${getRiskColor(riskScore)} rounded-full`}
          />
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <RiskIcon className={`w-full h-full ${riskConfig.text}`} />
      </div>
    </motion.div>
  );
};
