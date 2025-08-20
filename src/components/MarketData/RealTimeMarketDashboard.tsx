import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Zap, Globe, AlertCircle, Clock, Crown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { customBackendAPI } from '../../services/customBackendAPI';
import { UserProfile } from '../../App';

interface RealTimeMarketDashboardProps {
  userProfile: UserProfile;
}

export const RealTimeMarketDashboard: React.FC<RealTimeMarketDashboardProps> = ({ userProfile }) => {
  const { userPlan, checkFeatureAccess } = usePlanAccess();
  
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['VAS.AX', 'VGS.AX', 'VAF.AX', 'CBA.AX']);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Get plan limits for real-time data
  const planLimits = {
    maxRequests: userPlan?.features.apiCallLimit || 10,
    resetPeriod: (userPlan?.name === 'Free' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
  };
  
  const { 
    prices, 
    lastUpdate, 
    loading, 
    error, 
    connectionStatus, 
    refreshPrices,
    requestCount,
    maxRequests,
    canMakeRequest 
  } = useRealTimeData({
    symbols: selectedSymbols,
    interval: checkFeatureAccess('realtimeAccess') ? 30000 : 60000, // 30s for premium, 1min for free
    enabled: true,
    planLimits,
  });

  const availableSymbols = [
    { symbol: 'VAS.AX', name: 'Vanguard Australian Shares', category: 'ETF', color: '#3B82F6' },
    { symbol: 'VGS.AX', name: 'Vanguard International Shares', category: 'ETF', color: '#10B981' },
    { symbol: 'VAF.AX', name: 'Vanguard Australian Fixed Interest', category: 'ETF', color: '#8B5CF6' },
    { symbol: 'CBA.AX', name: 'Commonwealth Bank', category: 'Stock', color: '#F59E0B' },
    { symbol: 'BHP.AX', name: 'BHP Group', category: 'Stock', color: '#EF4444' },
    { symbol: 'CSL.AX', name: 'CSL Limited', category: 'Stock', color: '#06B6D4' },
    { symbol: 'BTC-USD', name: 'Bitcoin', category: 'Crypto', color: '#F7931A' },
    { symbol: 'ETH-USD', name: 'Ethereum', category: 'Crypto', color: '#627EEA' },
  ];

  useEffect(() => {
    generateChartData();
  }, [selectedSymbols]);

  const generateChartData = () => {
    const chartPoints = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const point: any = {
        time: time.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
        timestamp: time.getTime()
      };
      
      selectedSymbols.forEach(symbol => {
        const priceData = prices[symbol];
        if (priceData) {
          // Simulate historical data with some volatility
          const basePrice = priceData.price;
          const volatility = 0.02; // 2% volatility
          const randomChange = (Math.random() - 0.5) * volatility;
          point[symbol] = basePrice * (1 + randomChange);
        } else {
          // Use mock data if no real data available
          point[symbol] = 100 + Math.random() * 20;
        }
      });
      
      chartPoints.push(point);
    }
    
    setChartData(chartPoints);
  };

  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol].slice(0, 6) // Limit to 6 symbols
    );
  };

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Real-Time Market Data</h2>
          <p className="text-slate-600">
            Live market updates • {requestCount}/{maxRequests} requests used this {planLimits.resetPeriod}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            <span className="text-sm text-slate-600 capitalize">{connectionStatus}</span>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refreshPrices}
            disabled={loading || !canMakeRequest}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{canMakeRequest ? 'Refresh' : 'Limit Reached'}</span>
          </button>
        </div>
      </div>

      {/* Plan Access Information */}
      {!checkFeatureAccess('realtimeAccess') && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Enhanced Real-Time Features Available</h3>
              <p className="text-sm text-blue-800 mt-1">
                Upgrade to Pro, Family, or Enterprise for faster updates, more requests, and advanced market analytics.
              </p>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Limit Warning */}
      {!canMakeRequest && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Request limit reached ({requestCount}/{maxRequests}). {getRemainingTime()}.</span>
          </div>
        </div>
      )}

      {/* Symbol Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Assets to Track</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableSymbols.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => handleSymbolToggle(asset.symbol)}
              className={`p-3 text-left border-2 rounded-lg transition-all ${
                selectedSymbols.includes(asset.symbol)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />
                <div>
                  <div className="font-medium text-slate-900 text-sm">{asset.symbol}</div>
                  <div className="text-xs text-slate-600">{asset.category}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedSymbols.map((symbol) => {
          const asset = availableSymbols.find(a => a.symbol === symbol);
          const liveData = prices[symbol];
          const price = liveData?.price || 0;
          const change = liveData?.change || 0;
          const changePercent = liveData?.changePercent || 0;
          const isLiveData = liveData?.source === 'live';
          
          return (
            <motion.div
              key={symbol}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">{symbol}</h3>
                  <p className="text-sm text-slate-600 truncate">{asset?.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isLiveData ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                  }`} />
                  <div className={`p-2 rounded-lg ${
                    change >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {change >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Price</span>
                  <span className="font-bold text-slate-900">{formatPrice(price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Change</span>
                  <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatChange(change, changePercent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Data Source</span>
                  <span className={`font-medium text-xs ${isLiveData ? 'text-green-600' : 'text-orange-600'}`}>
                    {isLiveData ? 'Live' : 'Fallback'}
                  </span>
                </div>
                {liveData?.volume && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Volume</span>
                    <span className="font-medium text-slate-900">
                      {liveData.volume >= 1000000 ? `${(liveData.volume / 1000000).toFixed(1)}M` : `${(liveData.volume / 1000).toFixed(0)}K`}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <Activity className={`w-3 h-3 ${isLiveData ? 'text-green-500' : 'text-orange-500'}`} />
                  <span>{isLiveData ? 'Live Data' : 'Cached Data'}</span>
                </div>
                {lastUpdate && (
                  <span>{lastUpdate.toLocaleTimeString()}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
            {error.includes('limit') && (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Market Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Market Trends</h3>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            {checkFeatureAccess('realtimeAccess') ? (
              <>
                <Activity className="w-4 h-4 text-green-500" />
                <span>Real-time Updates</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Standard Updates</span>
              </>
            )}
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time"
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
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              {selectedSymbols.map((symbol, index) => {
                const asset = availableSymbols.find(a => a.symbol === symbol);
                return (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={symbol}
                    stroke={asset?.color || '#64748b'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: asset?.color }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {requestCount}
            </div>
            <div className="text-sm text-slate-600">Requests Used</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {maxRequests - requestCount}
            </div>
            <div className="text-sm text-slate-600">Requests Remaining</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {userPlan?.name || 'Free'}
            </div>
            <div className="text-sm text-slate-600">Current Plan</div>
          </div>
        </div>
        
        {/* Usage Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Usage Progress</span>
            <span>{Math.round((requestCount / maxRequests) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                requestCount / maxRequests > 0.8 ? 'bg-red-500' :
                requestCount / maxRequests > 0.6 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min((requestCount / maxRequests) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Market News */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Market News & Analysis</h3>
        </div>
        
        <div className="space-y-4">
          {/* Mock news items - would be populated from Serper news API */}
          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-slate-900 mb-2">ASX 200 Reaches New High Amid Strong Earnings</h4>
            <p className="text-sm text-slate-600 mb-3">
              The Australian stock market continues its upward trajectory with strong corporate earnings driving investor confidence.
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Financial Review</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-slate-900 mb-2">RBA Holds Interest Rates Steady</h4>
            <p className="text-sm text-slate-600 mb-3">
              The Reserve Bank maintains the cash rate at 4.35%, citing balanced economic conditions.
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>ABC News</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Upgrade Modal */}
      {showUpgradeModal && (
        <PlanUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="realtime_access"
        />
      )}
    </div>
  );
};

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-green-500" />
                    <span>Live</span>
                  </div>
                  {lastUpdate && (
                    <span>{lastUpdate.toLocaleTimeString()}</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Market Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Market Trends</h3>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            {hasRealtimeAccess ? (
              <>
                <Activity className="w-4 h-4 text-green-500" />
                <span>Real-time Updates</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Delayed Data</span>
              </>
            )}
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time"
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
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              {selectedSymbols.map((symbol, index) => {
                const asset = availableSymbols.find(a => a.symbol === symbol);
                return (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={symbol}
                    stroke={asset?.color || '#64748b'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: asset?.color }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market News */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Market News & Analysis</h3>
        </div>
        
        <div className="space-y-4">
          {/* Mock news items - would be populated from Serper news API */}
          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-slate-900 mb-2">ASX 200 Reaches New High Amid Strong Earnings</h4>
            <p className="text-sm text-slate-600 mb-3">
              The Australian stock market continues its upward trajectory with strong corporate earnings driving investor confidence.
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Financial Review</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-slate-900 mb-2">RBA Holds Interest Rates Steady</h4>
            <p className="text-sm text-slate-600 mb-3">
              The Reserve Bank maintains the cash rate at 4.35%, citing balanced economic conditions.
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>ABC News</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};