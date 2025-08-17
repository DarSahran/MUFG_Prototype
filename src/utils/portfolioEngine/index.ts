import { AssetCalculator } from './core/AssetCalculator';
import { MonteCarloSimulator } from './core/MonteCarloSimulator';
import { RegionalRulesEngine } from './core/RegionalRules';
import { UnifiedAsset, PortfolioProjection, ScenarioAnalysis, RegionalConfig } from '../../types/portfolioTypes';

export class PortfolioEngine {
  private assetCalculator: AssetCalculator;
  private monteCarloSimulator: MonteCarloSimulator;
  private regionalRules: RegionalRulesEngine;
  private regionalConfig: RegionalConfig;

  constructor(region: 'AU' | 'IN' | 'US' = 'AU') {
    this.regionalRules = new RegionalRulesEngine();
    this.regionalConfig = this.regionalRules.getConfig(region);
    this.assetCalculator = new AssetCalculator(this.regionalConfig);
    this.monteCarloSimulator = new MonteCarloSimulator(this.assetCalculator);
  }

  calculatePortfolioValue(assets: UnifiedAsset[]): number {
    return assets.reduce((total, asset) => {
      return total + this.assetCalculator.calculateAssetValue(asset);
    }, 0);
  }

  calculateAssetAllocation(assets: UnifiedAsset[]): { [key: string]: number } {
    const totalValue = this.calculatePortfolioValue(assets);
    if (totalValue === 0) return {};

    const allocation: { [key: string]: number } = {};
    
    assets.forEach(asset => {
      const value = this.assetCalculator.calculateAssetValue(asset);
      const percentage = (value / totalValue) * 100;
      allocation[asset.type] = (allocation[asset.type] || 0) + percentage;
    });

    return allocation;
  }

  calculatePortfolioProjections(
    assets: UnifiedAsset[],
    monthlyContribution: number,
    years: number,
    retirementGoal?: number
  ): ScenarioAnalysis {
    const baseCase = this.projectPortfolio(assets, monthlyContribution, years, 'base');
    const optimistic = this.projectPortfolio(assets, monthlyContribution, years, 'optimistic');
    const pessimistic = this.projectPortfolio(assets, monthlyContribution, years, 'pessimistic');
    const monteCarlo = this.monteCarloSimulator.runSimulation(
      assets,
      monthlyContribution,
      years,
      1000,
      retirementGoal
    );

    return {
      baseCase,
      optimistic,
      pessimistic,
      monteCarlo,
    };
  }

  private projectPortfolio(
    assets: UnifiedAsset[],
    monthlyContribution: number,
    years: number,
    scenario: 'base' | 'optimistic' | 'pessimistic'
  ): PortfolioProjection[] {
    const projections: PortfolioProjection[] = [];
    const currentValue = this.calculatePortfolioValue(assets);
    
    const returnMultipliers = {
      base: 1.0,
      optimistic: 1.3,
      pessimistic: 0.7,
    };

    let portfolioValue = currentValue;
    let totalContributions = currentValue;

    for (let year = 0; year <= years; year++) {
      if (year > 0) {
        // Apply growth to each asset
        const assetBreakdown: { [assetType: string]: number } = {};
        let yearlyGrowth = 0;

        assets.forEach(asset => {
          const assetValue = this.assetCalculator.calculateAssetValue(asset);
          const expectedReturn = this.assetCalculator.calculateExpectedReturn(asset);
          const adjustedReturn = expectedReturn * returnMultipliers[scenario];
          const growth = assetValue * adjustedReturn;
          
          yearlyGrowth += growth;
          assetBreakdown[asset.type] = (assetBreakdown[asset.type] || 0) + assetValue + growth;
        });

        // Add monthly contributions
        const yearlyContributions = monthlyContribution * 12;
        portfolioValue += yearlyGrowth + yearlyContributions;
        totalContributions += yearlyContributions;

        // Calculate taxes
        const taxes = this.regionalRules.calculateTax(
          yearlyGrowth,
          this.regionalConfig.region,
          'capital'
        );

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
        assets.forEach(asset => {
          const value = this.assetCalculator.calculateAssetValue(asset);
          assetBreakdown[asset.type] = (assetBreakdown[asset.type] || 0) + value;
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

  calculateWhatIfScenario(
    assets: UnifiedAsset[],
    changes: {
      monthlyContribution?: number;
      retirementAge?: number;
      riskProfile?: 'conservative' | 'balanced' | 'aggressive';
      additionalInvestment?: number;
    },
    currentAge: number = 30
  ): { current: PortfolioProjection[]; whatIf: PortfolioProjection[] } {
    const baseYears = 30;
    const current = this.projectPortfolio(assets, 500, baseYears, 'base');
    
    // Apply changes for what-if scenario
    const newContribution = changes.monthlyContribution || 500;
    const projectionYears = changes.retirementAge ? changes.retirementAge - currentAge : baseYears;
    
    let modifiedAssets = [...assets];
    
    // Add additional investment if specified
    if (changes.additionalInvestment && changes.additionalInvestment > 0) {
      modifiedAssets.push({
        id: 'additional-investment',
        type: 'cash',
        name: 'Additional Investment',
        quantity: 1,
        purchasePrice: changes.additionalInvestment,
        currentPrice: changes.additionalInvestment,
        value: changes.additionalInvestment,
        currency: this.regionalConfig.currency,
        region: this.regionalConfig.region,
        purchaseDate: new Date().toISOString().split('T')[0],
        expectedReturn: 0.025,
        volatility: 0.01,
        metadata: {},
      });
    }
    
    const whatIf = this.projectPortfolio(modifiedAssets, newContribution, projectionYears, 'base');
    
    return { current, whatIf };
  }

  getDiversificationScore(assets: UnifiedAsset[]): number {
    return this.assetCalculator.calculateDiversificationScore(assets);
  }

  getRiskScore(assets: UnifiedAsset[]): number {
    return this.assetCalculator.calculateRiskScore(assets);
  }

  getRegionalConfig(): RegionalConfig {
    return this.regionalConfig;
  }
}

// Export singleton instance
export const portfolioEngine = new PortfolioEngine('AU');
export const calculationEngine = portfolioEngine;