// New PortfolioAnalysisPanel.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Target, PieChart } from 'lucide-react';

interface PortfolioAnalysisPanelProps {
  userProfile: UserProfile;
  liveMarketData: any;
}

export const PortfolioAnalysisPanel: React.FC<PortfolioAnalysisPanelProps> = ({
  userProfile,
  liveMarketData
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateAIAnalysis = async () => {
    setLoading(true);
    try {
      // Use your AI service to analyze portfolio
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          liveMarketData,
          analysisType: 'comprehensive'
        })
      });
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">AI Portfolio Analysis</h2>
        <button
          onClick={generateAIAnalysis}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <TrendingUp className="w-4 h-4" />
          <span>{loading ? 'Analyzing...' : 'Run Analysis'}</span>
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Risk Analysis</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-red-800">Portfolio Risk Score: {analysis.riskScore}/100</p>
              <p className="text-sm text-red-700">{analysis.riskAssessment}</p>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">AI Recommendations</h3>
            </div>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <p key={index} className="text-sm text-green-800">• {rec}</p>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Live Market Integration */}
      {liveMarketData && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Live Market Context</h3>
          <p className="text-sm text-blue-800">
            VAS.AX: ${liveMarketData.regularMarketPrice} ({liveMarketData.currency})
          </p>
        </div>
      )}
    </div>
  );
};
