import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Globe, DollarSign, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { assetSearchService, AssetSearchResult } from '../../../services/assetSearch';

interface AssetSearchInputProps {
  onAssetSelect: (asset: AssetSearchResult) => void;
  assetType?: string;
  region?: 'AU' | 'US' | 'IN';
  placeholder?: string;
}

export const AssetSearchInput: React.FC<AssetSearchInputProps> = ({
  onAssetSelect,
  assetType,
  region,
  placeholder = "Search stocks, ETFs, crypto...",
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AssetSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      searchAssets(query);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [query, assetType, region]);

  const searchAssets = async (searchQuery: string) => {
    setLoading(true);
    try {
      let results = await assetSearchService.searchAssets(searchQuery, 10);
      
      // Filter by asset type if specified
      if (assetType) {
        results = results.filter(asset => asset.type === assetType);
      }
      
      // Filter by region if specified
      if (region) {
        results = results.filter(asset => asset.region === region || asset.region === 'GLOBAL');
      }
      
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Asset search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleAssetSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleAssetSelect = (asset: AssetSearchResult) => {
    onAssetSelect(asset);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'stock': return TrendingUp;
      case 'crypto': return Globe;
      default: return DollarSign;
    }
  };

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'stock': return 'text-blue-600 bg-blue-100';
      case 'etf': return 'text-green-600 bg-green-100';
      case 'crypto': return 'text-orange-600 bg-orange-100';
      case 'bond': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
          >
            {suggestions.map((asset, index) => {
              const Icon = getAssetTypeIcon(asset.type);
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={`${asset.symbol}-${index}`}
                  onClick={() => handleAssetSelect(asset)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getAssetTypeColor(asset.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{asset.symbol}</div>
                        <div className="text-sm text-slate-600 truncate max-w-xs">{asset.name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-slate-500">{asset.exchange}</span>
                          {asset.sector && (
                            <>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{asset.sector}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {asset.currentPrice && (
                        <div className="font-semibold text-slate-900">
                          ${asset.currentPrice.toLocaleString()}
                        </div>
                      )}
                      <div className="text-xs text-slate-500">{asset.currency}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      {isOpen && suggestions.length === 0 && query.length >= 2 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-6 text-center"
        >
          <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-2">No assets found for "{query}"</p>
          <p className="text-sm text-slate-500">
            Try searching for a stock symbol, company name, or cryptocurrency
          </p>
        </motion.div>
      )}
    </div>
  );
};