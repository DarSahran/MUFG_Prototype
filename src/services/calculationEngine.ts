import { AssetHolding, PortfolioProjection, MonteCarloResult, ScenarioAnalysis } from '../types/portfolio';

export class PortfolioCalculationEngine {
  private region: 'AU' | 'IN' | 'US';
  
  constructor(region: 'AU' | 'IN' | 'US' = 'AU') {
    this.region = region;
  }

  calculatePortfolioProjections(
    holdings: AssetHolding[],
    monthlyContribution: number,
    years: number,
    retirementGoal?: number
  ): ScenarioAnalysis {
    const baseCase = this.projectPortfolio(holdings, monthlyContribution, years, 'base');
    const optimistic = this.projectPortfolio(holdings, monthlyContribution, years, 'optimistic');
    const pessimistic = this.projectPortfolio(holdings, monthlyContribution, years, 'pessimistic');
    const monteCarlo = this.runMonteCarloSimulation(holdings, monthlyContribution, years, retirementGoal);

    return {
      baseCase,
      optimistic,
      pessimistic,
      monteCarlo,
    };
  }

  private projectPortfolio(
    holdings: AssetHolding[],
    monthlyContribution: number,
    years: number,
    scenario: 'base' | 'optimistic' | 'pessimistic'
  ): PortfolioProjection[] {
    const projections: PortfolioProjection[] = [];
    const currentValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    
    const returnMultipliers = {
      base: 1.0,
      optimistic: 1.3,
      pessimistic: 0.7,
    };

    let portfolioValue = currentValue;
    let totalContributions = currentValue;

    for (let year = 0; year <= years; year++) {
      if (year > 0) {
        const assetBreakdown: { [assetType: string]: number } = {};
        let yearlyGrowth = 0;

        holdings.forEach(holding => {
          const holdingValue = holding.quantity * holding.currentPrice;
          const expectedReturn = this.getExpectedReturn(holding.type);
          const adjustedReturn = expectedReturn * returnMultipliers[scenario];
          const growth = holdingValue * adjustedReturn;
          
          yearlyGrowth += growth;
          assetBreakdown[holding.type] = (assetBreakdown[holding.type] || 0) + holdingValue + growth;
        });

        const yearlyContributions = monthlyContribution * 12;
        portfolioValue += yearlyGrowth + yearlyContributions;
        totalContributions += yearlyContributions;

        projections.push({
          year: new Date().getFullYear() + year,
          totalValue: Math.round(portfolioValue),
          assetBreakdown,
          contributions: Math.round(totalContributions),
          growth: Math.round(portfolioValue - totalContributions),
          inflation: Math.round(portfolioValue * 0.025),
          taxes: Math.round(yearlyGrowth * 0.15),
        });
      } else {
        const assetBreakdown: { [assetType: string]: number } = {};
        holdings.forEach(holding => {
          const value = holding.quantity * holding.currentPrice;
          assetBreakdown[holding.type] = (assetBreakdown[holding.type] || 0) + value;
        });

        projections.push({
          year: new Date().getFullYear(),
          totalValue: Math.round(currentValue),
          assetBreakdown,
          contributions: Math.round(currentValue),
          growth: 0,
          inflation: 0,
          taxes: 0,
        });
      }
    }

    return projections;
  }

  private runMonteCarloSimulation(
    holdings: AssetHolding[],
    monthlyContribution: number,
    years: number,
    retirementGoal?: number
  ): MonteCarloResult[] {
    const results: MonteCarloResult[] = [];
    const iterations = 1000;

    for (let year = 1; year <= years; year++) {
      const yearResults: number[] = [];

      for (let iteration = 0; iteration < iterations; iteration++) {
        const portfolioValue = this.simulatePortfolioGrowth(holdings, monthlyContribution, year);
        yearResults.push(portfolioValue);
      }

      yearResults.sort((a, b) => a - b);

      const mean = yearResults.reduce((sum, val) => sum + val, 0) / iterations;
      const variance = yearResults.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / iterations;
      const standardDeviation = Math.sqrt(variance);

      let probabilityOfSuccess = 1;
      if (retirementGoal) {
        const successCount = yearResults.filter(val => val >= retirementGoal).length;
        probabilityOfSuccess = successCount / iterations;
      }

      results.push({
        percentile10: yearResults[Math.floor(iterations * 0.1)],
        percentile25: yearResults[Math.floor(iterations * 0.25)],
        percentile50: yearResults[Math.floor(iterations * 0.5)],
        percentile75: yearResults[Math.floor(iterations * 0.75)],
        percentile90: yearResults[Math.floor(iterations * 0.9)],
        mean,
        standardDeviation,
        probabilityOfSuccess,
      });
    }

    return results;
  }

  private simulatePortfolioGrowth(
    holdings: AssetHolding[],
    monthlyContribution: number,
    years: number
  ): number {
    let totalValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);

    for (let year = 1; year <= years; year++) {
      holdings.forEach(holding => {
        const holdingValue = holding.quantity * holding.currentPrice;
        const expectedReturn = this.getExpectedReturn(holding.type);
        const volatility = this.getVolatility(holding.type);
        
        const randomReturn = this.generateNormalRandom(expectedReturn, volatility);
        const growth = holdingValue * randomReturn;
        
        totalValue += growth;
      });

      totalValue += monthlyContribution * 12;
      totalValue *= (1 - 0.025); // Inflation adjustment
    }

    return Math.max(0, totalValue);
  }

  calculateWhatIfScenario(
    holdings: AssetHolding[],
    changes: {
      monthlyContribution?: number;
      retirementAge?: number;
      riskProfile?: string;
      additionalInvestment?: number;
    }
  ): { current: PortfolioProjection[]; whatIf: PortfolioProjection[] } {
    const baseYears = 30;
    const current = this.projectPortfolio(holdings, 500, baseYears, 'base');
    
    const newContribution = changes.monthlyContribution || 500;
    const projectionYears = baseYears;
    
    let modifiedHoldings = [...holdings];
    
    if (changes.additionalInvestment && changes.additionalInvestment > 0) {
      modifiedHoldings.push({
        id: 'additional-investment',
        type: 'cash',
        name: 'Additional Investment',
        quantity: 1,
        purchasePrice: changes.additionalInvestment,
        currentPrice: changes.additionalInvestment,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: new Date().toISOString().split('T')[0],
        metadata: {},
      });
    }
    
    const whatIf = this.projectPortfolio(modifiedHoldings, newContribution, projectionYears, 'base');
    
    return { current, whatIf };
  }

  private getExpectedReturn(assetType: string): number {
    const returns = {
      stock: 0.08,
      etf: 0.075,
      bond: 0.04,
      property: 0.06,
      crypto: 0.12,
      cash: 0.025,
      super: 0.075,
      fd: 0.055,
      ppf: 0.075
    };
    return returns[assetType as keyof typeof returns] || 0.06;
  }

  private getVolatility(assetType: string): number {
    const volatilities = {
      stock: 0.20,
      etf: 0.15,
      bond: 0.05,
      property: 0.12,
      crypto: 0.60,
      cash: 0.01,
      super: 0.15,
      fd: 0.02,
      ppf: 0.03
    };
    return volatilities[assetType as keyof typeof volatilities] || 0.15;
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }
}

export const calculationEngine = new PortfolioCalculationEngine();