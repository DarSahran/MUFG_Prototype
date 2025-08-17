import { UnifiedAsset, MonteCarloResult } from '../../../types/portfolioTypes';
import { AssetCalculator } from './AssetCalculator';

export class MonteCarloSimulator {
  private assetCalculator: AssetCalculator;

  constructor(assetCalculator: AssetCalculator) {
    this.assetCalculator = assetCalculator;
  }

  runSimulation(
    assets: UnifiedAsset[],
    monthlyContribution: number,
    years: number,
    iterations: number = 1000,
    retirementGoal?: number
  ): MonteCarloResult[] {
    const results: MonteCarloResult[] = [];

    for (let year = 1; year <= years; year++) {
      const yearResults: number[] = [];

      for (let iteration = 0; iteration < iterations; iteration++) {
        const portfolioValue = this.simulatePortfolioGrowth(
          assets,
          monthlyContribution,
          year
        );
        yearResults.push(portfolioValue);
      }

      // Sort results for percentile calculations
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
    assets: UnifiedAsset[],
    monthlyContribution: number,
    years: number
  ): number {
    let totalValue = assets.reduce((sum, asset) => 
      sum + this.assetCalculator.calculateAssetValue(asset), 0
    );

    for (let year = 1; year <= years; year++) {
      // Apply random returns for each asset
      assets.forEach(asset => {
        const assetValue = this.assetCalculator.calculateAssetValue(asset);
        const expectedReturn = this.assetCalculator.calculateExpectedReturn(asset);
        const volatility = this.assetCalculator.calculateVolatility(asset);
        
        // Generate random return using normal distribution
        const randomReturn = this.generateNormalRandom(expectedReturn, volatility);
        const growth = assetValue * randomReturn;
        
        totalValue += growth;
      });

      // Add annual contributions
      totalValue += monthlyContribution * 12;

      // Apply inflation
      totalValue *= (1 - 0.025); // 2.5% inflation adjustment
    }

    return Math.max(0, totalValue);
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  calculateConfidenceInterval(
    results: number[],
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number } {
    const alpha = 1 - confidenceLevel;
    const lowerIndex = Math.floor(results.length * (alpha / 2));
    const upperIndex = Math.floor(results.length * (1 - alpha / 2));

    return {
      lower: results[lowerIndex],
      upper: results[upperIndex],
    };
  }

  calculateValueAtRisk(results: number[], confidenceLevel: number = 0.05): number {
    const sortedResults = [...results].sort((a, b) => a - b);
    const index = Math.floor(results.length * confidenceLevel);
    return sortedResults[index];
  }
}