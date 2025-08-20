import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, AlertCircle, Star, RefreshCw, MessageCircle, BarChart3, PieChart, Calculator } from 'lucide-react';
import { AIAdvisorInterface } from './AIAdvisor/AIAdvisorInterface';
import { RealTimeMarketDashboard } from './MarketData/RealTimeMarketDashboard';
import { serperService, InvestmentRecommendation, MarketInsight } from '../services/serperService';
import { marketDataService } from '../services/marketData';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAIAdvisor } from '../hooks/useAIAdvisor';
import { UserProfile } from '../App';

interface CombinedAIProps {
  userProfile: UserProfile;
}

export const CombinedAI: React.FC<CombinedAIProps> = ({ userProfile }) => {
  const { usageInfo } = useAIAdvisor();
  const { getTotalPortfolioValue } = usePortfolio();
  
  // Recommendations/Insights State
  const [recommendations, setRecommendations] = useState<InvestmentRecommendation[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'ai-chat' | 'market-data' | 'recommendations' | 'insights'>('ai-chat');
  
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load AI Data and setup cooldown
  useEffect(() => { 
    initializeRefreshState();
    loadAIData(); 
  }, [userProfile]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const initializeRefreshState = () => {
    const lastRefresh = localStorage.getItem('lastAIRefresh');
    if (lastRefresh) {
      const timeSinceRefresh = Date.now() - parseInt(lastRefresh);
      const cooldownTime = 2 * 60 * 1000; // 2 minutes
      
      if (timeSinceRefresh < cooldownTime) {
        const remainingCooldown = Math.ceil((cooldownTime - timeSinceRefresh) / 1000);
        setRefreshCooldown(remainingCooldown);
        startCooldownTimer(remainingCooldown);
      }
    }
  };

  const startCooldownTimer = (seconds: number) => {
    setRefreshCooldown(seconds);
    
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    
    cooldownTimerRef.current = setInterval(() => {
      setRefreshCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadAIData = async (forceRefresh = false) => {
    // Check cooldown unless forced
    if (!forceRefresh && refreshCooldown > 0) {
      alert(`Please wait ${Math.ceil(refreshCooldown / 60)} more minutes before refreshing.`);
      return;
    }

    setLoading(true);
    
    try {
      // Set cooldown immediately when refresh starts
      if (!forceRefresh) {
        localStorage.setItem('lastAIRefresh', Date.now().toString());
        startCooldownTimer(120); // 2 minutes
      }

      const marketData = await Promise.all([
        marketDataService.getStockQuote('VAS.AX'),
        marketDataService.getStockQuote('VGS.AX'),
        marketDataService.getStockQuote('VAF.AX'),
        marketDataService.getStockQuote('VGE.AX'),
      ]);
      const validMarketData = marketData.filter(Boolean).length > 0 
        ? marketData.filter(Boolean) 
        : [
            marketDataService.getMockStockData('VAS.AX'),
            marketDataService.getMockStockData('VGS.AX'),
            marketDataService.getMockStockData('VAF.AX'),
            marketDataService.getMockStockData('VGE.AX'),
          ];
      const [aiRecommendations, aiInsights] = await Promise.all([
        serperService.getInvestmentRecommendations(userProfile, validMarketData),
        serperService.getMarketInsights(validMarketData, userProfile)
      ]);
      setRecommendations(aiRecommendations);
      setInsights(aiInsights);
      
    } catch (error) {
      console.error('Error loading AI data:', error);
      
      // If error due to rate limiting, show helpful message
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        alert('Rate limit exceeded. Please wait before making more requests.');
      }
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'bg-green-100 text-green-700 border-green-200';
      case 'HOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'SELL': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderRecommendations = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{rec.symbol}</h3>
                    <p className="text-sm text-slate-600">{rec.name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(rec.riskLevel)}`}>
                      {rec.riskLevel}
                    </span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-xs sm:text-sm font-medium text-slate-600 ml-1">{rec.confidence}%</span>
                    </div>
                  </div>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border-2 mb-4 ${getRecommendationColor(rec.recommendation)}`}>
                  {rec.recommendation === 'BUY' && <TrendingUp className="w-4 h-4 mr-1" />}
                  {rec.recommendation === 'HOLD' && <Target className="w-4 h-4 mr-1" />}
                  {rec.recommendation === 'SELL' && <AlertCircle className="w-4 h-4 mr-1" />}
                  {rec.recommendation}
                </div>
                <p className="text-slate-700 text-xs sm:text-sm mb-4">{rec.reasoning}</p>
                <div className="space-y-2 text-sm">
                  {rec.targetPrice && typeof rec.targetPrice === 'number' && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Target Price:</span>
                      <span className="font-medium text-slate-900">${rec.targetPrice.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-xs sm:text-sm">Time Horizon:</span>
                    <span className="font-medium text-slate-900 text-xs sm:text-sm">{rec.timeHorizon}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <div className="flex space-x-2">
                    <button className="p-1 text-green-600 hover:text-green-700">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:text-red-700">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          {recommendations.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No recommendations available</h3>
              <p className="text-slate-600">Try refreshing to get new AI-powered investment recommendations.</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{insight.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        insight.importance === 'HIGH' ? 'bg-red-100 text-red-700' :
                        insight.importance === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {insight.importance}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        insight.category === 'MARKET_TREND' ? 'bg-green-100 text-green-700' :
                        insight.category === 'ECONOMIC_INDICATOR' ? 'bg-purple-100 text-purple-700' :
                        insight.category === 'SECTOR_ANALYSIS' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {insight.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm sm:text-base">{insight.content}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{new Date(insight.timestamp).toLocaleDateString()}</span>
                  <div className="flex space-x-2">
                    <button className="p-1 text-green-600 hover:text-green-700">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:text-red-700">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {insights.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No insights available</h3>
              <p className="text-slate-600">Market insights will appear here when available.</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">AI Investment Advisor</h1>
              <p className="text-sm sm:text-base text-slate-600">
                Personalized recommendations for your ${getTotalPortfolioValue().toLocaleString()} portfolio
              </p>
              {usageInfo && usageInfo.remaining < 5 && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>AI queries remaining: {usageInfo.remaining}/{usageInfo.limit}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => loadAIData()}
              disabled={loading || refreshCooldown > 0}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {refreshCooldown > 0 ? `Wait ${Math.ceil(refreshCooldown / 60)}m` : 'Refresh'}
              </span>
              <span className="sm:hidden">
                {refreshCooldown > 0 ? `${Math.ceil(refreshCooldown / 60)}m` : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 lg:mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-4 sm:space-x-6 lg:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: 'ai-chat', label: 'AI Chat', icon: MessageCircle },
                { id: 'market-data', label: 'Live Market', icon: Activity },
                { id: 'recommendations', label: 'Recommendations', icon: TrendingUp },
                { id: 'insights', label: 'Market Insights', icon: AlertCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Usage Status */}
          {usageInfo && usageInfo.remaining < 10 && (
            <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-blue-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>AI Queries: {usageInfo.remaining}/{usageInfo.limit} remaining this month</span>
                </div>
                <span className="text-blue-600">{usageInfo.planName} Plan</span>
              </div>
            </div>
          )}
          
          <div className="p-4 sm:p-6">
            {selectedTab === 'ai-chat' && <AIAdvisorInterface userProfile={userProfile} />}
            {selectedTab === 'market-data' && <RealTimeMarketDashboard userProfile={userProfile} />}
            {selectedTab === 'recommendations' && renderRecommendations()}
            {selectedTab === 'insights' && renderInsights()}
          </div>
        </div>
      </div>
    </div>
  );
};