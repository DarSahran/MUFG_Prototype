import { serperService } from '../serperService';
import { UnifiedAsset, AIRecommendation } from '../../types/portfolioTypes';
import { UserProfile } from '../../App';

export class ContextualAdvisor {
  constructor() {
    // Serper service is used for market research and analysis
  }

  async analyzePortfolio(
    portfolio: UnifiedAsset[], 
    userProfile: UserProfile, 
    question?: string
  ): Promise<string> {
    try {
      const context = this.buildContext(portfolio, userProfile);
      const searchQuery = this.buildSearchQuery(context, question);
      
      const answer = await serperService.answerFinancialQuestion(
        searchQuery, 
        userProfile, 
        JSON.stringify(context)
      );
      
      return answer;
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
      const recommendations = await serperService.getInvestmentRecommendations(
        userProfile,
        portfolio.map(asset => ({
          symbol: asset.symbol,
          price: asset.currentPrice,
          changePercent: 0, // Would be calculated from real data
          volume: 0
        }))
      );
      
      return recommendations;
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

  private buildSearchQuery(context: any, question?: string): string {
    let query = `Australian superannuation investment advice ${context.riskProfile} risk`;
    
    if (question) {
      query = `${question} ${query}`;
    } else {
      query += ` portfolio optimization ${context.yearsToRetirement} years retirement`;
    }
    
    return query;
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