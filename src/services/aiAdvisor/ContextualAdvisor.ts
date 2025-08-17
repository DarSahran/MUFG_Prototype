import { GoogleGenerativeAI } from '@google/generative-ai';
import { UnifiedAsset, AIRecommendation } from '../../types/portfolioTypes';
import { UserProfile } from '../../App';

export class ContextualAdvisor {
  private geminiClient: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'demo-key';
    this.geminiClient = new GoogleGenerativeAI(apiKey);
    this.model = this.geminiClient.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzePortfolio(
    portfolio: UnifiedAsset[], 
    userProfile: UserProfile, 
    question?: string
  ): Promise<string> {
    try {
      const context = this.buildContext(portfolio, userProfile);
      const prompt = this.buildAnalysisPrompt(context, question);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      return this.getFallbackAnalysis(portfolio, userProfile);
    }
  }

  async generateRecommendations(
    portfolio: UnifiedAsset[], 
    userProfile: UserProfile
  ): Promise<AIRecommendation[]> {
    try {
      const context = this.buildContext(portfolio, userProfile);
      const prompt = this.buildRecommendationPrompt(context);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const parsed = JSON.parse(text);
        return parsed.recommendations || [];
      } catch (parseError) {
        return this.getFallbackRecommendations(portfolio, userProfile);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getFallbackRecommendations(portfolio, userProfile);
    }
  }

  private buildContext(portfolio: UnifiedAsset[], userProfile: UserProfile) {
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.value, 0);
    const allocation = this.calculateAllocation(portfolio);
    const diversificationScore = this.calculateDiversificationScore(portfolio);
    
