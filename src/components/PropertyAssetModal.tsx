import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, MapPin, Calendar, DollarSign, Building, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePortfolio } from '../hooks/usePortfolio';
import { UserProfile } from '../App';

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

interface PropertyAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export const PropertyAssetModal: React.FC<PropertyAssetModalProps> = ({
  isOpen,
  onClose,
  userProfile,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addHolding } = usePortfolio();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
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

  // Popular Australian locations for property investment
  const popularLocations = [
    { suburb: 'Sydney CBD', state: 'NSW', medianPrice: 1200000, growth: 5.2 },
    { suburb: 'Melbourne CBD', state: 'VIC', medianPrice: 850000, growth: 4.8 },
    { suburb: 'Brisbane CBD', state: 'QLD', medianPrice: 650000, growth: 6.1 },
    { suburb: 'Perth CBD', state: 'WA', medianPrice: 550000, growth: 3.9 },
    { suburb: 'Adelaide CBD', state: 'SA', medianPrice: 480000, growth: 4.5 },
    { suburb: 'Parramatta', state: 'NSW', medianPrice: 950000, growth: 5.8 },
    { suburb: 'Southbank', state: 'VIC', medianPrice: 780000, growth: 4.2 },
    { suburb: 'Fortitude Valley', state: 'QLD', medianPrice: 520000, growth: 5.5 },
  ];

  const filteredLocations = popularLocations.filter(location =>
    location.suburb.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onFormSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      const result = await addHolding({
        type: 'property',
        name: data.address,
        quantity: 1,
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
      });

      if (result.error) {
        alert('Error adding property: ' + result.error);
      } else {
        alert('Property added successfully!');
        reset();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting property form:', error);
      alert('Error adding property');
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
                  <Home className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Add Property Investment</h2>
                  <p className="text-slate-600">Track your real estate investments</p>
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
            {/* Left Panel - Location Search */}
            <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Popular Investment Locations</h3>
                <div className="space-y-2">
                  {filteredLocations.map((location) => (
                    <button
                      key={`${location.suburb}-${location.state}`}
                      onClick={() => {
                        setValue('location', `${location.suburb}, ${location.state}`);
                        setValue('marketValue', location.medianPrice);
                        setSearchQuery(`${location.suburb}, ${location.state}`);
                      }}
                      className="w-full p-3 text-left border border-slate-200 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">{location.suburb}</h4>
                          <p className="text-sm text-slate-600">{location.state}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">
                            ${(location.medianPrice / 1000).toFixed(0)}K
                          </div>
                          <div className="text-xs text-green-600">
                            +{location.growth}% growth
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-1/2 overflow-y-auto">
              <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Location/Suburb *
                    </label>
                    <input
                      {...register('location')}
                      type="text"
                      value={searchQuery || watchedValues.location}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        register('location').onChange(e);
                      }}
                      placeholder="e.g., Sydney CBD, NSW"
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

                <div className="grid grid-cols-2 gap-4">
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
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {errors.marketValue && (
                      <p className="mt-1 text-sm text-red-600">{errors.marketValue.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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

                {/* Property Summary */}
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
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};