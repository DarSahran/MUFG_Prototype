import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Building, Calendar, DollarSign, Percent } from 'lucide-react';
import { AssetSearchResult } from '../../../services/assetSearch';

const bondSchema = z.object({
  issuer: z.string().min(1, 'Issuer is required'),
  faceValue: z.number().min(100, 'Face value must be at least $100'),
  couponRate: z.number().min(0, 'Coupon rate must be positive').max(20, 'Rate seems too high'),
  maturityDate: z.string().min(1, 'Maturity date is required'),
  purchasePrice: z.number().min(50, 'Purchase price must be positive'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  bondType: z.enum(['government', 'corporate', 'municipal', 'treasury']),
  rating: z.string().optional(),
  notes: z.string().optional(),
});

type BondFormData = z.infer<typeof bondSchema>;

interface BondFormProps {
  selectedAsset?: AssetSearchResult;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const BondForm: React.FC<BondFormProps> = ({
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
  } = useForm<BondFormData>({
    resolver: zodResolver(bondSchema),
    defaultValues: {
      issuer: selectedAsset?.name || '',
      faceValue: 1000,
      couponRate: 4.0,
      maturityDate: '',
      purchasePrice: selectedAsset?.currentPrice || 1000,
      purchaseDate: new Date().toISOString().split('T')[0],
      bondType: 'government',
      rating: 'AAA',
      notes: '',
    },
  });

  const watchedValues = watch();
  const yieldToMaturity = watchedValues.faceValue > 0 && watchedValues.purchasePrice > 0 
    ? ((watchedValues.faceValue - watchedValues.purchasePrice) / watchedValues.purchasePrice) * 100
    : 0;

  const onFormSubmit = async (data: BondFormData) => {
    setIsSubmitting(true);
    try {
      const assetData = {
        type: 'bond',
        name: `${data.issuer} Bond`,
        quantity: 1, // Bonds typically tracked as units
        purchasePrice: data.purchasePrice,
        currentPrice: data.purchasePrice, // Would need market pricing
        currency: 'AUD',
        region: 'AU',
        purchaseDate: data.purchaseDate,
        metadata: {
          issuer: data.issuer,
          faceValue: data.faceValue,
          couponRate: data.couponRate,
          maturityDate: data.maturityDate,
          bondType: data.bondType,
          rating: data.rating,
          notes: data.notes,
          addedAt: new Date().toISOString(),
        },
      };
      
      await onSubmit(assetData);
    } catch (error) {
      console.error('Error submitting bond form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Shield className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Add Bond Investment</h3>
          <p className="text-sm text-slate-600">Fixed income security details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Issuer and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Issuer *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('issuer')}
                type="text"
                placeholder="e.g., Commonwealth of Australia"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.issuer && (
              <p className="mt-1 text-sm text-red-600">{errors.issuer.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bond Type *
            </label>
            <select
              {...register('bondType')}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="government">Government Bond</option>
              <option value="corporate">Corporate Bond</option>
              <option value="municipal">Municipal Bond</option>
              <option value="treasury">Treasury Bond</option>
            </select>
          </div>
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Face Value * (AUD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('faceValue', { valueAsNumber: true })}
                type="number"
                step="100"
                placeholder="1000"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.faceValue && (
              <p className="mt-1 text-sm text-red-600">{errors.faceValue.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Coupon Rate * (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('couponRate', { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="4.0"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.couponRate && (
              <p className="mt-1 text-sm text-red-600">{errors.couponRate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Purchase Price * (AUD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('purchasePrice', { valueAsNumber: true })}
                type="number"
                step="10"
                placeholder="Purchase price"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.purchasePrice && (
              <p className="mt-1 text-sm text-red-600">{errors.purchasePrice.message}</p>
            )}
          </div>
        </div>

        {/* Dates and Rating */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              Maturity Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('maturityDate')}
                type="date"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.maturityDate && (
              <p className="mt-1 text-sm text-red-600">{errors.maturityDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Credit Rating
            </label>
            <select
              {...register('rating')}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="AAA">AAA (Highest)</option>
              <option value="AA">AA (High)</option>
              <option value="A">A (Upper Medium)</option>
              <option value="BBB">BBB (Lower Medium)</option>
              <option value="BB">BB (Speculative)</option>
              <option value="B">B (Highly Speculative)</option>
            </select>
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
            placeholder="Bond details, investment strategy, etc."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Bond Summary */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Bond Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Face Value</span>
              <span className="font-medium">${watchedValues.faceValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Purchase Price</span>
              <span className="font-medium">${watchedValues.purchasePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Coupon Rate</span>
              <span className="font-medium">{watchedValues.couponRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Yield to Maturity</span>
              <span className="font-medium text-green-600">
                {yieldToMaturity.toFixed(2)}%
              </span>
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
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Bond'}
          </button>
        </div>
      </form>
    </div>
  );
};