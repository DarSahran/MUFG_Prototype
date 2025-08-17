import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bitcoin, Hash, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { AssetSearchResult } from '../../../services/assetSearch';

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

interface CryptoFormProps {
  selectedAsset?: AssetSearchResult;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const CryptoForm: React.FC<CryptoFormProps> = ({
  selectedAsset,
  onSubmit,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CryptoFormData>({
    resolver: zodResolver(cryptoSchema),
    defaultValues: {
      symbol: selectedAsset?.symbol || '',
      quantity: 0,
      purchasePrice: selectedAsset?.currentPrice || 0,
      exchange: selectedAsset?.exchange || '',
      purchaseDate: new Date().toISOString().split('T')[0],
      walletAddress: '',
      notes: '',
    },
  });

  const watchedValues = watch();
  const totalValue = watchedValues.quantity * watchedValues.purchasePrice;

  const onFormSubmit = async (data: CryptoFormData) => {
    if (!acknowledgedRisk) {
      alert('Please acknowledge the cryptocurrency risks before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assetData = {
        type: 'crypto',
        symbol: data.symbol,
        name: selectedAsset?.name || data.symbol,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        currentPrice: selectedAsset?.currentPrice || data.purchasePrice,
        currency: 'USD', // Most crypto priced in USD
        exchange: data.exchange,
        region: 'GLOBAL',
        purchaseDate: data.purchaseDate,
        metadata: {
          walletAddress: data.walletAddress,
          notes: data.notes,
          addedAt: new Date().toISOString(),
        },
      };
      
      await onSubmit(assetData);
    } catch (error) {
      console.error('Error submitting crypto form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Bitcoin className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Add Cryptocurrency</h3>
          <p className="text-sm text-slate-600">
            {selectedAsset ? `Adding ${selectedAsset.name}` : 'Enter cryptocurrency details'}
          </p>
        </div>
      </div>

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
        {/* Symbol and Exchange */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                readOnly={!!selectedAsset}
              />
            </div>
            {errors.symbol && (
              <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Exchange *
            </label>
            <input
              {...register('exchange')}
              type="text"
              placeholder="e.g., Coinbase, Binance"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.exchange && (
              <p className="mt-1 text-sm text-red-600">{errors.exchange.message}</p>
            )}
          </div>
        </div>

        {/* Quantity and Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Purchase Date and Wallet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Notes */}
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

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
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
  );
};