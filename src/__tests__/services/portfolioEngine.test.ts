import { describe, test, expect, beforeEach } from 'vitest';
import { PortfolioEngine } from '../../utils/portfolioEngine';
import { AssetCalculator } from '../../utils/portfolioEngine/core/AssetCalculator';
import { MonteCarloSimulator } from '../../utils/portfolioEngine/core/MonteCarloSimulator';
import { RegionalRulesEngine } from '../../utils/portfolioEngine/core/RegionalRules';
import { UnifiedAsset } from '../../types/portfolioTypes';

describe('PortfolioEngine', () => {
  let engine: PortfolioEngine;
  let mockAssets: UnifiedAsset[];

  beforeEach(() => {
    engine = new PortfolioEngine('AU');
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
    const config = engine.getRegionalConfig();
    expect(config.region).toBe('AU');
    expect(config.currency).toBe('AUD');
    expect(config.superContributionCap).toBe(27500);
  });

  test('should calculate total portfolio value', () => {
    const totalValue = engine.calculatePortfolioValue(mockAssets);
    expect(totalValue).toBe(28500); // 10500 + 18000
  });

  test('should calculate asset allocation percentages', () => {
    const allocation = engine.calculateAssetAllocation(mockAssets);
    
    expect(allocation.stock).toBeCloseTo(36.84, 1); // 10500/28500 * 100
    expect(allocation.etf).toBeCloseTo(63.16, 1); // 18000/28500 * 100
    
    // Total should equal 100%
    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  test('should generate portfolio projections', () => {
    const projections = engine.calculatePortfolioProjections(
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
    const score = engine.getDiversificationScore(mockAssets);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    
    // Single asset should have lower score
    const singleAsset = [mockAssets[0]];
    const singleScore = engine.getDiversificationScore(singleAsset);
    expect(singleScore).toBeLessThan(score);
  });

  test('should calculate risk score', () => {
    const riskScore = engine.getRiskScore(mockAssets);
    
    expect(riskScore).toBeGreaterThan(0);
    expect(riskScore).toBeLessThanOrEqual(100);
    
    // Higher volatility should increase risk
    const highVolatilityAssets = mockAssets.map(asset => ({
      ...asset,
      volatility: 0.5,
    }));
    
    const highRiskScore = engine.getRiskScore(highVolatilityAssets);
    expect(highRiskScore).toBeGreaterThan(riskScore);
  });
});

describe('AssetCalculator', () => {
  let calculator: AssetCalculator;
  let regionalConfig: any;

  beforeEach(() => {
    const regionalRules = new RegionalRulesEngine();
    regionalConfig = regionalRules.getConfig('AU');
    calculator = new AssetCalculator(regionalConfig);
  });

  test('should calculate asset value correctly', () => {
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

    const value = calculator.calculateAssetValue(asset);
    expect(value).toBe(6000); // 100 * 60
  });

  test('should calculate gains correctly', () => {
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

    const { gain, gainPercent } = calculator.calculateAssetGain(asset);
    expect(gain).toBe(1000); // (60-50) * 100
    expect(gainPercent).toBe(20); // 1000/5000 * 100
  });

  test('should calculate expected returns for different asset types', () => {
    const stockAsset: UnifiedAsset = {
      id: '1', type: 'stock', symbol: 'TEST', name: 'Test', quantity: 1,
      purchasePrice: 100, currentPrice: 100, value: 100, currency: 'AUD',
      region: 'AU', purchaseDate: '2024-01-01', expectedReturn: 0.08,
      volatility: 0.15, metadata: {},
    };

    const bondAsset: UnifiedAsset = {
      ...stockAsset, id: '2', type: 'bond',
    };

    const stockReturn = calculator.calculateExpectedReturn(stockAsset);
    const bondReturn = calculator.calculateExpectedReturn(bondAsset);

    expect(stockReturn).toBeGreaterThan(bondReturn);
    expect(stockReturn).toBeCloseTo(0.08, 2);
    expect(bondReturn).toBeCloseTo(0.04, 2);
  });
});

describe('RegionalRulesEngine', () => {
  let rulesEngine: RegionalRulesEngine;

  beforeEach(() => {
    rulesEngine = new RegionalRulesEngine();
  });

  test('should provide correct regional configurations', () => {
    const auConfig = rulesEngine.getConfig('AU');
    const inConfig = rulesEngine.getConfig('IN');
    const usConfig = rulesEngine.getConfig('US');

    expect(auConfig.currency).toBe('AUD');
    expect(inConfig.currency).toBe('INR');
    expect(usConfig.currency).toBe('USD');

    expect(auConfig.superContributionCap).toBe(27500);
    expect(auConfig.inflationRate).toBe(0.025);
  });

  test('should calculate taxes correctly', () => {
    const auTax = rulesEngine.calculateTax(10000, 'AU', 'capital');
    const inTax = rulesEngine.calculateTax(10000, 'IN', 'capital');

    expect(auTax).toBe(1500); // 10000 * 0.15
    expect(inTax).toBe(2000); // 10000 * 0.20
  });

  test('should provide contribution limits', () => {
    const auLimits = rulesEngine.getContributionLimits('AU');
    const inLimits = rulesEngine.getContributionLimits('IN');

    expect(auLimits.concessional).toBe(27500);
    expect(auLimits.nonConcessional).toBe(110000);
    
    expect(inLimits.concessional).toBe(150000);
    expect(inLimits.nonConcessional).toBe(Infinity);
  });

  test('should throw error for invalid region', () => {
    expect(() => rulesEngine.getConfig('INVALID')).toThrow();
  });
});