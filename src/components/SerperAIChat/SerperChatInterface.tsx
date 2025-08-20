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
}

export const SerperChatInterface: React.FC<SerperChatInterfaceProps> = ({ userProfile }) => {
  const { askSerperAI, loading, error, planDetails, fetchPlanDetails, canMakeQuery, getUsageMessage, getTimeUntilReset } = useSerperChat();
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
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
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
      const response = await askSerperAI({
        query: text,
        context: {
          portfolioValue,
          riskProfile: userProfile.riskTolerance,
          age: userProfile.age,
          retirementAge: userProfile.retirementAge
        }
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
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      {/* Header with Plan Details */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Serper AI Financial Advisor</h2>
              <p className="text-sm text-slate-600">Powered by real-time web search & market data</p>
            </div>
          </div>
          
          {planDetails && (
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  planDetails.dailyRemaining > 1 ? 'bg-green-500' : 
                  planDetails.dailyRemaining > 0 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium text-slate-700">
                  {planDetails.dailyRemaining}/{planDetails.dailyLimit} daily queries
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {planDetails.planName} Plan • {getTimeUntilReset()}
              </div>
            </div>
          )}
        </div>

        {/* Usage Progress Bar */}
        {planDetails && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Daily Usage</span>
              <span>{planDetails.dailyUsed}/{planDetails.dailyLimit}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
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
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                Only {planDetails.dailyRemaining} query remaining today. {getTimeUntilReset()}.
              </span>
            </div>
          </div>
        )}

        {planDetails && planDetails.dailyRemaining === 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  Daily query limit reached. {getTimeUntilReset()}.
                </span>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Upgrade Plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Quick Financial Questions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSendMessage(action.query)}
                  disabled={loading || !canMakeQuery()}
                  className="flex items-center space-x-3 p-3 text-left border border-slate-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">{action.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-4xl ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                    <p className="whitespace-pre-line text-sm sm:text-base">{message.text}</p>
                  </div>

                  {/* Enhanced AI Response Display */}
                  {message.response && message.sender === 'ai' && (
                    <div className="mt-3 space-y-3">
                      {/* Search Results Summary */}
                      {message.response.searchResults.length > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">
                              Web Search Results ({message.response.searchResults.length})
                            </span>
                            {message.response.cached && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Cached
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {message.response.searchResults.slice(0, 3).map((result: any, index: number) => (
                              <div key={index} className="text-sm">
                                <a 
                                  href={result.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-700 hover:text-blue-800 font-medium"
                                >
                                  {result.title}
                                </a>
                                <p className="text-blue-600 text-xs mt-1">{result.snippet}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      {message.response.sources.length > 0 && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-900">Sources</span>
                          </div>
                          <div className="space-y-1">
                            {message.response.sources.slice(0, 3).map((source: string, index: number) => (
                              <div key={index} className="text-xs text-green-700">
                                • {source.split(' - ')[0]}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response Metadata */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>Confidence: {message.response.confidence}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="w-3 h-3" />
                            <span>Tokens: {message.response.tokensUsed}</span>
                          </div>
                          {message.response.cached && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-green-500" />
                              <span className="text-green-600">Cached Result</span>
                            </div>
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
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 p-4 sm:p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Smart Suggestions */}
        {inputText.length === 0 && messages.length <= 1 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-slate-700">Popular Financial Questions</span>
            </div>
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
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputText)}
            placeholder={
              !canMakeQuery() 
                ? `Upgrade your plan or wait for reset to ask more questions...`
                : "Ask me about investments, market trends, or financial planning..."
            }
            disabled={loading || !canMakeQuery()}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed text-sm sm:text-base"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || loading || !canMakeQuery()}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Plan Info Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>
            AI responses powered by Serper web search • Educational purposes only
          </span>
          {planDetails && (
            <span>
              Monthly: {planDetails.monthlyUsed}/{planDetails.monthlyLimit} used
            </span>
          )}
        </div>
      </div>
    </div>
  );
};