import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, MapPin, Calendar, DollarSign } from 'lucide-react';
import { AssetSearchResult } from '../../../services/assetSearch';

const propertySchema = z.object({
  address: z.string().min(1, 'Address is required'),
  marketValue: z.number().min(1000, 'Market value must be at least $1,000'),
  purchasePrice: z.number().min(1000, 'Purchase price must be at least $1,000'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  propertyType: z.enum(['residential', 'commercial', 'industrial', 'land']),
  location: z.string().min(1, 'Location is required'),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  landSize: z.number().optional(),
  rentalIncome: z.number().optional(),
  notes: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  selectedAsset?: AssetSearchResult;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
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
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      address: '',
      marketValue: 0,
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      propertyType: 'residential',
      location: '',
      bedrooms: 3,
      bathrooms: 2,
      landSize: 600,
      rentalIncome: 0,
      notes: '',
    },
  });

  const watchedValues = watch();
  const capitalGain = watchedValues.marketValue - watchedValues.purchasePrice;
  const capitalGainPercent = watchedValues.purchasePrice > 0 ? (capitalGain / watchedValues.purchasePrice) * 100 : 0;

  const onFormSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      const assetData = {
        type: 'property',
        name: data.address,
        quantity: 1, // Properties are typically whole units
        purchasePrice: data.purchasePrice,
        currentPrice: data.marketValue,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: data.purchaseDate,
        metadata: {
          address: data.address,
          propertyType: data.propertyType,
          location: data.location,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          landSize: data.landSize,
          rentalIncome: data.rentalIncome,
          notes: data.notes,
          addedAt: new Date().toISOString(),
        },
      };
      
      await onSubmit(assetData);
    } catch (error) {
      console.error('Error submitting property form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Home className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Add Property Investment</h3>
          <p className="text-sm text-slate-600">Enter property details and valuation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Property Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Property Address *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              {...register('address')}
              type="text"
              placeholder="123 Main Street, Sydney NSW 2000"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        {/* Location and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location/Suburb *
            </label>
            <input
              {...register('location')}
              type="text"
              placeholder="e.g., Sydney CBD"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Property Type *
            </label>
            <select
              {...register('propertyType')}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="land">Land</option>
            </select>
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bedrooms
            </label>
            <input
              {...register('bedrooms', { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bathrooms
            </label>
            <input
              {...register('bathrooms', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.5"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Land Size (sqm)
            </label>
            <input
              {...register('landSize', { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Purchase Price * (AUD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('purchasePrice', { valueAsNumber: true })}
                type="number"
                step="1000"
                placeholder="Original purchase price"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.purchasePrice && (
              <p className="mt-1 text-sm text-red-600">{errors.purchasePrice.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Market Value * (AUD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('marketValue', { valueAsNumber: true })}
                type="number"
                step="1000"
                placeholder="Current estimated value"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.marketValue && (
              <p className="mt-1 text-sm text-red-600">{errors.marketValue.message}</p>
            )}
          </div>
        </div>

        {/* Rental Income and Purchase Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Weekly Rental Income (AUD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('rentalIncome', { valueAsNumber: true })}
                type="number"
                step="10"
                placeholder="Weekly rent received"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
            placeholder="Property details, investment strategy, etc."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Investment Summary */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Property Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Current Value</span>
              <span className="font-medium">${watchedValues.marketValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Capital Gain</span>
              <span className={`font-medium ${capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {capitalGain >= 0 ? '+' : ''}${capitalGain.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Gain %</span>
              <span className={`font-medium ${capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {capitalGain >= 0 ? '+' : ''}{capitalGainPercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Annual Rental</span>
              <span className="font-medium">
                ${((watchedValues.rentalIncome || 0) * 52).toLocaleString()}
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
            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
};