import { RegionalConfig } from '../../../types/portfolioTypes';

export class RegionalRulesEngine {
  private configs: Map<string, RegionalConfig> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // Australia
    this.configs.set('AU', {
      region: 'AU',
      currency: 'AUD',
      superContributionCap: 27500,
      taxRates: {
        income: [0, 0.19, 0.325, 0.37, 0.45],
        capital: 0.15,
        super: 0.15,
      },
      inflationRate: 0.025,
      riskFreeRate: 0.035,
    });

    // India
    this.configs.set('IN', {
      region: 'IN',
      currency: 'INR',
      taxRates: {
        income: [0, 0.05, 0.20, 0.30],
        capital: 0.20,
      },
      inflationRate: 0.04,
      riskFreeRate: 0.065,
    });

    // United States
    this.configs.set('US', {
      region: 'US',
      currency: 'USD',
      taxRates: {
        income: [0, 0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37],
        capital: 0.15,
      },
      inflationRate: 0.023,
      riskFreeRate: 0.045,
    });
  }

  getConfig(region: string): RegionalConfig {
    const config = this.configs.get(region);
    if (!config) {
      throw new Error(`Regional configuration not found for: ${region}`);
    }
    return config;
  }

  calculateTax(
    income: number,
    region: string,
    taxType: 'income' | 'capital' | 'super' = 'income'
  ): number {
    const config = this.getConfig(region);
    
    if (taxType === 'capital') {
      return income * config.taxRates.capital;
    }
    
    if (taxType === 'super' && config.taxRates.super) {
      return income * config.taxRates.super;
    }

    // Progressive income tax calculation
    const brackets = config.taxRates.income;
    let tax = 0;
    let remainingIncome = income;

    // Simplified progressive tax (would need actual brackets for real implementation)
    for (let i = 0; i < brackets.length && remainingIncome > 0; i++) {
      const rate = brackets[i];
      const taxableAmount = Math.min(remainingIncome, 50000); // Simplified bracket
      tax += taxableAmount * rate;
      remainingIncome -= taxableAmount;
    }

    return tax;
  }

  getContributionLimits(region: string): { concessional: number; nonConcessional: number } {
    const config = this.getConfig(region);
    
    switch (region) {
      case 'AU':
        return {
          concessional: config.superContributionCap || 27500,
          nonConcessional: 110000,
        };
      case 'IN':
        return {
          concessional: 150000, // Section 80C limit
          nonConcessional: Infinity, // No specific limit
        };
      case 'US':
        return {
          concessional: 22500, // 401k limit
          nonConcessional: 6000, // IRA limit
        };
      default:
        return { concessional: 0, nonConcessional: 0 };
    }
  }

  validateAssetForRegion(asset: UnifiedAsset, userRegion: string): boolean {
    // Check if asset is available in user's region
    if (asset.region === 'GLOBAL') return true;
    if (asset.region === userRegion) return true;
    
    // Cross-border investment rules
    if (userRegion === 'AU' && asset.region === 'US') return true;
    if (userRegion === 'IN' && asset.region === 'US') return true;
    
    return false;
  }

  calculateCurrencyImpact(
    asset: UnifiedAsset,
    userCurrency: string,
    exchangeRate: number = 1
  ): number {
    if (asset.currency === userCurrency) return 1;
    return exchangeRate;
  }
}