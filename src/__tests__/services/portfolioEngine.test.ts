import { describe, test, expect, beforeEach } from 'vitest';
import { portfolioEngine } from '../../utils/portfolioEngine';
import { UnifiedAsset } from '../../types/portfolioTypes';

describe('PortfolioEngine', () => {
  let mockAssets: UnifiedAsset[];

  beforeEach(() => {
    mockAssets = [
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
      {
        id: '2',
        type: 'etf',
        symbol: 'VAS.AX',
        name: 'Vanguard Australian Shares',
        quantity: 200,
        purchasePrice: 85,
        currentPrice: 90,
        value: 18000,
        currency: 'AUD',
        region: 'AU',
        exchange: 'ASX',
        purchaseDate: '2024-01-01',
        expectedReturn: 0.075,
        volatility: 0.15,
        metadata: {},
      },
    ];
  });

  test('should initialize with correct regional config', () => {
    const config = portfolioEngine.getRegionalConfig();
    expect(config.region).toBe('AU');
    expect(config.currency).toBe('AUD');
    expect(config.superContributionCap).toBe(27500);
  });

  test('should calculate total portfolio value', () => {
    const totalValue = portfolioEngine.calculatePortfolioValue(mockAssets);
    expect(totalValue).toBe(28500); // 10500 + 18000
  });

  test('should calculate asset allocation percentages', () => {
    const allocation = portfolioEngine.calculateAssetAllocation(mockAssets);
    
    expect(allocation.stock).toBeCloseTo(36.84, 1); // 10500/28500 * 100
    expect(allocation.etf).toBeCloseTo(63.16, 1); // 18000/28500 * 100
    
    // Total should equal 100%
    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  test('should generate portfolio projections', () => {
    const projections = portfolioEngine.calculatePortfolioProjections(
      mockAssets,
      1000, // monthly contribution
      5 // years
    );

    // Should have all scenario types
    expect(projections.baseCase).toBeDefined();
    expect(projections.optimistic).toBeDefined();
    expect(projections.pessimistic).toBeDefined();
    expect(projections.monteCarlo).toBeDefined();

    // Base case should have correct length
    expect(projections.baseCase).toHaveLength(6); // 0 to 5 years

    // Values should increase over time
    expect(projections.baseCase[5].totalValue).toBeGreaterThan(projections.baseCase[0].totalValue);
    
    // Optimistic should be higher than base case
    expect(projections.optimistic[5].totalValue).toBeGreaterThan(projections.baseCase[5].totalValue);
    
    // Pessimistic should be lower than base case
    expect(projections.pessimistic[5].totalValue).toBeLessThan(projections.baseCase[5].totalValue);
  });

  test('should calculate diversification score', () => {
    const score = portfolioEngine.getDiversificationScore(mockAssets);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    
    // Single asset should have lower score
    const singleAsset = [mockAssets[0]];
    const singleScore = portfolioEngine.getDiversificationScore(singleAsset);
    expect(singleScore).toBeLessThan(score);
  });

  test('should calculate risk score', () => {
    const riskScore = portfolioEngine.getRiskScore(mockAssets);
    
    expect(riskScore).toBeGreaterThan(0);
    expect(riskScore).toBeLessThanOrEqual(100);
    
    // Higher volatility should increase risk
    const highVolatilityAssets = mockAssets.map(asset => ({
      ...asset,
      volatility: 0.5,
    }));
    
    const highRiskScore = portfolioEngine.getRiskScore(highVolatilityAssets);
    expect(highRiskScore).toBeGreaterThan(riskScore);
  });
});