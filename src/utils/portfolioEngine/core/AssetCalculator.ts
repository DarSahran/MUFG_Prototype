import { UnifiedAsset, RegionalConfig } from '../../../types/portfolioTypes';

export class AssetCalculator {
  private regionalConfig: RegionalConfig;

  constructor(regionalConfig: RegionalConfig) {
    this.regionalConfig = regionalConfig;
  }

  calculateAssetValue(asset: UnifiedAsset): number {
    return asset.quantity * asset.currentPrice;
  }

  calculateAssetGain(asset: UnifiedAsset): { gain: number; gainPercent: number } {
    const currentValue = this.calculateAssetValue(asset);
    const purchaseValue = asset.quantity * asset.purchasePrice;
    const gain = currentValue - purchaseValue;
    const gainPercent = purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0;
    
    return { gain, gainPercent };
  }

  calculateExpectedReturn(asset: UnifiedAsset): number {
    const baseReturns = {
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

    let expectedReturn = baseReturns[asset.type] || 0.06;

    // Adjust for region
    if (asset.region === 'IN' && asset.type === 'fd') {
      expectedReturn = 0.065; // Higher FD rates in India
    }
    if (asset.region === 'IN' && asset.type === 'ppf') {
      expectedReturn = 0.071; // Current PPF rate
    }

    // Adjust for currency
    if (asset.currency === 'USD' && this.regionalConfig.currency !== 'USD') {
      expectedReturn += 0.005; // Currency risk premium
    }

    return expectedReturn;
  }

  calculateVolatility(asset: UnifiedAsset): number {
    const baseVolatilities = {
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

    return baseVolatilities[asset.type] || 0.15;
  }

  projectAssetGrowth(
    asset: UnifiedAsset, 
    years: number, 
    additionalContributions: number = 0
  ): number[] {
    const projections: number[] = [];
    const expectedReturn = this.calculateExpectedReturn(asset);
    let value = this.calculateAssetValue(asset);

    for (let year = 0; year <= years; year++) {
      if (year > 0) {
        value = value * (1 + expectedReturn) + additionalContributions;
      }
      projections.push(Math.round(value));
    }

    return projections;
  }

  calculateTaxImpact(asset: UnifiedAsset, gain: number): number {
    // Simplified tax calculation
    if (asset.type === 'super') {
      return gain * (this.regionalConfig.taxRates.super || 0.15);
    }
    
    // Capital gains tax for other assets
    return gain * this.regionalConfig.taxRates.capital;
  }

  calculateDiversificationScore(assets: UnifiedAsset[]): number {
    if (assets.length === 0) return 0;

    const typeCount = new Set(assets.map(a => a.type)).size;
    const regionCount = new Set(assets.map(a => a.region)).size;
    const currencyCount = new Set(assets.map(a => a.currency)).size;

    // Score based on diversification across types, regions, and currencies
    const maxScore = 100;
    const typeScore = Math.min(typeCount * 15, 60); // Max 60 for types
    const regionScore = Math.min(regionCount * 10, 25); // Max 25 for regions
    const currencyScore = Math.min(currencyCount * 5, 15); // Max 15 for currencies

    return Math.min(typeScore + regionScore + currencyScore, maxScore);
  }

  calculateRiskScore(assets: UnifiedAsset[]): number {
    if (assets.length === 0) return 0;

    const totalValue = assets.reduce((sum, asset) => sum + this.calculateAssetValue(asset), 0);
    
    const weightedRisk = assets.reduce((sum, asset) => {
      const weight = this.calculateAssetValue(asset) / totalValue;
      const volatility = this.calculateVolatility(asset);
      return sum + (weight * volatility);
    }, 0);

    return Math.round(weightedRisk * 100); // Convert to percentage
  }
}