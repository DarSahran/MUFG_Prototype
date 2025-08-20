import React, { useState } from 'react';
import { TrendingUp, MessageCircle, BookOpen, BarChart3, LineChart, Briefcase, Calculator, Bot, Menu, X, RefreshCw, DollarSign, Star } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio';
import { UserProfile } from '../App';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: 'onboarding' | 'dashboard' | 'combined-ai' | 'education' | 'profile' | 'market' | 'investments' | 'forecasting') => void;
  userProfile: UserProfile | null;
  subscription?: any;
  subscriptionPlan?: any;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, userProfile, subscription, subscriptionPlan }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getTotalPortfolioValue, loading: portfolioLoading, refetch } = usePortfolio();
  const [refreshing, setRefreshing] = useState(false);

  // Get real-time portfolio value
  const totalPortfolioValue = getTotalPortfolioValue();

  // Default to dashboard if currentView is empty or undefined
  const effectiveView = currentView || 'dashboard';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'combined-ai', label: 'AI Advisor', icon: Bot },
    { id: 'investments', label: 'Portfolio', icon: Briefcase },
    { id: 'market', label: 'Market', icon: LineChart },    
    { id: 'forecasting', label: 'Forecasting', icon: Calculator },    
    { id: 'education', label: 'Learn', icon: BookOpen },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
  ];

  const handleRefreshPortfolio = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatPortfolioValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50 shadow-sm">
  <div className="w-full max-w mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="grid grid-cols-5 items-center h-16 w-full gap-2">
            {/* 1. Website Name/Logo */}
            <div className="flex items-center min-w-0 justify-start">
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none flex-shrink-0 hover:opacity-80 transition-opacity"
                onClick={() => setCurrentView('dashboard')}
                title="Go to Dashboard"
              >
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex flex-col min-w-0 hidden xs:flex">
                  <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight truncate">
                    SuperAI Advisor
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 truncate">
                    Your AI Investment Guide
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Spacer (free space) */}
            <div className="hidden md:block" />

            {/* 3. Navigation */}
            <div className="flex items-center justify-center">
              {userProfile && (
                <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = effectiveView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as any)}
                        className={`flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg transition-all duration-200 text-xs xl:text-sm font-medium whitespace-nowrap ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 shadow-sm scale-105'
                            : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50 hover:scale-102'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden xl:inline">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* 4. Spacer (free space) */}
            <div className="hidden md:block" />

            {/* 5. Profile/Actions */}
            <div className="flex items-center min-w-0 justify-end">
              {userProfile && (
                <>
                  {/* Portfolio Value Display */}
                  <div className="hidden sm:flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <div className="text-right min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-900 truncate">
                          {portfolioLoading ? 'Loading...' : formatPortfolioValue(totalPortfolioValue)}
                        </span>
                        <button
                          onClick={handleRefreshPortfolio}
                          disabled={refreshing || portfolioLoading}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-50 transition-colors"
                          title="Refresh portfolio value"
                        >
                          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">Portfolio Value</p>
                    </div>
                  </div>

                  {/* Gap between portfolio value and profile icon */}
                  <div className="hidden sm:block w-4" />

                  {/* User Avatar */}
                  <button
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 shadow hover:scale-105 transition-all duration-200 flex-shrink-0"
                    title="View Profile"
                    onClick={() => setCurrentView('profile')}
                  >
                    <span className="text-white font-bold text-sm sm:text-base">
                      {userProfile.name.charAt(0)}
                    </span>
                  </button>
              
                  {/* Subscription Badge */}
                  {subscriptionPlan && (
                    <div className="hidden sm:flex items-center ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3 mr-1 " />
                      {subscriptionPlan.name.replace('SuperAI ', '')}
                    </div>
                  )}

                  {/* Mobile Menu Button */}
                  <button
                    className="inline-flex lg:hidden items-center justify-center p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors flex-shrink-0"
                    aria-label="Open menu"
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {userProfile && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Drawer */}
          <div className="lg:hidden fixed top-0 right-0 z-50 w-80 max-w-[85vw] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-green-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg shadow">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-lg">SuperAI</span>
                    <p className="text-xs text-slate-600">Investment Guide</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Portfolio Value in Mobile */}
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Portfolio Value</p>
                    <p className="text-lg font-bold text-blue-600">
                      {portfolioLoading ? 'Loading...' : formatPortfolioValue(totalPortfolioValue)}
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshPortfolio}
                    disabled={refreshing || portfolioLoading}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
                    title="Refresh portfolio"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { 
                          setCurrentView(item.id as any); 
                          setMobileMenuOpen(false); 
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                            : 'text-slate-700 hover:text-blue-700 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full ml-auto"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* User Profile Section */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                {/* Subscription Status */}
                {subscriptionPlan && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        {subscriptionPlan.name} Plan
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Active subscription
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => { 
                    setCurrentView('profile'); 
                    setMobileMenuOpen(false); 
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors border border-slate-200 bg-white shadow-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                    <span className="text-white font-bold text-base">
                      {userProfile.name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {userProfile.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      View Profile & Settings
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};