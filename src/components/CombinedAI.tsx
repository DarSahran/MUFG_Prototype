import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, DollarSign, Target, AlertCircle, Star, RefreshCw, MessageCircle, ThumbsUp, ThumbsDown, Lightbulb, BarChart3, PieChart, Calculator } from 'lucide-react';
import { geminiService, InvestmentRecommendation, MarketInsight } from '../services/geminiService';
import { marketDataService } from '../services/marketData';
import { usePortfolio } from '../hooks/usePortfolio';
import { calculationEngine } from '../services/calculationEngine';
import { UserProfile } from '../App';

interface CombinedAIProps {
  userProfile: UserProfile;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
  attachments?: {
    type: 'chart' | 'calculation' | 'recommendation';
    data: any;
  }[];
}

export const CombinedAI: React.FC<CombinedAIProps> = ({ userProfile }) => {
  const { holdings, getTotalPortfolioValue } = usePortfolio();
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${userProfile?.name}! I'm your AI Investment Advisor. I can help you optimize your superannuation strategy, analyze market trends, and answer any investment questions you have. What would you like to know?`,
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        'How can I maximize my retirement savings?',
        'Should I increase my risk tolerance?',
        'What are the best performing investment options?',
        'How much should I contribute monthly?'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recommendations/Insights State
  const [recommendations, setRecommendations] = useState<InvestmentRecommendation[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'insights' | 'chat'>('recommendations');

  // Load user context data
  useEffect(() => {
    const loadContextData = async () => {
      try {
        const portfolioValue = getTotalPortfolioValue();
        const projections = calculationEngine.calculatePortfolioProjections(
          holdings, 
          userProfile.monthlyContribution, 
          userProfile.retirementAge - userProfile.age
        );
        
        setContextData({
          portfolioValue,
          projections,
          holdings: holdings.length,
          yearsToRetirement: userProfile.retirementAge - userProfile.age
        });
      } catch (error) {
        console.error('Error loading context data:', error);
      }
    };
    
    loadContextData();
  }, [holdings, userProfile]);

  // Chat scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load AI Data
  useEffect(() => { loadAIData(); }, [userProfile]);
  
  const loadAIData = async () => {
    setLoading(true);
    try {
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
        geminiService.getInvestmentRecommendations(userProfile, validMarketData),
        geminiService.getMarketInsights(validMarketData, userProfile)
      ]);
      setRecommendations(aiRecommendations);
      setInsights(aiInsights);
    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chat logic
  const simulateAIResponse = (userMessage: string): { text: string; attachments?: any[] } => {
    const message = userMessage.toLowerCase();
    
    // Context-aware responses using actual user data
    if (message.includes('maximize') || message.includes('increase') || message.includes('savings')) {
      const currentValue = contextData?.portfolioValue || userProfile.currentSuper;
      const projectedIncrease = Math.round(300 * 12 * contextData?.yearsToRetirement * 1.075);
      
      return {
        text: `Based on your ${userProfile?.riskTolerance} risk profile and ${contextData?.yearsToRetirement || 35} years to retirement, I recommend:\n\n1. **Increase Contributions**: Boost your monthly contribution by $200-300. This could add $${projectedIncrease.toLocaleString()}+ to your retirement balance.\n\n2. **Current Portfolio**: Your ${contextData?.holdings || 0} holdings worth $${currentValue.toLocaleString()} show good diversification.\n\n3. **Salary Sacrifice**: Use pre-tax contributions to maximize tax benefits - potentially saving you $1,200 annually.\n\n4. **Asset Allocation**: With your timeframe, consider increasing growth assets to 70-75% for higher long-term returns.\n\nWould you like me to run a detailed projection with these changes?`,
        attachments: [{
          type: 'calculation',
          data: {
            currentContribution: userProfile.monthlyContribution,
            recommendedContribution: userProfile.monthlyContribution + 250,
            projectedIncrease,
            timeframe: contextData?.yearsToRetirement
          }
        }]
      };
    }
    
    if (message.includes('risk') || message.includes('tolerance')) {
      return {
        text: `Your current ${userProfile?.riskTolerance} risk profile suits your ${contextData?.yearsToRetirement}-year investment horizon well. Here's what this means:\n\n**Current Portfolio Analysis:**\n- Total Value: $${(contextData?.portfolioValue || 0).toLocaleString()}\n- Holdings: ${contextData?.holdings || 0} different assets\n- Diversification: Good spread across asset classes\n\n**Risk Assessment:**\nGiven your age (${userProfile?.age}) and time to retirement, you might benefit from a slightly more growth-oriented approach. This could potentially increase your retirement balance by 15-20%.\n\n**Risk vs. Reward:**\n- Higher risk = potential for $75,000+ more at retirement\n- Lower risk = more predictable but potentially smaller returns\n\nWould you like me to model different risk scenarios for your specific situation?`,
        attachments: [{
          type: 'chart',
          data: {
            riskProfile: userProfile.riskTolerance,
            currentAllocation: contextData?.portfolioValue,
            recommendedChanges: ['Increase international exposure', 'Reduce cash holdings']
          }
        }]
      };
    }
    
    if (message.includes('contribute') || message.includes('monthly') || message.includes('much')) {
      const current = userProfile?.monthlyContribution || 500;
      const recommended = Math.round(current * 1.4);
      const difference = recommended - current;
      const projectedIncrease = Math.round(difference * 12 * contextData?.yearsToRetirement * 1.07);
      
      return {
        text: `Based on your goals and current portfolio value of $${(contextData?.portfolioValue || userProfile.currentSuper).toLocaleString()}, here's my analysis:\n\n**Current Contribution:** $${current}/month\n**Recommended:** $${recommended}/month (+$${difference})\n\n**Impact of Increase:**\n- Additional retirement savings: ~$${projectedIncrease.toLocaleString()}\n- Tax benefits: Save ~$${Math.round(difference * 12 * 0.15)}/year\n- Retirement income boost: +$${Math.round(projectedIncrease * 0.04 / 12)}/month\n\n**Ways to Increase:**\n1. Salary sacrifice (pre-tax)\n2. After-tax contributions\n3. Government co-contributions (if eligible)\n\nShould I help you calculate the optimal contribution strategy?`,
        attachments: [{
          type: 'calculation',
          data: {
            current,
            recommended,
            difference,
            projectedIncrease,
            taxSavings: Math.round(difference * 12 * 0.15)
          }
        }]
      };
    }
    
    return {
      text: `I understand you're asking about "${message}". Based on your profile:\n\n- Current Portfolio: $${(contextData?.portfolioValue || userProfile.currentSuper).toLocaleString()}\n- Holdings: ${contextData?.holdings || 0} different assets\n- Risk Profile: ${userProfile?.riskTolerance}\n- Years to Retirement: ${contextData?.yearsToRetirement || 35}\n\nLet me provide personalized advice. The investment landscape offers many opportunities for optimization, from asset allocation adjustments to contribution strategies and tax-effective structures.\n\nCould you be more specific about what aspect of your investment strategy you'd like to focus on? I can provide detailed analysis on portfolio performance, risk management, or retirement income projections.`
    };
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => {
      const response = simulateAIResponse(text);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        attachments: response.attachments,
        suggestions: [
          'Tell me more about this strategy',
          'Show me the calculations',
          'What are the risks?',
          'Compare with other options'
        ]
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Enhanced Quick Actions with real data
  const quickActions = [
    { 
      icon: TrendingUp, 
      text: `Analyze my ${contextData?.holdings || 0} holdings`, 
      color: 'bg-blue-500',
      action: () => handleSendMessage(`Please analyze my current ${contextData?.holdings || 0} holdings worth $${(contextData?.portfolioValue || 0).toLocaleString()}`)
    },
    { 
      icon: DollarSign, 
      text: `Optimize my $${userProfile.monthlyContribution}/month contributions`, 
      color: 'bg-green-500',
      action: () => handleSendMessage(`How can I optimize my monthly contributions of $${userProfile.monthlyContribution}?`)
    },
    { 
      icon: Target, 
      text: `Plan for retirement in ${contextData?.yearsToRetirement || 35} years`, 
      color: 'bg-purple-500',
      action: () => handleSendMessage(`Help me plan for retirement in ${contextData?.yearsToRetirement || 35} years`)
    },
    { 
      icon: AlertCircle, 
      text: `Review my ${userProfile.riskTolerance} risk strategy`, 
      color: 'bg-orange-500',
      action: () => handleSendMessage(`Is my ${userProfile.riskTolerance} risk tolerance appropriate for my situation?`)
    },
  ];

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

  // Renderers
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
                  {rec.targetPrice && (
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

  const renderChat = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-xs sm:text-sm font-medium text-slate-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action || (() => handleSendMessage(action.text))}
                  className="flex flex-col items-center p-2 sm:p-3 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200"
                >
                  <div className={`p-1.5 sm:p-2 rounded-lg ${action.color} mb-2`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-700 text-center leading-tight">{action.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6" style={{ maxHeight: window.innerWidth < 640 ? 300 : 400 }}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} max-w-full`}>
            <div className={`flex max-w-full sm:max-w-3xl ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gradient-to-br from-green-500 to-blue-600'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className={`p-3 sm:p-4 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <p className="whitespace-pre-line text-sm sm:text-base break-words">{message.text}</p>
                </div>
                
                {/* Message Attachments */}
                {message.attachments && message.attachments.map((attachment, index) => (
                  <div key={index} className="mt-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {attachment.type === 'calculation' && (
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Calculator className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-slate-900">Calculation Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(attachment.data).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium">{typeof value === 'number' ? `$${value.toLocaleString()}` : value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {attachment.type === 'chart' && (
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <BarChart3 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-slate-900">Portfolio Analysis</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          Interactive chart data would be displayed here
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {message.suggestions && (
                  <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-50 transition-colors duration-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex">
              <div className="mr-2 sm:mr-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <div className="bg-slate-100 p-3 sm:p-4 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="border-t border-slate-200 p-4 sm:p-6">
        {/* Smart Suggestions */}
        {inputText.length === 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-slate-700">Smart Suggestions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'What if I retire 5 years early?',
                'Should I rebalance my portfolio?',
                'How much will I have at retirement?',
                'Compare my performance to benchmarks'
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(suggestion)}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2 sm:space-x-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder="Ask me about your investment strategy..."
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-500 mt-2 text-center">
          AI responses are educational and not personalized financial advice. Consult a licensed advisor for specific guidance.
        </p>
      </div>
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
                Personalized recommendations for your $${(contextData?.portfolioValue || 0).toLocaleString()} portfolio
              </p>
            </div>
            <button
              onClick={loadAIData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 lg:mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-4 sm:space-x-6 lg:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: 'recommendations', label: 'Recommendations', icon: TrendingUp },
                { id: 'insights', label: 'Market Insights', icon: AlertCircle },
                { id: 'chat', label: 'AI Chat', icon: MessageCircle }
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
          <div className="p-4 sm:p-6">
            {selectedTab === 'recommendations' && renderRecommendations()}
            {selectedTab === 'insights' && renderInsights()}
            {selectedTab === 'chat' && renderChat()}
          </div>
        </div>
      </div>
    </div>
  );
};