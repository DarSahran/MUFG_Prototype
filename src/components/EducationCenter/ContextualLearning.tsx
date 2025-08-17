import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Star, Clock, Award, Target } from 'lucide-react';
import { EducationCard } from './EducationCard';
import { UserProfile } from '../../App';
import { UnifiedAsset } from '../../types/portfolioTypes';

interface ContextualLearningProps {
  userAction?: string;
  portfolio: UnifiedAsset[];
  userProfile: UserProfile;
}

interface LearningContent {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'article' | 'video' | 'quiz' | 'calculator';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  relevanceScore: number;
  hasQuiz: boolean;
  prerequisites?: string[];
  tags: string[];
}

export const ContextualLearning: React.FC<ContextualLearningProps> = ({
  userAction,
  portfolio,
  userProfile,
}) => {
  const [relevantContent, setRelevantContent] = useState<LearningContent[]>([]);
  const [completedContent, setCompletedContent] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState(0);

  useEffect(() => {
    loadRelevantContent();
    loadUserProgress();
  }, [userAction, portfolio, userProfile]);

  const loadRelevantContent = () => {
    const allContent = getAllLearningContent();
    const scored = allContent.map(content => ({
      ...content,
      relevanceScore: calculateRelevanceScore(content, userAction, portfolio, userProfile),
    }));

    // Sort by relevance and filter top content
    const relevant = scored
      .filter(content => content.relevanceScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6);

    setRelevantContent(relevant);
  };

  const loadUserProgress = () => {
    const saved = localStorage.getItem('educationProgress');
    if (saved) {
      const completed = JSON.parse(saved);
      setCompletedContent(completed);
      
      const totalContent = getAllLearningContent().length;
      setUserProgress((completed.length / totalContent) * 100);
    }
  };

  const calculateRelevanceScore = (
    content: LearningContent,
    action?: string,
    portfolio?: UnifiedAsset[],
    profile?: UserProfile
  ): number => {
    let score = 0.5; // Base score

    // Action-based relevance
    if (action) {
      if (action.includes('add') && content.tags.includes('portfolio-management')) score += 0.3;
      if (action.includes('risk') && content.tags.includes('risk-management')) score += 0.4;
      if (action.includes('super') && content.tags.includes('superannuation')) score += 0.4;
    }

    // Portfolio-based relevance
    if (portfolio) {
      const hasStocks = portfolio.some(a => a.type === 'stock');
      const hasCrypto = portfolio.some(a => a.type === 'crypto');
      const hasProperty = portfolio.some(a => a.type === 'property');

      if (hasStocks && content.tags.includes('stocks')) score += 0.2;
      if (hasCrypto && content.tags.includes('cryptocurrency')) score += 0.2;
      if (hasProperty && content.tags.includes('property')) score += 0.2;
    }

    // Profile-based relevance
    if (profile) {
      const experience = profile.investmentExperience || 'beginner';
      if (content.difficulty === experience) score += 0.2;
      
      const yearsToRetirement = profile.retirementAge - profile.age;
      if (yearsToRetirement > 20 && content.tags.includes('long-term')) score += 0.2;
      if (yearsToRetirement < 10 && content.tags.includes('retirement-planning')) score += 0.3;
    }

    return Math.min(score, 1.0);
  };

  const handleContentComplete = (contentId: string) => {
    if (!completedContent.includes(contentId)) {
      const newCompleted = [...completedContent, contentId];
      setCompletedContent(newCompleted);
      
      const totalContent = getAllLearningContent().length;
      setUserProgress((newCompleted.length / totalContent) * 100);
      
      localStorage.setItem('educationProgress', JSON.stringify(newCompleted));
    }
  };

  const trackProgress = (contentId: string) => {
    handleContentComplete(contentId);
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Learning Journey</h2>
            <p className="text-blue-100">
              Personalized content based on your portfolio and recent actions
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round(userProgress)}%</div>
            <div className="text-sm text-blue-100">Complete</div>
          </div>
        </div>
        
        <div className="bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${userProgress}%` }}
          />
        </div>
      </div>

      {/* Contextual Recommendations */}
      {userAction && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-900">
              Recommended Based on Your Recent Action
            </h3>
          </div>
          <p className="text-yellow-800 mb-4">
            Since you recently {userAction}, here are some relevant learning resources:
          </p>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relevantContent.map((content, index) => (
          <motion.div
            key={content.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <EducationCard
              content={content}
              isCompleted={completedContent.includes(content.id)}
              onComplete={() => trackProgress(content.id)}
              interactive={content.hasQuiz}
            />
          </motion.div>
        ))}
      </div>

      {/* Learning Path */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Award className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-900">Suggested Learning Path</h3>
        </div>
        
        <div className="space-y-4">
          {getRecommendedPath(userProfile, portfolio).map((step, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index < completedContent.length 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {index < completedContent.length ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">{step.title}</h4>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">{step.duration}</div>
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-slate-600">{step.rating}/5</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getAllLearningContent = (): LearningContent[] => {
  return [
    {
      id: 'super-basics',
      title: 'Superannuation Fundamentals',
      description: 'Understanding the Australian retirement system',
      content: 'Comprehensive guide to superannuation...',
      type: 'article',
      duration: '8 min read',
      difficulty: 'beginner',
      category: 'superannuation',
      relevanceScore: 0,
      hasQuiz: true,
      tags: ['superannuation', 'basics', 'retirement'],
    },
    {
      id: 'stock-investing',
      title: 'Stock Market Investing',
      description: 'How to evaluate and invest in individual stocks',
      content: 'Guide to stock analysis and selection...',
      type: 'article',
      duration: '12 min read',
      difficulty: 'intermediate',
      category: 'investing',
      relevanceScore: 0,
      hasQuiz: true,
      tags: ['stocks', 'investing', 'portfolio-management'],
    },
    {
      id: 'risk-management',
      title: 'Investment Risk Management',
      description: 'Understanding and managing investment risks',
      content: 'Comprehensive risk management strategies...',
      type: 'article',
      duration: '10 min read',
      difficulty: 'intermediate',
      category: 'risk',
      relevanceScore: 0,
      hasQuiz: false,
      tags: ['risk-management', 'portfolio', 'diversification'],
    },
    {
      id: 'crypto-basics',
      title: 'Cryptocurrency Investing',
      description: 'Introduction to digital asset investing',
      content: 'Understanding cryptocurrency markets...',
      type: 'article',
      duration: '15 min read',
      difficulty: 'advanced',
      category: 'crypto',
      relevanceScore: 0,
      hasQuiz: true,
      tags: ['cryptocurrency', 'digital-assets', 'high-risk'],
    },
    {
      id: 'property-investment',
      title: 'Property Investment Strategies',
      description: 'Real estate investing through super and direct ownership',
      content: 'Property investment guide...',
      type: 'article',
      duration: '18 min read',
      difficulty: 'advanced',
      category: 'property',
      relevanceScore: 0,
      hasQuiz: false,
      tags: ['property', 'real-estate', 'long-term'],
    },
    {
      id: 'retirement-planning',
      title: 'Retirement Income Planning',
      description: 'Strategies for generating retirement income',
      content: 'Retirement planning strategies...',
      type: 'article',
      duration: '14 min read',
      difficulty: 'intermediate',
      category: 'retirement',
      relevanceScore: 0,
      hasQuiz: true,
      tags: ['retirement-planning', 'income', 'long-term'],
    },
  ];
};

const getRecommendedPath = (userProfile: UserProfile, portfolio: UnifiedAsset[]) => {
  const experience = userProfile.investmentExperience || 'beginner';
  const yearsToRetirement = userProfile.retirementAge - userProfile.age;
  
  if (experience === 'beginner') {
    return [
      { title: 'Superannuation Basics', description: 'Start with the fundamentals', duration: '8 min', rating: 4.8 },
      { title: 'Risk and Return', description: 'Understanding investment principles', duration: '10 min', rating: 4.7 },
      { title: 'Asset Allocation', description: 'Building a balanced portfolio', duration: '12 min', rating: 4.9 },
      { title: 'Tax Strategies', description: 'Optimizing your tax position', duration: '15 min', rating: 4.6 },
    ];
  }
  
  if (yearsToRetirement < 10) {
    return [
      { title: 'Retirement Planning', description: 'Preparing for retirement', duration: '14 min', rating: 4.8 },
      { title: 'Income Strategies', description: 'Generating retirement income', duration: '16 min', rating: 4.7 },
      { title: 'Risk Management', description: 'Protecting your wealth', duration: '10 min', rating: 4.6 },
    ];
  }
  
  return [
    { title: 'Advanced Strategies', description: 'Sophisticated investment techniques', duration: '20 min', rating: 4.9 },
    { title: 'International Investing', description: 'Global diversification', duration: '18 min', rating: 4.7 },
    { title: 'Alternative Assets', description: 'Beyond traditional investments', duration: '22 min', rating: 4.5 },
  ];
};