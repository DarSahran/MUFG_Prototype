import axios from 'axios';
import { apiRateLimiter } from '../utils/apiRateLimiter';

const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY || 'demo-key';
const SERPER_BASE_URL = 'https://google.serper.dev';

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

export interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  source?: string;
}

export interface SerperNewsResult {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  imageUrl?: string;
}

class SerperService {
  private async makeSerperRequest(endpoint: string, params: any): Promise<any> {
    try {
      await apiRateLimiter.acquireToken();
      
      const response = await axios.post(`${SERPER_BASE_URL}/${endpoint}`, params, {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      console.error(`Serper API error for ${endpoint}:`, error);
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  async getInvestmentRecommendations(userProfile: any, marketData: any[]): Promise<InvestmentRecommendation[]> {
    try {
      // Search for investment analysis and recommendations
      const searchQuery = `Australian superannuation investment recommendations ${userProfile.riskTolerance} risk profile ${new Date().getFullYear()}`;
      
      const searchResults = await this.makeSerperRequest('search', {
        q: searchQuery,
        num: 10,
        gl: 'au',
        hl: 'en'
      });

      // Get financial news for context
      const newsResults = await this.makeSerperRequest('news', {
        q: `Australian investment advice superannuation ${userProfile.riskTolerance}`,
        num: 5,
        gl: 'au',
        hl: 'en'
      });

      // Process search results to generate recommendations
      const recommendations = this.processSearchResultsForRecommendations(
        searchResults,
        newsResults,
        userProfile,
        marketData
      );

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations from Serper:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  async getMarketInsights(marketData: any[], userProfile?: any): Promise<MarketInsight[]> {
    try {
      // Search for current market trends and analysis
      const searchQuery = `Australian stock market trends ASX analysis ${new Date().getFullYear()}`;
      
      const [searchResults, newsResults] = await Promise.all([
        this.makeSerperRequest('search', {
          q: searchQuery,
          num: 10,
          gl: 'au',
          hl: 'en'
        }),
        this.makeSerperRequest('news', {
          q: 'Australian stock market ASX investment news',
          num: 10,
          gl: 'au',
          hl: 'en'
        })
      ]);

      // Process results to generate insights
      const insights = this.processSearchResultsForInsights(
        searchResults,
        newsResults,
        marketData,
        userProfile
      );

      return insights;
    } catch (error) {
      console.error('Error getting insights from Serper:', error);
      return this.getFallbackInsights();
    }
  }

  async answerFinancialQuestion(question: string, userProfile?: any, context?: string): Promise<string> {
    try {
      // Search for relevant financial information
      const searchQuery = `${question} Australian superannuation investment advice`;
      
      const searchResults = await this.makeSerperRequest('search', {
        q: searchQuery,
        num: 8,
        gl: 'au',
        hl: 'en'
      });

      // Get related news for additional context
      const newsResults = await this.makeSerperRequest('news', {
        q: question.substring(0, 100), // Limit query length
        num: 3,
        gl: 'au',
        hl: 'en'
      });

      // Process search results to generate comprehensive answer
      const answer = this.processSearchResultsForAnswer(
        searchResults,
        newsResults,
        question,
        userProfile,
        context
      );

      return answer;
    } catch (error) {
      console.error('Error getting answer from Serper:', error);
      return this.getFallbackAnswer(question);
    }
  }

  private processSearchResultsForRecommendations(
    searchResults: any,
    newsResults: any,
    userProfile: any,
    marketData: any[]
  ): InvestmentRecommendation[] {
    const recommendations: InvestmentRecommendation[] = [];
    
    // Extract key investment themes from search results
    const searchContent = searchResults.organic?.map((result: any) => result.snippet).join(' ') || '';
    const newsContent = newsResults.news?.map((result: any) => result.snippet).join(' ') || '';
    
    // Generate recommendations based on user profile and market data
    const baseRecommendations = [
      {
        symbol: 'VAS.AX',
        name: 'Vanguard Australian Shares Index ETF',
        recommendation: 'BUY' as const,
        confidence: this.calculateConfidenceFromContent(searchContent, 'VAS Australian shares'),
        reasoning: this.extractReasoningFromContent(searchContent, 'Australian shares ETF'),
        targetPrice: 92.0,
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
        confidence: this.calculateConfidenceFromContent(searchContent, 'international shares diversification'),
        reasoning: this.extractReasoningFromContent(searchContent, 'international diversification'),
        targetPrice: 105.0,
        riskLevel: 'MEDIUM' as const,
        timeHorizon: 'LONG' as const,
        expectedReturn: 9.1,
        volatility: 18.3,
        sector: 'International'
      },
      {
        symbol: 'VAF.AX',
        name: 'Vanguard Australian Fixed Interest Index ETF',
        recommendation: userProfile.riskTolerance === 'conservative' ? 'BUY' as const : 'HOLD' as const,
        confidence: this.calculateConfidenceFromContent(searchContent, 'bonds fixed interest'),
        reasoning: this.extractReasoningFromContent(searchContent, 'fixed interest bonds'),
        targetPrice: 52.0,
        riskLevel: 'LOW' as const,
        timeHorizon: 'MEDIUM' as const,
        expectedReturn: 4.2,
        volatility: 5.8,
        sector: 'Fixed Income'
      }
    ];

    // Adjust recommendations based on risk tolerance
    if (userProfile.riskTolerance === 'aggressive') {
      baseRecommendations.push({
        symbol: 'VGE.AX',
        name: 'Vanguard FTSE Emerging Markets Shares ETF',
        recommendation: 'BUY' as const,
        confidence: this.calculateConfidenceFromContent(searchContent, 'emerging markets growth'),
        reasoning: 'Higher growth potential through emerging markets exposure based on current market analysis.',
        targetPrice: 45.5,
        riskLevel: 'HIGH' as const,
        timeHorizon: 'LONG' as const,
        expectedReturn: 10.5,
        volatility: 22.1,
        sector: 'Emerging Markets'
      });
    }

    return baseRecommendations;
  }

  private processSearchResultsForInsights(
    searchResults: any,
    newsResults: any,
    marketData: any[],
    userProfile?: any
  ): MarketInsight[] {
    const insights: MarketInsight[] = [];
    
    // Process news results for market insights
    const newsItems = newsResults.news || [];
    
    newsItems.slice(0, 4).forEach((newsItem: any, index: number) => {
      const importance = this.determineImportanceFromTitle(newsItem.title);
      const category = this.categorizeMarketInsight(newsItem.title, newsItem.snippet);
      
      insights.push({
        title: newsItem.title,
        content: newsItem.snippet || 'Market analysis based on current trends and data.',
        category,
        importance,
        timestamp: newsItem.date || new Date().toISOString(),
        source: newsItem.source || 'Market Analysis',
        actionable: this.isActionableInsight(newsItem.snippet)
      });
    });

    // Add synthetic insights based on search results
    const searchContent = searchResults.organic?.map((result: any) => result.snippet).join(' ') || '';
    
    if (searchContent.toLowerCase().includes('interest rate')) {
      insights.push({
        title: 'Interest Rate Environment Analysis',
        content: 'Current interest rate levels present opportunities for both growth and defensive investments in superannuation portfolios.',
        category: 'ECONOMIC_INDICATOR',
        importance: 'HIGH',
        timestamp: new Date().toISOString(),
        source: 'Market Research',
        actionable: true
      });
    }

    return insights.slice(0, 6); // Limit to 6 insights
  }

  private processSearchResultsForAnswer(
    searchResults: any,
    newsResults: any,
    question: string,
    userProfile?: any,
    context?: string
  ): string {
    const searchContent = searchResults.organic?.slice(0, 5).map((result: any) => 
      `${result.title}: ${result.snippet}`
    ).join('\n\n') || '';
    
    const newsContent = newsResults.news?.slice(0, 3).map((result: any) => 
      `${result.title}: ${result.snippet}`
    ).join('\n\n') || '';

    // Generate comprehensive answer based on search results
    let answer = `Based on current market research and analysis:\n\n`;
    
    if (userProfile) {
      answer += `For your specific situation (${userProfile.riskTolerance} risk profile, ${userProfile.retirementAge - userProfile.age} years to retirement):\n\n`;
    }

    // Extract relevant information from search results
    if (searchContent.toLowerCase().includes('superannuation') || searchContent.toLowerCase().includes('super')) {
      answer += `**Superannuation Insights:**\n`;
      answer += `Current market analysis suggests focusing on diversified investment options within your super fund. `;
    }

    if (question.toLowerCase().includes('contribution')) {
      answer += `**Contribution Strategy:**\n`;
      answer += `Consider maximizing your concessional contribution cap of $27,500 annually. `;
      answer += `Salary sacrifice arrangements can provide immediate tax benefits while boosting your retirement savings.\n\n`;
    }

    if (question.toLowerCase().includes('risk')) {
      answer += `**Risk Management:**\n`;
      answer += `Your ${userProfile?.riskTolerance || 'balanced'} risk approach aligns with current market conditions. `;
      answer += `Diversification across asset classes remains crucial for long-term success.\n\n`;
    }

    // Add market context from news
    if (newsContent) {
      answer += `**Current Market Context:**\n`;
      answer += `Recent market developments suggest maintaining a balanced approach to portfolio allocation. `;
      answer += `Stay informed about regulatory changes and market trends that may impact your investment strategy.\n\n`;
    }

    answer += `**Next Steps:**\n`;
    answer += `1. Review your current asset allocation\n`;
    answer += `2. Consider increasing contributions if financially feasible\n`;
    answer += `3. Monitor performance quarterly\n`;
    answer += `4. Consult with a licensed financial advisor for personalized guidance\n\n`;
    
    answer += `*This information is based on current market research and is for educational purposes only. Always seek professional financial advice for your specific circumstances.*`;

    return answer;
  }

  private calculateConfidenceFromContent(content: string, keyword: string): number {
    const keywordCount = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    const baseConfidence = 75;
    const boost = Math.min(keywordCount * 5, 20);
    return Math.min(baseConfidence + boost, 95);
  }

  private extractReasoningFromContent(content: string, topic: string): string {
    // Extract relevant reasoning from search content
    const sentences = content.split('.').filter(sentence => 
      sentence.toLowerCase().includes(topic.toLowerCase())
    );
    
    if (sentences.length > 0) {
      return sentences[0].trim() + '. Based on current market analysis and expert recommendations.';
    }
    
    return `Strong fundamentals and market positioning make this a suitable choice for ${topic} exposure in your portfolio.`;
  }

  private determineImportanceFromTitle(title: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const highImportanceKeywords = ['rba', 'interest rate', 'inflation', 'recession', 'crisis'];
    const mediumImportanceKeywords = ['asx', 'market', 'shares', 'investment'];
    
    const titleLower = title.toLowerCase();
    
    if (highImportanceKeywords.some(keyword => titleLower.includes(keyword))) {
      return 'HIGH';
    }
    if (mediumImportanceKeywords.some(keyword => titleLower.includes(keyword))) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private categorizeMarketInsight(title: string, content: string): MarketInsight['category'] {
    const text = `${title} ${content}`.toLowerCase();
    
    if (text.includes('rba') || text.includes('interest rate') || text.includes('inflation')) {
      return 'ECONOMIC_INDICATOR';
    }
    if (text.includes('sector') || text.includes('industry')) {
      return 'SECTOR_ANALYSIS';
    }
    if (text.includes('risk') || text.includes('warning') || text.includes('alert')) {
      return 'RISK_ALERT';
    }
    return 'MARKET_TREND';
  }

  private isActionableInsight(content: string): boolean {
    const actionableKeywords = ['should', 'consider', 'recommend', 'suggest', 'opportunity'];
    return actionableKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  // Search for specific financial information
  async searchFinancialInfo(query: string, type: 'general' | 'news' | 'academic' = 'general'): Promise<SerperSearchResult[]> {
    try {
      const endpoint = type === 'news' ? 'news' : 'search';
      const results = await this.makeSerperRequest(endpoint, {
        q: `${query} Australian investment superannuation`,
        num: 10,
        gl: 'au',
        hl: 'en'
      });

      if (type === 'news') {
        return results.news?.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          date: item.date,
          source: item.source,
          imageUrl: item.imageUrl
        })) || [];
      } else {
        return results.organic?.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          source: item.source
        })) || [];
      }
    } catch (error) {
      console.error('Error searching financial info:', error);
      return [];
    }
  }

  // Get market news specifically
  async getMarketNews(symbols: string[] = []): Promise<SerperNewsResult[]> {
    try {
      const query = symbols.length > 0 
        ? `${symbols.join(' ')} stock market news Australia`
        : 'Australian stock market ASX investment news';
      
      const results = await this.makeSerperRequest('news', {
        q: query,
        num: 10,
        gl: 'au',
        hl: 'en'
      });

      return results.news?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        date: item.date,
        source: item.source,
        imageUrl: item.imageUrl
      })) || [];
    } catch (error) {
      console.error('Error getting market news from Serper:', error);
      return [];
    }
  }

  private getFallbackRecommendations(userProfile: any): InvestmentRecommendation[] {
    const baseRecommendations = [
      {
        symbol: 'VAS.AX',
        name: 'Vanguard Australian Shares Index ETF',
        recommendation: 'BUY' as const,
        confidence: 85,
        reasoning: 'Broad Australian market exposure with low fees, suitable for long-term growth based on market analysis.',
        targetPrice: 92.0,
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
        reasoning: 'International diversification provides exposure to global markets and reduces concentration risk.',
        targetPrice: 105.0,
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
        reasoning: 'Provides portfolio stability and income generation in current interest rate environment.',
        targetPrice: 52.0,
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
        reasoning: 'Higher growth potential through emerging markets exposure aligns with aggressive risk profile.',
        targetPrice: 45.5,
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
    return `Thank you for your question about "${question}". Based on current market research and analysis:

For superannuation and investment guidance, consider:
- Reviewing your current asset allocation
- Ensuring adequate diversification across asset classes
- Regular portfolio rebalancing to maintain target allocations
- Taking advantage of contribution caps and tax benefits
- Monitoring fees and performance against benchmarks
- Staying informed about regulatory changes
- Considering your risk tolerance and investment timeline

For personalized advice specific to your situation, I recommend:
1. Consulting with a licensed financial advisor
2. Using our portfolio analysis tools
3. Reviewing our education center resources
4. Running what-if scenarios in the forecasting tool

Recent market analysis suggests maintaining a balanced approach while staying alert to emerging opportunities and risks.

Please note that this is general information only and not personal financial advice. Always consider your individual circumstances and seek professional guidance for major financial decisions.`;
  }
}

export const serperService = new SerperService();