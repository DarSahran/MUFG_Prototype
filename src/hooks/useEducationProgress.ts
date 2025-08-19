import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface EducationProgress {
  id: string;
  article_id: string;
  article_title: string;
  category: string;
  completed_at: string;
  quiz_score: number | null;
  quiz_attempts: number;
  time_spent_minutes: number;
}

export const useEducationProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<EducationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setProgress([]);
      setLoading(false);
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_education_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setProgress(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching education progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const markArticleComplete = async (
    articleId: string,
    articleTitle: string,
    category: string,
    timeSpentMinutes: number = 0
  ) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('user_education_progress')
        .upsert({
          user_id: user.id,
          article_id: articleId,
          article_title: articleTitle,
          category,
          time_spent_minutes: timeSpentMinutes,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setProgress(prev => {
        const existing = prev.find(p => p.article_id === articleId);
        if (existing) {
          return prev.map(p => p.article_id === articleId ? data : p);
        }
        return [data, ...prev];
      });

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const saveQuizScore = async (
    articleId: string,
    articleTitle: string,
    category: string,
    score: number,
    attempts: number = 1
  ) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('user_education_progress')
        .upsert({
          user_id: user.id,
          article_id: articleId,
          article_title: articleTitle,
          category,
          quiz_score: score,
          quiz_attempts: attempts,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setProgress(prev => {
        const existing = prev.find(p => p.article_id === articleId);
        if (existing) {
          return prev.map(p => p.article_id === articleId ? data : p);
        }
        return [data, ...prev];
      });

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const getProgressStats = () => {
    const totalArticles = progress.length;
    const completedQuizzes = progress.filter(p => p.quiz_score !== null).length;
    const averageScore = progress.length > 0 
      ? progress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / progress.filter(p => p.quiz_score !== null).length
      : 0;
    const totalTimeSpent = progress.reduce((sum, p) => sum + p.time_spent_minutes, 0);

    return {
      totalArticles,
      completedQuizzes,
      averageScore: Math.round(averageScore),
      totalTimeSpent,
    };
  };

  const isArticleCompleted = (articleId: string) => {
    return progress.some(p => p.article_id === articleId);
  };

  const getQuizScore = (articleId: string) => {
    const article = progress.find(p => p.article_id === articleId);
    return article?.quiz_score || null;
  };

  return {
    progress,
    loading,
    error,
    markArticleComplete,
    saveQuizScore,
    getProgressStats,
    isArticleCompleted,
    getQuizScore,
    refetch: fetchProgress,
  };
};