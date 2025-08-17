import React, { useState } from 'react';
import { Bitcoin, TrendingUp, TrendingDown, AlertTriangle, Plus, Edit3, Trash2 } from 'lucide-react';
import { AssetHolding } from '../../../types/portfolio';
import { UserProfile } from '../../../App';

interface CryptoTabProps {
  holdings: AssetHolding[];
  userProfile: UserProfile;
}

export const CryptoTab: React.FC<CryptoTabProps> = ({ holdings, userProfile }) => {
  const [selectedCrypto, setSelectedCrypto] = useState<AssetHolding | null>(null);

  const cryptoHoldings = holdings.filter(h => h.type === 'crypto');
  const totalCryptoValue = cryptoHoldings.reduce((sum, holding) => 
    sum + (holding.quantity * holding.currentPrice), 0
  );

  const cryptoMetrics = {
    totalValue: totalCryptoValue,
    dayChange: 2.4,
    weekChange: -5.7,
    monthChange: 12.3,
    volatility: 45.2
  };

  const cryptoRecommendations = [
    {
      symbol: 'BTC-USD',
      name: 'Bitcoin',
      recommendation: 'HOLD',
      confidence: 75,
      reasoning: 'Strong institutional adoption but high volatility',
      allocation: '2-5%'
    },
    {
      symbol: 'ETH-USD',
      name: 'Ethereum',
      recommendation: 'BUY',
      confidence: 68,
      reasoning: 'DeFi ecosystem growth and upcoming upgrades',
      allocation: '1-3%'
    }
  ];

  const cryptoRisks = [
    {
      title: 'High Volatility',
      description: 'Crypto prices can fluctuate dramatically in short periods',
      severity: 'high'
    },
    {
      title: 'Regulatory Risk',
      description: 'Government regulations could impact crypto investments',
      severity: 'medium'
    },
    {
      title: 'Technology Risk',
      description: 'Smart contract bugs or network issues could affect value',
      severity: 'medium'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Crypto Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <Bitcoin className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            ${cryptoMetrics.totalValue.toLocaleString()}
          </h3>
          <p className="text-sm text-orange-700">Total Crypto Value</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            +{cryptoMetrics.dayChange}%
          </h3>
          <p className="text-sm text-green-700">24h Change</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-600 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {cryptoMetrics.weekChange}%
          </h3>
          <p className="text-sm text-red-700">7d Change</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {cryptoMetrics.volatility}%
          </h3>
          <p className="text-sm text-purple-700">Volatility</p>
        </div>
      </div>

      {/* Crypto Holdings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Cryptocurrency Holdings</h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Crypto</span>
          </button>
        </div>

        {cryptoHoldings.length > 0 ? (
          <div className="space-y-4">
            {cryptoHoldings.map((crypto) => {
              const currentValue = crypto.quantity * crypto.currentPrice;
              const purchaseValue = crypto.quantity * crypto.purchasePrice;
              const gain = currentValue - purchaseValue;
              const gainPercent = purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0;

              return (
                <div key={crypto.id} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Bitcoin className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{crypto.symbol}</h4>
                        <p className="text-sm text-slate-600">{crypto.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900">
                        ${currentValue.toLocaleString()}
                      </div>
                      <div className={`text-sm font-medium ${
                        gain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Quantity</span>
                      <p className="font-medium">{crypto.quantity}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Avg Price</span>
                      <p className="font-medium">${crypto.purchasePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Current Price</span>
                      <p className="font-medium">${crypto.currentPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Exchange</span>
                      <p className="font-medium">{crypto.exchange || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-200">
                    <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Bitcoin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No cryptocurrency holdings found</p>
            <button className="text-orange-600 hover:text-orange-700 font-medium">
              Add your first crypto investment
            </button>
          </div>
        )}
      </div>

      {/* Crypto Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Crypto Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cryptoRecommendations.map((rec, index) => (
            <div key={rec.symbol} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900">{rec.symbol}</h4>
                  <p className="text-sm text-slate-600">{rec.name}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    rec.recommendation === 'BUY' ? 'bg-green-100 text-green-700' :
                    rec.recommendation === 'HOLD' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {rec.recommendation}
                  </span>
                  <div className="text-xs text-slate-500 mt-1">{rec.confidence}% confidence</div>
                </div>
              </div>
              
              <p className="text-sm text-slate-700 mb-4">{rec.reasoning}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Suggested allocation: {rec.allocation}</span>
                <button className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors">
                  Add to Portfolio
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Warning */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-4">Cryptocurrency Risks</h3>
            <div className="space-y-3">
              {cryptoRisks.map((risk, index) => (
                <div key={index} className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-red-900">{risk.title}</h4>
                    <p className="text-sm text-red-700">{risk.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    risk.severity === 'high' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {risk.severity}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Recommendation:</strong> Limit crypto exposure to 5-10% of your total portfolio. 
                Consider it as a high-risk, high-reward component of your investment strategy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};