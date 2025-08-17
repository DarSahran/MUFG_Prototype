import { PortfolioCalculationEngine } from '../calculationEngine';
import { AssetHolding } from '../../types/portfolio';

describe('PortfolioCalculationEngine', () => {
  let engine: PortfolioCalculationEngine;
  let mockHoldings: AssetHolding[];

  beforeEach(() => {
    engine = new PortfolioCalculationEngine('AU');
    mockHoldings = [
      {
        id: '1',
        type: 'stock',
        symbol: 'VAS.AX',
        name: 'Vanguard Australian Shares',
        quantity: 100,
        purchasePrice: 85,
        currentPrice: 90,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: '2024-01-01',
      },
      {
        id: '2',
        type: 'super',
        name: 'Superannuation',
        quantity: 1,
        purchasePrice: 50000,
        currentPrice: 55000,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: '2020-01-01',
      },
    ];
  });

  test('should calculate current portfolio value correctly', () => {
    const projections = engine.calculatePortfolioProjections(mockHoldings, 500, 10);
    expect(projections.baseCase[0].totalValue).toBe(64000); // 100*90 + 55000
  });

  test('should project portfolio growth over time', () => {
    const projections = engine.calculatePortfolioProjections(mockHoldings, 500, 5);
    expect(projections.baseCase).toHaveLength(6); // 0 to 5 years
    expect(projections.baseCase[5].totalValue).toBeGreaterThan(64000);
  });

  test('should run Monte Carlo simulation', () => {
    const projections = engine.calculatePortfolioProjections(mockHoldings, 500, 10, 100000);
    expect(projections.monteCarlo).toHaveLength(10);
    expect(projections.monteCarlo[9].probabilityOfSuccess).toBeGreaterThanOrEqual(0);
    expect(projections.monteCarlo[9].probabilityOfSuccess).toBeLessThanOrEqual(1);
  });

  test('should handle what-if scenarios', () => {
    const scenario = engine.calculateWhatIfScenario(mockHoldings, {
      monthlyContribution: 1000,
      retirementAge: 65,
    });
    
    expect(scenario.current).toBeDefined();
    expect(scenario.whatIf).toBeDefined();
    expect(scenario.whatIf[scenario.whatIf.length - 1].totalValue)
      .toBeGreaterThan(scenario.current[scenario.current.length - 1].totalValue);
  });

  test('should handle different regions', () => {
    const auEngine = new PortfolioCalculationEngine('AU');
    const inEngine = new PortfolioCalculationEngine('IN');
    
    const auProjections = auEngine.calculatePortfolioProjections(mockHoldings, 500, 5);
    const inProjections = inEngine.calculatePortfolioProjections(mockHoldings, 500, 5);
    
    // Different regional configs should produce different results
    expect(auProjections.baseCase[5].taxes).not.toBe(inProjections.baseCase[5].taxes);
  });

  test('should handle edge cases', () => {
    // Empty holdings
    const emptyProjections = engine.calculatePortfolioProjections([], 500, 5);
    expect(emptyProjections.baseCase[0].totalValue).toBe(0);
    
    // Zero contribution
    const zeroContribProjections = engine.calculatePortfolioProjections(mockHoldings, 0, 5);
    expect(zeroContribProjections.baseCase[1].contributions).toBe(64000); // Only initial value
    
    // Negative years (should handle gracefully)
    expect(() => engine.calculatePortfolioProjections(mockHoldings, 500, -1)).not.toThrow();
  });
});