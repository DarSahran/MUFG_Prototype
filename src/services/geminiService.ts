import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'demo-key';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface InvestmentRecommendation {
  symbol: string;
  name: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  expectedReturn?: number;
  volatility?: number;
  sector?: string;
}

export interface MarketInsight {
  title: string;
  content: string;
  category: 'MARKET_TREND' | 'ECONOMIC_INDICATOR' | 'SECTOR_ANALYSIS' | 'RISK_ALERT';
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
  source?: string;
  actionable?: boolean;
}

class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async getInvestmentRecommendations(userProfile: any, marketData: any[]): Promise<InvestmentRecommendation[]> {
    // Enhanced prompt with more context
    try {
      const prompt = `
        As a professional financial advisor, analyze the following user profile and current market data to provide investment recommendations:

        User Profile:
        - Age: ${userProfile.age}
        - Risk Tolerance: ${userProfile.riskTolerance}
        - Annual Income: $${userProfile.annualIncome}
        - Current Super Balance: $${userProfile.currentSuper}
        - Monthly Contribution: $${userProfile.monthlyContribution}
        - Retirement Age: ${userProfile.retirementAge}
        - Years to Retirement: ${userProfile.retirementAge - userProfile.age}
        - Financial Goals: ${userProfile.financialGoals?.join(', ')}
        - Investment Experience: ${userProfile.investmentExperience || 'beginner'}
        - Employment Status: ${userProfile.employmentStatus || 'Full-time'}
        - ESG Preferences: ${userProfile.esgPreferences ? 'Yes' : 'No'}

        Current Market Data:
        ${marketData.map(stock => `
        - ${stock.symbol}: $${stock.price} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
        `).join('')}

        Please provide 6-8 specific investment recommendations in JSON format with the following structure:
        {
          "recommendations": [
            {
              "symbol": "VAS.AX",
              "name": "Vanguard Australian Shares Index ETF",
              "recommendation": "BUY",
              "confidence": 85,
              "reasoning": "Strong fundamentals and aligns with user's risk profile...",
              "targetPrice": 95.50,
              "riskLevel": "MEDIUM",
              "timeHorizon": "LONG",
              "expectedReturn": 8.5,
              "volatility": 15.2,
              "sector": "Diversified"
            }
          ]
        }

        Focus on Australian ETFs, international ETFs, and superannuation-appropriate investments. Consider the user's age, risk tolerance, time to retirement, and ESG preferences. Include both growth and defensive options.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return parsed.recommendations || [];
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        return this.getFallbackRecommendations(userProfile);
      }
    } catch (error) {
      console.error('Error getting recommendations from Gemini:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  async getMarketInsights(marketData: any[], userProfile?: any): Promise<MarketInsight[]> {
    try {
      const prompt = `
        As a financial market analyst, provide 4-6 key market insights based on the current market data:

        Market Data:
        ${marketData.map(stock => `
        - ${stock.symbol}: $${stock.price} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
        `).join('')}

        ${userProfile ? `
        User Context:
        - Risk Tolerance: ${userProfile.riskTolerance}
        - Investment Experience: ${userProfile.investmentExperience || 'beginner'}
        - Portfolio Value: $${userProfile.currentSuper || 0}
        - Years to Retirement: ${userProfile.retirementAge - userProfile.age}
        ` : ''}

        Provide insights in JSON format:
        {
          "insights": [
            {
              "title": "Australian Market Outlook",
              "content": "The ASX is showing strong momentum...",
              "category": "MARKET_TREND",
              "importance": "HIGH",
              "timestamp": "${new Date().toISOString()}",
              "source": "Market Analysis",
              "actionable": true
            }
          ]
        }

        Focus on actionable insights relevant to Australian superannuation investors. Include both opportunities and risks.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return parsed.insights || [];
      } catch (parseError) {
        console.error('Error parsing Gemini insights response:', parseError);
        return this.getFallbackInsights();
      }
    } catch (error) {
      console.error('Error getting insights from Gemini:', error);
      return this.getFallbackInsights();
    }
  }

  async answerFinancialQuestion(question: string, userProfile?: any, context?: string): Promise<string> {
    try {
      const prompt = `
        As a qualified financial advisor specializing in Australian superannuation and investments, answer the following question:

        Question: ${question}

        ${userProfile ? `
        User Context:
        - Age: ${userProfile.age}
        - Risk Tolerance: ${userProfile.riskTolerance}
        - Current Super Balance: $${userProfile.currentSuper}
        - Annual Income: $${userProfile.annualIncome}
        - Years to Retirement: ${userProfile.retirementAge - userProfile.age}
        - Monthly Contribution: $${userProfile.monthlyContribution}
        - Investment Experience: ${userProfile.investmentExperience}
        ` : ''}

        ${context ? `Additional Context: ${context}` : ''}

        Please provide a comprehensive, personalized answer that:
        1. Addresses the specific question
        2. Considers the user's profile and circumstances
        3. Provides actionable advice
        4. Mentions any relevant risks or considerations
        5. Stays within Australian financial regulations and best practices
        6. References specific numbers from the user's situation
        7. Suggests next steps or follow-up actions

        Keep the response conversational but professional, and limit to 400-500 words.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error getting answer from Gemini:', error);
      return this.getFallbackAnswer(question);
    }
  }

  private getFallbackRecommendations(userProfile: any): InvestmentRecommendation[] {
    const baseRecommendations = [
      {
        symbol: 'VAS.AX',
        name: 'Vanguard Australian Shares Index ETF',
        recommendation: 'BUY' as const,
        confidence: 85,
        reasoning: 'Broad Australian market exposure with low fees, suitable for long-term growth.',
        targetPrice: 92.00,
        riskLevel: 'MEDIUM' as const,
        timeHorizon: 'LONG' as const,
        expectedReturn: 8.2,
        volatility: 16.5,
        sector: 'Diversified'
      },
      {
        symbol: 'VGS.AX',
        name: 'Vanguard MSCI Index International Shares ETF',
        recommendation: 'BUY' as const,
        confidence: 88,
        reasoning: 'International diversification with exposure to global markets.',
        targetPrice: 105.00,
        riskLevel: 'MEDIUM' as const,
        timeHorizon: 'LONG' as const,
        expectedReturn: 9.1,
        volatility: 18.3,
        sector: 'International'
      },
      {
        symbol: 'VAF.AX',
        name: 'Vanguard Australian Fixed Interest Index ETF',
        recommendation: 'HOLD' as const,
        confidence: 75,
        reasoning: 'Provides stability and income, good for defensive allocation.',
        targetPrice: 52.00,
        riskLevel: 'LOW' as const,
        timeHorizon: 'MEDIUM' as const,
        expectedReturn: 4.2,
        volatility: 5.8,
        sector: 'Fixed Income'
      }
    ];

    // Adjust recommendations based on risk tolerance
    if (userProfile.riskTolerance === 'conservative') {
      baseRecommendations[2].recommendation = 'BUY';
      baseRecommendations[2].confidence = 90;
    } else if (userProfile.riskTolerance === 'aggressive') {
      baseRecommendations.push({
        symbol: 'VGE.AX',
        name: 'Vanguard FTSE Emerging Markets Shares ETF',
        recommendation: 'BUY' as const,
        confidence: 78,
        reasoning: 'Higher growth potential through emerging markets exposure.',
        riskLevel: 'HIGH' as const,
        timeHorizon: 'LONG' as const,
        expectedReturn: 10.5,
        volatility: 22.1,
        sector: 'Emerging Markets'
      });
    }

    return baseRecommendations;
  }

  private getFallbackInsights(): MarketInsight[] {
    return [
      {
        title: 'Australian Market Resilience',
        content: 'The ASX continues to show resilience amid global uncertainties, with strong performance in the resources and financial sectors.',
        category: 'MARKET_TREND',
        importance: 'HIGH',
        timestamp: new Date().toISOString(),
        source: 'Market Analysis',
        actionable: true
      },
      {
        title: 'Interest Rate Environment',
        content: 'Current interest rate levels present opportunities for both growth and defensive investments in superannuation portfolios.',
        category: 'ECONOMIC_INDICATOR',
        importance: 'MEDIUM',
        timestamp: new Date().toISOString(),
        source: 'RBA Analysis',
        actionable: true
      },
      {
        title: 'Diversification Benefits',
        content: 'International exposure through ETFs continues to provide valuable diversification benefits for Australian investors.',
        category: 'SECTOR_ANALYSIS',
        importance: 'MEDIUM',
        timestamp: new Date().toISOString(),
        source: 'Portfolio Analysis',
        actionable: false
      },
      {
        title: 'Superannuation Contribution Caps',
        content: 'With the new financial year, ensure you maximize your concessional contribution cap of $27,500 for tax benefits.',
        category: 'RISK_ALERT',
        importance: 'HIGH',
        timestamp: new Date().toISOString(),
        source: 'ATO Guidelines',
        actionable: true
      }
    ];
  }

  private getFallbackAnswer(question: string): string {
    return `Thank you for your question about "${question}". While I'm currently unable to provide a fully personalized response due to API limitations, I can offer some general guidance:

    For superannuation and investment guidance, consider:
    - Reviewing your current asset allocation
    - Ensuring adequate diversification
    - Regular portfolio rebalancing
    - Taking advantage of contribution caps
    - Considering your risk tolerance and time horizon
    - Monitoring fees and performance
    - Staying informed about regulatory changes

    For personalized advice specific to your situation, I recommend:
    1. Consulting with a licensed financial advisor
    2. Using our portfolio analysis tools
    3. Reviewing our education center resources
    4. Running what-if scenarios in the forecasting tool

    Please note that this is general information only and not personal financial advice. Always consider your individual circumstances and seek professional guidance for major financial decisions.`;
  }
}

export const geminiService = new GeminiService();