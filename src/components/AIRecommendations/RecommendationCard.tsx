import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, Target, Calculator, Shield, CheckCircle, X } from 'lucide-react';
import { AIRecommendation } from '../../types/portfolioTypes';

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  onApply?: (recommendation: AIRecommendation) => void;
  onDismiss?: (recommendationId: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onApply,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'allocation': return TrendingUp;
      case 'contribution': return Target;
      case 'tax': return Calculator;
      case 'risk': return Shield;
      default: return TrendingUp;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'allocation': return 'blue';
      case 'contribution': return 'green';
      case 'tax': return 'purple';
      case 'risk': return 'orange';
      default: return 'blue';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleApply = async () => {
    if (!onApply) return;
    
    setIsApplying(true);
    try {
      await onApply(recommendation);
    } catch (error) {
      console.error('Error applying recommendation:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const CategoryIcon = getCategoryIcon(recommendation.category);
  const categoryColor = getCategoryColor(recommendation.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 bg-${categoryColor}-100 rounded-lg`}>
              <CategoryIcon className={`w-5 h-5 text-${categoryColor}-600`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{recommendation.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{recommendation.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(recommendation.priority)}`}>
              {recommendation.priority.toUpperCase()}
            </span>
            {onDismiss && (
              <button
                onClick={() => onDismiss(recommendation.id)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Confidence and Impact */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Confidence:</span>
              <div className="flex items-center space-x-1">
                <div className="w-16 bg-slate-200 rounded-full h-2">
                  <div 
                    className={`bg-${categoryColor}-600 h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${recommendation.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {recommendation.confidence}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-slate-600">Impact</div>
            <div className={`text-sm font-semibold text-${categoryColor}-600`}>
              {recommendation.impact}
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="mb-4">
          <div className="text-sm text-slate-600 mb-2">Recommended Action:</div>
          <div className={`p-3 bg-${categoryColor}-50 rounded-lg border border-${categoryColor}-200`}>
            <p className="text-sm font-medium text-slate-900">{recommendation.action}</p>
          </div>
        </div>

        {/* Expandable Reasoning */}
        <div className="border-t border-slate-200 pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-medium text-slate-700">
              Why this recommendation?
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-slate-50 rounded-lg"
            >
              <p className="text-sm text-slate-700">{recommendation.reasoning}</p>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          {onApply && (
            <button
              onClick={handleApply}
              disabled={isApplying}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-${categoryColor}-600 text-white rounded-lg hover:bg-${categoryColor}-700 transition-colors disabled:opacity-50`}
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Apply Recommendation</span>
                </>
              )}
            </button>
          )}
          
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </motion.div>
  );
};