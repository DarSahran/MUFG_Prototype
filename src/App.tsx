import React, { useState } from 'react';
import { Header } from './components/Header';
// import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { Dashboard as EnhancedDashboard } from './components/Dashboard/Dashboard';
import { OnboardingFlow } from './components/OnboardingFlow';
import { EducationCenter } from './components/EducationCenter';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/Auth/LoginPage';
import { SignupPage } from './components/Auth/SignupPage';
import { ForgotPasswordPage } from './components/Auth/ForgotPasswordPage';
import { MarketTrends } from './components/MarketTrends';
import { InvestmentManager } from './components/InvestmentManager';
import { ForecastingTool } from './components/ForecastingTool';
import { CombinedAI } from './components/CombinedAI';
import { AIRecommendations } from './components/AIRecommendations/AIRecommendations';
import ProfilePage from './components/ProfilePage';
import { PricingPage } from './components/PricingPage';

import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';

export type UserProfile = {
  name: string;
  age: number;
  retirementAge: number;
  currentSuper: number;
  monthlyContribution: number;
  riskTolerance: 'conservative' | 'balanced' | 'growth' | 'aggressive';
  financialGoals: string[];
  completed: boolean;
  // Extended fields for profile page
  occupation?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  email?: string;
  phone?: string;
  socialLinks?: { linkedin?: string; github?: string };
  annualIncome?: number;
  investmentPreference?: string;
  communicationPreference?: string;
  twoFactorEnabled?: boolean;
  lastLogin?: string;
};



type View = 'landing' | 'onboarding' | 'dashboard' | 'combined-ai' | 'education' | 'login' | 'signup' | 'forgot' | 'profile' | 'market' | 'investments' | 'forecasting';


function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, createProfile } = useUserProfile();

  // Auth navigation handlers
  const handleSwitchToLogin = () => setCurrentView('login');
  const handleSwitchToSignup = () => setCurrentView('signup');
  const handleSwitchToForgot = () => setCurrentView('forgot');
  const handleBackToLanding = () => setCurrentView('landing');

  // Onboarding complete handler
  const handleOnboardingComplete = async (profileData: any) => {
    console.log('Submitting onboarding profileData:', profileData);
    // Remove 'completed' if present
    if ('completed' in profileData) {
      delete profileData.completed;
    }
    const result = await createProfile(profileData);
    if (result && result.error) {
      console.error('Profile creation error:', result.error);
      alert('Failed to complete onboarding: ' + result.error);
      return;
    }
    console.log('Profile creation result:', result);
    setCurrentView('dashboard');
  };

  // If loading auth/profile, show loading
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in: show landing or auth pages
  if (!user) {
    switch (currentView) {
      case 'signup':
        return <SignupPage onBack={handleBackToLanding} onSwitchToLogin={handleSwitchToLogin} />;
      case 'login':
        return <LoginPage onBack={handleBackToLanding} onSwitchToSignup={handleSwitchToSignup} onForgotPassword={handleSwitchToForgot} />;
      case 'forgot':
        return <ForgotPasswordPage onBack={handleSwitchToLogin} onSwitchToLogin={handleSwitchToLogin} />;
      default:
        return <LandingPage onGetStarted={handleSwitchToSignup} />;
    }
  }

  // Logged in but no profile: show onboarding
  if (!profile) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }


  // Map Supabase profile to app UserProfile type
  const mapProfile = (p: any): UserProfile => ({
    name: p.name,
    age: p.age,
    retirementAge: p.retirement_age,
    currentSuper: p.current_super,
    monthlyContribution: p.monthly_contribution,
    riskTolerance: p.risk_tolerance,
    financialGoals: p.financial_goals || [],
    completed: true,
    occupation: p.occupation || '',
    location: p.location || '',
    dateOfBirth: p.date_of_birth || '',
    gender: p.gender || '',
    maritalStatus: p.marital_status || '',
    email: p.email || '',
    phone: p.phone || '',
    socialLinks: p.social_links || {},
    annualIncome: p.annual_income,
    investmentPreference: p.investment_preference || '',
    communicationPreference: p.communication_preference || '',
    twoFactorEnabled: p.two_factor_enabled || false,
    lastLogin: p.last_login || '',
  });

  const userProfile = mapProfile(profile);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <EnhancedDashboard userProfile={userProfile} />;
      case 'combined-ai':
        return <CombinedAI userProfile={userProfile} />;
      case 'ai-recommendations':
        return <AIRecommendations userProfile={userProfile} />;
      case 'education':
        return <EducationCenter />;
      case 'market':
        return <MarketTrends userProfile={userProfile} />;
      case 'investments':
        return <InvestmentManager userProfile={userProfile} />;
      case 'forecasting':
        return <ForecastingTool userProfile={userProfile} />;
      case 'profile':
        return <ProfilePage userProfile={userProfile} />;
      case 'pricing':
        return <PricingPage />;
      default:
        return <EnhancedDashboard userProfile={userProfile} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        currentView={currentView as Exclude<View, 'landing' | 'login' | 'signup' | 'forgot'>}
        setCurrentView={setCurrentView as any}
        userProfile={userProfile}
      />
      <main className="pt-16">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;