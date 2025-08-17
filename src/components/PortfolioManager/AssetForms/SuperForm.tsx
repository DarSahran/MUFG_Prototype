import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target, Building, DollarSign, Percent } from 'lucide-react';
import { AssetSearchResult } from '../../../services/assetSearch';

const superSchema = z.object({
  fundName: z.string().min(1, 'Fund name is required'),
  balance: z.number().min(0, 'Balance must be positive'),
  contributionRate: z.number().min(0, 'Rate must be positive').max(100, 'Rate cannot exceed 100%'),
  investmentOption: z.string().min(1, 'Investment option is required'),
  employerContribution: z.number().min(0, 'Must be positive').optional(),
  memberNumber: z.string().optional(),
  notes: z.string().optional(),
});

type SuperFormData = z.infer<typeof superSchema>;

interface SuperFormProps {
  selectedAsset?: AssetSearchResult;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const SuperForm: React.FC<SuperFormProps> = ({
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
  } = useForm<SuperFormData>({
    resolver: zodResolver(superSchema),
    defaultValues: {
      fundName: '',
      balance: 0,
      contributionRate: 11, // Current SG rate
      investmentOption: 'balanced',
      employerContribution: 0,
      memberNumber: '',
      notes: '',
    },
  });

  const watchedValues = watch();
  const annualContribution = (watchedValues.contributionRate / 100) * 50000; // Assuming $50k salary

  const investmentOptions = [
    { value: 'conservative', label: 'Conservative', expectedReturn: 5.5 },
    { value: 'balanced', label: 'Balanced', expectedReturn: 7.5 },
    { value: 'growth', label: 'Growth', expectedReturn: 8.5 },
    { value: 'aggressive', label: 'Aggressive', expectedReturn: 9.5 },
    { value: 'ethical', label: 'Ethical/ESG', expectedReturn: 7.2 },
  ];

  const onFormSubmit = async (data: SuperFormData) => {
    setIsSubmitting(true);
    try {
      const assetData = {
        type: 'super',
        name: data.fundName,
        quantity: 1, // Super is typically tracked as a single balance
        purchasePrice: data.balance,
        currentPrice: data.balance,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: new Date().toISOString().split('T')[0],
        metadata: {
          fundName: data.fundName,
          contributionRate: data.contributionRate,
          investmentOption: data.investmentOption,
          employerContribution: data.employerContribution,
          memberNumber: data.memberNumber,
          notes: data.notes,
          addedAt: new Date().toISOString(),
        },
      };
      
      await onSubmit(assetData);
    } catch (error) {
      console.error('Error submitting super form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Target className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Add Superannuation Fund</h3>
          <p className="text-sm text-slate-600">Track your super balance and contributions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Fund Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fund Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('fundName')}
                type="text"
                placeholder="e.g., Australian Super"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.fundName && (
              <p className="mt-1 text-sm text-red-600">{errors.fundName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Member Number (Optional)
            </label>
            <input
              {...register('memberNumber')}
              type="text"
              placeholder="Your member number"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Balance and Contributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Balance * (AUD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('balance', { valueAsNumber: true })}
                type="number"
                step="100"
                placeholder="Current super balance"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.balance && (
              <p className="mt-1 text-sm text-red-600">{errors.balance.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contribution Rate * (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('contributionRate', { valueAsNumber: true })}
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="11.0"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.contributionRate && (
              <p className="mt-1 text-sm text-red-600">{errors.contributionRate.message}</p>
            )}
          </div>
        </div>

        {/* Investment Option */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Investment Option *
          </label>
          <select
            {...register('investmentOption')}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {investmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} (Expected: {option.expectedReturn}% p.a.)
              </option>
            ))}
          </select>
          {errors.investmentOption && (
            <p className="mt-1 text-sm text-red-600">{errors.investmentOption.message}</p>
          )}
        </div>

        {/* Additional Details */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Employer Contribution (Monthly AUD)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              {...register('employerContribution', { valueAsNumber: true })}
              type="number"
              step="10"
              placeholder="Monthly employer contribution"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            placeholder="Fund performance notes, strategy, etc."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Super Summary */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Superannuation Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Current Balance</span>
              <span className="font-medium">${watchedValues.balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Contribution Rate</span>
              <span className="font-medium">{watchedValues.contributionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Investment Option</span>
              <span className="font-medium capitalize">{watchedValues.investmentOption}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Expected Return</span>
              <span className="font-medium text-green-600">
                {investmentOptions.find(opt => opt.value === watchedValues.investmentOption)?.expectedReturn || 7.5}%
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
            disabled={isSubmitting || !acknowledgedRisk}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Super Fund'}
          </button>
        </div>
      </form>
    </div>
  );
};