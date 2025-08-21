import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Clock, Activity, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

interface AssetHolding {
  id: string;
  symbol?: string;
  name: string;
  quantity: number;
  currentPrice: number;
  type: string;
}

interface AssetTrendChartProps {
  holdings: AssetHolding[];
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
}

// Custom API Response interface
interface CustomAPIResponse {
  source: string;
  symbol: string;
  currency: string;
  regularMarketPrice: number;
  open: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
}

// Real-time price service using your custom yfinance API
class CustomPriceService {
  private static instance: CustomPriceService;
  private priceCache = new Map<string, { price: number; timestamp: number; data: CustomAPIResponse }>();
  private subscribers = new Set<(prices: Map<string, number>) => void>();
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || 'https://mufg-hackathon-backend-q8zxhtuu6-darsahrans-projects.vercel.app';
  }

  static getInstance(baseURL?: string): CustomPriceService {
    if (!CustomPriceService.instance) {
      CustomPriceService.instance = new CustomPriceService(baseURL);
    }
    return CustomPriceService.instance;
  }

  subscribe(callback: (prices: Map<string, number>) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    const currentPrices = new Map<string, number>();
    this.priceCache.forEach((data, symbol) => {
      currentPrices.set(symbol, data.price);
    });
    this.subscribers.forEach(callback => callback(currentPrices));
  }

  async fetchLivePrice(symbol: string): Promise<number | null> {
    try {
      // Check cache first (valid for 30 seconds for real-time updates)
      const cached = this.priceCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < 30000) {
        return cached.price;
      }

      // console.log(`Fetching live price for ${symbol} from custom API`);
      
      const response = await fetch(
        `${this.baseURL}/api/quote?symbol=${encodeURIComponent(symbol)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CustomAPIResponse = await response.json();
      
      if (data && data.regularMarketPrice) {
        // console.log(`✅ Custom API price for ${symbol}: $${data.regularMarketPrice} ${data.currency}`);
        
        this.priceCache.set(symbol, { 
          price: data.regularMarketPrice, 
          timestamp: Date.now(),
          data
        });
        
        this.notifySubscribers();
        return data.regularMarketPrice;
      }

      // console.warn(`⚠️ No price data available for ${symbol}`);
      return null;
    } catch (error) {
      console.error(`❌ Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  async fetchHistoricalData(symbol: string, timeframe: string): Promise<any[]> {
    try {
      // console.log(`Fetching historical data for ${symbol} (${timeframe}) from custom API`);
      
      // For now, use current price to generate historical trend
      // You can extend your backend to provide historical data
      const currentPrice = await this.fetchLivePrice(symbol);
      
      if (!currentPrice) {
        return [];
      }

      return this.generateHistoricalFromCurrentPrice(symbol, currentPrice, timeframe);
    } catch (error) {
      // console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  private generateHistoricalFromCurrentPrice(symbol: string, currentPrice: number, timeframe: string): any[] {
    const days = this.getTimeframeDays(timeframe);
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get cached data for additional context
    const cached = this.priceCache.get(symbol);
    const previousClose = cached?.data?.previousClose || currentPrice;
    const dayHigh = cached?.data?.dayHigh || currentPrice;
    const dayLow = cached?.data?.dayLow || currentPrice;

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate realistic historical prices based on current market data
      const progress = i / days; // 0 to 1
      const volatility = this.getVolatilityForSymbol(symbol);
      
      // Create a trend that ends at current price
      const trendComponent = (currentPrice - previousClose) * progress;
      const randomComponent = (Math.random() - 0.5) * volatility * currentPrice;
      const cyclicalComponent = Math.sin(i / 5) * (dayHigh - dayLow) * 0.3;
      
      let price = previousClose + trendComponent + randomComponent + cyclicalComponent;
      
      // Ensure reasonable bounds
      price = Math.max(price, currentPrice * 0.8);
      price = Math.min(price, currentPrice * 1.2);
      
      // Last data point should be current price
      if (i === days) {
        price = currentPrice;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        formattedDate: date.toLocaleDateString('en-AU', {
          month: 'short',
          day: 'numeric'
        }),
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
    }

    return data;
  }

  private getVolatilityForSymbol(symbol: string): number {
    // Different volatility based on asset type
    if (symbol.endsWith('-USD')) return 0.05; // Crypto - higher volatility
    if (symbol.endsWith('.AX')) return 0.015; // ASX - moderate volatility
    return 0.02; // Default stocks
  }

  private getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '6M': return 180;
      case '1Y': return 365;
      default: return 30;
    }
  }

  // Get additional market data from cache
  getMarketData(symbol: string) {
    const cached = this.priceCache.get(symbol);
    return cached?.data || null;
  }
}

