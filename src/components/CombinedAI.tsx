import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  User,
  AlertCircle,
  TrendingUp,
  Calculator,
  Target,
  Globe,
  RefreshCw,
  DollarSign,
  Sparkles,
  MessageSquare,
  Shield,
  Brain
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../hooks/usePortfolio';
import { UserProfile } from '../App';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  portfolioValue?: number;
  messageType?: 'analysis' | 'recommendation' | 'general';
}

interface CombinedAIProps {
  userProfile: UserProfile;
}

// Enhanced AI Service with user holdings integration
class FinancialAIService {
  private static instance: FinancialAIService;

  static getInstance(): FinancialAIService {
    if (!FinancialAIService.instance) {
      FinancialAIService.instance = new FinancialAIService();
    }
    return FinancialAIService.instance;
  }

  // Fetch real holdings data from Supabase
  private async fetchUserHoldings(userId: string): Promise<any[]> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('user_holdings')
        .select('name, quantity, purchase_price, current_price')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching holdings:', error);
      return [];
    }
  }

  async generateResponse(prompt: string, userContext: any, portfolioValue?: number, holdings?: any[]): Promise<{ text: string; type: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerPrompt = prompt.toLowerCase();
    
    // Use provided holdings or fetch from Supabase
    const realHoldings = holdings || (userContext.userId ? 
      await this.fetchUserHoldings(userContext.userId) : []);

    // Use provided portfolio value or calculate from holdings
    const totalValue = portfolioValue || realHoldings.reduce((sum, h) => sum + ((h.quantity || 0) * (h.purchase_price || 0)), 0);

    // Risk minimization with actual holdings
    if (lowerPrompt.includes('minimize risk') || lowerPrompt.includes('reduce risk')) {
      const hasCrypto = realHoldings.some(h => h.name && (h.name.toLowerCase().includes('bitcoin') || h.name.toLowerCase().includes('ethereum') || h.name.toLowerCase().includes('crypto')));

      return {
        text: `🛡️ **Risk Minimization for ${userContext.name}**

**Current Holdings:** ${realHoldings.length > 0 ? 
  realHoldings.map(h => {
    const value = (h.quantity || 0) * (h.purchase_price || 0);
    const percentage = totalValue > 0 ? ((value/totalValue)*100).toFixed(1) : '0';
    return `${h.name || 'Unknown'}: $${value.toLocaleString()} (${percentage}%)`;
  }).join(', ') :
  'No holdings detected'}

**Immediate Actions for $${totalValue.toLocaleString()} portfolio:**
• **Rebalance to 60% defensive, 40% growth**
• **Add bonds:** VAF.AX (Australian bonds) - $${(totalValue * 0.3).toLocaleString()}
• **Reduce high-risk positions** ${hasCrypto ? '(crypto exposure detected)' : ''}

**Target Allocation:**
• 30% Bonds (VAF.AX): $${(totalValue * 0.3).toLocaleString()}
• 40% Blue-chip stocks: $${(totalValue * 0.4).toLocaleString()}
• 30% Conservative ETFs: $${(totalValue * 0.3).toLocaleString()}

**Expected:** 8-12% volatility vs current 15-25%`,
        type: 'recommendation'
      };
    }

    // Portfolio analysis with real data
    if (lowerPrompt.includes('portfolio') || lowerPrompt.includes('analyze')) {
      console.log('Real holdings data:', realHoldings);
      const holdingsWithValue = realHoldings.map(h => ({
        ...h,
        value: h.quantity * (h.current_price || h.purchase_price || 0)
      }));
      console.log('Holdings with calculated values:', holdingsWithValue);
      const topHolding = holdingsWithValue.sort((a, b) => b.value - a.value)[0];
      const asxCount = realHoldings.filter(h => h.name && (h.name.includes('Australian') || h.name.includes('ASX'))).length;

      return {
        text: `📊 **Portfolio Analysis for ${userContext.name}**

**Current Position:** $${totalValue.toLocaleString()}
**Holdings:** ${realHoldings.length} positions, ${asxCount} Australian investments

**Top Holdings:**
${realHoldings.map(h => {
  const price = h.current_price || h.purchase_price || 0;
  const value = h.quantity * price;
  return `• ${h.name}: $${value.toLocaleString()} (${h.quantity} units @ $${price})`;
}).join('\n')}

**Quick Wins:**
• Diversify: Add VGS.AX for international exposure
• Rebalance: ${topHolding?.name || 'Top holding'} is ${topHolding && totalValue > 0 ? ((topHolding.value / totalValue) * 100).toFixed(0) : 'NaN'}% - ${topHolding && totalValue > 0 && (topHolding.value / totalValue) > 0.4 ? 'reduce to <40%' : 'good allocation'}
• Monthly investing: Set up $300-500 automatic

**Target:** 50% ASX, 30% International, 20% Bonds`,
        type: 'portfolio_analysis'
      };
    }

    // Super optimization
    if (lowerPrompt.includes('super') || lowerPrompt.includes('contribution')) {
      return {
        text: `🏦 **Super Optimization for ${userContext.name}**

**Current:** $${userContext.monthlyContribution}/month ($${(userContext.monthlyContribution * 12).toLocaleString()}/year)
**Available cap:** $${(30000 - (userContext.monthlyContribution * 12)).toLocaleString()}

**Immediate Actions:**
• **Increase to $2,500/month** (max concessional)
• **Tax savings:** ~$4,000 annually
• **Projected at ${userContext.retirementAge}:** $650,000 vs current $400,000

**This month:** Contact payroll for salary sacrifice increase`,
        type: 'recommendation'
      };
    }

    // Default concise response
    return {
      text: `👋 **Ready to optimize your $${userContext.portfolioValue?.toLocaleString()} portfolio, ${userContext.name}?**

**Current:** ${realHoldings.length} holdings, ${userContext.riskTolerance} risk tolerance
**Goal:** ${userContext.retirementAge - userContext.age} years to retirement

**Focus areas:**
• Portfolio optimization • Super strategy • Risk management

What's your priority today?`,
      type: 'general'
    };
  }
}

