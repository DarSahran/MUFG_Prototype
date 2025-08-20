import React, { useState } from 'react';
import { TrendingUp, MessageCircle, BookOpen, BarChart3, LineChart, Briefcase, Calculator, Bot, Menu, X } from 'lucide-react';
import { UserProfile } from '../App';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: 'onboarding' | 'dashboard' | 'combined-ai' | 'education' | 'profile' | 'market' | 'investments' | 'forecasting') => void;
  userProfile: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, userProfile }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'combined-ai', label: 'AI Advisor', icon: Bot },
    { id: 'ai-recommendations', label: 'AI Recommendations', icon: TrendingUp },
    { id: 'investments', label: 'Portfolio', icon: Briefcase },
    { id: 'market', label: 'Market', icon: LineChart },    
    { id: 'forecasting', label: 'Forecasting', icon: Calculator },    
    { id: 'education', label: 'Learn', icon: BookOpen },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 cursor-pointer select-none min-w-0 flex-shrink-0" onClick={() => setCurrentView('dashboard')} title="Go to Home">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg shadow-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col min-w-0 hidden xs:flex">
              <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight truncate">SuperAI Advisor</span>
              <span className="text-[10px] sm:text-xs text-slate-500 truncate">Your AI Investment Guide</span>
            </div>
          </div>

          {/* Desktop Nav */}
          {userProfile && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as any)}
                    className={`flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 shadow'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline whitespace-nowrap text-xs">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Mobile Hamburger */}
          {userProfile && (
            <button
              className="inline-flex lg:hidden items-center justify-center p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          )}

          {/* User Info */}
          {userProfile && (
            <div className="hidden sm:flex items-center gap-2 min-w-0 flex-shrink-0">
              <div className="text-right max-w-[100px] lg:max-w-[140px]">
                <p className="text-xs font-medium text-slate-900 truncate">{userProfile.name.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-500 truncate">${(userProfile.currentSuper / 1000).toFixed(0)}K</p>
              </div>
              <button
                className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 shadow hover:scale-105 transition-transform"
                title="View Profile"
                onClick={() => setCurrentView('profile')}
              >
                <span className="text-white font-bold text-sm sm:text-base">{userProfile.name.charAt(0)}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {userProfile && mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-0 right-0 z-50 w-80 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 text-lg">SuperAI Advisor</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
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
                        onClick={() => { setCurrentView(item.id as any); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 shadow-sm'
                            : 'text-slate-700 hover:text-blue-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* User Profile Section */}
              <div className="border-t border-slate-200 p-4">
                <button
                  onClick={() => { setCurrentView('profile'); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-base">{userProfile.name.charAt(0)}</span>
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{userProfile.name}</p>
                    <p className="text-xs text-slate-500 truncate">${userProfile.currentSuper.toLocaleString()}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};