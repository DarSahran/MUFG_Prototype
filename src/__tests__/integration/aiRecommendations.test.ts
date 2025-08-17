import { describe, test, expect, beforeEach, vi } from 'vitest';
import { contextualAdvisor } from '../../services/aiAdvisor';
import { UnifiedAsset } from '../../types/portfolioTypes';
import { UserProfile } from '../../App';

// Mock the Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockResolvedValue(JSON.stringify({
            recommendations: [
              {
                id: 'test-rec-1',
                title: 'Test Recommendation',
                description: 'Test description',
                confidence: 85,
                reasoning: 'Test reasoning',
                action: 'Test action',
                impact: 'Test impact',
                priority: 'high',
                category: 'allocation'
              }
            ]
          }))
        }
      })
    })
  }))
}));

describe('AI Recommendations', () => {
  let advisor: ContextualAdvisor;
  let mockPortfolio: UnifiedAsset[];
  let mockUserProfile: UserProfile;

  beforeEach(() => {
    advisor = contextualAdvisor;
    
    mockPortfolio = [
      {
        id: '1',
        type: 'stock',
        symbol: 'CBA.AX',
        name: 'Commonwealth Bank',
        quantity: 100,
        purchasePrice: 95,
        currentPrice: 105,
        value: 10500,
        currency: 'AUD',
        region: 'AU',
        exchange: 'ASX',
        purchaseDate: '2024-01-01',
        expectedReturn: 0.08,
        volatility: 0.18,
        metadata: {},
      },
    ];

    mockUserProfile = {
      name: 'Test User',
      age: 35,
      retirementAge: 65,
      currentSuper: 75000,
      monthlyContribution: 1000,
      riskTolerance: 'balanced',
      financialGoals: ['retirement'],
      completed: true,
      annualIncome: 80000,
      investmentExperience: 'intermediate',
    } as UserProfile;
  });

  test('should generate portfolio analysis', async () => {
    const analysis = await advisor.analyzePortfolio(mockPortfolio, mockUserProfile);
    
    expect(analysis).toBeDefined();
    expect(typeof analysis).toBe('string');
    expect(analysis.length).toBeGreaterThan(0);
  });

  test('should generate recommendations', async () => {
    const recommendations = await advisor.generateRecommendations(mockPortfolio, mockUserProfile);
    
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    
    const firstRec = recommendations[0];
    expect(firstRec).toHaveProperty('id');
    expect(firstRec).toHaveProperty('title');
    expect(firstRec).toHaveProperty('confidence');
    expect(firstRec.confidence).toBeGreaterThanOrEqual(0);
    expect(firstRec.confidence).toBeLessThanOrEqual(100);
  });

  test('should handle API errors gracefully', async () => {
    // Mock API failure
    const failingAdvisor = new ContextualAdvisor();
    vi.spyOn(failingAdvisor as any, 'model', 'get').mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
    });

    const analysis = await failingAdvisor.analyzePortfolio(mockPortfolio, mockUserProfile);
    expect(analysis).toBeDefined();
    expect(analysis).toContain('Portfolio Analysis'); // Should return fallback
  });

  test('should provide contextual recommendations based on portfolio', async () => {
    // Test with crypto-heavy portfolio
    const cryptoPortfolio: UnifiedAsset[] = [
      {
        id: '1',
        type: 'crypto',
        symbol: 'BTC-USD',
        name: 'Bitcoin',
        quantity: 0.5,
        purchasePrice: 50000,
        currentPrice: 60000,
        value: 30000,
        currency: 'USD',
        region: 'GLOBAL',
        purchaseDate: '2024-01-01',
        expectedReturn: 0.15,
        volatility: 0.6,
        metadata: {},
      },
    ];

    const recommendations = await advisor.generateRecommendations(cryptoPortfolio, mockUserProfile);
    
    // Should recommend diversification for crypto-heavy portfolio
    expect(recommendations.some(rec => 
      rec.category === 'allocation' || rec.title.toLowerCase().includes('diversif')
    )).toBe(true);
  });

  test('should adjust recommendations based on user age', async () => {
    // Test with young user
    const youngUser = { ...mockUserProfile, age: 25, retirementAge: 65 };
    const youngRecommendations = await advisor.generateRecommendations(mockPortfolio, youngUser);
    
    // Test with older user
    const olderUser = { ...mockUserProfile, age: 55, retirementAge: 65 };
    const olderRecommendations = await advisor.generateRecommendations(mockPortfolio, olderUser);
    
    expect(youngRecommendations).toBeDefined();
    expect(olderRecommendations).toBeDefined();
    
    // Recommendations should be different based on age
    expect(youngRecommendations).not.toEqual(olderRecommendations);
  });

  test('should handle different risk tolerances', async () => {
    const conservativeUser = { ...mockUserProfile, riskTolerance: 'conservative' as const };
    const aggressiveUser = { ...mockUserProfile, riskTolerance: 'aggressive' as const };
    
    const conservativeRecs = await advisor.generateRecommendations(mockPortfolio, conservativeUser);
    const aggressiveRecs = await advisor.generateRecommendations(mockPortfolio, aggressiveUser);
    
    expect(conservativeRecs).toBeDefined();
    expect(aggressiveRecs).toBeDefined();
    
    // Should provide different recommendations based on risk tolerance
    expect(conservativeRecs.length).toBeGreaterThan(0);
    expect(aggressiveRecs.length).toBeGreaterThan(0);
  });
});

describe('Monte Carlo Simulation', () => {
  test('should produce statistically valid results', () => {
    const portfolioEngine = new PortfolioEngine('AU');
    const mockAssets: UnifiedAsset[] = [
      {
        id: '1',
        type: 'stock',
        symbol: 'TEST',
        name: 'Test Asset',
        quantity: 100,
        purchasePrice: 100,
        currentPrice: 100,
        value: 10000,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: '2024-01-01',
        expectedReturn: 0.08,
        volatility: 0.15,
        metadata: {},
      },
    ];

    const projections = portfolioEngine.calculatePortfolioProjections(
      mockAssets,
      500,
      10,
      150000 // retirement goal
    );

    const monteCarlo = projections.monteCarlo;
    expect(monteCarlo).toHaveLength(10);

    // Test statistical properties
    const lastYear = monteCarlo[9];
    
    // Percentiles should be ordered
    expect(lastYear.percentile10).toBeLessThanOrEqual(lastYear.percentile50);
    expect(lastYear.percentile50).toBeLessThanOrEqual(lastYear.percentile90);
    
    // Mean should be between reasonable bounds
    expect(lastYear.mean).toBeGreaterThan(10000);
    expect(lastYear.mean).toBeLessThan(1000000);
    
    // Standard deviation should be positive
    expect(lastYear.standardDeviation).toBeGreaterThan(0);
    
    // Probability should be valid
    expect(lastYear.probabilityOfSuccess).toBeGreaterThanOrEqual(0);
    expect(lastYear.probabilityOfSuccess).toBeLessThanOrEqual(1);
  });
});