export const CombinedAI: React.FC<CombinedAIProps> = ({ userProfile }) => {
  const { user } = useAuth();
  const { getTotalPortfolioValue, holdings, loading: portfolioLoading } = usePortfolio();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiService = FinancialAIService.getInstance();

  // Initialize with streamlined welcome - wait for portfolio data to load
  useEffect(() => {
    if (messages.length === 0 && !portfolioLoading) {
      const portfolioValue = getTotalPortfolioValue();
      const welcomeMessage: Message = {
        id: 'welcome-1',
        text: `**What's your biggest financial priority right now?**

I'm your AI Financial Advisor, specializing in Australian investment strategies. 

**Your Profile:** $${portfolioValue.toLocaleString()} portfolio • ${userProfile.riskTolerance} risk • ${userProfile.retirementAge - userProfile.age} years to retirement

Ready to help with investment optimization, superannuation planning, and wealth building strategies tailored to your goals.`,
        sender: 'ai',
        timestamp: new Date(),
        portfolioValue: portfolioValue,
        messageType: 'general'
      };

      setMessages([welcomeMessage]);
    }
  }, [portfolioLoading, getTotalPortfolioValue]); // Wait for portfolio data to load

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || loading) return;

    const now = Date.now();
    if (now - lastRequestTime < 8000) {
      setError(`Please wait ${Math.ceil((8000 - (now - lastRequestTime)) / 1000)} seconds between messages.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setError(null);
    setLastRequestTime(now);

    const userMessage: Message = {
      id: `user-${now}`,
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
      portfolioValue: getTotalPortfolioValue()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const userContext = {
        userId: user?.id, // Add user ID for Supabase queries
        name: userProfile.name,
        age: userProfile.age,
        retirementAge: userProfile.retirementAge,
        portfolioValue: getTotalPortfolioValue(),
        riskTolerance: userProfile.riskTolerance,
        monthlyContribution: userProfile.monthlyContribution,
        financialGoals: userProfile.financialGoals,
        holdings: holdings || [] // Keep as fallback
      };

      const { text: aiResponse, type } = await aiService.generateResponse(textToSend, userContext, getTotalPortfolioValue(), holdings);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        portfolioValue: getTotalPortfolioValue(),
        messageType: type as any
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Response Error:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "I'm having a technical issue. Let me help you with general guidance based on your profile. What specific financial question do you have?",
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, lastRequestTime, userProfile, getTotalPortfolioValue, holdings, aiService]);

  // Compact, focused quick actions
  const quickActions = [
    {
      icon: Shield,
      text: "Minimize Investment Risk",
      description: "Conservative strategies for your portfolio",
      query: "What should I buy to minimize risk in my portfolio? I want conservative investments.",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: TrendingUp,
      text: "Optimize Portfolio",
      description: "Maximize returns with balanced approach",
      query: `Analyze my current portfolio worth $${getTotalPortfolioValue().toLocaleString()}. Provide specific optimization recommendations.`,
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: Calculator,
      text: "Super Strategy",
      description: "Maximize superannuation benefits",
      query: `Optimize my superannuation strategy. I contribute $${userProfile.monthlyContribution}/month. How can I maximize my super?`,
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      icon: Globe,
      text: "Market Insights",
      description: "Latest ASX trends and opportunities",
      query: "What are the current ASX market trends and best investment opportunities for 2025?",
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  // Enhanced message formatter
  const MessageText: React.FC<{ text: string; sender: 'user' | 'ai' }> = ({ text, sender }) => {
    if (sender === 'user') {
      return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          if (line.match(/^[🎯📊📈🏦⚖️💰🛡️👋📉🚀].+\*\*$/)) {
            return (
              <h2 key={index} className="text-lg font-bold text-slate-900 mt-3 mb-2">
                {line.replace(/\*\*/g, '')}
              </h2>
            );
          }

          if (line.startsWith('**') && line.endsWith('**')) {
            return (
              <h3 key={index} className="text-base font-semibold text-slate-800 mt-2 mb-1">
                {line.slice(2, -2)}
              </h3>
            );
          }

          if (line.match(/^[•✅❌🚀📉].+/)) {
            const emoji = line.charAt(0);
            const content = line.slice(2);
            return (
              <div key={index} className="flex items-start space-x-2 ml-1">
                <span className="text-sm">{emoji}</span>
                <span className="flex-1 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            );
          }

          if (/^\d+\./.test(line)) {
            return (
              <div key={index} className="ml-3 text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            );
          }

          if (line.trim()) {
            return (
              <div
                key={index}
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
            );
          }

          return <div key={index} className="h-1" />;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto p-4">
        {/* Streamlined Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-2 bg-gradient-to-br from-blue-400 to-green-400 rounded-lg shadow-lg"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Financial Advisor</h1>
              <p className="text-blue-200 text-sm">Specialized Australian Investment Planning</p>
            </div>
          </div>

          {/* Compact Status Bar */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="text-white">Portfolio: ${getTotalPortfolioValue().toLocaleString()}</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
              <Target className="w-3 h-3 text-blue-400" />
              <span className="text-white">{userProfile.retirementAge - userProfile.age} years to retirement</span>
            </div>

            {/* Remove VAS.AX display to save space */}
          </div>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden"
          style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-2 max-w-4xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${message.sender === 'user'
                          ? 'bg-blue-600'
                          : 'bg-gradient-to-br from-green-500 to-blue-500'
                        }`}>
                        {message.sender === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Brain className="w-4 h-4 text-white" />
                        )}
                      </div>

                      <div className={`rounded-xl p-4 shadow-md ${message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-900 border border-slate-200'
                        }`}>
                        <MessageText text={message.text} sender={message.sender} />

                        <div className={`mt-2 flex items-center justify-between text-xs ${message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                          {message.sender === 'ai' && (
                            <div className="flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              <span className="text-blue-600">AI Analysis</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-md">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                        <span className="text-slate-600 text-sm">Analyzing your situation...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Compact Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-slate-800">Quick Financial Questions</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(action.query)}
                        disabled={loading}
                        className={`${action.color} text-white p-3 rounded-lg text-left transition-all duration-200 disabled:opacity-50 group hover:shadow-md`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{action.text}</span>
                        </div>
                        <p className="text-xs opacity-90">{action.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me about minimizing risk, optimizing your portfolio, or planning for retirement..."
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 resize-none"
                  rows={2}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 shadow-lg"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-500 text-center">
                Powered by Advanced AI • Australian Financial Expertise • Educational purposes only
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
   
  );
};

export default CombinedAI;
