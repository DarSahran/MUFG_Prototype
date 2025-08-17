export interface AssetHolding {
  id: string;
  type: 'stock' | 'etf' | 'bond' | 'property' | 'crypto' | 'cash' | 'super' | 'fd' | 'ppf';
  symbol?: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currency: 'AUD' | 'USD' | 'INR';
  exchange?: string;
  purchaseDate: string;
  region: 'AU' | 'US' | 'IN' | 'GLOBAL';
  metadata?: {
    // Stock/ETF specific
    dividend?: number;
    dividendYield?: number;
    // Bond specific
    coupon?: number;
    maturity?: string;
    // Property specific
    location?: string;
    propertyType?: string;
    // FD/PPF specific
    bank?: string;
    interestRate?: number;
    maturityDate?: string;
    // Crypto specific
    exchangeName?: string;
    stakingRewards?: number;
  };
}

export interface PortfolioProjection {
  year: number;
  totalValue: number;
  assetBreakdown: { [assetType: string]: number };
  contributions: number;
  growth: number;
  inflation: number;
  taxes: number;
}

export interface MonteCarloResult {
  percentile10: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  mean: number;
  standardDeviation: number;
  probabilityOfSuccess: number; // Probability of reaching retirement goal
}

export interface RegionalConfig {
  region: 'AU' | 'IN';
  currency: 'AUD' | 'INR';
  superContributionCap?: number;
  taxRates: {
    income: number[];
    capital: number;
    super?: number;
  };
  inflationRate: number;
  riskFreeRate: number;
}

export interface ScenarioAnalysis {
  baseCase: PortfolioProjection[];
  optimistic: PortfolioProjection[];
  pessimistic: PortfolioProjection[];
  monteCarlo: MonteCarloResult[];
}