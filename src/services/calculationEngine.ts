import { AssetHolding, PortfolioProjection, MonteCarloResult, RegionalConfig, ScenarioAnalysis } from '../types/portfolio';

export class PortfolioCalculationEngine {
  private regionalConfig: RegionalConfig;

  constructor(region: 'AU' | 'IN' = 'AU') {
    this.regionalConfig = this.getRegionalConfig(region);
  }

  private getRegionalConfig(region: 'AU' | 'IN'): RegionalConfig {
    const configs = {
      AU: {
        region: 'AU' as const,
        currency: 'AUD' as const,
        superContributionCap: 27500,
        taxRates: {
          income: [0, 0.19, 0.325, 0.37, 0.45],
          capital: 0.15,
          super: 0.15,
        },
        inflationRate: 0.025,
        riskFreeRate: 0.035,
      },
      IN: {
        region: 'IN' as const,
        currency: 'INR' as const,
        taxRates: {
          income: [0, 0.05, 0.20, 0.30],
          capital: 0.20,
        },
        inflationRate: 0.04,
        riskFreeRate: 0.065,
      },
    };
    return configs[region];
  }

  /**
   * Calculate portfolio projections with multiple scenarios
   */
  calculatePortfolioProjections(
    holdings: AssetHolding[],
    monthlyContribution: number,
    yearsToProject: number,
    retirementGoal?: number
  ): ScenarioAnalysis {
    const baseCase = this.projectPortfolio(holdings, monthlyContribution, yearsToProject, 'base');
    const optimistic = this.projectPortfolio(holdings, monthlyContribution, yearsToProject, 'optimistic');
    const pessimistic = this.projectPortfolio(holdings, monthlyContribution, yearsToProject, 'pessimistic');
    const monteCarlo = this.runMonteCarloSimulation(holdings, monthlyContribution, yearsToProject, retirementGoal);

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
    const currentValue = this.calculateCurrentPortfolioValue(holdings);
    
    // Asset-specific expected returns based on scenario
    const returnMultipliers = {
      base: { stock: 0.08, etf: 0.075, bond: 0.04, property: 0.06, crypto: 0.12, cash: 0.025, super: 0.075, fd: 0.055, ppf: 0.075 },
      optimistic: { stock: 0.12, etf: 0.11, bond: 0.05, property: 0.08, crypto: 0.20, cash: 0.03, super: 0.10, fd: 0.065, ppf: 0.085 },
      pessimistic: { stock: 0.04, etf: 0.035, bond: 0.025, property: 0.03, crypto: 0.05, cash: 0.015, super: 0.045, fd: 0.045, ppf: 0.065 },
    };

    let portfolioValue = currentValue;
    let totalContributions = currentValue;

    for (let year = 0; year <= years; year++) {
      if (year > 0) {
        // Apply growth to each asset class
        const assetBreakdown: { [assetType: string]: number } = {};
        let yearlyGrowth = 0;

        holdings.forEach(holding => {
          const holdingValue = holding.quantity * holding.currentPrice;
          const expectedReturn = returnMultipliers[scenario][holding.type] || 0.06;
          const growth = holdingValue * expectedReturn;
          yearlyGrowth += growth;
          
          assetBreakdown[holding.type] = (assetBreakdown[holding.type] || 0) + holdingValue + growth;
        });

        // Add monthly contributions
        const yearlyContributions = monthlyContribution * 12;
        portfolioValue += yearlyGrowth + yearlyContributions;
        totalContributions += yearlyContributions;

        // Calculate taxes (simplified)
        const taxes = this.calculateTaxes(yearlyGrowth, holding => holding.type === 'super');

        projections.push({
          year: new Date().getFullYear() + year,
          totalValue: Math.round(portfolioValue),
          assetBreakdown,
          contributions: Math.round(totalContributions),
          growth: Math.round(portfolioValue - totalContributions),
          inflation: Math.round(portfolioValue * this.regionalConfig.inflationRate),
          taxes: Math.round(taxes),
        });
      } else {
        // Initial year
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

  /**
   * Run Monte Carlo simulation for portfolio projections
   */
  private runMonteCarloSimulation(
    holdings: AssetHolding[],
    monthlyContribution: number,
    years: number,
    retirementGoal?: number,
    simulations: number = 1000
  ): MonteCarloResult[] {
    const results: MonteCarloResult[] = [];
    
    for (let year = 1; year <= years; year++) {
      const yearResults: number[] = [];
      
      for (let sim = 0; sim < simulations; sim++) {
        let portfolioValue = this.calculateCurrentPortfolioValue(holdings);
        
        for (let y = 1; y <= year; y++) {
          // Apply random returns based on asset volatility
          holdings.forEach(holding => {
            const holdingValue = holding.quantity * holding.currentPrice;
            const expectedReturn = this.getExpectedReturn(holding.type);
            const volatility = this.getAssetVolatility(holding.type);
            
            // Generate random return using normal distribution
            const randomReturn = this.normalRandom(expectedReturn, volatility);
            portfolioValue += holdingValue * randomReturn;
          });
          
          // Add contributions
          portfolioValue += monthlyContribution * 12;
        }
        
        yearResults.push(portfolioValue);
      }
      
      // Calculate percentiles
      yearResults.sort((a, b) => a - b);
      const mean = yearResults.reduce((sum, val) => sum + val, 0) / simulations;
      const variance = yearResults.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / simulations;
      const standardDeviation = Math.sqrt(variance);
      
      let probabilityOfSuccess = 1;
      if (retirementGoal) {
        const successCount = yearResults.filter(val => val >= retirementGoal).length;
        probabilityOfSuccess = successCount / simulations;
      }
      
      results.push({
        percentile10: yearResults[Math.floor(simulations * 0.1)],
        percentile25: yearResults[Math.floor(simulations * 0.25)],
        percentile50: yearResults[Math.floor(simulations * 0.5)],
        percentile75: yearResults[Math.floor(simulations * 0.75)],
        percentile90: yearResults[Math.floor(simulations * 0.9)],
        mean,
        standardDeviation,
        probabilityOfSuccess,
      });
    }
    
    return results;
  }

  private calculateCurrentPortfolioValue(holdings: AssetHolding[]): number {
    return holdings.reduce((total, holding) => {
      return total + (holding.quantity * holding.currentPrice);
    }, 0);
  }

  private getExpectedReturn(assetType: string): number {
    const returns = {
      stock: 0.08, etf: 0.075, bond: 0.04, property: 0.06,
      crypto: 0.12, cash: 0.025, super: 0.075, fd: 0.055, ppf: 0.075
    };
    return returns[assetType as keyof typeof returns] || 0.06;
  }

  private getAssetVolatility(assetType: string): number {
    const volatilities = {
      stock: 0.20, etf: 0.15, bond: 0.05, property: 0.12,
      crypto: 0.60, cash: 0.01, super: 0.15, fd: 0.02, ppf: 0.03
    };
    return volatilities[assetType as keyof typeof volatilities] || 0.15;
  }

  private normalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  private calculateTaxes(growth: number, isSuperFn: (holding: AssetHolding) => boolean): number {
    // Simplified tax calculation - would need more complex logic for real implementation
    const capitalGainsTax = growth * this.regionalConfig.taxRates.capital;
    return Math.max(0, capitalGainsTax);
  }

  /**
   * Calculate what-if scenarios
   */
  calculateWhatIfScenario(
    holdings: AssetHolding[],
    changes: {
      monthlyContribution?: number;
      retirementAge?: number;
      riskProfile?: 'conservative' | 'balanced' | 'aggressive';
      additionalInvestment?: number;
    }
  ): { current: PortfolioProjection[]; whatIf: PortfolioProjection[] } {
    const baseYears = 30; // Default projection period
    const current = this.projectPortfolio(holdings, 500, baseYears, 'base');
    
    // Apply changes for what-if scenario
    const modifiedHoldings = changes.riskProfile ? this.adjustForRiskProfile(holdings, changes.riskProfile) : holdings;
    const newContribution = changes.monthlyContribution || 500;
    const projectionYears = changes.retirementAge ? changes.retirementAge - 30 : baseYears; // Assuming current age 30
    
    const whatIf = this.projectPortfolio(modifiedHoldings, newContribution, projectionYears, 'base');
    
    return { current, whatIf };
  }

  private adjustForRiskProfile(holdings: AssetHolding[], riskProfile: string): AssetHolding[] {
    // This would implement portfolio rebalancing based on risk profile
    // For now, return original holdings
    return holdings;
  }
}

export const calculationEngine = new PortfolioCalculationEngine();