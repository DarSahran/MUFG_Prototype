import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, Calendar, DollarSign, Hash } from 'lucide-react';
import { AssetSearchResult } from '../../../services/assetSearch';

const stockSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol too long'),
  quantity: z.number().min(0.001, 'Quantity must be positive').max(1000000, 'Quantity too large'),
  purchasePrice: z.number().min(0.01, 'Price must be positive').max(10000, 'Price too high'),
  exchange: z.string().optional(),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  notes: z.string().optional(),
});

type StockFormData = z.infer<typeof stockSchema>;

interface StockFormProps {
  selectedAsset?: AssetSearchResult;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const StockForm: React.FC<StockFormProps> = ({
  selectedAsset,
  onSubmit,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      symbol: selectedAsset?.symbol || '',
      quantity: 1,
      purchasePrice: selectedAsset?.currentPrice || 0,
      exchange: selectedAsset?.exchange || '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const watchedValues = watch();
  const totalValue = watchedValues.quantity * watchedValues.purchasePrice;

  const onFormSubmit = async (data: StockFormData) => {
    setIsSubmitting(true);
    try {
      const assetData = {
        type: 'stock',
        symbol: data.symbol,
        name: selectedAsset?.name || data.symbol,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        currentPrice: selectedAsset?.currentPrice || data.purchasePrice,
        currency: selectedAsset?.currency || 'AUD',
        exchange: data.exchange || selectedAsset?.exchange,
        region: selectedAsset?.region || 'AU',
        purchaseDate: data.purchaseDate,
        metadata: {
          notes: data.notes,
          sector: selectedAsset?.sector,
          addedAt: new Date().toISOString(),
        },
      };
      
      await onSubmit(assetData);
    } catch (error) {
      console.error('Error submitting stock form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Add Stock Investment</h3>
          <p className="text-sm text-slate-600">
            {selectedAsset ? `Adding ${selectedAsset.name}` : 'Enter stock details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Stock Symbol */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Stock Symbol *
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              {...register('symbol')}
              type="text"
              placeholder="e.g., CBA.AX"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly={!!selectedAsset}
            />
          </div>
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>
          )}
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
              step="0.001"
              placeholder="Number of shares"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Purchase Price * ({selectedAsset?.currency || 'AUD'})
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('purchasePrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Price per share"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.purchasePrice && (
              <p className="mt-1 text-sm text-red-600">{errors.purchasePrice.message}</p>
            )}
          </div>
        </div>

        {/* Exchange and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Exchange
            </label>
            <input
              {...register('exchange')}
              type="text"
              placeholder="e.g., ASX"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly={!!selectedAsset}
            />
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

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Investment thesis, reminders, etc."
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
              <span className="font-medium">{selectedAsset?.currency || 'AUD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Asset Type</span>
              <span className="font-medium">Stock</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Region</span>
              <span className="font-medium">{selectedAsset?.region || 'AU'}</span>
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
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add to Portfolio'}
          </button>
        </div>
      </form>
    </div>
  );
};