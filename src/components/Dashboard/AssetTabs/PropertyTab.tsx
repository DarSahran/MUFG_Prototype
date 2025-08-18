import React, { useState } from 'react';
import { Home, MapPin, TrendingUp, Calculator, Plus, Edit3, Trash2, Search, Building } from 'lucide-react';
import { AssetHolding } from '../../../types/portfolio';
import { UserProfile } from '../../../App';
import { PropertyAssetModal } from '../../PropertyAssetModal';
import { usePortfolio } from '../../../hooks/usePortfolio';

interface PropertyTabProps {
  holdings: AssetHolding[];
  userProfile: UserProfile;
}

export const PropertyTab: React.FC<PropertyTabProps> = ({ holdings, userProfile }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<AssetHolding | null>(null);
  const { deleteHolding } = usePortfolio();

  const propertyHoldings = holdings.filter(h => h.type === 'property');
  const totalPropertyValue = propertyHoldings.reduce((sum, holding) => 
    sum + (holding.quantity * holding.currentPrice), 0
  );

  const totalPropertyGain = propertyHoldings.reduce((sum, holding) => {
    const currentValue = holding.quantity * holding.currentPrice;
    const purchaseValue = holding.quantity * holding.purchasePrice;
    return sum + (currentValue - purchaseValue);
  }, 0);

  const propertyMetrics = {
    totalValue: totalPropertyValue,
    totalGain: totalPropertyGain,
    averageGrowth: totalPropertyValue > 0 ? (totalPropertyGain / (totalPropertyValue - totalPropertyGain)) * 100 : 0,
    rentalYield: 4.1,
    capitalGrowth: 2.1
  };

  const propertyInsights = [
    {
      title: 'Market Outlook',
      message: 'Property markets showing resilience with 3.2% growth this quarter',
      type: 'positive'
    },
    {
      title: 'Interest Rate Impact',
      message: 'Rising rates may affect property valuations in the short term',
      type: 'warning'
    },
    {
      title: 'Diversification Opportunity',
      message: 'Consider REITs for liquid property exposure',
      type: 'info'
    }
  ];

  const handleDeleteProperty = async (holdingId: string) => {
    if (confirm('Are you sure you want to remove this property from your portfolio?')) {
      const result = await deleteHolding(holdingId);
      if (result.error) {
        alert('Error removing property: ' + result.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Property Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-orange-700">
              {propertyHoldings.length} properties
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            ${propertyMetrics.totalValue.toLocaleString()}
          </h3>
          <p className="text-sm text-orange-700">Total Property Value</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${
            propertyMetrics.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {propertyMetrics.totalGain >= 0 ? '+' : ''}${propertyMetrics.totalGain.toLocaleString()}
          </h3>
          <p className="text-sm text-green-700">Capital Gain</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {propertyMetrics.rentalYield}%
          </h3>
          <p className="text-sm text-blue-700">Avg Rental Yield</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {propertyMetrics.averageGrowth.toFixed(1)}%
          </h3>
          <p className="text-sm text-purple-700">Total Return</p>
        </div>
      </div>

      {/* Property Holdings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Property Holdings</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>

        {propertyHoldings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {propertyHoldings.map((property) => {
              const currentValue = property.quantity * property.currentPrice;
              const purchaseValue = property.quantity * property.purchasePrice;
              const gain = currentValue - purchaseValue;
              const gainPercent = purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0;

              return (
                <div key={property.id} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Home className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{property.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-600">
                            {property.metadata?.location || 'Location not specified'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Building className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-600">
                            {property.metadata?.propertyType || 'Residential'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        ${currentValue.toLocaleString()}
                      </div>
                      <div className={`text-sm font-medium ${
                        gain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-slate-600">Purchase Price</span>
                      <p className="font-medium">${property.purchasePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Current Value</span>
                      <p className="font-medium">${property.currentPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Purchase Date</span>
                      <p className="font-medium">{new Date(property.purchaseDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Rental Income</span>
                      <p className="font-medium">
                        ${((property.metadata?.rentalIncome || 0) * 52).toLocaleString()}/year
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setSelectedProperty(property)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProperty(property.id)}
                      className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No property holdings found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Add your first property investment
            </button>
          </div>
        )}
      </div>

      {/* Property Insights */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Property Market Insights</h3>
        <div className="space-y-4">
          {propertyInsights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              insight.type === 'positive' ? 'border-green-500 bg-green-50' :
              insight.type === 'warning' ? 'border-orange-500 bg-orange-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">{insight.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Property Asset Modal */}
      <PropertyAssetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userProfile={userProfile}
      />
    </div>
  );
};