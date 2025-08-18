import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Edit3, Trash2, BarChart3, Search, RefreshCw, Eye } from 'lucide-react';
import { AssetHolding } from '../../../types/portfolio';
import { UserProfile } from '../../../App';
import { AssetSearchModal } from '../../AssetSearchModal';
import { usePortfolio } from '../../../hooks/usePortfolio';
import { useRealTimeData } from '../../../hooks/useRealTimeData';
import { marketDataService } from '../../../services/marketData';

interface StocksTabProps {
  holdings: AssetHolding[];
  userProfile: UserProfile;
}

export const StocksTab: React.FC<StocksTabProps> = ({ holdings, userProfile }) => {
  const [sortBy, setSortBy] = useState<'value' | 'gain' | 'name'>('value');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<AssetHolding | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { updateHolding, deleteHolding } = usePortfolio();

  const stockHoldings = holdings.filter(h => h.type === 'stock');
  const stockSymbols = stockHoldings.map(h => h.symbol).filter(Boolean) as string[];
  
  // Real-time price updates
  const { prices, lastUpdate, refreshPrices } = useRealTimeData({
    symbols: stockSymbols,
    interval: 30000, // 30 seconds
    enabled: stockSymbols.length > 0,
    assetTypes: Object.fromEntries(stockHoldings.map(h => [h.symbol!, 'stock'])),
    regions: Object.fromEntries(stockHoldings.map(h => [h.symbol!, h.region])),
  });

  // Update current prices when real-time data changes
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      stockHoldings.forEach(holding => {
        if (holding.symbol && prices[holding.symbol]) {
          const newPrice = prices[holding.symbol].price;
          if (newPrice !== holding.currentPrice) {
            updateHolding(holding.id, { currentPrice: newPrice });
          }
        }
      });
    }
  }, [prices]);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      await refreshPrices();
      
      // Also update prices from market data service
      for (const holding of stockHoldings) {
        if (holding.symbol) {
          const quote = await marketDataService.getStockQuote(holding.symbol);
          if (quote) {
            await updateHolding(holding.id, { currentPrice: quote.price });
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing prices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const sortedHoldings = [...stockHoldings].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice);
      case 'gain':
        const aGain = (a.quantity * a.currentPrice) - (a.quantity * a.purchasePrice);
        const bGain = (b.quantity * b.currentPrice) - (b.quantity * b.purchasePrice);
        return bGain - aGain;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const totalStockValue = stockHoldings.reduce((sum, holding) => 
    sum + (holding.quantity * holding.currentPrice), 0
  );

  const totalStockGain = stockHoldings.reduce((sum, holding) => {
    const currentValue = holding.quantity * holding.currentPrice;
    const purchaseValue = holding.quantity * holding.purchasePrice;
    return sum + (currentValue - purchaseValue);
  }, 0);

  const totalGainPercent = totalStockValue > 0 ? (totalStockGain / (totalStockValue - totalStockGain)) * 100 : 0;

  const handleDeleteStock = async (holdingId: string) => {
    if (confirm('Are you sure you want to remove this stock from your portfolio?')) {
      const result = await deleteHolding(holdingId);
      if (result.error) {
        alert('Error removing stock: ' + result.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Stock Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-700">
              {stockHoldings.length} stocks
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            ${totalStockValue.toLocaleString()}
          </h3>
          <p className="text-sm text-blue-700">Total Stock Value</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              {totalStockGain >= 0 ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
            <span className={`text-sm font-medium ${
              totalStockGain >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {totalStockGain >= 0 ? 'Profit' : 'Loss'}
            </span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${
            totalStockGain >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {totalStockGain >= 0 ? '+' : ''}${totalStockGain.toLocaleString()}
          </h3>
          <p className="text-sm text-green-700">Total Gain/Loss</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-purple-700">
              {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(1)}%
          </h3>
          <p className="text-sm text-purple-700">Total Return</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <RefreshCw className={`w-6 h-6 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </div>
            <button
              onClick={handleRefreshPrices}
              disabled={refreshing}
              className="text-sm font-medium text-orange-700 hover:text-orange-800 disabled:opacity-50"
            >
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">Live</h3>
          <p className="text-sm text-orange-700">
            {lastUpdate ? `Updated ${new Date(lastUpdate).toLocaleTimeString()}` : 'Real-time Prices'}
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Stock Holdings</h3>
            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="value">Sort by Value</option>
                <option value="gain">Sort by Gain/Loss</option>
                <option value="name">Sort by Name</option>
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stock</span>
              </button>
            </div>
          </div>
        </div>

        {sortedHoldings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Avg Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Current Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gain/Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedHoldings.map((holding) => {
                  const currentValue = holding.quantity * holding.currentPrice;
                  const purchaseValue = holding.quantity * holding.purchasePrice;
                  const gain = currentValue - purchaseValue;
                  const gainPercent = purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0;
                  const realTimePrice = holding.symbol ? prices[holding.symbol]?.price : null;
                  const priceChanged = realTimePrice && realTimePrice !== holding.currentPrice;

                  return (
                    <tr key={holding.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900 flex items-center space-x-2">
                            <span>{holding.symbol}</span>
                            {priceChanged && (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 truncate max-w-48">{holding.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900">{holding.quantity}</td>
                      <td className="px-6 py-4 text-slate-900">${holding.purchasePrice.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-900">${holding.currentPrice.toFixed(2)}</span>
                          {realTimePrice && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              realTimePrice > holding.currentPrice ? 'bg-green-100 text-green-700' :
                              realTimePrice < holding.currentPrice ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              ${realTimePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">${currentValue.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                        </div>
                        <div className={`text-sm ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingStock(holding)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit holding"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStock(holding.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Remove holding"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No stock holdings found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first stock
            </button>
          </div>
        )}
      </div>

      {/* Real-time Market Data */}
      {stockHoldings.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Live Market Data</h3>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
              {lastUpdate && (
                <span className="text-xs">
                  Last: {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockHoldings.slice(0, 6).map((holding) => {
              const realTimeData = holding.symbol ? prices[holding.symbol] : null;
              const currentValue = holding.quantity * holding.currentPrice;
              
              return (
                <div key={holding.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900">{holding.symbol}</h4>
                      <p className="text-sm text-slate-600 truncate">{holding.name}</p>
                    </div>
                    {realTimeData && (
                      <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                        realTimeData.changePercent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {realTimeData.changePercent >= 0 ? '+' : ''}{realTimeData.changePercent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Current Price</span>
                      <span className="font-medium">
                        ${realTimeData?.price.toFixed(2) || holding.currentPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Holdings Value</span>
                      <span className="font-medium">${currentValue.toLocaleString()}</span>
                    </div>
                    {realTimeData && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Volume</span>
                        <span className="font-medium">
                          {realTimeData.volume >= 1000000 
                            ? `${(realTimeData.volume / 1000000).toFixed(1)}M` 
                            : `${(realTimeData.volume / 1000).toFixed(0)}K`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Asset Search Modal */}
      <AssetSearchModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        region={userProfile.region as any}
      />
    </div>
  );
};