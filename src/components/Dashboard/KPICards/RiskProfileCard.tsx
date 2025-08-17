import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

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
  const getRiskColor = (profile: string) => {
    switch (profile) {
      case 'conservative': return { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle };
      case 'balanced': return { bg: 'bg-blue-100', text: 'text-blue-600', icon: Shield };
      case 'growth': return { bg: 'bg-orange-100', text: 'text-orange-600', icon: AlertTriangle };
      case 'aggressive': return { bg: 'bg-red-100', text: 'text-red-600', icon: AlertTriangle };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: Shield };
    }
  };

  const riskConfig = getRiskColor(riskProfile);
  const RiskIcon = riskConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 sm:p-3 ${riskConfig.bg} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
          <RiskIcon className={`w-6 h-6 ${riskConfig.text}`} />
        </div>
        <span className="text-xs sm:text-sm font-medium text-slate-600">
          Score: {riskScore}/100
        </span>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 capitalize">
        {riskProfile}
      </h3>
      <p className="text-sm text-slate-600">Risk Profile</p>
      
      {/* Risk level indicator */}
      <div className="mt-3 w-full bg-slate-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-1000 ${
            riskProfile === 'conservative' ? 'bg-green-600' :
            riskProfile === 'balanced' ? 'bg-blue-600' :
            riskProfile === 'growth' ? 'bg-orange-600' : 'bg-red-600'
          }`}
          style={{ width: `${riskScore}%` }}
        />
      </div>
    </motion.div>
  );
};