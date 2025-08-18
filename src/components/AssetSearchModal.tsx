import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Globe, DollarSign, Clock, Star, Plus } from 'lucide-react';
import { realTimeMarketDataService } from '../services/realTimeMarketData';
import { usePortfolio } from '../hooks/usePortfolio';

interface AssetSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset?: (asset: any) => void;
  region?: 'AU' | 'US' | 'IN';
  assetType?: 'stock' | 'etf' | 'crypto' | 'property' | 'super';
}

export const AssetSearchModal: React.FC<AssetSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  region,
  assetType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'popular' | 'categories'>('popular');
  const [selectedCategory, setSelectedCategory] = useState<'stocks' | 'etfs' | 'crypto' | 'bonds'>(assetType === 'crypto' ? 'crypto' : 'etfs');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addHolding } = usePortfolio();

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      loadPopularAssets();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
      setActiveTab('popular');
    }
  }, [searchQuery]);

  const loadPopularAssets = () => {
    try {
      setLoading(true);
      const popular = await realTimeMarketDataService.searchTradableAssets('', assetType, region);
      
      // If no results, use predefined popular assets
      if (popular.length === 0) {
        const fallbackAssets = getFallbackPopularAssets();
        setSearchResults(fallbackAssets);
      } else {
        setSearchResults(popular.slice(0, 20));
      }
    } catch (error) {
      console.error('Error loading popular assets:', error);
      setSearchResults(getFallbackPopularAssets());
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    setActiveTab('search');
    try {
      const results = await realTimeMarketDataService.searchTradableAssets(query, assetType, region);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetClick = async (asset: AssetSearchResult) => {
    setLoading(true);
    try {
      // Get real-time price data
      const priceData = await realTimeMarketDataService.getCurrentPrice(asset.symbol, asset.type);
      
      const enrichedAsset = {
        ...asset,
        currentPrice: priceData?.price || asset.currentPrice || 0,
        change: priceData?.change || 0,
        changePercent: priceData?.changePercent || 0,
        volume: priceData?.volume || 0,
        lastUpdate: priceData?.timestamp || new Date().toISOString(),
      };
      
      setSelectedAsset(enrichedAsset);
    } catch (error) {
      console.error('Error fetching asset details:', error);
      setSelectedAsset(asset);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPortfolio = async (asset: AssetSearchResult | AssetDetails) => {
    try {
      const assetTypeMap: { [key: string]: string } = {
        'EQUITY': 'stock',
        'ETF': 'etf',
        'CRYPTOCURRENCY': 'crypto',
        'BOND': 'bond',
        'MUTUALFUND': 'etf',
      };
      
      const mappedType = assetTypeMap[asset.type?.toUpperCase()] || asset.type || 'stock';
      
      const result = await addHolding({
        type: mappedType as any,
        symbol: asset.symbol,
        name: asset.name,
        quantity: 1, // Default quantity
        purchasePrice: asset.currentPrice || 0,
        currentPrice: asset.currentPrice || 0,
        currency: (asset.currency || 'AUD') as any,
        exchange: asset.exchange,
        region: (asset.region || 'AU') as any,
        purchaseDate: new Date().toISOString().split('T')[0],
        metadata: {
          sector: asset.sector,
          description: asset.description,
          marketCap: asset.marketCap,
          addedAt: new Date().toISOString(),
        },
      });

      if (result.error) {
        alert('Error adding to portfolio: ' + result.error);
      } else {
        alert('Asset added to portfolio successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      alert('Error adding to portfolio');
    }
  };

  const getFallbackPopularAssets = () => {
    const fallbackAssets = [
      { symbol: 'VAS.AX', name: 'Vanguard Australian Shares Index ETF', type: 'etf', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Diversified', currentPrice: 89.45 },
      { symbol: 'VGS.AX', name: 'Vanguard MSCI Index International Shares ETF', type: 'etf', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'International', currentPrice: 102.67 },
      { symbol: 'VAF.AX', name: 'Vanguard Australian Fixed Interest Index ETF', type: 'etf', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Fixed Income', currentPrice: 51.23 },
      { symbol: 'CBA.AX', name: 'Commonwealth Bank of Australia', type: 'stock', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Financial Services', currentPrice: 104.50 },
      { symbol: 'BHP.AX', name: 'BHP Group Limited', type: 'stock', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Materials', currentPrice: 46.78 },
      { symbol: 'BTC-USD', name: 'Bitcoin USD', type: 'crypto', exchange: 'CoinGecko', currency: 'USD', region: 'GLOBAL', sector: 'Cryptocurrency', currentPrice: 45000 },
      { symbol: 'ETH-USD', name: 'Ethereum USD', type: 'crypto', exchange: 'CoinGecko', currency: 'USD', region: 'GLOBAL', sector: 'Cryptocurrency', currentPrice: 3200 },
    ];
    
    return assetType ? fallbackAssets.filter(asset => asset.type === assetType) : fallbackAssets;
  };
  const formatPrice = (price: number | undefined, currency: string = 'USD') => {
    if (!price) return 'N/A';
    const symbol = currency === 'AUD' ? 'A$' : currency === 'INR' ? '₹' : '$';
    return `${symbol}${price.toLocaleString()}`;
  };

  const formatMarketCap = (marketCap: number | undefined) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const getAssetTypeColor = (type: string) => {
    const colors = {
      stock: 'bg-blue-100 text-blue-700',
      etf: 'bg-green-100 text-green-700',
      crypto: 'bg-orange-100 text-orange-700',
      bond: 'bg-purple-100 text-purple-700',
      'mutual-fund': 'bg-indigo-100 text-indigo-700',
      index: 'bg-gray-100 text-gray-700',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const categories = [
    { id: 'etfs', label: 'ETFs', icon: TrendingUp },
    { id: 'stocks', label: 'Stocks', icon: DollarSign },
    { id: 'crypto', label: 'Crypto', icon: Globe },
    { id: 'bonds', label: 'Bonds', icon: Clock },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Add Investment</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks, ETFs, crypto, and more..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-4">
              <button
                onClick={() => {
                  setActiveTab('popular');
                  loadPopularAssets();
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'popular'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Star className="w-4 h-4 inline mr-2" />
                Popular
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Categories
              </button>
              {searchQuery && (
                <button
                  onClick={() => setActiveTab('search')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'search'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Search Results ({searchResults.length})
                </button>
              )}
            </div>
          </div>

          <div className="flex h-96">
            {/* Left Panel - Asset List */}
            <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
              {/* Category Selector */}
              {activeTab === 'categories' && (
                <div className="p-4 border-b border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id as any);
                            const assets = assetSearchService.getAssetsByCategory(category.id as any);
                            setSelectedCategory(category.id as any);
                            setLoading(true);
                            try {
                              const assets = await realTimeMarketDataService.searchTradableAssets('', category.id.slice(0, -1), region);
                              setSearchResults(assets.slice(0, 20));
                            } catch (error) {
                              console.error('Error loading category assets:', error);
                              setSearchResults([]);
                            } finally {
                              setLoading(false);
                            }
                            setSearchResults(assets);
                          }}
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                            selectedCategory === category.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Asset List */}
              <div className="p-4">
                {searchResults.length === 0 && !loading ? (
                  <div className="text-center py-8 text-slate-500">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No assets found</p>
                    <p className="text-sm">Try searching for a stock symbol or company name</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((asset) => (
                      <motion.div
                        key={asset.symbol}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 border border-slate-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleAssetClick(asset)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-bold text-slate-900">{asset.symbol}</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAssetTypeColor(asset.type)}`}>
                                {asset.type.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 truncate">{asset.name}</p>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                              <span>{asset.exchange}</span>
                              {asset.sector && <span>• {asset.sector}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            {asset.currentPrice && (
                              <div className="font-bold text-slate-900">
                                {formatPrice(asset.currentPrice, asset.currency)}
                              </div>
                            )}
                            {asset.marketCap && (
                              <div className="text-xs text-slate-500">
                                {formatMarketCap(asset.marketCap)}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Asset Details */}
            <div className="w-1/2 overflow-y-auto">
              {selectedAsset ? (
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{selectedAsset.symbol}</h3>
                        <p className="text-slate-600">{selectedAsset.name}</p>
                      </div>
                      <button
                        onClick={() => handleAddToPortfolio(selectedAsset)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add to Portfolio</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-600">Current Price</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatPrice(selectedAsset.currentPrice, selectedAsset.currency)}
                        </p>
                        {selectedAsset.changePercent !== undefined && (
                          <p className={`text-sm font-medium ${
                            selectedAsset.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedAsset.changePercent >= 0 ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
                          </p>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-600">Market Cap</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatMarketCap(selectedAsset.marketCap)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Volume</span>
                          <span className="font-medium">{selectedAsset.volume?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Exchange</span>
                          <span className="font-medium">{selectedAsset.exchange || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Currency</span>
                          <span className="font-medium">{selectedAsset.currency || 'USD'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Region</span>
                          <span className="font-medium">
                            {selectedAsset.region || 'Global'}
                          </span>
                        </div>
                      </div>

                      {selectedAsset.description && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">About</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {selectedAsset.description.length > 300 
                              ? selectedAsset.description.substring(0, 300) + '...'
                              : selectedAsset.description
                            }
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getAssetTypeColor(selectedAsset.type)}`}>
                          {selectedAsset.type.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                          {selectedAsset.exchange}
                        </span>
                        {selectedAsset.sector && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                            {selectedAsset.sector}
                          </span>
                        )}
                        {selectedAsset.lastUpdate && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Live Data
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an asset to view details</p>
                    <p className="text-sm mt-2">Real-time prices and market data</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};