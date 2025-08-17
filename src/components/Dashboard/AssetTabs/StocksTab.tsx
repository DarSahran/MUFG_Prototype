import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Edit3, Trash2, BarChart3 } from 'lucide-react';
import { AssetHolding } from '../../../types/portfolio';
import { UserProfile } from '../../../App';

interface StocksTabProps {
  holdings: AssetHolding[];
  userProfile: UserProfile;
}

export const StocksTab: React.FC<StocksTabProps> = ({ holdings, userProfile }) => {
  const [sortBy, setSortBy] = useState<'value' | 'gain' | 'name'>('value');

  const stockHoldings = holdings.filter(h => h.type === 'stock');
  
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

  const stockRecommendations = [
    {
      symbol: 'CBA.AX',
      name: 'Commonwealth Bank',
      reason: 'Strong dividend yield and stable performance',
      confidence: 85,
      targetPrice: 105.50,
    },
    {
      symbol: 'CSL.AX',
      name: 'CSL Limited',
      reason: 'Healthcare sector growth and international expansion',
      confidence: 78,
      targetPrice: 285.00,
    },
    {
      symbol: 'BHP.AX',
      name: 'BHP Group',
      reason: 'Commodity exposure and dividend sustainability',
      confidence: 72,
      targetPrice: 48.50,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stock Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              Annual
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">8.2%</h3>
          <p className="text-sm text-purple-700">Expected Return</p>
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
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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

                  return (
                    <tr key={holding.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{holding.symbol}</div>
                          <div className="text-sm text-slate-500">{holding.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900">{holding.quantity}</td>
                      <td className="px-6 py-4 text-slate-900">${holding.purchasePrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-900">${holding.currentPrice.toFixed(2)}</td>
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
                          <button className="p-1 text-blue-600 hover:text-blue-800">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-800">
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
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Add your first stock
            </button>
          </div>
        )}
      </div>

      {/* Stock Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">AI Stock Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stockRecommendations.map((rec, index) => (
            <div key={rec.symbol} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-900">{rec.symbol}</h4>
                  <p className="text-sm text-slate-600">{rec.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">{rec.confidence}%</div>
                  <div className="text-xs text-slate-500">Confidence</div>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-3">{rec.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Target: ${rec.targetPrice}</span>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                  Add to Portfolio
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};