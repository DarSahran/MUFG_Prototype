import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, BookOpen, Brain, CheckCircle, RotateCcw, Award, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEducationProgress } from '../../hooks/useEducationProgress';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  difficulty: string;
  quiz: QuizQuestion[];
}

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  category: string;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  article,
  category,
}) => {
  const [currentView, setCurrentView] = useState<'article' | 'quiz'>('article');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [hasStartedReading, setHasStartedReading] = useState(false);

  const { markArticleComplete, saveQuizScore, isArticleCompleted, getQuizScore } = useEducationProgress();

  useEffect(() => {
    if (isOpen && article) {
      setCurrentView('article');
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setShowResults(false);
      setQuizScore(0);
      setReadingStartTime(new Date());
      setHasStartedReading(true);
    }
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  const handleStartQuiz = () => {
    setCurrentView('quiz');
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < article.quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = async () => {
    let correct = 0;
    article.quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correct++;
      }
    });
    
    const finalScore = Math.round((correct / article.quiz.length) * 100);
    setQuizScore(finalScore);
    setShowResults(true);

    // Save quiz score to database
    try {
      await saveQuizScore(article.id, article.title, category, finalScore);
    } catch (error) {
      console.error('Error saving quiz score:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!hasStartedReading) return;

    const timeSpent = readingStartTime 
      ? Math.round((new Date().getTime() - readingStartTime.getTime()) / 60000)
      : 0;

    try {
      await markArticleComplete(article.id, article.title, category, timeSpent);
    } catch (error) {
      console.error('Error marking article complete:', error);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizScore(0);
  };

  const currentQ = article.quiz[currentQuestion];
  const progress = ((currentQuestion + 1) / article.quiz.length) * 100;
  const isCompleted = isArticleCompleted(article.id);
  const existingScore = getQuizScore(article.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {currentView === 'article' ? (
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Brain className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{article.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{article.duration}</span>
                    </div>
                    <span className="px-2 py-1 bg-slate-200 rounded-full text-xs font-medium">
                      {article.difficulty}
                    </span>
                    {isCompleted && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setCurrentView('article')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'article'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Article</span>
              </button>
              <button
                onClick={() => setCurrentView('quiz')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'quiz'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>Quiz ({article.quiz.length} questions)</span>
                {existingScore !== null && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {existingScore}%
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {currentView === 'article' ? (
              <div className="p-6">
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown
                    children={article.content}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-slate-900" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-slate-900" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-800" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 text-slate-700 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-slate-700" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-blue-700 font-semibold" {...props} />,
                      code: ({node, ...props}) => <code className="bg-slate-100 px-2 py-1 rounded text-sm text-pink-600" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600 my-4" {...props} />,
                    }}
                  />
                </div>

                {/* Article Actions */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">Rate Article</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!isCompleted && (
                      <button
                        onClick={handleMarkComplete}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark as Read</span>
                      </button>
                    )}
                    <button
                      onClick={handleStartQuiz}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Take Quiz</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {showResults ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                      quizScore >= 80 ? 'bg-green-100' : quizScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <Award className={`w-10 h-10 ${
                        quizScore >= 80 ? 'text-green-600' : quizScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Quiz Complete!</h3>
                    <p className="text-slate-600 mb-6">
                      You scored {quizScore}% on "{article.title}"
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {article.quiz.filter((_, index) => selectedAnswers[index] === article.quiz[index].correct).length}
                        </div>
                        <div className="text-sm text-slate-600">Correct</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {article.quiz.length - article.quiz.filter((_, index) => selectedAnswers[index] === article.quiz[index].correct).length}
                        </div>
                        <div className="text-sm text-slate-600">Incorrect</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{quizScore}%</div>
                        <div className="text-sm text-slate-600">Score</div>
                      </div>
                    </div>

                    {/* Performance Message */}
                    <div className={`p-4 rounded-lg mb-6 ${
                      quizScore >= 80 ? 'bg-green-50 border border-green-200' :
                      quizScore >= 60 ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        quizScore >= 80 ? 'text-green-800' :
                        quizScore >= 60 ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        {quizScore >= 80 ? '🎉 Excellent! You have a strong understanding of this topic.' :
                         quizScore >= 60 ? '👍 Good job! Consider reviewing the article for better understanding.' :
                         '📚 Keep learning! Review the article and try again.'}
                      </p>
                    </div>

                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={resetQuiz}
                        className="flex items-center space-x-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Retake Quiz</span>
                      </button>
                      
                      <button
                        onClick={() => setCurrentView('article')}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Review Article</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div>
                    {/* Quiz Progress */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Knowledge Check</h3>
                        <span className="text-sm text-slate-600">
                          Question {currentQuestion + 1} of {article.quiz.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Question */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-xl font-semibold text-slate-900 mb-6">
                          {currentQ.question}
                        </h4>
                        
                        <div className="space-y-3 mb-6">
                          {currentQ.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleAnswerSelect(currentQuestion, index)}
                              className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                                selectedAnswers[currentQuestion] === index
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  selectedAnswers[currentQuestion] === index
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-slate-300'
                                }`}>
                                  {selectedAnswers[currentQuestion] === index && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <span className="text-slate-900">{option}</span>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Show explanation if answered */}
                        {selectedAnswers[currentQuestion] !== undefined && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <div className="flex items-start space-x-2">
                              {selectedAnswers[currentQuestion] === currentQ.correct ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <p className={`font-medium mb-2 ${
                                  selectedAnswers[currentQuestion] === currentQ.correct
                                    ? 'text-green-900'
                                    : 'text-red-900'
                                }`}>
                                  {selectedAnswers[currentQuestion] === currentQ.correct
                                    ? 'Correct!'
                                    : 'Incorrect'}
                                </p>
                                <p className="text-sm text-slate-700">{currentQ.explanation}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <button
                        onClick={handleNext}
                        disabled={selectedAnswers[currentQuestion] === undefined}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {currentQuestion === article.quiz.length - 1 ? 'Finish Quiz' : 'Next'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {currentView === 'article' && (
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Ready to test your knowledge?
                </div>
                <button
                  onClick={handleStartQuiz}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Brain className="w-5 h-5" />
                  <span>Take Quiz</span>
                  <TrendingUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};