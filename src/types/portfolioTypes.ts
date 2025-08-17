export interface UnifiedAsset {
  id: string;
  type: 'stock' | 'super' | 'property' | 'fd' | 'crypto' | 'bond' | 'etf' | 'cash' | 'ppf';
  symbol?: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  value: number;
  currency: 'AUD' | 'INR' | 'USD';
  region: 'AU' | 'IN' | 'US' | 'GLOBAL';
  exchange?: string;
  purchaseDate: string;
  expectedReturn: number;
  volatility: number;
  metadata: Record<string, any>;
  lastUpdated?: string;
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
  probabilityOfSuccess: number;
}

export interface RegionalConfig {
  region: 'AU' | 'IN' | 'US';
  currency: 'AUD' | 'INR' | 'USD';
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

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  action: string;
  impact: string;
  priority: 'low' | 'medium' | 'high';
  category: 'allocation' | 'contribution' | 'tax' | 'risk';
}

export interface MarketDataPoint {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}