import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bitcoin, Hash, Calendar, DollarSign, AlertTriangle, Search, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePortfolio } from '../hooks/usePortfolio';
import { UserProfile } from '../App';
import axios from 'axios';

const cryptoSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  quantity: z.number().min(0.00000001, 'Quantity must be positive'),
  purchasePrice: z.number().min(0.000001, 'Price must be positive'),
  exchange: z.string().min(1, 'Exchange is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  walletAddress: z.string().optional(),
  notes: z.string().optional(),
});

type CryptoFormData = z.infer<typeof cryptoSchema>;

interface CryptoAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  image: string;
}

export const CryptoAssetModal: React.FC<CryptoAssetModalProps> = ({
  isOpen,
  onClose,
  userProfile,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const { addHolding } = usePortfolio();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<CryptoFormData>({
    resolver: zodResolver(cryptoSchema),
    defaultValues: {
      symbol: '',
      quantity: 0,
      purchasePrice: 0,
      exchange: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      walletAddress: '',
      notes: '',
    },
  });

  const watchedValues = watch();
  const totalValue = watchedValues.quantity * watchedValues.purchasePrice;

  // Fetch popular cryptocurrencies
  useEffect(() => {
    if (isOpen) {
      fetchPopularCryptos();
    }
  }, [isOpen]);

  const fetchPopularCryptos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 20,
          page: 1,
          sparkline: false,
        },
        timeout: 5000,
      });

      setCryptoAssets(response.data);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      // Fallback to popular cryptos
      setCryptoAssets([
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          current_price: 45000,
          market_cap: 850000000000,
          price_change_percentage_24h: 2.5,
          image: '',
        },
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          current_price: 3200,
          market_cap: 380000000000,
          price_change_percentage_24h: -1.2,
          image: '',
        },
        {
          id: 'cardano',
          symbol: 'ADA',
          name: 'Cardano',
          current_price: 0.45,
          market_cap: 15000000000,
          price_change_percentage_24h: 3.8,
          image: '',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptos = cryptoAssets.filter(crypto =>
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCryptoSelect = (crypto: CryptoAsset) => {
    setSelectedCrypto(crypto);
    setValue('symbol', `${crypto.symbol}-USD`);
    setValue('purchasePrice', crypto.current_price);
    setSearchQuery(crypto.name);
  };

  const onFormSubmit = async (data: CryptoFormData) => {
    if (!acknowledgedRisk) {
      alert('Please acknowledge the cryptocurrency risks before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addHolding({
        type: 'crypto',
        symbol: data.symbol,
        name: selectedCrypto?.name || data.symbol,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        currentPrice: selectedCrypto?.current_price || data.purchasePrice,
        currency: 'USD',
        exchange: data.exchange,
        region: 'GLOBAL',
        purchaseDate: data.purchaseDate,
        metadata: {
          walletAddress: data.walletAddress,
          notes: data.notes,
          coinGeckoId: selectedCrypto?.id,
          addedAt: new Date().toISOString(),
        },
      });

      if (result.error) {
        alert('Error adding cryptocurrency: ' + result.error);
      } else {
        alert('Cryptocurrency added successfully!');
        reset();
        setSelectedCrypto(null);
        setAcknowledgedRisk(false);
        onClose();
      }
    } catch (error) {
      console.error('Error submitting crypto form:', error);
      alert('Error adding cryptocurrency');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bitcoin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Add Cryptocurrency</h2>
                  <p className="text-slate-600">Track your digital asset investments</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex h-96">
            {/* Left Panel - Crypto Search */}
            <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cryptocurrencies..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCryptos.map((crypto) => (
                      <button
                        key={crypto.id}
                        onClick={() => handleCryptoSelect(crypto)}
                        className={`w-full p-3 text-left border rounded-lg hover:shadow-md transition-all ${
                          selectedCrypto?.id === crypto.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-orange-600">
                                {crypto.symbol.substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">{crypto.name}</h4>
                              <p className="text-sm text-slate-600">{crypto.symbol.toUpperCase()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">
                              ${crypto.current_price.toLocaleString()}
                            </div>
                            <div className={`text-xs font-medium ${
                              crypto.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                              {crypto.price_change_percentage_24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-1/2 overflow-y-auto">
              <div className="p-6">
                {/* Risk Warning */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-2">High Risk Investment</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Cryptocurrencies are highly volatile and speculative investments. 
                        Only invest what you can afford to lose.
                      </p>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={acknowledgedRisk}
                          onChange={(e) => setAcknowledgedRisk(e.target.checked)}
                          className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-red-700">
                          I understand and acknowledge the risks
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cryptocurrency Symbol *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        {...register('symbol')}
                        type="text"
                        placeholder="e.g., BTC-USD"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        readOnly={!!selectedCrypto}
                      />
                    </div>
                    {errors.symbol && (
                      <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        {...register('quantity', { valueAsNumber: true })}
                        type="number"
                        step="0.00000001"
                        placeholder="Amount owned"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Average Purchase Price * (USD)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          {...register('purchasePrice', { valueAsNumber: true })}
                          type="number"
                          step="0.000001"
                          placeholder="Price per unit"
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {errors.purchasePrice && (
                        <p className="mt-1 text-sm text-red-600">{errors.purchasePrice.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Exchange *
                      </label>
                      <select
                        {...register('exchange')}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Exchange</option>
                        <option value="Coinbase">Coinbase</option>
                        <option value="Binance">Binance</option>
                        <option value="Kraken">Kraken</option>
                        <option value="Coinspot">Coinspot (AU)</option>
                        <option value="Independent Reserve">Independent Reserve (AU)</option>
                        <option value="Swyftx">Swyftx (AU)</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.exchange && (
                        <p className="mt-1 text-sm text-red-600">{errors.exchange.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Purchase Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          {...register('purchaseDate')}
                          type="date"
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {errors.purchaseDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.purchaseDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Wallet Address (Optional)
                    </label>
                    <input
                      {...register('walletAddress')}
                      type="text"
                      placeholder="Your wallet address"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      placeholder="Investment thesis, trading strategy, etc."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Investment Summary */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">Investment Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Investment</span>
                        <span className="font-medium">${totalValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Currency</span>
                        <span className="font-medium">USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Asset Type</span>
                        <span className="font-medium">Cryptocurrency</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Risk Level</span>
                        <span className="font-medium text-red-600">Very High</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !acknowledgedRisk}
                      className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Adding...' : 'Add to Portfolio'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};