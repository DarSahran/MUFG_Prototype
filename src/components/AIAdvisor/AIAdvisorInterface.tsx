import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, TrendingUp, Target, Calculator, Shield, Clock, Star, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIAdvisor } from '../../hooks/useAIAdvisor';
import { usePortfolio } from '../../hooks/usePortfolio';
import { UserProfile } from '../../App';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  response?: {
    answer: string;
    marketAnalysis: string;
    recommendations: string[];
    riskAssessment: string;
    sources: string[];
    confidence: number;
    queryType: string;
  };
}

interface AIAdvisorInterfaceProps {
  userProfile: UserProfile;
}

export const AIAdvisorInterface: React.FC<AIAdvisorInterfaceProps> = ({ userProfile }) => {
  const { askAI, loading, error, usageInfo, fetchUsageInfo } = useAIAdvisor();
  const { getTotalPortfolioValue } = usePortfolio();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${userProfile.name}! I'm your AI Financial Advisor powered by real-time market data. I can help you with investment strategies, market analysis, superannuation planning, and portfolio optimization. What would you like to know?`,
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchUsageInfo();
  }, [fetchUsageInfo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const portfolioValue = getTotalPortfolioValue();
      const response = await askAI({
        query: text,
        context: {
          portfolioValue,
          riskProfile: userProfile.riskTolerance,
          age: userProfile.age,
          retirementAge: userProfile.retirementAge,
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
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    {
      icon: TrendingUp,
      text: `Analyze my $${getTotalPortfolioValue().toLocaleString()} portfolio`,
      query: `Please analyze my current portfolio worth $${getTotalPortfolioValue().toLocaleString()}. What are your recommendations for optimization?`
    },
    {
      icon: Target,
      text: `Plan for retirement in ${userProfile.retirementAge - userProfile.age} years`,
      query: `I'm ${userProfile.age} years old and plan to retire at ${userProfile.retirementAge}. What's the best strategy for my retirement planning?`
    },
    {
      icon: Calculator,
      text: `Optimize my $${userProfile.monthlyContribution}/month contributions`,
      query: `I'm currently contributing $${userProfile.monthlyContribution} monthly to my super. How can I optimize my contribution strategy?`
    },
    {
      icon: Shield,
      text: `Review my ${userProfile.riskTolerance} risk strategy`,
      query: `I have a ${userProfile.riskTolerance} risk tolerance. Is this appropriate for my situation and how can I optimize it?`
    },
  ];

  const financialSuggestions = [
    'What are the current ASX market trends?',
    'Should I increase my superannuation contributions?',
    'How can I optimize my portfolio allocation?',
    'What are the tax implications of my investment strategy?',
    'How do interest rates affect my investments?',
    'What ETFs are best for Australian investors?'
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      {/* Header with Usage Info */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">AI Financial Advisor</h2>
              <p className="text-sm text-slate-600">Powered by real-time market data</p>
            </div>
          </div>
          
          {usageInfo && (
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  usageInfo.remaining > 5 ? 'bg-green-500' : 
                  usageInfo.remaining > 0 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium text-slate-700">
                  {usageInfo.remaining}/{usageInfo.limit} queries left
                </span>
              </div>
              <div className="text-xs text-slate-500">{usageInfo.planName} Plan</div>
            </div>
          )}
        </div>

        {/* Usage Warning */}
        {usageInfo && usageInfo.remaining <= 3 && usageInfo.remaining > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Only {usageInfo.remaining} queries remaining this month. Consider upgrading your plan.
              </span>
            </div>
          </div>
        )}

        {usageInfo && usageInfo.remaining === 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  You've reached your monthly query limit.
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
                  disabled={loading || (usageInfo?.remaining === 0)}
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
                      {/* Market Analysis */}
                      {message.response.marketAnalysis && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">Market Analysis</span>
                          </div>
                          <p className="text-sm text-blue-800">{message.response.marketAnalysis}</p>
                        </div>
                      )}

                      {/* Recommendations */}
                      {message.response.recommendations.length > 0 && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-900">Recommendations</span>
                          </div>
                          <ul className="space-y-1">
                            {message.response.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-green-800 flex items-start space-x-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk Assessment */}
                      {message.response.riskAssessment && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-semibold text-orange-900">Risk Assessment</span>
                          </div>
                          <p className="text-sm text-orange-800">{message.response.riskAssessment}</p>
                        </div>
                      )}

                      {/* Confidence and Sources */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center space-x-2">
                          <Star className="w-3 h-3" />
                          <span>Confidence: {message.response.confidence}%</span>
                        </div>
                        {message.response.sources.length > 0 && (
                          <button className="text-blue-600 hover:text-blue-700">
                            View {message.response.sources.length} sources
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex">
              <div className="mr-3">
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
          </motion.div>
        )}

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
                  disabled={usageInfo?.remaining === 0}
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
              usageInfo?.remaining === 0 
                ? "Upgrade your plan to ask more questions..."
                : "Ask me about investments, market trends, or financial planning..."
            }
            disabled={loading || usageInfo?.remaining === 0}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed text-sm sm:text-base"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || loading || usageInfo?.remaining === 0}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 mt-3 text-center">
          AI responses are for educational purposes only. Not personalized financial advice. 
          Consult a licensed advisor for specific guidance.
        </p>
      </div>
    </div>
  );
};