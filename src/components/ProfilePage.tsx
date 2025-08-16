import React, { useState } from "react";
import { UserProfile } from "../App";
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Heart, Users, Settings, Shield, Bell, CreditCard, TrendingUp, Edit3, Save, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface ProfilePageProps {
  userProfile: UserProfile;
  onEdit?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userProfile, onEdit }) => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'financial' | 'preferences' | 'security'>('personal');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Personal Info
    name: userProfile.name || '',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    dateOfBirth: userProfile.dateOfBirth || '',
    gender: userProfile.gender || '',
    maritalStatus: userProfile.maritalStatus || '',
    occupation: userProfile.occupation || '',
    location: userProfile.location || '',
    
    // Financial Info
    annualIncome: userProfile.annualIncome || 0,
    currentSuper: userProfile.currentSuper || 0,
    monthlyContribution: userProfile.monthlyContribution || 0,
    retirementAge: userProfile.retirementAge || 65,
    
    // Preferences
    riskTolerance: userProfile.riskTolerance || 'balanced',
    financialGoals: userProfile.financialGoals || [],
    investmentPreference: userProfile.investmentPreference || '',
    communicationPreference: userProfile.communicationPreference || 'email',
    
    // Social Links
    socialLinks: {
      linkedin: userProfile.socialLinks?.linkedin || '',
      github: userProfile.socialLinks?.github || '',
    }
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleSave = (section: string) => {
    // Here you would typically call an API to update the profile
    console.log('Saving section:', section, formData);
    setEditingSection(null);
    // You can add actual save logic here
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'financial', label: 'Financial', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Basic Information</h3>
          <button
            onClick={() => setEditingSection(editingSection === 'basic' ? null : 'basic')}
            className="flex items-center space-x-2 px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {editingSection === 'basic' ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{editingSection === 'basic' ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Full Name</label>
            {editingSection === 'basic' ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">{formData.name || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Email</label>
            {editingSection === 'basic' ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900 break-words">{formData.email || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Phone</label>
            {editingSection === 'basic' ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">{formData.phone || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
            {editingSection === 'basic' ? (
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">{formData.dateOfBirth || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Gender</label>
            {editingSection === 'basic' ? (
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            ) : (
              <p className="text-sm sm:text-base text-slate-900">{formData.gender || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Marital Status</label>
            {editingSection === 'basic' ? (
              <select
                value={formData.maritalStatus}
                onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Select Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            ) : (
              <p className="text-sm sm:text-base text-slate-900">{formData.maritalStatus || 'Not provided'}</p>
            )}
          </div>
        </div>

        {editingSection === 'basic' && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={() => setEditingSection(null)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('basic')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Professional Information */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Professional Information</h3>
          <button
            onClick={() => setEditingSection(editingSection === 'professional' ? null : 'professional')}
            className="flex items-center space-x-2 px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {editingSection === 'professional' ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{editingSection === 'professional' ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Occupation</label>
            {editingSection === 'professional' ? (
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">{formData.occupation || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Location</label>
            {editingSection === 'professional' ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">{formData.location || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">LinkedIn</label>
            {editingSection === 'professional' ? (
              <input
                type="url"
                value={formData.socialLinks.linkedin}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="https://linkedin.com/in/username"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900 break-words">{formData.socialLinks.linkedin || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">GitHub</label>
            {editingSection === 'professional' ? (
              <input
                type="url"
                value={formData.socialLinks.github}
                onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="https://github.com/username"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900 break-words">{formData.socialLinks.github || 'Not provided'}</p>
            )}
          </div>
        </div>

        {editingSection === 'professional' && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={() => setEditingSection(null)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('professional')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderFinancialInfo = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Financial Overview</h3>
          <button
            onClick={() => setEditingSection(editingSection === 'financial' ? null : 'financial')}
            className="flex items-center space-x-2 px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {editingSection === 'financial' ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{editingSection === 'financial' ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Annual Income</label>
            {editingSection === 'financial' ? (
              <input
                type="number"
                value={formData.annualIncome}
                onChange={(e) => handleInputChange('annualIncome', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">${formData.annualIncome?.toLocaleString() || '0'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Current Super Balance</label>
            {editingSection === 'financial' ? (
              <input
                type="number"
                value={formData.currentSuper}
                onChange={(e) => handleInputChange('currentSuper', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">${formData.currentSuper?.toLocaleString() || '0'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Monthly Contribution</label>
            {editingSection === 'financial' ? (
              <input
                type="number"
                value={formData.monthlyContribution}
                onChange={(e) => handleInputChange('monthlyContribution', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">${formData.monthlyContribution?.toLocaleString() || '0'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Retirement Age</label>
            {editingSection === 'financial' ? (
              <input
                type="number"
                value={formData.retirementAge}
                onChange={(e) => handleInputChange('retirementAge', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-sm sm:text-base text-slate-900">{formData.retirementAge || 'Not set'}</p>
            )}
          </div>
        </div>

        {editingSection === 'financial' && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={() => setEditingSection(null)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('financial')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Investment Preferences</h3>
          <button
            onClick={() => setEditingSection(editingSection === 'preferences' ? null : 'preferences')}
            className="flex items-center space-x-2 px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {editingSection === 'preferences' ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{editingSection === 'preferences' ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Risk Tolerance</label>
            {editingSection === 'preferences' ? (
              <select
                value={formData.riskTolerance}
                onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="growth">Growth</option>
                <option value="aggressive">Aggressive</option>
              </select>
            ) : (
              <p className="text-sm sm:text-base text-slate-900 capitalize">{formData.riskTolerance}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Communication Preference</label>
            {editingSection === 'preferences' ? (
              <select
                value={formData.communicationPreference}
                onChange={(e) => handleInputChange('communicationPreference', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="phone">Phone</option>
                <option value="app">App Notifications</option>
              </select>
            ) : (
              <p className="text-sm sm:text-base text-slate-900 capitalize">{formData.communicationPreference}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Financial Goals</label>
            <div className="space-y-2">
              {formData.financialGoals.map((goal, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg text-sm">
                  <span className="flex-1">{goal}</span>
                </div>
              ))}
              {formData.financialGoals.length === 0 && (
                <p className="text-sm text-slate-500 italic">No goals set</p>
              )}
            </div>
          </div>
        </div>

        {editingSection === 'preferences' && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={() => setEditingSection(null)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('preferences')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg gap-3">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-slate-900">Two-Factor Authentication</h4>
              <p className="text-xs sm:text-sm text-slate-600">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap">
              {userProfile.twoFactorEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg gap-3">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-slate-900">Change Password</h4>
              <p className="text-xs sm:text-sm text-slate-600">Update your account password</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
              Change
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg gap-3">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-slate-900">Login Sessions</h4>
              <p className="text-xs sm:text-sm text-slate-600">Manage your active sessions</p>
            </div>
            <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm whitespace-nowrap">
              View Sessions
            </button>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-red-900">Sign Out</h4>
              <p className="text-xs sm:text-sm text-red-700">Sign out of your account</p>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
              {userProfile.name?.charAt(0) || 'U'}
            </div>
            <div className="text-center sm:text-left min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{userProfile.name}</h1>
              <p className="text-sm sm:text-base text-slate-600 truncate">{userProfile.occupation || 'Professional'}</p>
              <p className="text-sm text-slate-500 truncate">{userProfile.location || 'Location not specified'}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500">
                <span>Member since {new Date().getFullYear()}</span>
                <span>•</span>
                <span>Last login: Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 lg:mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-4 sm:space-x-6 lg:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'personal' && renderPersonalInfo()}
            {activeTab === 'financial' && renderFinancialInfo()}
            {activeTab === 'preferences' && renderPreferences()}
            {activeTab === 'security' && renderSecurity()}
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md mx-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Confirm Sign Out</h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;