export const AssetTrendChart: React.FC<AssetTrendChartProps> = ({
  holdings,
  timeframe
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [isLoading, setIsLoading] = useState(true);
  const [livePrices, setLivePrices] = useState<Map<string, number>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketData, setMarketData] = useState<Map<string, any>>(new Map());

  const priceService = CustomPriceService.getInstance();

  // Subscribe to live price updates
  useEffect(() => {
    const unsubscribe = priceService.subscribe((prices) => {
      setLivePrices(new Map(prices));
      setLastUpdated(new Date());
      
      // Update market data
      const newMarketData = new Map<string, any>();
      prices.forEach((price, symbol) => {
        const data = priceService.getMarketData(symbol);
        if (data) {
          newMarketData.set(symbol, data);
        }
      });
      setMarketData(newMarketData);
    });

    return unsubscribe;
  }, [priceService]);

  // Fetch initial data and set up real-time updates
  useEffect(() => {
    fetchRealTimeData();
    
    // Set up interval for live price updates (every 30 seconds)
    const interval = setInterval(() => {
      updateLivePrices();
    }, 30000);

    return () => clearInterval(interval);
  }, [holdings, selectedTimeframe]);

  const fetchRealTimeData = async () => {
    setIsLoading(true);
    setConnectionStatus('loading');

    try {
      const displayHoldings = holdings.slice(0, 5);
      
      if (displayHoldings.length === 0) {
        setChartData([]);
        setConnectionStatus('error');
        setIsLoading(false);
        return;
      }

      // console.log('🚀 Fetching data for holdings:', displayHoldings.map(h => h.symbol || h.name));

      // Fetch historical data for each holding
      const historicalDataPromises = displayHoldings.map(async (holding) => {
        try {
          const symbol = holding.symbol || holding.name;
          const data = await priceService.fetchHistoricalData(symbol, selectedTimeframe);
          return { holding, data };
        } catch (error) {
          console.warn(`Failed to fetch historical data for ${holding.symbol || holding.name}:`, error);
          return { holding, data: [] };
        }
      });

      const results = await Promise.all(historicalDataPromises);
      
      // Also fetch current live prices
      const pricePromises = displayHoldings.map(holding => 
        priceService.fetchLivePrice(holding.symbol || holding.name)
      );
      const currentPrices = await Promise.all(pricePromises);
      
      // console.log('💰 Current prices:', currentPrices);
      
      // Generate chart data
      const chartData = generateChartData(results, currentPrices, displayHoldings);
      
      setChartData(chartData);
      setConnectionStatus('connected');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error fetching real-time data:', error);
      setConnectionStatus('error');
      
      // Fallback to simulated data
      const fallbackData = generateFallbackData();
      setChartData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLivePrices = useCallback(async () => {
    if (holdings.length === 0) return;

    try {
      const displayHoldings = holdings.slice(0, 5);
      const pricePromises = displayHoldings.map(holding => 
        priceService.fetchLivePrice(holding.symbol || holding.name)
      );

      await Promise.all(pricePromises);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error updating live prices:', error);
      setConnectionStatus('error');
    }
  }, [holdings, priceService]);

  const generateChartData = (results: any[], currentPrices: (number | null)[], displayHoldings: AssetHolding[]) => {
    // Find the result with the most historical data to use as time base
    const baseData = results.find(r => r.data.length > 0)?.data || [];
    
    if (baseData.length === 0) {
      // Generate synthetic data if no historical data available
      return generateSyntheticData(displayHoldings, currentPrices);
    }

    // Use historical data as base and create portfolio values
    return baseData.map((dataPoint: any, index: number) => {
      const chartPoint: any = {
        date: dataPoint.date,
        timestamp: dataPoint.timestamp,
        formattedDate: dataPoint.formattedDate
      };

      displayHoldings.forEach((holding, holdingIndex) => {
        const result = results[holdingIndex];
        const currentPrice = currentPrices[holdingIndex] || holding.currentPrice;
        
        let price: number;
        if (result.data.length > index && result.data[index]) {
          price = result.data[index].price;
        } else {
          // Interpolate missing data
          price = currentPrice;
        }
        
        chartPoint[holding.symbol || holding.name] = Math.round(holding.quantity * price);
      });

      return chartPoint;
    });
  };

  const generateSyntheticData = (displayHoldings: AssetHolding[], currentPrices: (number | null)[]) => {
    const days = priceService['getTimeframeDays'](selectedTimeframe);
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dataPoint: any = {
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        formattedDate: date.toLocaleDateString('en-AU', {
          month: 'short',
          day: 'numeric'
        })
      };

      displayHoldings.forEach((holding, index) => {
        const currentPrice = currentPrices[index] || holding.currentPrice;
        const baseValue = holding.quantity * currentPrice;
        
        const volatility = holding.type === 'crypto' ? 0.05 : 0.02;
        const daysFromEnd = days - i;
        const trend = Math.sin(daysFromEnd / 20) * 0.1;
        const randomWalk = (Math.random() - 0.5) * volatility;
        
        const historicalMultiplier = 1 + trend + randomWalk;
        const finalValue = baseValue * historicalMultiplier;
        
        dataPoint[holding.symbol || holding.name] = Math.round(Math.max(finalValue, baseValue * 0.7));
      });

      data.push(dataPoint);
    }

    return data;
  };

  const generateFallbackData = () => {
    const days = priceService['getTimeframeDays'](selectedTimeframe);
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dataPoint: any = {
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        formattedDate: date.toLocaleDateString('en-AU', {
          month: 'short',
          day: 'numeric'
        })
      };

      holdings.slice(0, 5).forEach((holding) => {
        const baseValue = holding.quantity * holding.currentPrice;
        const volatility = holding.type === 'crypto' ? 0.05 : 0.02;
        const trend = Math.sin(i / 20) * 0.15;
        const randomWalk = (Math.random() - 0.5) * volatility;
        const finalValue = baseValue * (1 + trend + randomWalk);
        
        dataPoint[holding.symbol || holding.name] = Math.round(Math.max(finalValue, baseValue * 0.7));
      });

      data.push(dataPoint);
    }

    return data;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRealTimeData();
    setIsRefreshing(false);
  };

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
  const displayHoldings = holdings.slice(0, 5);

  const calculatePerformance = () => {
    if (chartData.length < 2) return { bestPerformer: null, worstPerformer: null };
    
    const firstDay = chartData[0];
    const lastDay = chartData[chartData.length - 1];
    
    let bestPerformance = -Infinity;
    let worstPerformance = Infinity;
    let bestPerformer = null;
    let worstPerformer = null;
    
    displayHoldings.forEach((holding) => {
      const symbol = holding.symbol || holding.name;
      if (firstDay[symbol] && lastDay[symbol]) {
        const performance = ((lastDay[symbol] - firstDay[symbol]) / firstDay[symbol]) * 100;
        if (performance > bestPerformance) {
          bestPerformance = performance;
          bestPerformer = { ...holding, performance };
        }
        if (performance < worstPerformance) {
          worstPerformance = performance;
          worstPerformer = { ...holding, performance };
        }
      }
    });
    
    return { bestPerformer, worstPerformer };
  };

  const { bestPerformer, worstPerformer } = calculatePerformance();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">
            {new Date(label).toLocaleDateString('en-AU', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          {payload.map((entry: any, index: number) => {
            const holding = displayHoldings.find(h => (h.symbol || h.name) === entry.name);
            const livePrice = livePrices.get(entry.name);
            const currentValue = livePrice ? holding?.quantity * livePrice : entry.value;
            const market = marketData.get(entry.name);
            
            return (
              <div key={index} className="mb-2">
                <div className="flex items-center justify-between space-x-4 mb-1">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-600">{entry.name}</span>
                    {livePrice && (
                      <span className="text-xs bg-green-100 text-green-700 px-1 rounded">LIVE</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    ${(currentValue || entry.value).toLocaleString()}
                  </span>
                </div>
                {market && (
                  <div className="text-xs text-slate-500 ml-4">
                    Open: ${market.open} | High: ${market.dayHigh} | Low: ${market.dayLow}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-slate-100"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Real-Time Asset Performance</h3>
            <p className="text-sm text-slate-600">Live data via Custom yfinance API</p>
          </div>
        </div>
        
        {/* Status and Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Live</span>
              </div>
            ) : connectionStatus === 'loading' ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
            {(['1D', '1W', '1M', '3M', '6M', '1Y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  selectedTimeframe === period
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Live Price Summary */}
      {livePrices.size > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayHoldings.map((holding) => {
              const livePrice = livePrices.get(holding.symbol || holding.name);
              const market = marketData.get(holding.symbol || holding.name);
              const change = livePrice && market ? ((livePrice - market.previousClose) / market.previousClose) * 100 : 0;
              
              return (
                <div key={holding.id} className="text-center">
                  <div className="text-sm font-medium text-slate-700">{holding.symbol || holding.name}</div>
                  <div className="text-lg font-bold text-slate-900">
                    ${(livePrice || holding.currentPrice).toLocaleString()}
                    {market && <span className="text-xs text-slate-500 ml-1">{market.currency}</span>}
                  </div>
                  <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </div>
                  {market && (
                    <div className="text-xs text-slate-500">
                      H: ${market.dayHigh} L: ${market.dayLow}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {(bestPerformer || worstPerformer) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {bestPerformer && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Best Performer</p>
                <p className="font-semibold text-green-900">
                  {bestPerformer.symbol || bestPerformer.name} 
                  <span className="ml-2">+{bestPerformer.performance.toFixed(1)}%</span>
                </p>
              </div>
            </div>
          )}
          
          {worstPerformer && (
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <Activity className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-red-700">Needs Attention</p>
                <p className="font-semibold text-red-900">
                  {worstPerformer.symbol || worstPerformer.name}
                  <span className="ml-2">{worstPerformer.performance.toFixed(1)}%</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="h-80 mb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-slate-600">Loading from custom API...</span>
            </div>
          </div>
        ) : connectionStatus === 'error' && chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Unable to Load Live Data</h3>
            <p className="text-slate-600 text-center mb-4">Check your custom API connection</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="formattedDate"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {displayHoldings.map((holding, index) => (
                <Line
                  key={holding.id}
                  type="monotone"
                  dataKey={holding.symbol || holding.name}
                  stroke={colors[index]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: colors[index], strokeWidth: 2, fill: 'white' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
        {displayHoldings.map((holding, index) => (
          <div key={holding.id} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index] }}
            />
            <span className="text-sm text-slate-600">
              {holding.symbol || holding.name}
            </span>
            {livePrices.has(holding.symbol || holding.name) && (
              <span className="text-xs bg-green-100 text-green-700 px-1 rounded">LIVE</span>
            )}
          </div>
        ))}
      </div>

      {/* Update Time */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>
            {lastUpdated ? 
              `Last updated: ${lastUpdated.toLocaleTimeString()}` : 
              'No recent updates'
            }
          </span>
        </div>
        
        
      </div>
    </motion.div>
  );
};
