import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, RefreshCw, Filter, TrendingUp, Target, Calculator, Shield } from 'lucide-react';
import { RecommendationCard } from './RecommendationCard';
import { contextualAdvisor } from '../../services/aiAdvisor/ContextualAdvisor';
import { usePortfolio } from '../../hooks/usePortfolio';
import { AIRecommendation } from '../../types/portfolioTypes';
import { UserProfile } from '../../App';

interface AIRecommendationsProps {
  userProfile: UserProfile;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ userProfile }) => {
  const { holdings } = usePortfolio();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'allocation' | 'contribution' | 'tax' | 'risk'>('all');
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, [holdings, userProfile]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Convert holdings to unified assets
      const unifiedAssets = holdings.map(holding => ({
        id: holding.id,
        type: holding.type,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        purchasePrice: holding.purchasePrice,
        currentPrice: holding.currentPrice,
        value: holding.quantity * holding.currentPrice,
        currency: holding.currency,
        region: holding.region,
        exchange: holding.exchange,
        purchaseDate: holding.purchaseDate,
        expectedReturn: 0.075,
        volatility: 0.15,
        metadata: holding.metadata || {},
      }));

      const aiRecommendations = await contextualAdvisor.generateRecommendations(
        unifiedAssets,
        userProfile
      );

      setRecommendations(aiRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async (recommendation: AIRecommendation) => {
    try {
      // Simulate applying recommendation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAppliedRecommendations(prev => [...prev, recommendation.id]);
      
      // Show success message
      alert(`Recommendation "${recommendation.title}" has been applied successfully!`);
    } catch (error) {
      console.error('Error applying recommendation:', error);
      alert('Failed to apply recommendation. Please try again.');
    }
  };

  const handleDismissRecommendation = (recommendationId: string) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
  };

  const filteredRecommendations = recommendations.filter(rec => 
    selectedCategory === 'all' || rec.category === selectedCategory
  ).filter(rec => !appliedRecommendations.includes(rec.id));

  const categories = [
    { id: 'all', label: 'All Recommendations', icon: Bot },
    { id: 'allocation', label: 'Asset Allocation', icon: TrendingUp },
    { id: 'contribution', label: 'Contributions', icon: Target },
    { id: 'tax', label: 'Tax Optimization', icon: Calculator },
    { id: 'risk', label: 'Risk Management', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Recommendations</h1>
              <p className="text-slate-600">
                Personalized investment advice for your ${holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0).toLocaleString()} portfolio
              </p>
            </div>
            <button
              onClick={loadRecommendations}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Filter by Category</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const count = category.id === 'all' 
                ? filteredRecommendations.length 
                : recommendations.filter(rec => rec.category === category.id).length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                  {count > 0 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recommendations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRecommendations.map((recommendation, index) => (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <RecommendationCard
                  recommendation={recommendation}
                  onApply={handleApplyRecommendation}
                  onDismiss={handleDismissRecommendation}
                />
              </motion.div>
            ))}
          </div>
        )}

        {filteredRecommendations.length === 0 && !loading && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {selectedCategory === 'all' 
                ? 'No recommendations available' 
                : `No ${selectedCategory} recommendations`}
            </h3>
            <p className="text-slate-600 mb-4">
              {appliedRecommendations.length > 0 
                ? 'Great job! You\'ve applied recent recommendations.' 
                : 'Your portfolio looks well-optimized.'}
            </p>
            <button
              onClick={loadRecommendations}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Check for new recommendations
            </button>
          </div>
        )}

        {/* Applied Recommendations Summary */}
        {appliedRecommendations.length > 0 && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">
                Applied Recommendations ({appliedRecommendations.length})
              </h3>
            </div>
            <p className="text-sm text-green-700">
              You've successfully implemented {appliedRecommendations.length} AI recommendations. 
              Keep monitoring your portfolio for new optimization opportunities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};