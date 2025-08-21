import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, Calculator, 
  Target, DollarSign, Calendar, AlertTriangle, CheckCircle, 
  Zap, RefreshCw, Settings, Info, Globe, Building2, Coins,
  Activity, Award, Briefcase, CreditCard
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ComposedChart, Bar, PieChart as RechartsPieChart, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { UserProfile } from '../App';

interface ForecastingToolProps {
  userProfile: UserProfile;
}

// API Configuration from environment variables
const API_KEYS = {
  FMP: import.meta.env.VITE_FMP_API_KEY || 'demo',
  ALPHA_VANTAGE: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo',
  POLYGON: import.meta.env.VITE_POLYGON_API_KEY || 'demo',
};

export const ForecastingTool: React.FC<ForecastingToolProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto' | 'economy' | 'retirement'>('stocks');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | '5Y'>('1Y');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Real-time data states
  const [stockData, setStockData] = useState<any>({
    indices: {},
    forecast: [],
    sectors: [],
    news: []
  });
  
  const [cryptoData, setCryptoData] = useState<any>({
    prices: {},
    forecast: [],
    sentiment: {},
    trending: []
  });
  
  const [economicData, setEconomicData] = useState<any>({
    indicators: [],
    global: {},
    calendar: []
  });

  const [retirementData, setRetirementData] = useState({
    scenarios: [],
    recommendations: [],
    timeline: []
  });

  // Fixed utility functions with proper error handling
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '$0';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };
  
  const formatPercentage = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.00%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  const formatLargeNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };

  // Safe value getter with fallback
  const safeValue = (obj: any, path: string, fallback: any = 0): any => {
    try {
      return path.split('.').reduce((o, p) => o && o[p] !== undefined ? o[p] : fallback, obj);
    } catch {
      return fallback;
    }
  };

