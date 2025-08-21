import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, TrendingUp, Target, Calculator, Shield, Clock, Star, Zap, RefreshCw, Crown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSerperChat } from '../../hooks/useSerperChat';
import { usePortfolio } from '../../hooks/usePortfolio';
import { UserProfile } from '../../App';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  response?: {
    answer: string;
    searchResults: any[];
    sources: string[];
    confidence: number;
    queryType: string;
    tokensUsed: number;
    cached: boolean;
  };
}

interface SerperChatInterfaceProps {
  userProfile: UserProfile;
  liveMarketData?: any;
  portfolioContext?: {
    totalValue: number;
    holdings: any[];
    riskProfile: string;
  };
}

// Make sure this component is properly exported
export const SerperChatInterface: React.FC<SerperChatInterfaceProps> = ({ 
  userProfile, 
  liveMarketData,
  portfolioContext 
}) => {
  const { askSerperAI, loading, error, setError, planDetails, fetchPlanDetails, canMakeQuery, getUsageMessage, getTimeUntilReset } = useSerperChat();
  const { getTotalPortfolioValue } = usePortfolio();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${userProfile.name}! I'm your AI Financial Advisor powered by Serper's real-time web search. I can help you with investment strategies, market analysis, superannuation planning, and portfolio optimization using the latest information from the web. What would you like to know?`,
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    // Check minimum time between requests (30 seconds)
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < 30000) {
      setError(`Please wait ${Math.ceil((30000 - timeSinceLastRequest) / 1000)} seconds between queries.`);
      return;
    }

    // Check if user can make request
    if (!canMakeQuery()) {
      setError(getUsageMessage());
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setError(null);
    setLastRequestTime(Date.now());

    try {
      const portfolioValue = getTotalPortfolioValue();
      
      // Enhanced context with live market data
      const enhancedContext = {
        portfolioValue,
        riskProfile: userProfile.riskTolerance,
        age: userProfile.age,
        retirementAge: userProfile.retirementAge,
        ...(liveMarketData && { liveMarketData }),
        ...(portfolioContext && { portfolioContext })
      };

      const response = await askSerperAI({
        query: text,
        context: enhancedContext
      });

      if (response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.answer,
          sender: 'ai',
          timestamp: new Date(),
          response
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get AI response. Please try again.');
    }
  };

  const quickActions = [
    {
      icon: TrendingUp,
      text: `Analyze my $${getTotalPortfolioValue().toLocaleString()} portfolio`,
      query: `Please analyze my current portfolio worth $${getTotalPortfolioValue().toLocaleString()}. What are the latest market trends and recommendations for optimization?`
    },
    {
      icon: Target,
      text: `Plan for retirement in ${userProfile.retirementAge - userProfile.age} years`,
      query: `I'm ${userProfile.age} years old and plan to retire at ${userProfile.retirementAge}. What are the current best practices for retirement planning in Australia?`
    },
    {
      icon: Calculator,
      text: `Optimize my $${userProfile.monthlyContribution}/month contributions`,
      query: `I'm currently contributing $${userProfile.monthlyContribution} monthly to my super. What are the latest strategies to optimize my contribution approach?`
    },
    {
      icon: Globe,
      text: `Current market trends and news`,
      query: `What are the current market trends and latest financial news affecting Australian investors and superannuation?`
    },
  ];

  const financialSuggestions = [
    'What are the latest ASX market trends?',
    'Current interest rate impact on investments?',
    'Best ETFs for Australian investors in 2025?',
    'Latest superannuation contribution strategies?',
    'How is inflation affecting retirement planning?',
    'Current property market outlook Australia?'
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header with Plan Details */}
      <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Serper AI Financial Advisor</h2>
            <p className="text-sm text-slate-600">Powered by real-time web search & market data</p>
          </div>
          
          {planDetails && (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                planDetails.dailyRemaining > 1 ? 'bg-green-500' :
                planDetails.dailyRemaining > 0 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div className="text-sm">
                <div className="font-medium">{planDetails.dailyRemaining}/{planDetails.dailyLimit} daily queries</div>
                <div className="text-xs text-slate-500">{planDetails.planName} Plan • {getTimeUntilReset()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Usage Progress Bar */}
        {planDetails && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Daily Usage</span>
              <span>{planDetails.dailyUsed}/{planDetails.dailyLimit}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  planDetails.dailyUsed / planDetails.dailyLimit > 0.8 ? 'bg-red-500' :
                  planDetails.dailyUsed / planDetails.dailyLimit > 0.6 ? 'bg-orange-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min((planDetails.dailyUsed / planDetails.dailyLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Usage Warnings */}
        {planDetails && planDetails.dailyRemaining <= 1 && planDetails.dailyRemaining > 0 && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded text-sm text-yellow-800">
            Only {planDetails.dailyRemaining} query remaining today. {getTimeUntilReset()}.
          </div>
        )}

        {planDetails && planDetails.dailyRemaining === 0 && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800 flex justify-between items-center">
            <span>Daily query limit reached. {getTimeUntilReset()}.</span>
            <button className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
              Upgrade Plan
            </button>
          </div>
        )}
      </div>

      {/* Live Market Data Banner */}
      {liveMarketData && (
        <div className="flex-shrink-0 p-3 bg-green-50 border-b border-green-200">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              Live Market: VAS.AX ${liveMarketData.regularMarketPrice} ({liveMarketData.currency})
            </span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 p-4 border-b border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Quick Financial Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSendMessage(action.query)}
                  disabled={loading || !canMakeQuery()}
                  className="flex items-center space-x-3 p-3 text-left border border-slate-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">{action.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-2 max-w-3xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div className={`rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                {/* Enhanced AI Response Display */}
                {message.response && message.sender === 'ai' && (
                  <div className="mt-3 space-y-3">
                    {/* Search Results Summary */}
                    {message.response.searchResults.length > 0 && (
                      <div className="border-t border-slate-200 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-medium text-slate-600">
                            Web Search Results ({message.response.searchResults.length})
                          </h4>
                          {message.response.cached && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Cached
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {message.response.searchResults.slice(0, 3).map((result: any, index: number) => (
                            <div key={index} className="p-2 bg-white rounded border border-slate-200">
                              <h5 className="text-xs font-medium text-slate-800 line-clamp-1">{result.title}</h5>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{result.snippet}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources */}
                    {message.response.sources.length > 0 && (
                      <div className="border-t border-slate-200 pt-2">
                        <h4 className="text-xs font-medium text-slate-600 mb-1">Sources</h4>
                        <div className="space-y-1">
                          {message.response.sources.slice(0, 3).map((source: string, index: number) => (
                            <div key={index} className="text-xs text-slate-500">
                              • {source.split(' - ')[0]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Response Metadata */}
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2">
                      <div className="flex items-center space-x-3">
                        <span>Confidence: {message.response.confidence}%</span>
                        <span>Tokens: {message.response.tokensUsed}</span>
                        {message.response.cached && (
                          <span className="text-blue-600">Cached Result</span>
                        )}
                      </div>
                      <button className="text-blue-600 hover:text-blue-700">
                        View all sources
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-slate-200">
        {/* Error Display */}
        {error && (
          <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Smart Suggestions */}
        {inputText.length === 0 && messages.length <= 1 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-slate-600 mb-2">Popular Financial Questions</h4>
            <div className="flex flex-wrap gap-2">
              {financialSuggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(suggestion)}
                  disabled={!canMakeQuery()}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputText)}
            placeholder={
              !canMakeQuery()
                ? `Upgrade your plan or wait for reset to ask more questions...`
                : "Ask me about investments, market trends, or financial planning..."
            }
            disabled={loading || !canMakeQuery()}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed text-sm resize-none"
            rows={1}
          />
          
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || loading || !canMakeQuery()}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Plan Info Footer */}
        <div className="mt-2 text-xs text-slate-500 flex justify-between">
          <span>AI responses powered by Serper web search • Educational purposes only</span>
          {planDetails && (
            <span>Monthly: {planDetails.monthlyUsed}/{planDetails.monthlyLimit} used</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Default export as well for flexibility
export default SerperChatInterface;
