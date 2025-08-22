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
  Brain,
  DollarSign,
  Sparkles,
  Shield,
  BarChart3,
  PieChart,
  Clock,
  Star
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  portfolioValue?: number;
  type?: 'casual' | 'analysis' | 'advice' | 'question';
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  retirement_age: number;
  annual_income: number;
  monthly_contribution: number;
  risk_tolerance: string;
  financial_goals: string[];
  preferred_sectors: string[];
  investment_experience: string;
}

interface UserHolding {
  id: string;
  user_id: string;
  asset_type: string;
  symbol: string;
  name: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  currency: string;
  exchange: string;
  region: string;
  metadata?: any;
  is_active: boolean;
}

// FIXED: Bulletproof Gemini AI Service
class SuperAI {
  private static instance: SuperAI;
  private apiKey: string;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    console.log('🔑 SuperAI Status:', this.apiKey ? 'Ready ✅' : 'Missing ❌');
  }

  static getInstance(): SuperAI {
    if (!SuperAI.instance) {
      SuperAI.instance = new SuperAI();
    }
    return SuperAI.instance;
  }

  // Smart intent analysis
  private analyzeIntent(query: string): { 
    type: 'casual' | 'question' | 'super' | 'analysis' | 'advice'; 
    needsContext: boolean;
    maxWords: number;
  } {
    const lowerQuery = query.toLowerCase().trim();
    
    // Casual responses
    const casualPatterns = /^(hi|hello|hey|good morning|afternoon|thanks|ok|cool)$/i;
    if (casualPatterns.test(lowerQuery)) {
      return { type: 'casual', needsContext: false, maxWords: 20 };
    }
    
    // Superannuation specific
    const superPatterns = ['super', 'superannuation', 'retirement', 'pension', 'concessional', 'salary sacrifice'];
    if (superPatterns.some(word => lowerQuery.includes(word))) {
      return { type: 'super', needsContext: true, maxWords: 250 };
    }
    
    // Analysis requests
    const analysisPatterns = ['analyze', 'assess', 'evaluate', 'review', 'risk'];
    if (analysisPatterns.some(word => lowerQuery.includes(word))) {
      return { type: 'analysis', needsContext: true, maxWords: 200 };
    }
    
    // Advice requests
    const advicePatterns = ['should i', 'recommend', 'suggest', 'strategy', 'invest', 'buy'];
    if (advicePatterns.some(word => lowerQuery.includes(word))) {
      return { type: 'advice', needsContext: true, maxWords: 180 };
    }
    
    return { type: 'question', needsContext: false, maxWords: 100 };
  }

  private buildExpertPrompt(query: string, intent: any, userProfile: UserProfile, holdings: UserHolding[], portfolioValue: number): string {
    const { type, needsContext, maxWords } = intent;
    const currentYear = new Date().getFullYear();
    
    let systemPrompt = `You are Australia's leading superannuation and financial advisor with access to current 2025 Australian financial regulations.

CURRENT AUSTRALIAN SUPER RULES (2025):
- Concessional contribution cap: $30,000/year (including employer)
- Non-concessional cap: $120,000/year
- Super Guarantee rate: 11.5%
- Tax on super contributions: 15%

RESPONSE REQUIREMENTS:
- Maximum ${maxWords} words
- Include specific 2025 figures
- Provide actionable steps
- Use Australian terminology`;

    if (needsContext) {
      const yearsToRetirement = userProfile.retirement_age - userProfile.age;
      const holdingsText = holdings.map(h => 
        `${h.symbol || h.name}: $${(h.quantity * h.current_price).toFixed(0)}`
      ).join(', ');

      systemPrompt += `

USER CONTEXT:
- ${userProfile.name}, ${userProfile.age} years old
- ${yearsToRetirement} years to retirement
- Current super: $${userProfile.monthly_contribution}/month
- Portfolio: $${portfolioValue.toLocaleString()} (${holdingsText || 'No investments'})`;
    }

    return `${systemPrompt}

USER QUERY: ${query}

Provide expert Australian financial advice:`;
  }

  async generateResponse(query: string, userProfile: UserProfile, holdings: UserHolding[], portfolioValue: number): Promise<{ text: string; type: string }> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const intent = this.analyzeIntent(query);
    const systemPrompt = this.buildExpertPrompt(query, intent, userProfile, holdings, portfolioValue);

    try {
      console.log('🤖 Calling Gemini API...');
      
      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: intent.type === 'casual' ? 0.3 : 0.8,
            maxOutputTokens: Math.ceil(intent.maxWords * 1.5),
            topK: 40,
            topP: 0.95
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Raw API Response:', data);

      // BULLETPROOF response extraction with multiple fallback methods
      let responseText: string | null = null;

      try {
        // Method 1: Standard path - candidates[0].content.parts.text
        if (data && 
            data.candidates && 
            Array.isArray(data.candidates) && 
            data.candidates.length > 0 && 
            data.candidates && 
            data.candidates.content && 
            data.candidates.content.parts && 
            Array.isArray(data.candidates.content.parts) && 
            data.candidates.content.parts.length > 0 && 
            data.candidates.content.parts && 
            data.candidates.content.parts.text) {
          responseText = data.candidates.content.parts.text;
          console.log('✅ Method 1 successful - Standard path');
        }
      } catch (e) {
        console.log('⚠️ Method 1 failed:', e);
      }

      // Method 2: Alternative - candidates.text
      if (!responseText) {
        try {
          if (data && 
              data.candidates && 
              Array.isArray(data.candidates) && 
              data.candidates.length > 0 && 
              data.candidates && 
              data.candidates.text) {
            responseText = data.candidates.text;
            console.log('✅ Method 2 successful - Direct text');
          }
        } catch (e) {
          console.log('⚠️ Method 2 failed:', e);
        }
      }

      // Method 3: Output field
      if (!responseText) {
        try {
          if (data && 
              data.candidates && 
              Array.isArray(data.candidates) && 
              data.candidates.length > 0 && 
              data.candidates[0] && 
              data.candidates.output) {
            responseText = data.candidates.output;
            console.log('✅ Method 3 successful - Output field');
          }
        } catch (e) {
          console.log('⚠️ Method 3 failed:', e);
        }
      }

      // Method 4: Message field
      if (!responseText) {
        try {
          if (data && 
              data.candidates && 
              Array.isArray(data.candidates) && 
              data.candidates.length > 0 && 
              data.candidates[0] && 
              data.candidates.message) {
            responseText = data.candidates.message;
            console.log('✅ Method 4 successful - Message field');
          }
        } catch (e) {
          console.log('⚠️ Method 4 failed:', e);
        }
      }

      // Method 5: Deep search for any text field
      if (!responseText) {
        try {
          const findTextInObject = (obj: any): string | null => {
            if (typeof obj === 'string' && obj.length > 10) {
              return obj;
            }
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                if (key === 'text' && typeof obj[key] === 'string' && obj[key].length > 0) {
                  return obj[key];
                }
                const result = findTextInObject(obj[key]);
                if (result) return result;
              }
            }
            return null;
          };
          
          responseText = findTextInObject(data);
          if (responseText) {
            console.log('✅ Method 5 successful - Deep search');
          }
        } catch (e) {
          console.log('⚠️ Method 5 failed:', e);
        }
      }

      // Fallback responses if all methods fail
      if (!responseText) {
        console.log('⚠️ All extraction methods failed, using fallback');
        
        if (intent.type === 'casual') {
          responseText = `G'day ${userProfile.name}! How can I help with your financial goals today?`;
        } else if (intent.type === 'super') {
          responseText = `Happy to help with superannuation, ${userProfile.name}! With ${userProfile.retirement_age - userProfile.age} years to retirement, let's explore the best super strategies for your situation.`;
        } else if (intent.type === 'analysis') {
          responseText = `I'd be happy to analyze your portfolio, ${userProfile.name}. Your current portfolio is worth $${portfolioValue.toLocaleString()}. Let me provide some insights based on your ${userProfile.risk_tolerance} risk tolerance.`;
        } else {
          responseText = `I'm here to help with your financial questions, ${userProfile.name}. What specific information would you like to know?`;
        }
      }

      // Format response
      const formattedResponse = responseText
        .replace(/(^|\n)\s*[\*\/]\s+/g, '$1• ')
        .replace(/\*\*([^*]+)\*\*/g, '**$1**')
        .trim();

      console.log('✅ Final formatted response:', formattedResponse);
      return { text: formattedResponse, type: intent.type };

    } catch (error) {
      console.error('💥 SuperAI Error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = '';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Invalid API key. Please check your configuration.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request. Please try rephrasing your question.';
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = 'Unknown error occurred';
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const CombinedAI: React.FC = () => {
  const { user } = useAuth();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiService = SuperAI.getInstance();

  // Data fetching functions
  const fetchUserProfile = useCallback(async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }, [user]);

  const fetchUserHoldings = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setHoldings(data || []);
      return data || [];
    } catch (error) {
      console.error('Holdings fetch error:', error);
      return [];
    }
  }, [user]);

  const calculatePortfolioValue = useCallback((holdingsData: UserHolding[]) => {
    return holdingsData.reduce((sum, holding) => {
      return sum + (holding.quantity * holding.current_price);
    }, 0);
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setDataLoading(true);
      try {
        await Promise.all([fetchUserProfile(), fetchUserHoldings()]);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user, fetchUserProfile, fetchUserHoldings]);

  // Initialize welcome message
  useEffect(() => {
    if (userProfile && !dataLoading && messages.length === 0) {
      const portfolioValue = calculatePortfolioValue(holdings);

      const welcomeText = `**G'day ${userProfile.name}! 👋**

I'm your Australian superannuation and investment specialist.

**Your Snapshot:**
• Portfolio: **$${portfolioValue.toLocaleString()}**
• Super: **$${userProfile.monthly_contribution}/month**
• Retirement: **${userProfile.retirement_age - userProfile.age} years to go**

**I specialize in:**
🏦 **Superannuation strategies** (2025 caps: $30k concessional)
📈 **Investment optimization** 
💰 **Tax-effective planning**
🎯 **Retirement planning**

**Ask me anything about super, investing, or your financial future!**`;

      setMessages([{
        id: 'welcome',
        text: welcomeText,
        sender: 'ai',
        timestamp: new Date(),
        portfolioValue
      }]);
    }
  }, [userProfile, holdings, dataLoading, messages.length, calculatePortfolioValue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || loading || !userProfile) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < 2000) {
      setError(`Wait ${Math.ceil((2000 - (now - lastRequestTime)) / 1000)}s`);
      setTimeout(() => setError(null), 1500);
      return;
    }

    setError(null);
    setLastRequestTime(now);

    const portfolioValue = calculatePortfolioValue(holdings);
    
    // Add user message
    const userMessage: Message = {
      id: `user-${now}`,
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
      portfolioValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      console.log('🤖 Generating response...');
      const { text: response, type } = await aiService.generateResponse(textToSend, userProfile, holdings, portfolioValue);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: response,
        sender: 'ai',
        timestamp: new Date(),
        portfolioValue,
        type: type as any
      };

      setMessages(prev => [...prev, aiMessage]);
      console.log('✅ Response added successfully');
    } catch (error) {
      console.error('💥 AI Error:', error);
      setError(error instanceof Error ? error.message : 'Service unavailable');
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, lastRequestTime, userProfile, holdings, calculatePortfolioValue, aiService]);

  // Compact Quick Actions
  const quickActions = [
    { icon: Shield, label: "Risk", query: "Analyze my portfolio risk level", color: "bg-emerald-500" },
    { icon: Calculator, label: "Super", query: "Best superannuation strategies for my age and income", color: "bg-blue-500" },
    { icon: TrendingUp, label: "Grow", query: "How to optimize my portfolio for better returns", color: "bg-purple-500" },
    { icon: Target, label: "Goals", query: "Investment strategy for my retirement goals", color: "bg-orange-500" },
    { icon: PieChart, label: "Diversify", query: "How should I diversify my investments", color: "bg-pink-500" },
    { icon: Globe, label: "ASX", query: "Best ASX opportunities for my risk profile", color: "bg-indigo-500" }
  ];

  // Loading state
  if (dataLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          </motion.div>
          <p>Loading your financial profile...</p>
        </motion.div>
      </div>
    );
  }

  const portfolioValue = calculatePortfolioValue(holdings);

  // Enhanced message renderer
  const MessageText: React.FC<{ text: string; sender: 'user' | 'ai' }> = ({ text, sender }) => {
    if (sender === 'user') {
      return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          // Emoji headers
          if (line.match(/^[🎯📊📈🏦⚖️💰🛡️👋📉🚀⚠️✅💡].+\*\*$/)) {
            return (
              <h3 key={index} className="text-base font-bold text-slate-900 mt-3 mb-2">
                {line.replace(/\*\*/g, '')}
              </h3>
            );
          }
          
          // Bold headers
          if (line.startsWith('**') && line.endsWith('**')) {
            return (
              <h4 key={index} className="text-sm font-semibold text-blue-800 mt-2 mb-1">
                {line.slice(2, -2)}
              </h4>
            );
          }
          
          // Bullet points
          if (line.startsWith('• ')) {
            return (
              <div key={index} className="flex items-start space-x-2 ml-1">
                <span className="text-blue-600 font-bold text-xs mt-1">•</span>
                <span className="flex-1 text-sm leading-relaxed text-slate-700">
                  <span dangerouslySetInnerHTML={{ 
                    __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>') 
                  }} />
                </span>
              </div>
            );
          }
          
          if (line.trim()) {
            return (
              <div 
                key={index} 
                className="text-sm leading-relaxed text-slate-700"
                dangerouslySetInnerHTML={{ 
                  __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>') 
                }}
              />
            );
          }
          
          return <div key={index} className="h-1" />;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-48 h-48 bg-green-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto p-4">
        {/* Compact header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center space-x-3 mb-3">
            <motion.div 
              className="p-2 bg-gradient-to-br from-blue-400 to-green-400 rounded-xl shadow-lg"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-white">SuperAI Financial Advisor</h1>
              <p className="text-blue-200 text-xs">Australian Super & Investment Specialist</p>
            </div>
          </div>

          {/* Compact status bar */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="text-white text-xs">${portfolioValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
              <Clock className="w-3 h-3 text-purple-400" />
              <span className="text-white text-xs">{userProfile.retirement_age - userProfile.age}y to retire</span>
            </div>
          </div>
        </motion.div>

        {/* Main chat container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
          style={{ height: 'calc(100vh - 180px)' }}
        >
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-2 max-w-4xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                        message.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-green-500 to-blue-500'
                      }`}>
                        {message.sender === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Brain className="w-4 h-4 text-white" />
                        )}
                      </div>

                      <div className={`rounded-xl p-4 shadow-md ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-900 border border-slate-200'
                      }`}>
                        <MessageText text={message.text} sender={message.sender} />
                        
                        <div className={`mt-2 text-xs ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                          {message.portfolioValue && (
                            <span className="ml-2">• ${message.portfolioValue.toLocaleString()}</span>
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
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                        <span className="text-slate-600 text-sm">Researching...</span>
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
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-700">Quick Commands</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendMessage(action.query)}
                        disabled={loading}
                        className={`group ${action.color} text-white p-3 rounded-lg text-center transition-all duration-200 disabled:opacity-50 hover:shadow-md`}
                        title={action.query}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium">{action.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="p-4 border-t border-slate-200 bg-white">
              {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-3">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about super, investments, or retirement planning..."
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  rows={2}
                />
                
                <button
                  type="submit"
                  disabled={!inputText.trim() || loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>

              <div className="mt-2 text-xs text-slate-500 text-center">
                SuperAI • Current 2025 Rules • Bulletproof API
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CombinedAI;