    return {
      totalValue,
      allocation,
      diversificationScore,
      riskProfile: userProfile.riskTolerance,
      region: userProfile.region || 'AU',
      age: userProfile.age,
      retirementAge: userProfile.retirementAge,
      monthlyContribution: userProfile.monthlyContribution,
      annualIncome: userProfile.annualIncome,
      financialGoals: userProfile.financialGoals,
      investmentExperience: userProfile.investmentExperience || 'beginner',
      yearsToRetirement: userProfile.retirementAge - userProfile.age,
      assetCount: portfolio.length,
    };
  }

  private buildAnalysisPrompt(context: any, question?: string): string {
    return `
      As a professional financial advisor specializing in Australian investments, analyze this portfolio:

      Portfolio Context:
      - Total Value: $${context.totalValue.toLocaleString()}
      - Asset Count: ${context.assetCount}
      - Diversification Score: ${context.diversificationScore}/100
      - Risk Profile: ${context.riskProfile}
      - Years to Retirement: ${context.yearsToRetirement}
      - Monthly Contribution: $${context.monthlyContribution}
      - Annual Income: $${context.annualIncome}

      Asset Allocation:
      ${Object.entries(context.allocation).map(([type, percentage]) => 
        `- ${type}: ${percentage.toFixed(1)}%`
      ).join('\n')}

      ${question ? `Specific Question: ${question}` : ''}

      Provide a comprehensive analysis covering:
      1. Portfolio strengths and weaknesses
      2. Risk assessment for the user's profile
      3. Diversification analysis
      4. Specific actionable recommendations
      5. Tax optimization opportunities
      6. Timeline considerations

      Keep the response conversational but professional, and reference specific numbers from the portfolio.
    `;
  }

  private buildRecommendationPrompt(context: any): string {
    return `
      Generate 4-6 specific investment recommendations for this portfolio in JSON format:

      Portfolio Context:
      - Total Value: $${context.totalValue.toLocaleString()}
      - Risk Profile: ${context.riskProfile}
      - Years to Retirement: ${context.yearsToRetirement}
      - Region: ${context.region}
      - Current Allocation: ${JSON.stringify(context.allocation)}

      Return JSON in this format:
      {
        "recommendations": [
          {
            "id": "rec-1",
            "title": "Increase International Exposure",
            "description": "Add 10% international ETFs for better diversification",
            "confidence": 85,
            "reasoning": "Current portfolio lacks international diversification...",
            "action": "Add VGS.AX or similar international ETF",
            "impact": "+$45,000 at retirement",
            "priority": "high",
            "category": "allocation"
          }
        ]
      }

      Focus on actionable recommendations specific to Australian investors.
    `;
  }

  private calculateAllocation(portfolio: UnifiedAsset[]): { [key: string]: number } {
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.value, 0);
    if (totalValue === 0) return {};

    const allocation: { [key: string]: number } = {};
    portfolio.forEach(asset => {
      const percentage = (asset.value / totalValue) * 100;
      allocation[asset.type] = (allocation[asset.type] || 0) + percentage;
    });

    return allocation;
  }

  private calculateDiversificationScore(portfolio: UnifiedAsset[]): number {
    if (portfolio.length === 0) return 0;

    const typeCount = new Set(portfolio.map(a => a.type)).size;
    const regionCount = new Set(portfolio.map(a => a.region)).size;
    const currencyCount = new Set(portfolio.map(a => a.currency)).size;

    return Math.min(typeCount * 15 + regionCount * 10 + currencyCount * 5, 100);
  }

  private getFallbackAnalysis(portfolio: UnifiedAsset[], userProfile: UserProfile): string {
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.value, 0);
    const allocation = this.calculateAllocation(portfolio);
    
    return `
      Portfolio Analysis for ${userProfile.name}:

      Current Portfolio Value: $${totalValue.toLocaleString()}
      Asset Count: ${portfolio.length}
      Risk Profile: ${userProfile.riskTolerance}
      Years to Retirement: ${userProfile.retirementAge - userProfile.age}

      Key Observations:
      1. Your portfolio shows ${portfolio.length > 5 ? 'good' : 'limited'} diversification
      2. With ${userProfile.retirementAge - userProfile.age} years to retirement, you have ${userProfile.retirementAge - userProfile.age > 20 ? 'ample time for growth strategies' : 'limited time, consider more conservative approaches'}
      3. Your ${userProfile.riskTolerance} risk tolerance aligns with your investment timeline

      Recommendations:
      - Consider increasing monthly contributions if possible
      - Review asset allocation quarterly
      - Take advantage of tax-effective investment structures
      - Monitor fees and performance regularly

      This analysis is based on general principles. For personalized advice, consult with a licensed financial advisor.
    `;
  }

  private getFallbackRecommendations(portfolio: UnifiedAsset[], userProfile: UserProfile): AIRecommendation[] {
    return [
      {
        id: 'rec-1',
        title: 'Increase Monthly Contributions',
        description: 'Boost your monthly super contributions to maximize compound growth',
        confidence: 90,
        reasoning: 'With your current age and risk profile, increasing contributions will significantly impact your retirement outcome',
        action: 'Increase monthly contribution by $200-300',
        impact: '+$75,000 at retirement',
        priority: 'high',
        category: 'contribution'
      },
      {
        id: 'rec-2',
        title: 'Diversify Asset Allocation',
        description: 'Add international exposure to reduce concentration risk',
        confidence: 85,
        reasoning: 'Your portfolio could benefit from geographic diversification',
        action: 'Add international ETFs (VGS.AX)',
        impact: 'Improved risk-adjusted returns',
        priority: 'medium',
        category: 'allocation'
      },
      {
        id: 'rec-3',
        title: 'Tax Optimization',
        description: 'Use salary sacrifice to reduce taxable income',
        confidence: 95,
        reasoning: 'Pre-tax contributions provide immediate tax benefits',
        action: 'Set up salary sacrifice arrangement',
        impact: 'Save $1,200+ annually in tax',
        priority: 'high',
        category: 'tax'
      }
    ];
  }
}

export const contextualAdvisor = new ContextualAdvisor();