import React, { useState } from 'react';
import { TrendingUp, MessageCircle, BookOpen, BarChart3, LineChart, Briefcase, Calculator, Bot } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 w-screen bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0" onClick={() => setCurrentView('dashboard')} title="Go to Home">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg shadow-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 leading-tight truncate">SuperAI Advisor</span>
              <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:block truncate">Your AI Investment Guide</span>
            </div>
          </div>

          {/* Desktop Nav */}
          {userProfile && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-3 2xl:gap-4">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as any)}
                    className={`flex items-center gap-1 px-2 xl:px-3 py-2 rounded-lg transition-all duration-200 text-xs xl:text-sm font-medium ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 shadow'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Mobile Hamburger */}
          {userProfile && (
            <button
              className="inline-flex lg:hidden items-center justify-center p-2 rounded-md text-slate-600 hover:text-blue-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* User Info */}
          {userProfile && (
            <div className="hidden sm:flex items-center gap-2 md:gap-3 min-w-0">
              <div className="text-right max-w-[80px] md:max-w-[110px] lg:max-w-[140px] truncate">
                <p className="text-xs md:text-sm font-medium text-slate-900 truncate">{userProfile.name}</p>
                <p className="text-[10px] md:text-xs text-slate-500 truncate">${userProfile.currentSuper.toLocaleString()}</p>
              </div>
              <button
                className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 shadow"
                title="View Profile"
                onClick={() => setCurrentView('profile')}
              >
                <span className="text-white font-bold text-base md:text-lg">{userProfile.name.charAt(0)}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {userProfile && mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 right-0 w-72 sm:w-80 bg-white shadow-2xl h-full p-4 sm:p-6 flex flex-col gap-2 animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg">SuperAI Advisor</span>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id as any); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-700 hover:text-blue-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="mt-auto flex items-center gap-3 border-t pt-4">
              <button
                className="w-9 h-9 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="View Profile"
                onClick={() => { setCurrentView('profile'); setMobileMenuOpen(false); }}
              >
                <span className="text-white font-bold text-base">{userProfile.name.charAt(0)}</span>
              </button>
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-900">{userProfile.name}</p>
                <p className="text-[10px] text-slate-500">${userProfile.currentSuper.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};