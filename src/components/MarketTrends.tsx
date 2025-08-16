import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, LineChart, PieChart, RefreshCw, Download, Filter } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { marketDataService, StockData, ChartData } from '../services/marketData';

interface MarketTrendsProps {
  userProfile?: any;
}

export const MarketTrends: React.FC<MarketTrendsProps> = ({ userProfile }) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['VAS.AX', 'VGS.AX', 'VAF.AX']);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [marketData, setMarketData] = useState<StockData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'comparison'>('overview');

  const availableAssets = [
    { symbol: 'VAS.AX', name: 'Vanguard Australian Shares Index ETF', category: 'Australian Equity', color: '#3B82F6' },
    { symbol: 'VGS.AX', name: 'Vanguard MSCI Index International Shares ETF', category: 'International Equity', color: '#10B981' },
    { symbol: 'VAF.AX', name: 'Vanguard Australian Fixed Interest Index ETF', category: 'Fixed Income', color: '#8B5CF6' },
    { symbol: 'VGE.AX', name: 'Vanguard FTSE Emerging Markets Shares ETF', category: 'Emerging Markets', color: '#F59E0B' },
    { symbol: 'VDHG.AX', name: 'Vanguard Diversified High Growth Index ETF', category: 'Diversified', color: '#EF4444' },
    { symbol: 'VAP.AX', name: 'Vanguard Australian Property Securities Index ETF', category: 'Property', color: '#06B6D4' },
    { symbol: 'VTS.AX', name: 'Vanguard US Total Market Shares Index ETF', category: 'US Market', color: '#84CC16' },
    { symbol: 'VEU.AX', name: 'Vanguard All-World ex-US Shares Index ETF', category: 'Global ex-US', color: '#F97316' },
  ];

  useEffect(() => {
    loadMarketData();
  }, [selectedAssets, timeframe]);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const stockPromises = selectedAssets.map(async (symbol) => {
        const data = await marketDataService.getStockQuote(symbol);
        return data || marketDataService.getMockStockData(symbol);
      });

      const stocks = await Promise.all(stockPromises);
      setMarketData(stocks);

      // Load chart data for the first selected asset
      if (selectedAssets.length > 0) {
        const historical = await marketDataService.getHistoricalData(selectedAssets[0], 'daily');
        setChartData(historical.length > 0 ? historical : marketDataService.getMockChartData());
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      setMarketData(selectedAssets.map(symbol => marketDataService.getMockStockData(symbol)));
      setChartData(marketDataService.getMockChartData());
    } finally {
      setLoading(false);
    }
  };

  const handleAssetToggle = (symbol: string) => {
    setSelectedAssets(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const data = chartData.slice(-30); // Last 30 data points

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatPrice}
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Price']}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-AU')}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatPrice}
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Price']}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-AU')}`}
              />
              <Bar dataKey="close" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={320}>
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatPrice}
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Price']}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-AU')}`}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Market Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {marketData.slice(0, 4).map((stock, index) => {
          const asset = availableAssets.find(a => a.symbol === stock.symbol);
          return (
            <div key={stock.symbol} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">{stock.symbol}</h3>
                  <p className="text-sm text-slate-600">{asset?.category}</p>
                </div>
                <div className={`p-2 rounded-lg ${stock.change >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {stock.change >= 0 ? (
                    <TrendingUp className={`w-5 h-5 ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-sm text-slate-600">Price</span>
                  <span className="font-bold text-slate-900">{formatPrice(stock.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sm text-slate-600">Change</span>
                  <span className={`font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatChange(stock.change, stock.changePercent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sm text-slate-600">Volume</span>
                  <span className="font-medium text-slate-900">
                    {stock.volume >= 1000000 ? `${(stock.volume / 1000000).toFixed(1)}M` : `${(stock.volume / 1000).toFixed(0)}K`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Market Trends</h2>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Chart Type Selector */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-xs sm:text-sm font-medium text-slate-700">Chart:</span>
              <div className="flex space-x-1">
                {[
                  { type: 'line', icon: LineChart },
                  { type: 'area', icon: Activity },
                  { type: 'bar', icon: BarChart3 }
                ].map(({ type, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type as any)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      chartType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-xs sm:text-sm font-medium text-slate-700">Period:</span>
              <div className="flex space-x-1">
                {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period as any)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      timeframe === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={loadMarketData}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {renderChart()}
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-6">
      {/* Asset Selection */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Select Assets to Track</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {availableAssets.map((asset) => (
            <div
              key={asset.symbol}
              onClick={() => handleAssetToggle(asset.symbol)}
              className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedAssets.includes(asset.symbol)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-slate-900">{asset.symbol}</h4>
                  <p className="text-xs sm:text-sm text-slate-600">{asset.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {selectedAssets.slice(0, 4).map((symbol) => {
          const asset = availableAssets.find(a => a.symbol === symbol);
          const stockData = marketData.find(s => s.symbol === symbol);
          
          return (
            <div key={symbol} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">{symbol}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">{asset?.name}</p>
                </div>
                {stockData && (
                  <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    stockData.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
                  </div>
                )}
              </div>
              
              <div className="h-32 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.slice(-15)}>
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={asset?.color}
                      strokeWidth={2}
                      fill={asset?.color}
                      fillOpacity={0.1}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value), 'Price']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {stockData && (
                <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-600">Current Price</span>
                    <p className="font-bold text-slate-900">{formatPrice(stockData.price)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Volume</span>
                    <p className="font-bold text-slate-900">
                      {stockData.volume >= 1000000 ? `${(stockData.volume / 1000000).toFixed(1)}M` : `${(stockData.volume / 1000).toFixed(0)}K`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      {/* Comparison Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Asset Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Asset</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Change</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Volume</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {marketData.map((stock) => {
                const asset = availableAssets.find(a => a.symbol === stock.symbol);
                return (
                  <tr key={stock.symbol} className="hover:bg-slate-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: asset?.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{stock.symbol}</div>
                          <div className="text-xs text-slate-500">{asset?.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {formatPrice(stock.price)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm font-medium ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {formatChange(stock.change, stock.changePercent)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {stock.volume >= 1000000 ? `${(stock.volume / 1000000).toFixed(1)}M` : `${(stock.volume / 1000).toFixed(0)}K`}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500">
                      {asset?.category}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Comparison Chart */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6">Performance Comparison</h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={chartData.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatPrice}
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatPrice(value), name]}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-AU')}`}
              />
              {selectedAssets.slice(0, 3).map((symbol, index) => {
                const asset = availableAssets.find(a => a.symbol === symbol);
                return (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey="close"
                    stroke={asset?.color}
                    strokeWidth={2}
                    dot={false}
                    name={symbol}
                  />
                );
              })}
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Market Trends & Analysis</h1>
          <p className="text-sm sm:text-base text-slate-600">Real-time market data and comprehensive analysis for your investment decisions</p>
        </div>

        {/* View Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'detailed', label: 'Detailed', icon: LineChart },
                { id: 'comparison', label: 'Comparison', icon: PieChart }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedView(id as any)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    selectedView === id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Activity className="w-4 h-4 text-green-500" />
                <span>Live Data</span>
              </div>
              <button className="flex items-center space-x-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'detailed' && renderDetailed()}
        {selectedView === 'comparison' && renderComparison()}
      </div>
    </div>
  );
};