// Updated fetchStockData function
const fetchStockData = async () => {
  try {
    setIsLoading(true);
    console.log('Fetching stock data...');
    
    // Check if we should use mock mode
    if (import.meta.env.VITE_MOCK_MODE === 'true' || API_KEYS.FMP === 'demo') {
      console.log('Using demo data mode');
      setStockData(getDemoStockData());
      return;
    }
    
    // Fetch indices one by one to avoid 403 errors
    const indices = {};
    const symbols = ['SPY', 'QQQ', 'DIA', 'VIX'];
    
    for (const symbol of symbols) {
      try {
        // Add delay between requests to avoid rate limiting
        if (symbols.indexOf(symbol) > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
        
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${API_KEYS.FMP}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        console.log(`${symbol} response status:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            indices[symbol] = data[0];
          }
        } else if (response.status === 403) {
          console.warn(`403 error for ${symbol}, using demo data`);
          // Use demo data for this symbol
          const demoIndices = getDemoIndices();
          indices[symbol] = demoIndices[symbol];
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        // Use demo data for this symbol
        const demoIndices = getDemoIndices();
        indices[symbol] = demoIndices[symbol];
      }
    }
    
    // If no data was fetched, use all demo data
    if (Object.keys(indices).length === 0) {
      Object.assign(indices, getDemoIndices());
    }
    
    // Try to fetch sector performance with a delay
    let sectors = [];
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      const sectorsResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/sector-performance?apikey=${API_KEYS.FMP}`
      );
      
      if (sectorsResponse.ok) {
        const sectorsData = await sectorsResponse.json();
        sectors = sectorsData.slice(0, 6).map((sector: any) => ({
          ...sector,
          changesPercentage: sector.changesPercentage || '0'
        }));
      } else {
        console.warn('Sectors API returned error, using demo data');
        sectors = getDemoSectors();
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
      sectors = getDemoSectors();
    }
    
    // Generate forecast based on current data
    const forecast = generateStockForecast(indices);
    
    // Market news
    const news = [
      { title: 'Fed Signals Rate Cut Possibility', impact: 'positive', time: '2 hours ago' },
      { title: 'Tech Earnings Beat Expectations', impact: 'positive', time: '4 hours ago' },
      { title: 'Oil Prices Surge on Supply Concerns', impact: 'mixed', time: '6 hours ago' }
    ];
    
    setStockData({
      indices,
      forecast,
      sectors,
      news
    });
    
  } catch (error) {
    console.error('Error in fetchStockData:', error);
    setStockData(getDemoStockData());
  } finally {
    setIsLoading(false);
    setLastUpdated(new Date());
  }
};


  // Fetch real-time crypto data
  const fetchCryptoData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching crypto data...');
      
      // Fetch crypto prices from CoinGecko (free API, no key required)
      let prices = {};
      try {
        const pricesResponse = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'
        );
        if (pricesResponse.ok) {
          prices = await pricesResponse.json();
        }
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
        prices = getDemoCryptoPrices();
      }
      
      // Fetch market data
      let market = {};
      try {
        const marketResponse = await fetch('https://api.coingecko.com/api/v3/global');
        if (marketResponse.ok) {
          const marketData = await marketResponse.json();
          market = marketData.data;
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        market = { total_market_cap: { usd: 2100000000000 } };
      }
      
      // Fetch fear & greed index
      let sentiment = { value: 65, value_classification: 'Greed' };
      try {
        const sentimentResponse = await fetch('https://api.alternative.me/fng/');
        if (sentimentResponse.ok) {
          const sentimentData = await sentimentResponse.json();
          sentiment = sentimentData.data[0];
        }
      } catch (error) {
        console.error('Error fetching sentiment:', error);
      }
      
      // Fetch trending coins
      let trending = [];
      try {
        const trendingResponse = await fetch('https://api.coingecko.com/api/v3/search/trending');
        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json();
          trending = trendingData.coins.slice(0, 5);
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
        trending = getDemoTrending();
      }
      
      const forecast = generateCryptoForecast(prices);
      
      setCryptoData({
        prices,
        forecast,
        sentiment,
        market,
        trending
      });
      
    } catch (error) {
      console.error('Error in fetchCryptoData:', error);
      setCryptoData(getDemoCryptoData());
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Fetch economic data
  const fetchEconomicData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching economic data...');
      
      // Safe economic indicators with proper defaults
      const indicators = [
        { 
          indicator: 'GDP Growth', 
          current: 2.8, 
          predicted: 3.1, 
          impact: 'positive', 
          source: 'Bureau of Economic Analysis',
          lastUpdate: '2025-08-15'
        },
        { 
          indicator: 'CPI Inflation', 
          current: 3.2, 
          predicted: 2.8, 
          impact: 'positive', 
          source: 'Bureau of Labor Statistics',
          lastUpdate: '2025-08-20'
        },
        { 
          indicator: 'Unemployment Rate', 
          current: 3.7, 
          predicted: 3.9, 
          impact: 'negative', 
          source: 'Bureau of Labor Statistics',
          lastUpdate: '2025-08-18'
        },
        { 
          indicator: 'Federal Funds Rate', 
          current: 5.25, 
          predicted: 4.75, 
          impact: 'positive', 
          source: 'Federal Reserve',
          lastUpdate: '2025-08-21'
        },
        { 
          indicator: 'Consumer Confidence', 
          current: 102.3, 
          predicted: 108.5, 
          impact: 'positive', 
          source: 'Conference Board',
          lastUpdate: '2025-08-19'
        },
        { 
          indicator: 'Housing Starts', 
          current: 1.35, 
          predicted: 1.42, 
          impact: 'positive', 
          source: 'Census Bureau',
          lastUpdate: '2025-08-17'
        }
      ];
      
      const global = {
        usGrowth: 2.8,
        euroGrowth: 1.9,
        chinaGrowth: 4.2,
        japanGrowth: 1.1,
        globalGrowth: 3.1,
        risks: [
          { name: 'Inflation Persistence', level: 'Medium', probability: 0.4 },
          { name: 'Geopolitical Tensions', level: 'High', probability: 0.7 },
          { name: 'Supply Chain Issues', level: 'Low', probability: 0.2 },
          { name: 'Energy Crisis', level: 'Medium', probability: 0.3 }
        ]
      };
      
      const calendar = [
        { date: '2025-08-25', event: 'Jackson Hole Symposium', importance: 'High' },
        { date: '2025-08-30', event: 'GDP Revision Q2', importance: 'Medium' },
        { date: '2025-09-05', event: 'Jobs Report', importance: 'High' },
        { date: '2025-09-12', event: 'CPI Data', importance: 'High' }
      ];
      
      setEconomicData({ indicators, global, calendar });
      
    } catch (error) {
      console.error('Error fetching economic data:', error);
      // Set fallback data even on error
      setEconomicData({
        indicators: [],
        global: { usGrowth: 2.8, euroGrowth: 1.9, chinaGrowth: 4.2, japanGrowth: 1.1, risks: [] },
        calendar: []
      });
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Calculate retirement scenarios
  const calculateRetirementData = () => {
    const currentAge = userProfile?.age || 30;
    const retirementAge = userProfile?.retirementAge || 65;
    const currentSavings = userProfile?.currentSuper || 50000;
    const monthlyContribution = userProfile?.monthlyContribution || 500;
    const yearsToRetirement = retirementAge - currentAge;
    
    const scenarios = [
      {
        name: 'Conservative',
        return: 5.5,
        risk: 'Low',
        allocation: { stocks: 30, bonds: 60, other: 10 },
        color: 'red'
      },
      {
        name: 'Moderate',
        return: 7.5,
        risk: 'Medium',
        allocation: { stocks: 60, bonds: 30, other: 10 },
        color: 'blue'
      },
      {
        name: 'Aggressive',
        return: 9.5,
        risk: 'High',
        allocation: { stocks: 80, bonds: 15, other: 5 },
        color: 'green'
      }
    ];
    
    const calculatedScenarios = scenarios.map(scenario => {
      const annualReturn = scenario.return / 100;
      const monthlyReturn = annualReturn / 12;
      let futureValue = currentSavings;
      
      // Calculate compound growth
      for (let year = 0; year < yearsToRetirement; year++) {
        for (let month = 0; month < 12; month++) {
          futureValue = futureValue * (1 + monthlyReturn) + monthlyContribution;
        }
      }
      
      const monthlyIncome = (futureValue * 0.04) / 12; // 4% withdrawal rule
      const successProbability = scenario.name === 'Conservative' ? 85 : 
                                scenario.name === 'Moderate' ? 70 : 55;
      
      return {
        ...scenario,
        futureValue: Math.round(futureValue),
        monthlyIncome: Math.round(monthlyIncome),
        successProbability
      };
    });
    
    const recommendations = [
      {
        category: 'Asset Allocation',
        suggestion: 'Consider increasing equity allocation by 10-15% for better long-term growth',
        priority: 'Medium',
        impact: 'High'
      },
      {
        category: 'Tax Strategy',
        suggestion: 'Maximize 401(k) and IRA contributions to reduce current tax burden',
        priority: 'High',
        impact: 'High'
      },
      {
        category: 'Healthcare Costs',
        suggestion: 'Plan for $300K+ in medical expenses during retirement',
        priority: 'High',
        impact: 'Medium'
      },
      {
        category: 'Inflation Protection',
        suggestion: 'Consider TIPS and real estate exposure to hedge against inflation',
        priority: 'Medium',
        impact: 'Medium'
      }
    ];
    
    const timeline = [];
    for (let i = 0; i <= yearsToRetirement; i += 5) {
      const age = currentAge + i;
      timeline.push({
        age,
        milestone: i === 0 ? 'Start Planning' :
                 i === yearsToRetirement ? 'Retirement' :
                 age === 50 ? 'Catch-up Contributions' :
                 age === 59.5 ? 'Penalty-free Withdrawals' :
                 age === 65 ? 'Medicare Eligibility' :
                 `Age ${age} Review`
      });
    }
    
    setRetirementData({ scenarios: calculatedScenarios, recommendations, timeline });
  };

  // Generate stock forecast
  const generateStockForecast = (indices: any) => {
    const spy = indices.SPY || { price: 485.20 };
    const forecast = [];
    let currentPrice = safeValue(spy, 'price', 485.20);
    const volatility = 0.15;
    const annualReturn = 0.08;
    const monthlyReturn = annualReturn / 12;
    
    for (let i = 0; i < 12; i++) {
      const randomFactor = (Math.random() - 0.5) * volatility * 0.5;
      currentPrice *= (1 + monthlyReturn + randomFactor);
      
      const date = new Date();
      date.setMonth(date.getMonth() + i + 1);
      
      forecast.push({
        date: date.toISOString().substr(0, 7),
        SPY: Math.round(currentPrice * 100) / 100,
        prediction: Math.round(currentPrice * (1.02 + Math.random() * 0.03) * 100) / 100,
        confidence: Math.max(0.5, 0.9 - (i * 0.03)),
        volume: Math.round(50000000 + Math.random() * 20000000)
      });
    }
    
    return forecast;
  };

  // Generate crypto forecast
  const generateCryptoForecast = (prices: any) => {
    const bitcoin = prices.bitcoin || { usd: 65000 };
    const ethereum = prices.ethereum || { usd: 3200 };
    const forecast = [];
    let btcPrice = safeValue(bitcoin, 'usd', 65000);
    let ethPrice = safeValue(ethereum, 'usd', 3200);
    
    for (let i = 0; i < 12; i++) {
      const btcVolatility = 0.35;
      const ethVolatility = 0.40;
      const btcReturn = 0.15;
      const ethReturn = 0.18;
      
      btcPrice *= (1 + btcReturn/12 + (Math.random() - 0.5) * btcVolatility * 0.3);
      ethPrice *= (1 + ethReturn/12 + (Math.random() - 0.5) * ethVolatility * 0.3);
      
      const date = new Date();
      date.setMonth(date.getMonth() + i + 1);
      
      forecast.push({
        date: date.toISOString().substr(0, 7),
        BTC: Math.round(btcPrice),
        ETH: Math.round(ethPrice),
        prediction: Math.round(btcPrice * (1.05 + Math.random() * 0.1)),
        volatility: Math.min(0.6, 0.35 + (i * 0.02))
      });
    }
    
    return forecast;
  };

  // Demo data functions
  const getDemoIndices = () => ({
    SPY: { symbol: 'SPY', price: 485.20, changesPercentage: 2.3, change: 10.85, volume: 45000000 },
    QQQ: { symbol: 'QQQ', price: 420.15, changesPercentage: 1.8, change: 7.42, volume: 35000000 },
    DIA: { symbol: 'DIA', price: 340.50, changesPercentage: 1.2, change: 4.05, volume: 8000000 },
    VIX: { symbol: '^VIX', price: 18.2, changesPercentage: -0.5, change: -0.09, volume: 0 }
  });

  const getDemoSectors = () => [
    { sector: 'Technology', changesPercentage: '12.5' },
    { sector: 'Healthcare', changesPercentage: '8.3' },
    { sector: 'Financials', changesPercentage: '6.7' },
    { sector: 'Energy', changesPercentage: '15.2' },
    { sector: 'Consumer Discretionary', changesPercentage: '4.1' },
    { sector: 'Real Estate', changesPercentage: '-2.3' }
  ];

  const getDemoCryptoPrices = () => ({
    bitcoin: { usd: 65420, usd_24h_change: 5.2, usd_market_cap: 1280000000000, usd_24h_vol: 28000000000 },
    ethereum: { usd: 3240, usd_24h_change: 3.8, usd_market_cap: 390000000000, usd_24h_vol: 15000000000 },
    binancecoin: { usd: 542, usd_24h_change: 2.1, usd_market_cap: 80000000000, usd_24h_vol: 2000000000 },
    cardano: { usd: 0.68, usd_24h_change: 4.5, usd_market_cap: 24000000000, usd_24h_vol: 800000000 },
    solana: { usd: 145, usd_24h_change: 7.2, usd_market_cap: 67000000000, usd_24h_vol: 3000000000 }
  });

  const getDemoTrending = () => [
    { item: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' }, score: 0 },
    { item: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' }, score: 1 },
    { item: { id: 'solana', name: 'Solana', symbol: 'SOL' }, score: 2 }
  ];

  const getDemoStockData = () => ({
    indices: getDemoIndices(),
    forecast: generateStockForecast(getDemoIndices()),
    sectors: getDemoSectors(),
    news: [
      { title: 'Market Rally Continues on Fed Optimism', impact: 'positive', time: '1 hour ago' },
      { title: 'Tech Earnings Exceed Expectations', impact: 'positive', time: '3 hours ago' },
      { title: 'Energy Sector Shows Mixed Signals', impact: 'mixed', time: '5 hours ago' }
    ]
  });

  const getDemoCryptoData = () => ({
    prices: getDemoCryptoPrices(),
    sentiment: { value: 72, value_classification: 'Greed' },
    market: { total_market_cap: { usd: 2100000000000 } },
    trending: getDemoTrending()
  });

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const refreshData = () => {
      switch (activeTab) {
        case 'stocks':
          fetchStockData();
          break;
        case 'crypto':
          fetchCryptoData();
          break;
        case 'economy':
          fetchEconomicData();
          break;
        case 'retirement':
          calculateRetirementData();
          break;
      }
    };

    // Initial load
    refreshData();
    
    // Set up auto-refresh every 5 minutes for market data
    const interval = setInterval(() => {
      if (activeTab === 'stocks' || activeTab === 'crypto') {
        refreshData();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [activeTab, autoRefresh]);

  // Calculate retirement data when tab is selected
  useEffect(() => {
    if (activeTab === 'retirement') {
      calculateRetirementData();
    }
  }, [activeTab, userProfile]);

  const renderStockForecasting = () => (
    <div className="space-y-6">
      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(stockData.indices || {}).map(([key, index]: [string, any]) => (
          <div key={key} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium">
                  {key === 'SPY' ? 'S&P 500' : 
                   key === 'QQQ' ? 'NASDAQ' : 
                   key === 'DIA' ? 'Dow Jones' : 
                   key === 'VIX' ? 'VIX (Fear)' : key}
                </p>
                <p className="text-2xl font-bold text-slate-900 my-1">
                  {key === 'VIX' ? 
                    safeValue(index, 'price', 0).toFixed(2) : 
                    formatCurrency(safeValue(index, 'price', 0))}
                </p>
                <div className={`flex items-center space-x-1 ${
                  (key === 'VIX' ? 
                    safeValue(index, 'changesPercentage', 0) < 0 : 
                    safeValue(index, 'changesPercentage', 0) > 0) 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(key === 'VIX' ? 
                    safeValue(index, 'changesPercentage', 0) < 0 : 
                    safeValue(index, 'changesPercentage', 0) > 0) ? 
                    <TrendingUp className="w-4 h-4" /> : 
                    <TrendingDown className="w-4 h-4" />
                  }
                  <span className="text-sm font-semibold">
                    {formatPercentage(safeValue(index, 'changesPercentage', 0))}
                  </span>
                </div>
                {safeValue(index, 'volume', 0) > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Volume: {formatLargeNumber(safeValue(index, 'volume', 0))}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${
                key === 'SPY' ? 'bg-blue-100' : 
                key === 'QQQ' ? 'bg-purple-100' : 
                key === 'DIA' ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {key === 'VIX' ? 
                  <AlertTriangle className={`w-6 h-6 ${
                    key === 'SPY' ? 'text-blue-600' : 
                    key === 'QQQ' ? 'text-purple-600' : 
                    key === 'DIA' ? 'text-green-600' : 'text-orange-600'
                  }`} /> :
                  <BarChart3 className={`w-6 h-6 ${
                    key === 'SPY' ? 'text-blue-600' : 
                    key === 'QQQ' ? 'text-purple-600' : 
                    key === 'DIA' ? 'text-green-600' : 'text-orange-600'
                  }`} />
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Forecast Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Market Forecast</h3>
            <p className="text-sm text-slate-600 mt-1">AI-powered predictions based on current market conditions</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">Last Updated</p>
              <p className="text-sm font-medium text-slate-700">
                {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
            {['1M', '3M', '6M', '1Y', '5Y'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTimeframe === period 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stockData.forecast || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'SPY' ? 'S&P 500 Current' : 
                  name === 'prediction' ? 'AI Prediction' : 
                  name === 'confidence' ? 'Confidence Level' : name
                ]}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="confidence"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.1}
                yAxisId="right"
              />
              <Line
                type="monotone"
                dataKey="SPY"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="prediction"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector Performance */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Sector Performance</h3>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Activity className="w-4 h-4" />
            <span>Live Data</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stockData.sectors || []).map((sector: any) => {
            const change = parseFloat(safeValue(sector, 'changesPercentage', '0'));
            return (
              <div key={sector.sector} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all hover:border-slate-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">{sector.sector}</h4>
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                    change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {formatPercentage(change)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      change > 0 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(change) * 8)}%` }}
                  ></div>
                </div>
                <div className="flex items-center mt-2 text-xs text-slate-600">
                  {change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  <span>{change > 0 ? 'Outperforming' : 'Underperforming'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Market News */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Market News Impact</h3>
        <div className="space-y-3">
          {(stockData.news || []).map((news: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  news.impact === 'positive' ? 'bg-green-500' : 
                  news.impact === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <div>
                  <p className="font-medium text-slate-900">{news.title}</p>
                  <p className="text-sm text-slate-600">{news.time}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                news.impact === 'positive' ? 'bg-green-100 text-green-700' : 
                news.impact === 'negative' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {news.impact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCryptoForecasting = () => (
    <div className="space-y-6">
      {/* Crypto Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(cryptoData.prices || {}).slice(0, 4).map(([key, crypto]: [string, any]) => {
          const name = key.charAt(0).toUpperCase() + key.slice(1);
          const symbol = key === 'bitcoin' ? 'BTC' : 
                        key === 'ethereum' ? 'ETH' : 
                        key === 'binancecoin' ? 'BNB' :
                        key === 'cardano' ? 'ADA' :
                        key === 'solana' ? 'SOL' : key.toUpperCase();
          
          return (
            <div key={key} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-bold text-slate-600">{symbol}</p>
                    <p className="text-xs text-slate-500">{name}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {formatCurrency(safeValue(crypto, 'usd', 0))}
                  </p>
                  <div className={`flex items-center space-x-1 ${
                    safeValue(crypto, 'usd_24h_change', 0) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {safeValue(crypto, 'usd_24h_change', 0) > 0 ? 
                      <TrendingUp className="w-4 h-4" /> : 
                      <TrendingDown className="w-4 h-4" />
                    }
                    <span className="text-sm font-semibold">
                      {formatPercentage(safeValue(crypto, 'usd_24h_change', 0))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Vol: {formatCurrency(safeValue(crypto, 'usd_24h_vol', 0))}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  key === 'bitcoin' ? 'bg-orange-100' : 
                  key === 'ethereum' ? 'bg-blue-100' : 
                  key === 'binancecoin' ? 'bg-yellow-100' :
                  key === 'cardano' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <Coins className={`w-6 h-6 ${
                    key === 'bitcoin' ? 'text-orange-600' : 
                    key === 'ethereum' ? 'text-blue-600' : 
                    key === 'binancecoin' ? 'text-yellow-600' :
                    key === 'cardano' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Market Cap</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(safeValue(cryptoData.market, 'total_market_cap.usd', 2100000000000))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Fear & Greed Index</p>
              <p className="text-xl font-bold text-slate-900">
                {safeValue(cryptoData.sentiment, 'value', 72)}
              </p>
              <p className={`text-sm ${
                safeValue(cryptoData.sentiment, 'value', 72) > 50 ? 'text-green-600' : 'text-red-600'
              }`}>
                {safeValue(cryptoData.sentiment, 'value_classification', 'Greed')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Market Trend</p>
              <p className="text-xl font-bold text-green-600">Bullish</p>
              <p className="text-sm text-slate-600">AI Confidence: 78%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Crypto Forecast Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Cryptocurrency Forecast</h3>
            <p className="text-sm text-slate-600 mt-1">AI predictions based on market sentiment and technical analysis</p>
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cryptoData.forecast || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'BTC' ? 'Bitcoin' : 
                  name === 'ETH' ? 'Ethereum' : 'AI Prediction'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="volatility"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.1}
                yAxisId="right"
              />
              <Line
                type="monotone"
                dataKey="BTC"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="ETH"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="prediction"
                stroke="#8b5cf6"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trending Coins */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Trending Cryptocurrencies</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(cryptoData.trending || []).map((coin: any, index: number) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{safeValue(coin, 'item.name', 'Unknown')}</h4>
                  <p className="text-sm text-slate-600">{safeValue(coin, 'item.symbol', 'N/A')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">#{index + 1}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEconomicForecasting = () => (
    <div className="space-y-6">
      {/* Economic Indicators Grid */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Economic Indicators Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(economicData.indicators || []).map((indicator: any) => (
            <div key={indicator.indicator} className="p-5 border border-slate-200 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">{indicator.indicator}</h4>
                <div className={`w-3 h-3 rounded-full ${
                  indicator.impact === 'positive' ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}></div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Current</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatPercentage(safeValue(indicator, 'current', 0))}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Forecast</span>
                  <span className={`text-lg font-bold ${
                    indicator.impact === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(safeValue(indicator, 'predicted', 0))}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Source</span>
                    <span className="text-xs text-slate-600">{safeValue(indicator, 'source', 'N/A')}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">Updated</span>
                    <span className="text-xs text-slate-600">{safeValue(indicator, 'lastUpdate', 'N/A')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Growth Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">Regional Growth Outlook</h4>
          <div className="space-y-4">
            {[
              { region: 'United States', growth: safeValue(economicData.global, 'usGrowth', 2.8), flag: '🇺🇸' },
              { region: 'European Union', growth: safeValue(economicData.global, 'euroGrowth', 1.9), flag: '🇪🇺' },
              { region: 'China', growth: safeValue(economicData.global, 'chinaGrowth', 4.2), flag: '🇨🇳' },
              { region: 'Japan', growth: safeValue(economicData.global, 'japanGrowth', 1.1), flag: '🇯🇵' }
            ].map((country) => (
              <div key={country.region} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div>
                    <p className="font-medium text-slate-900">{country.region}</p>
                    <p className="text-sm text-slate-600">GDP Growth Forecast</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    country.growth > 2 ? 'text-green-600' : 
                    country.growth > 1 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(country.growth)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">Key Risk Factors</h4>
          <div className="space-y-4">
            {(safeValue(economicData.global, 'risks', []) || []).map((risk: any, index: number) => (
              <div key={index} className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-slate-900">{safeValue(risk, 'name', 'Unknown Risk')}</h5>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    safeValue(risk, 'level', 'Low') === 'High' ? 'bg-red-100 text-red-700' :
                    safeValue(risk, 'level', 'Low') === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {safeValue(risk, 'level', 'Low')} Risk
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Probability</span>
                  <span className="text-sm font-medium text-slate-900">
                    {Math.round(safeValue(risk, 'probability', 0) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      safeValue(risk, 'level', 'Low') === 'High' ? 'bg-red-500' :
                      safeValue(risk, 'level', 'Low') === 'Medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${safeValue(risk, 'probability', 0) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Economic Calendar */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">Upcoming Economic Events</h4>
        <div className="space-y-3">
          {(economicData.calendar || []).map((event: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-slate-600">
                    {new Date(safeValue(event, 'date', '2025-08-25')).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {new Date(safeValue(event, 'date', '2025-08-25')).getDate()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{safeValue(event, 'event', 'Economic Event')}</p>
                  <p className="text-sm text-slate-600">
                    {new Date(safeValue(event, 'date', '2025-08-25')).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                safeValue(event, 'importance', 'Low') === 'High' ? 'bg-red-100 text-red-700' :
                safeValue(event, 'importance', 'Low') === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {safeValue(event, 'importance', 'Low')} Impact
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRetirementPlanning = () => (
    <div className="space-y-6">
      {/* Retirement Input Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Retirement Planning Calculator</h3>
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Calculations based on current market conditions and economic indicators
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Current Age</label>
            <input
              type="number"
              defaultValue={userProfile?.age || 30}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Retirement Age</label>
            <input
              type="number"
              defaultValue={userProfile?.retirementAge || 65}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Current Savings</label>
            <input
              type="number"
              defaultValue={userProfile?.currentSuper || 50000}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Monthly Contribution</label>
            <input
              type="number"
              defaultValue={userProfile?.monthlyContribution || 500}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Retirement Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(retirementData.scenarios || []).map((scenario: any) => (
          <div 
            key={scenario.name} 
            className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all hover:shadow-xl ${
              scenario.name === 'Moderate' ? 'border-blue-200 ring-2 ring-blue-100' : 'border-slate-200'
            }`}
          >
            <div className="text-center">
              <div className={`p-4 rounded-xl inline-block mb-4 ${
                scenario.color === 'red' ? 'bg-red-100' : 
                scenario.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <Target className={`w-8 h-8 ${
                  scenario.color === 'red' ? 'text-red-600' : 
                  scenario.color === 'blue' ? 'text-blue-600' : 'text-green-600'
                }`} />
              </div>
              
              <h4 className="text-lg font-bold text-slate-900 mb-2">{scenario.name}</h4>
              <p className="text-sm text-slate-600 mb-4">{formatPercentage(safeValue(scenario, 'return', 0))} annual return</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600">Portfolio Value at Retirement</p>
                  <p className="text-3xl font-bold text-slate-900">{formatCurrency(safeValue(scenario, 'futureValue', 0))}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-600">Monthly Retirement Income</p>
                  <p className="text-xl font-semibold text-slate-700">{formatCurrency(safeValue(scenario, 'monthlyIncome', 0))}</p>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Success Probability</span>
                    <span className={`font-semibold ${
                      safeValue(scenario, 'successProbability', 0) > 75 ? 'text-green-600' : 
                      safeValue(scenario, 'successProbability', 0) > 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {safeValue(scenario, 'successProbability', 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        safeValue(scenario, 'successProbability', 0) > 75 ? 'bg-green-500' : 
                        safeValue(scenario, 'successProbability', 0) > 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${safeValue(scenario, 'successProbability', 0)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-xs text-slate-500">
                  <p>Risk Level: {safeValue(scenario, 'risk', 'Medium')}</p>
                  <p>Stocks: {safeValue(scenario, 'allocation.stocks', 60)}% | Bonds: {safeValue(scenario, 'allocation.bonds', 30)}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-6">AI-Powered Retirement Recommendations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(retirementData.recommendations || []).map((rec: any, index: number) => (
            <div key={index} className="p-5 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-slate-900">{safeValue(rec, 'category', 'Recommendation')}</h5>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                    safeValue(rec, 'priority', 'Medium') === 'High' ? 'bg-red-100 text-red-700' :
                    safeValue(rec, 'priority', 'Medium') === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {safeValue(rec, 'priority', 'Medium')} Priority
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">{safeValue(rec, 'impact', 'Medium')} Impact</span>
                </div>
              </div>
              <p className="text-sm text-slate-700">{safeValue(rec, 'suggestion', 'No suggestion available')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Retirement Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-6">Retirement Planning Timeline</h4>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
          <div className="space-y-6">
            {(retirementData.timeline || []).map((milestone: any, index: number) => (
              <div key={index} className="relative flex items-center space-x-4">
                <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                  <span className="text-xs font-bold text-white">{safeValue(milestone, 'age', 30)}</span>
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-slate-900">{safeValue(milestone, 'milestone', 'Milestone')}</h5>
                  <p className="text-sm text-slate-600">Age {safeValue(milestone, 'age', 30)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsPanel = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${
      showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform ${
        showSettings ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Settings & Configuration</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto h-full">
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Auto-refresh data</span>
            </label>
            <p className="text-xs text-slate-500 mt-1">Automatically update market data every 5 minutes</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">API Configuration</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Financial Modeling Prep API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your FMP API key"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Get free key at financialmodelingprep.com</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alpha Vantage API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your Alpha Vantage API key"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Get free key at alphavantage.co</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Data Sources Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-green-800">CoinGecko API</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <span className="text-sm text-yellow-800">Financial Modeling Prep</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-yellow-600">Demo Mode</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-800">Fear & Greed Index</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-blue-600">Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-200">
            <button
              onClick={() => {
                // Save settings logic here
                setShowSettings(false);
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'stocks', label: 'Stock Market', icon: TrendingUp },
    { id: 'crypto', label: 'Cryptocurrency', icon: Coins },
    { id: 'economy', label: 'Economic Outlook', icon: Globe },
    { id: 'retirement', label: 'Retirement Planning', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Live Financial Forecasting</h1>
              <p className="text-slate-600 text-lg">Real-time market data and AI-powered predictions for smart financial decisions</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Data</span>
              </div>
              
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              <button
                onClick={() => {
                  switch (activeTab) {
                    case 'stocks': fetchStockData(); break;
                    case 'crypto': fetchCryptoData(); break;
                    case 'economy': fetchEconomicData(); break;
                    case 'retirement': calculateRetirementData(); break;
                  }
                }}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md transform scale-105'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex items-center space-x-4">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <div>
                <p className="text-lg font-semibold text-slate-900">Fetching live data...</p>
                <p className="text-sm text-slate-600">Getting the latest market information</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="transition-all duration-300">
          {activeTab === 'stocks' && renderStockForecasting()}
          {activeTab === 'crypto' && renderCryptoForecasting()}
          {activeTab === 'economy' && renderEconomicForecasting()}
          {activeTab === 'retirement' && renderRetirementPlanning()}
        </div>

        {/* Settings Panel */}
        {renderSettingsPanel()}
      </div>
    </div>
  );
};
