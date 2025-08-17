import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Star, Clock, ChevronRight, Award } from 'lucide-react';

interface EducationCardProps {
  content: {
    id: string;
    title: string;
    description: string;
    content: string;
    type: 'article' | 'video' | 'quiz' | 'calculator';
    duration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    hasQuiz: boolean;
  };
  isCompleted: boolean;
  onComplete: () => void;
  interactive: boolean;
}

export const EducationCard: React.FC<EducationCardProps> = ({
  content,
  isCompleted,
  onComplete,
  interactive,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'quiz': return Award;
      case 'calculator': return Calculator;
      default: return BookOpen;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const TypeIcon = getTypeIcon(content.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TypeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{content.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{content.description}</p>
            </div>
          </div>
          
          {isCompleted && (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{content.duration}</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(content.difficulty)}`}>
              {content.difficulty}
            </span>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>4.8/5</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-sm font-medium">
              {isExpanded ? 'Collapse' : 'Read More'}
            </span>
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-6 bg-slate-50"
        >
          <div className="prose prose-sm max-w-none text-slate-700 mb-6">
            {content.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3">{paragraph}</p>
            ))}
          </div>

          {/* Interactive Quiz */}
          {interactive && content.hasQuiz && (
            <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
              <h4 className="font-semibold text-slate-900 mb-3">Quick Knowledge Check</h4>
              <div className="space-y-3">
                <div className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm">What is the current superannuation guarantee rate?</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm">How often should you review your investment strategy?</p>
                </div>
              </div>
              {quizScore !== null && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    Great job! You scored {quizScore}% on this quiz.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {!isCompleted && (
              <button
                onClick={onComplete}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Complete</span>
              </button>
            )}
            
            <button className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              <Star className="w-4 h-4" />
              <span>Rate Content</span>
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};