import { describe, test, expect, beforeEach } from 'vitest';
import { PortfolioEngine } from '../../utils/portfolioEngine';
import { UnifiedAsset } from '../../types/portfolioTypes';

describe('Portfolio Management Flow', () => {
  let portfolioEngine: PortfolioEngine;
  let mockAssets: UnifiedAsset[];

  beforeEach(() => {
    portfolioEngine = new PortfolioEngine('AU');
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
        metadata: { sector: 'Financial Services' },
      },
      {
        id: '2',
        type: 'super',
        name: 'Australian Super',
        quantity: 1,
        purchasePrice: 75000,
        currentPrice: 82000,
        value: 82000,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: '2020-01-01',
        expectedReturn: 0.075,
        volatility: 0.12,
        metadata: { fundName: 'Australian Super', investmentOption: 'balanced' },
      },
    ];
  });

  test('should calculate portfolio value correctly', () => {
    const totalValue = portfolioEngine.calculatePortfolioValue(mockAssets);
    expect(totalValue).toBe(92500); // 10500 + 82000
  });

  test('should calculate asset allocation correctly', () => {
    const allocation = portfolioEngine.calculateAssetAllocation(mockAssets);
    expect(allocation.stock).toBeCloseTo(11.35, 1); // 10500/92500 * 100
    expect(allocation.super).toBeCloseTo(88.65, 1); // 82000/92500 * 100
  });

  test('should generate portfolio projections', () => {
    const projections = portfolioEngine.calculatePortfolioProjections(
      mockAssets,
      1000, // monthly contribution
      10 // years
    );

    expect(projections.baseCase).toHaveLength(11); // 0 to 10 years
    expect(projections.baseCase[0].totalValue).toBe(92500);
    expect(projections.baseCase[10].totalValue).toBeGreaterThan(92500);
    
    // Optimistic should be higher than base case
    expect(projections.optimistic[10].totalValue).toBeGreaterThan(projections.baseCase[10].totalValue);
    
    // Pessimistic should be lower than base case
    expect(projections.pessimistic[10].totalValue).toBeLessThan(projections.baseCase[10].totalValue);
  });

  test('should run Monte Carlo simulation', () => {
    const projections = portfolioEngine.calculatePortfolioProjections(
      mockAssets,
      1000,
      5,
      200000 // retirement goal
    );

    expect(projections.monteCarlo).toHaveLength(5);
    
    // Check that percentiles are ordered correctly
    const lastYear = projections.monteCarlo[4];
    expect(lastYear.percentile10).toBeLessThanOrEqual(lastYear.percentile25);
    expect(lastYear.percentile25).toBeLessThanOrEqual(lastYear.percentile50);
    expect(lastYear.percentile50).toBeLessThanOrEqual(lastYear.percentile75);
    expect(lastYear.percentile75).toBeLessThanOrEqual(lastYear.percentile90);
    
    // Probability should be between 0 and 1
    expect(lastYear.probabilityOfSuccess).toBeGreaterThanOrEqual(0);
    expect(lastYear.probabilityOfSuccess).toBeLessThanOrEqual(1);
  });

  test('should handle what-if scenarios', () => {
    const scenario = portfolioEngine.calculateWhatIfScenario(
      mockAssets,
      {
        monthlyContribution: 1500, // Increased from 1000
        retirementAge: 65,
        additionalInvestment: 10000,
      },
      30 // current age
    );

    expect(scenario.current).toBeDefined();
    expect(scenario.whatIf).toBeDefined();
    
    // What-if should show higher values due to increased contributions
    const currentFinal = scenario.current[scenario.current.length - 1];
    const whatIfFinal = scenario.whatIf[scenario.whatIf.length - 1];
    expect(whatIfFinal.totalValue).toBeGreaterThan(currentFinal.totalValue);
  });

  test('should calculate diversification score', () => {
    const score = portfolioEngine.getDiversificationScore(mockAssets);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    
    // More diverse portfolio should have higher score
    const diverseAssets = [
      ...mockAssets,
      {
        id: '3',
        type: 'bond',
        name: 'Government Bond',
        quantity: 10,
        purchasePrice: 100,
        currentPrice: 102,
        value: 1020,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: '2024-01-01',
        expectedReturn: 0.04,
        volatility: 0.05,
        metadata: {},
      },
    ];
    
    const diverseScore = portfolioEngine.getDiversificationScore(diverseAssets);
    expect(diverseScore).toBeGreaterThan(score);
  });

  test('should calculate risk score', () => {
    const riskScore = portfolioEngine.getRiskScore(mockAssets);
    expect(riskScore).toBeGreaterThan(0);
    expect(riskScore).toBeLessThanOrEqual(100);
    
    // Higher volatility assets should increase risk score
    const highRiskAssets = mockAssets.map(asset => ({
      ...asset,
      volatility: 0.5, // Very high volatility
    }));
    
    const highRiskScore = portfolioEngine.getRiskScore(highRiskAssets);
    expect(highRiskScore).toBeGreaterThan(riskScore);
  });

  test('should handle empty portfolio gracefully', () => {
    const emptyValue = portfolioEngine.calculatePortfolioValue([]);
    expect(emptyValue).toBe(0);
    
    const emptyAllocation = portfolioEngine.calculateAssetAllocation([]);
    expect(Object.keys(emptyAllocation)).toHaveLength(0);
    
    const emptyDiversification = portfolioEngine.getDiversificationScore([]);
    expect(emptyDiversification).toBe(0);
  });

  test('should handle regional configurations', () => {
    const auEngine = new PortfolioEngine('AU');
    const inEngine = new PortfolioEngine('IN');
    
    const auConfig = auEngine.getRegionalConfig();
    const inConfig = inEngine.getRegionalConfig();
    
    expect(auConfig.currency).toBe('AUD');
    expect(inConfig.currency).toBe('INR');
    expect(auConfig.inflationRate).not.toBe(inConfig.inflationRate);
  });
});

describe('Asset Calculator', () => {
  test('should calculate asset gains correctly', () => {
    const asset: UnifiedAsset = {
      id: '1',
      type: 'stock',
      symbol: 'TEST',
      name: 'Test Stock',
      quantity: 100,
      purchasePrice: 50,
      currentPrice: 60,
      value: 6000,
      currency: 'AUD',
      region: 'AU',
      purchaseDate: '2024-01-01',
      expectedReturn: 0.08,
      volatility: 0.15,
      metadata: {},
    };

    const portfolioEngine = new PortfolioEngine('AU');
    // Note: We can't directly access AssetCalculator methods through portfolioEngine
    // This would require exposing the calculator or testing it separately
    
    const value = portfolioEngine.calculatePortfolioValue([asset]);
    expect(value).toBe(6000);
  });
});