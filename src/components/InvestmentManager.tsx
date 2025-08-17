import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Edit3, Trash2, Eye, Calculator, Search, Filter, Download, Upload } from 'lucide-react';
import { AssetSearchModal } from './AssetSearchModal';
import { usePortfolio } from '../hooks/usePortfolio';
import { UserProfile } from '../App';

interface InvestmentManagerProps {
  userProfile: UserProfile;
}

export const InvestmentManager: React.FC<InvestmentManagerProps> = ({ userProfile }) => {
  const { holdings, loading, addHolding, updateHolding, deleteHolding, getTotalPortfolioValue, getAssetAllocation } = usePortfolio();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'performance'>('overview');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'gain' | 'name'>('value');

  const totalValue = getTotalPortfolioValue();
  const assetAllocation = getAssetAllocation();
  
  const totalGain = holdings.reduce((sum, holding) => {
    const value = holding.quantity * holding.currentPrice;
    const cost = holding.quantity * holding.purchasePrice;
    return sum + (value - cost);
  }, 0);
  const totalGainPercent = totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0;

  const filteredHoldings = holdings.filter(holding => 
    filterType === 'all' || holding.type === filterType
  ).sort((a, b) => {
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-slate-600">Total Value</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">${totalValue.toLocaleString()}</h3>
          <p className="text-slate-600 text-sm">Portfolio Value</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${totalGain >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {totalGain >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
            <span className="text-sm text-slate-600">Total Gain/Loss</span>
          </div>
          <h3 className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(totalGain).toLocaleString()}
          </h3>
          <p className={`text-sm ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGain >= 0 ? '+' : '-'}{Math.abs(totalGainPercent).toFixed(2)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-slate-600">Holdings</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{holdings.length}</h3>
          <p className="text-slate-600 text-sm">Active Investments</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <PieChart className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-slate-600">Diversification</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{Object.keys(assetAllocation).length}</h3>
          <p className="text-slate-600 text-sm">Asset Types</p>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Asset Allocation</h3>
        <div className="space-y-4">
          {Object.entries(assetAllocation).map(([type, value]) => {
            const percentage = (value / totalValue) * 100;
            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${
                    type === 'etf' ? 'bg-blue-500' :
                    type === 'stock' ? 'bg-green-500' :
                    type === 'bond' ? 'bg-purple-500' :
                    type === 'property' ? 'bg-orange-500' : 'bg-gray-500'
                  }`} />
                  <span className="font-medium text-slate-900 capitalize">{type}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        type === 'etf' ? 'bg-blue-500' :
                        type === 'stock' ? 'bg-green-500' :
                        type === 'bond' ? 'bg-purple-500' :
                        type === 'property' ? 'bg-orange-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600 w-12">{percentage.toFixed(1)}%</span>
                  <span className="text-sm text-slate-600 w-20">${((totalValue * percentage) / 100).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Your Holdings</h3>
          <div className="flex items-center space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Assets</option>
              <option value="stock">Stocks</option>
              <option value="etf">ETFs</option>
              <option value="bond">Bonds</option>
              <option value="property">Property</option>
              <option value="crypto">Crypto</option>
              <option value="super">Super</option>
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Asset</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Purchase Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Current Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gain/Loss</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredHoldings.map((holding) => {
                const value = holding.quantity * holding.currentPrice;
                const cost = holding.quantity * holding.purchasePrice;
                const gain = value - cost;
                const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
                
                return (
                <tr key={holding.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{holding.symbol || holding.name}</div>
                      <div className="text-sm text-slate-500 truncate max-w-32">{holding.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      holding.type === 'stock' ? 'bg-blue-100 text-blue-700' :
                      holding.type === 'etf' ? 'bg-green-100 text-green-700' :
                      holding.type === 'bond' ? 'bg-purple-100 text-purple-700' :
                      holding.type === 'property' ? 'bg-orange-100 text-orange-700' :
                      holding.type === 'crypto' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {holding.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-900">{holding.quantity}</td>
                  <td className="px-4 py-4 text-slate-900">${holding.purchasePrice.toFixed(2)}</td>
                  <td className="px-4 py-4 text-slate-900">${holding.currentPrice.toFixed(2)}</td>
                  <td className="px-4 py-4 font-medium text-slate-900">${value.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <div className={`font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                    </div>
                    <div className={`text-sm ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingInvestment(holding)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteHolding(holding.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        )}
        
        {filteredHoldings.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No holdings found</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first investment
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-6">
      {/* Detailed Holdings with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHoldings.map((holding) => {
          const value = holding.quantity * holding.currentPrice;
          const cost = holding.quantity * holding.purchasePrice;
          const gain = value - cost;
          const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
          
          return (
            <div key={holding.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{holding.symbol || holding.name}</h3>
                  <p className="text-sm text-slate-600">{holding.name}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  holding.type === 'stock' ? 'bg-blue-100 text-blue-700' :
                  holding.type === 'etf' ? 'bg-green-100 text-green-700' :
                  holding.type === 'bond' ? 'bg-purple-100 text-purple-700' :
                  holding.type === 'property' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {holding.type.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-600">Current Value</p>
                  <p className="text-xl font-bold text-slate-900">${value.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Gain/Loss</p>
                  <p className={`text-xl font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                  </p>
                  <p className={`text-sm ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Quantity</span>
                  <span className="font-medium">{holding.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Purchase Price</span>
                  <span className="font-medium">${holding.purchasePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Price</span>
                  <span className="font-medium">${holding.currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Purchase Date</span>
                  <span className="font-medium">{new Date(holding.purchaseDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setEditingInvestment(holding)}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deleteHolding(holding.id)}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Total Return</h3>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
          </div>
          <p className="text-sm text-slate-600">Since inception</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Best Performer</h3>
          {filteredHoldings.length > 0 && (
            <>
              <div className="text-xl font-bold text-slate-900 mb-1">
                {filteredHoldings.reduce((best, current) => {
                  const currentGain = ((current.currentPrice - current.purchasePrice) / current.purchasePrice) * 100;
                  const bestGain = ((best.currentPrice - best.purchasePrice) / best.purchasePrice) * 100;
                  return currentGain > bestGain ? current : best;
                }).symbol || 'N/A'}
              </div>
              <p className="text-sm text-slate-600">Top gaining asset</p>
            </>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Diversification Score</h3>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {Math.min(Object.keys(assetAllocation).length * 20, 100)}%
          </div>
          <p className="text-sm text-slate-600">Portfolio spread</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Investment Manager</h1>
          <p className="text-slate-600">Track and manage your investment portfolio</p>
        </div>

        {/* View Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'detailed', label: 'Detailed View', icon: Eye },
              { id: 'performance', label: 'Performance', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedView(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
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
        </div>

        {/* Content */}
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'detailed' && renderDetailed()}
        {selectedView === 'performance' && renderPerformance()}

        {/* Asset Search Modal */}
        <AssetSearchModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          region={userProfile.region as any}
        />
      </div>
    </div>
  );
};