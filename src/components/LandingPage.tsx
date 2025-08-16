import React, { useState, useEffect } from 'react';
import { TrendingUp, Shield, Users, Award, ChevronRight, CheckCircle, Star, ArrowRight, BarChart3, PieChart, LineChart } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  // Dynamic Text Animation
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const dynamicWords = [
    { word: 'Retirement', color: 'from-blue-600 to-green-600' },
    { word: 'Future', color: 'from-purple-600 to-pink-600' },
    { word: 'Wealth', color: 'from-green-600 to-blue-600' },
    { word: 'Dreams', color: 'from-orange-600 to-red-600' },
    { word: 'Freedom', color: 'from-indigo-600 to-purple-600' }
  ];

  // Animated Counter Hook
  const useAnimatedCounter = (end: number, duration: number = 3000) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
            let startTime: number;
            let animationFrame: number;
            
            const animate = (currentTime: number) => {
              if (!startTime) startTime = currentTime;
              const progress = Math.min((currentTime - startTime) / duration, 1);
              
              setCount(Math.floor(progress * end));
              
              if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
              }
            };
            
            animationFrame = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrame);
          }
        },
        { threshold: 0.5 }
      );
      
      const element = document.getElementById('stats-section');
      if (element) observer.observe(element);
      
      return () => observer.disconnect();
    }, [end, duration, hasStarted]);
    
    return count;
  };

  // Dynamic word cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % dynamicWords.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Investment Calculator State
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState({
    currentSuper: 50000,
    monthlyContribution: 500,
    yearsToRetirement: 30
  });

  // Animated counters
  const analysesCount = useAnimatedCounter(1000);
  const optionsCount = useAnimatedCounter(25);
  const returnCount = useAnimatedCounter(87);
  const accuracyCount = useAnimatedCounter(94);

  // Chart data for projections
  const projectionData = [
    { year: 2024, conservative: 50000, moderate: 50000, aggressive: 50000 },
    { year: 2029, conservative: 85000, moderate: 95000, aggressive: 110000 },
    { year: 2034, conservative: 125000, moderate: 155000, aggressive: 195000 },
    { year: 2039, conservative: 175000, moderate: 245000, aggressive: 340000 },
    { year: 2044, conservative: 235000, moderate: 385000, aggressive: 590000 },
    { year: 2049, conservative: 310000, moderate: 595000, aggressive: 1020000 },
    { year: 2054, conservative: 400000, moderate: 915000, aggressive: 1750000 }
  ];

  const portfolioData = [
    { name: 'Australian Shares', value: 40, color: '#3B82F6' },
    { name: 'International Shares', value: 35, color: '#10B981' },
    { name: 'Bonds', value: 15, color: '#8B5CF6' },
    { name: 'Property', value: 8, color: '#F59E0B' },
    { name: 'Cash', value: 2, color: '#6B7280' }
  ];

  const performanceData = [
    { month: 'Jan', return: 0.8 },
    { month: 'Feb', return: 1.2 },
    { month: 'Mar', return: -0.5 },
    { month: 'Apr', return: 2.1 },
    { month: 'May', return: 1.8 },
    { month: 'Jun', return: 0.9 },
    { month: 'Jul', return: 1.5 },
    { month: 'Aug', return: -0.3 },
    { month: 'Sep', return: 2.3 },
    { month: 'Oct', return: 1.1 },
    { month: 'Nov', return: 1.7 },
    { month: 'Dec', return: 2.0 }
  ];

  // Calculate investment projection
  const calculateProjection = () => {
    const { currentSuper, monthlyContribution, yearsToRetirement } = calculatorInputs;
    const annualReturn = 0.075;
    const monthlyReturn = annualReturn / 12;
    const totalMonths = yearsToRetirement * 12;
    
    const futureCurrentSuper = currentSuper * Math.pow(1 + annualReturn, yearsToRetirement);
    const futureContributions = monthlyContribution * 
      ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
    
    return Math.round(futureCurrentSuper + futureContributions);
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'AI-Powered Investment Advice',
      description: 'Get personalized superannuation strategies powered by advanced AI algorithms and market analysis.',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'from-blue-600 to-blue-700'
    },
    {
      icon: Shield,
      title: 'Risk-Optimized Portfolios',
      description: 'Tailored investment allocations based on your risk tolerance and retirement timeline.',
      color: 'from-green-500 to-green-600',
      hoverColor: 'from-green-600 to-green-700'
    },
    {
      icon: Users,
      title: 'Expert-Backed Insights',
      description: 'Our AI is trained on decades of financial expertise and real market performance data.',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'from-purple-600 to-purple-700'
    }
  ];

  const benefits = [
    'Maximize your retirement savings potential',
    'Reduce investment fees through smart allocation',
    'Get 24/7 access to personalized advice',
    'Track performance with real-time analytics',
    'Educational resources to build financial literacy',
    'Secure, bank-level data protection'
  ];

  const stats = [
    { value: `${analysesCount.toLocaleString()}+`, label: 'Portfolio Analyses', icon: BarChart3 },
    { value: `${optionsCount}+`, label: 'Investment Options', icon: PieChart },
    { value: `${returnCount / 10}%`, label: 'Target Annual Return', icon: TrendingUp },
    { value: `${accuracyCount}%`, label: 'AI Accuracy Rate', icon: Shield }
  ];

  const currentWord = dynamicWords[currentWordIndex];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 truncate">SuperAI Advisor</h1>
                <p className="text-[10px] sm:text-xs text-slate-600 truncate">Your AI Investment Guide</p>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Start Free</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Maximize Your{' '}
                <span 
                  className={`bg-gradient-to-r ${currentWord.color} bg-clip-text text-transparent transition-all duration-500 ${
                    isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  {currentWord.word}
                </span>
                <br />with AI
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 mb-6 sm:mb-8 leading-relaxed animate-fade-in-up animation-delay-300">
                Get personalized superannuation advice powered by artificial intelligence. 
                Optimize your portfolio, reduce fees, and secure your financial future with 
                expert-backed strategies tailored just for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-in-up animation-delay-600">
                <button
                  onClick={onGetStarted}
                  className="group flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-300 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <span className="hidden sm:inline">Start Your Free Analysis</span>
                  <span className="sm:hidden">Start Free Analysis</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <button className="group flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-slate-300 text-slate-700 rounded-lg hover:border-slate-400 hover:bg-slate-50 hover:scale-105 transition-all duration-300 font-semibold text-base sm:text-lg">
                  Watch Demo
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600 animate-fade-in-up animation-delay-900">
                <div className="flex items-center group">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Free to start
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  No hidden fees
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Bank-level security
                </div>
              </div>
            </div>
            
            {/* Interactive Dashboard Preview */}
            <div className="relative animate-fade-in-left">
              <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 hover:shadow-3xl transition-all duration-500 hover:scale-105">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Live Portfolio Analysis</h3>
                    <p className="text-slate-600 text-xs sm:text-sm">Real-time AI insights</p>
                  </div>
                </div>
                
                {/* Mini Performance Chart */}
                <div className="mb-4 sm:mb-6 h-24 sm:h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <Area
                        type="monotone"
                        dataKey="return"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#colorGradient)"
                        fillOpacity={0.6}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-300 cursor-pointer">
                    <span className="text-sm sm:text-base font-medium text-slate-900">Current Balance</span>
                    <span className="text-sm sm:text-base font-bold text-green-600 animate-pulse">$127,450</span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-300 cursor-pointer">
                    <span className="text-sm sm:text-base font-medium text-slate-900">Projected Growth</span>
                    <span className="text-sm sm:text-base font-bold text-blue-600 animate-pulse">+$45,200</span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-300 cursor-pointer">
                    <span className="text-sm sm:text-base font-medium text-slate-900">Retirement Goal</span>
                    <span className="text-sm sm:text-base font-bold text-purple-600 animate-pulse">$850,000</span>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg text-white hover:from-blue-700 hover:to-green-700 transition-all duration-300 cursor-pointer">
                  <p className="text-xs sm:text-sm opacity-90 mb-1">🤖 AI Recommendation</p>
                  <p className="text-sm sm:text-base font-semibold">Increase contributions by $150/month to reach your goal 3 years earlier</p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce opacity-80"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-ping opacity-60"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Stats Section */}
      <section id="stats-section" className="py-16 bg-gradient-to-r from-slate-900 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 animate-fade-in-up">
              Trusted by Smart Investors
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 animate-fade-in-up animation-delay-300">
              Our AI technology delivers results you can count on
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="text-center group cursor-pointer"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300 mx-auto mb-3 sm:mb-4 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                      {stat.value}
                    </div>
                    <div className="text-blue-200 text-xs sm:text-sm group-hover:text-white transition-colors duration-300">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Investment Projections Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 animate-fade-in-up">
              See Your Future Wealth Grow
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto animate-fade-in-up animation-delay-300">
              Visualize different investment strategies and their potential outcomes over time
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 lg:mb-16">
            {/* Growth Projection Chart */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center">
                <LineChart className="w-6 h-6 mr-3 text-blue-600" />
                Investment Growth Projections
              </h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={10} />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      stroke="#64748b" 
                      fontSize={10} 
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString()}`,
                        name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                      labelFormatter={(label) => `Year: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="conservative"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      name="conservative"
                    />
                    <Line
                      type="monotone"
                      dataKey="moderate"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      name="moderate"
                    />
                    <Line
                      type="monotone"
                      dataKey="aggressive"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                      name="aggressive"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 text-xs sm:text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Conservative (5.5%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Moderate (7.5%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Aggressive (9.5%)</span>
                </div>
              </div>
            </div>

            {/* Portfolio Allocation Chart */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center">
                <PieChart className="w-6 h-6 mr-3 text-green-600" />
                Recommended Portfolio Mix
              </h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={portfolioData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs sm:text-sm">
                {portfolioData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 animate-fade-in-up">
              Why Choose SuperAI Advisor?
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto animate-fade-in-up animation-delay-300">
              Our AI-powered platform combines cutting-edge technology with proven investment strategies 
              to help you make smarter decisions about your superannuation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="group text-center p-6 sm:p-8 rounded-xl border border-slate-200 hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50"
                  style={{
                    animationDelay: `${index * 200}ms`
                  }}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} group-hover:bg-gradient-to-br group-hover:${feature.hoverColor} rounded-xl mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">{feature.description}</p>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-green-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-12 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-4 sm:mb-6">
                  Everything You Need to Succeed
                </h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 group cursor-pointer hover:translate-x-2 transition-transform duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-sm sm:text-base text-slate-700 group-hover:text-slate-900 transition-colors duration-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 sm:p-6 shadow-inner border border-slate-200">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Sample AI Insights
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-300 cursor-pointer">
                    <p className="text-xs sm:text-sm font-medium text-blue-900">Portfolio Optimization</p>
                    <p className="text-xs sm:text-sm text-blue-700">Rebalance to 70% growth assets for better long-term returns</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-300 cursor-pointer">
                    <p className="text-xs sm:text-sm font-medium text-green-900">Tax Strategy</p>
                    <p className="text-xs sm:text-sm text-green-700">Salary sacrifice $200/month to save $1,200 in tax annually</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-300 cursor-pointer">
                    <p className="text-xs sm:text-sm font-medium text-purple-900">Fee Reduction</p>
                    <p className="text-xs sm:text-sm text-purple-700">Switch to low-cost index funds to save $800/year in fees</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Investment Calculator */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setCalculatorOpen(!calculatorOpen)}
          className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 animate-bounce"
        >
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        {calculatorOpen && (
          <div className="absolute bottom-16 right-0 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 sm:p-6 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Quick Calculator
              </h3>
              <button
                onClick={() => setCalculatorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg sm:text-xl hover:scale-110 transition-all duration-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Current Super</label>
                <input
                  type="number"
                  value={calculatorInputs.currentSuper}
                  onChange={(e) => setCalculatorInputs(prev => ({ ...prev, currentSuper: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Monthly Contribution</label>
                <input
                  type="number"
                  value={calculatorInputs.monthlyContribution}
                  onChange={(e) => setCalculatorInputs(prev => ({ ...prev, monthlyContribution: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Years to Retirement</label>
                <input
                  type="number"
                  value={calculatorInputs.yearsToRetirement}
                  onChange={(e) => setCalculatorInputs(prev => ({ ...prev, yearsToRetirement: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
                />
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Projected Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 animate-pulse">
                    ${calculateProjection().toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Based on 7.5% annual return</p>
                </div>
              </div>
              
              <button
                onClick={onGetStarted}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 hover:scale-105 transition-all duration-300 font-medium text-sm"
              >
                Get Personalized Plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center relative">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 animate-fade-in-up">
            Ready to Optimize Your Retirement Strategy?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed animate-fade-in-up animation-delay-300">
            Join thousands of Australians who are already using AI to maximize their superannuation. 
            Get started with your free personalized analysis today.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-lg hover:bg-slate-50 hover:scale-105 transition-all duration-300 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl animate-fade-in-up animation-delay-600"
          >
            Start Your Free Analysis
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          <p className="text-blue-100 text-xs sm:text-sm mt-4 animate-fade-in-up animation-delay-900">
            No credit card required • Free forever • Secure & confidential
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4 group cursor-pointer">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">SuperAI Advisor</h3>
                  <p className="text-slate-400 text-xs sm:text-sm">Your AI Investment Guide</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4 max-w-md text-sm sm:text-base">
                Empowering Australians to make smarter superannuation decisions through 
                AI-powered insights and personalized investment strategies.
              </p>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
                {stats.slice(0, 2).map((stat, index) => (
                  <div key={index} className="text-center p-2 sm:p-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all duration-300 cursor-pointer group">
                    <div className="text-base sm:text-lg font-bold text-white group-hover:scale-110 transition-transform duration-300">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-slate-300">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white mb-3 sm:mb-4">Product</h4>
              <ul className="space-y-1 sm:space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white mb-3 sm:mb-4">Support</h4>
              <ul className="space-y-1 sm:space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-slate-400 text-xs sm:text-sm">
              © 2025 SuperAI Advisor. All rights reserved. | MUFG HACKATHON | This is educational content and not personal financial advice.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-fade-in-left {
          animation: fade-in-left 0.8s ease-out forwards;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-900 {
          animation-delay: 0.9s;
        }
      `}</style>
    </div>
  );
};