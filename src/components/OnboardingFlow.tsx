
import React, { useState } from 'react';
import { ChevronRight, Target, DollarSign, TrendingUp } from 'lucide-react';
import { UserProfile } from '../App';

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  
  // Get user's name from localStorage if available
  const storedName = localStorage.getItem('userFullName') || '';
  
  const [formData, setFormData] = useState({
    name: storedName,
    age: 30,
    retirementAge: 65,
    annualIncome: 50000,
    totalSavings: 10000,
    currentSuper: 50000,
    monthlyContribution: 500,
    employerContribution: 458,
    riskTolerance: 'balanced' as const,
    investmentExperience: 'beginner' as const,
    financialGoals: [] as string[],
    preferredSectors: [] as string[],
    esgPreferences: false,
    taxConsiderations: [] as string[],
    employmentStatus: 'Full-time',
    relationshipStatus: 'Single',
    dependents: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate years to retirement
  const yearsToRetirement = formData.retirementAge - formData.age;
  const goalOptions = [
    'Maximize retirement savings',
    'Generate steady income',
    'Leave an inheritance',
    'Buy property before retirement',
    'Early retirement',
    'Travel and lifestyle goals'
  ];

  const riskOptions = [
    { value: 'conservative', label: 'Conservative', desc: 'Steady growth, lower risk' },
    { value: 'balanced', label: 'Balanced', desc: 'Mix of growth and stability' },
    { value: 'growth', label: 'Growth', desc: 'Higher potential returns' },
    { value: 'aggressive', label: 'Aggressive', desc: 'Maximum growth potential' },
  ];

  const handleNext = async () => {
    setError(null);
    if (step < 5) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      try {
        // Clear stored name after successful onboarding
        localStorage.removeItem('userFullName');
        await onComplete({
          name: formData.name,
          age: formData.age,
          retirement_age: formData.retirementAge,
          annual_income: formData.annualIncome,
          total_savings: formData.totalSavings,
          current_super: formData.currentSuper,
          monthly_contribution: formData.monthlyContribution,
          employer_contribution: formData.employerContribution,
          risk_tolerance: formData.riskTolerance,
          investment_experience: formData.investmentExperience,
          financial_goals: formData.financialGoals,
          preferred_sectors: formData.preferredSectors,
          esg_preferences: formData.esgPreferences,
          tax_considerations: formData.taxConsiderations,
          employment_status: formData.employmentStatus,
          relationship_status: formData.relationshipStatus,
          dependents: formData.dependents,
    // completed: true, // removed, not in Supabase schema
        } as any);
      } catch (e: any) {
        setError(e?.message || 'Failed to complete onboarding. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.includes(goal)
        ? prev.financialGoals.filter(g => g !== goal)
        : [...prev.financialGoals, goal]
    }));
  };

  const sectorOptions = [
    'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrials', 'Real Estate', 'Utilities', 'Other'
  ];
  const taxOptions = [
    'Salary Sacrifice', 'Spouse Contributions', 'Government Co-contribution', 'None'
  ];
  const employmentOptions = [
    'Employed', 'Self-employed', 'Unemployed', 'Retired', 'Student', 'Other'
  ];
  const relationshipOptions = [
    'Single', 'Married', 'De Facto', 'Divorced', 'Widowed', 'Other'
  ];
  const experienceOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  // Streamlined, unique steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Let's get to know you</h2>
              <p className="text-sm sm:text-base text-slate-600">Tell us about yourself to personalize your investment advice</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg text-sm sm:text-base ${
                    storedName 
                      ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed' 
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  placeholder="Enter your name"
                  readOnly={!!storedName}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Current Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Planned Retirement Age</label>
                <input
                  type="number"
                  value={formData.retirementAge || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, retirementAge: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter retirement age"
                />
              </div>
            </div>
            
            {/* Years to Retirement Display */}
            {formData.age && formData.retirementAge && !isNaN(formData.retirementAge) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Investment Timeline</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {yearsToRetirement > 0 ? yearsToRetirement : 0} years
                </div>
                <p className="text-sm text-blue-700">
                  {yearsToRetirement > 0 
                    ? `You have ${yearsToRetirement} years to build your retirement savings`
                    : yearsToRetirement === 0 
                      ? 'You are at retirement age'
                      : 'Please check your retirement age - it should be greater than your current age'
                  }
                </p>
                {yearsToRetirement > 40 && (
                  <p className="text-xs text-blue-600 mt-2">
                    ✨ Great! You have plenty of time for long-term growth strategies
                  </p>
                )}
                {yearsToRetirement <= 10 && yearsToRetirement > 0 && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚡ Consider more conservative investment approaches as you near retirement
                  </p>
                )}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Your Finances</h2>
              <p className="text-sm sm:text-base text-slate-600">Tell us about your income and savings</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Annual Income ($)</label>
                <input
                  type="number"
                  value={formData.annualIncome}
                  onChange={e => setFormData(prev => ({ ...prev, annualIncome: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Total Savings ($)</label>
                <input
                  type="number"
                  value={formData.totalSavings}
                  onChange={e => setFormData(prev => ({ ...prev, totalSavings: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Current Superannuation Balance ($)</label>
                <input
                  type="number"
                  value={formData.currentSuper}
                  onChange={e => setFormData(prev => ({ ...prev, currentSuper: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Monthly Contribution ($)</label>
                <input
                  type="number"
                  value={formData.monthlyContribution}
                  onChange={e => setFormData(prev => ({ ...prev, monthlyContribution: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Employer Contribution ($/mo)</label>
                <input
                  type="number"
                  value={formData.employerContribution}
                  onChange={e => setFormData(prev => ({ ...prev, employerContribution: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Your Goals & Risk</h2>
              <p className="text-sm sm:text-base text-slate-600">Select your financial goals and risk tolerance</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Financial Goals</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goalOptions.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => handleGoalToggle(goal)}
                    className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      formData.financialGoals.includes(goal)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium text-slate-900">{goal}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Risk Tolerance</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {riskOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, riskTolerance: option.value as any }))}
                    className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      formData.riskTolerance === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium text-slate-900">{option.label}</span>
                    <span className="block text-xs sm:text-sm text-slate-500">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Preferences</h2>
              <p className="text-sm sm:text-base text-slate-600">Set your sector, ESG, and tax preferences</p>
            </div>
            <div className="mb-6">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-3">Preferred Sectors</label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {sectorOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        preferredSectors: prev.preferredSectors.includes(opt)
                          ? prev.preferredSectors.filter(s => s !== opt)
                          : [...prev.preferredSectors, opt]
                      }));
                    }}
                    className={`px-3 sm:px-4 py-2 rounded-full border-2 text-xs sm:text-sm font-medium transition-all duration-150 ${
                      formData.preferredSectors.includes(opt)
                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-3">ESG Preferences</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, esgPreferences: !prev.esgPreferences }))}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                    formData.esgPreferences
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-slate-300'
                  }`}
                  aria-pressed={formData.esgPreferences}
                >
                  {formData.esgPreferences && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
                <span className="text-sm sm:text-base text-slate-700">I prefer ESG (Environmental, Social, Governance) investments</span>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-3">Tax Considerations</label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {taxOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        taxConsiderations: prev.taxConsiderations.includes(opt)
                          ? prev.taxConsiderations.filter(t => t !== opt)
                          : [...prev.taxConsiderations, opt]
                      }));
                    }}
                    className={`px-3 sm:px-4 py-2 rounded-full border-2 text-xs sm:text-sm font-medium transition-all duration-150 ${
                      formData.taxConsiderations.includes(opt)
                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">About You</h2>
              <p className="text-sm sm:text-base text-slate-600">Tell us about your employment, relationship, and dependents</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Employment Status</label>
                <select
                  value={formData.employmentStatus}
                  onChange={e => setFormData(prev => ({ ...prev, employmentStatus: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  {employmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Relationship Status</label>
                <select
                  value={formData.relationshipStatus}
                  onChange={e => setFormData(prev => ({ ...prev, relationshipStatus: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  {relationshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Number of Dependents</label>
                <input
                  type="number"
                  value={formData.dependents}
                  onChange={e => setFormData(prev => ({ ...prev, dependents: parseInt(e.target.value) }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Investment Experience</label>
                <select
                  value={formData.investmentExperience}
                  onChange={e => setFormData(prev => ({ ...prev, investmentExperience: e.target.value as any }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  {experienceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-medium text-slate-600">Step {step} of 5</span>
            <span className="text-xs sm:text-sm font-medium text-slate-600">{Math.round((step / 5) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
          {renderStep()}
          {error && (
            <div className="mb-4 text-red-600 text-center font-medium">{error}</div>
          )}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={submitting}
                className="px-4 sm:px-6 py-2 sm:py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-sm sm:text-base"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={submitting || (step === 1 && !formData.name)}
              className={`ml-auto flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base ${submitting ? 'cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{step === 5 ? 'Complete Setup' : 'Next'}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};