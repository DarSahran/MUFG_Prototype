import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Building, DollarSign, Percent, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePortfolio } from '../hooks/usePortfolio';
import { UserProfile } from '../App';

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

interface SuperAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export const SuperAssetModal: React.FC<SuperAssetModalProps> = ({
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
  } = useForm<SuperFormData>({
    resolver: zodResolver(superSchema),
    defaultValues: {
      fundName: '',
      balance: userProfile.currentSuper || 0,
      contributionRate: 11, // Current SG rate
      investmentOption: 'balanced',
      employerContribution: userProfile.monthlyContribution || 0,
      memberNumber: '',
      notes: '',
    },
  });

  const watchedValues = watch();

  // Popular Australian super funds
  const popularFunds = [
    { name: 'Australian Super', type: 'Industry', members: '2.9M', rating: 4.5 },
    { name: 'AustralianSuper', type: 'Industry', members: '2.9M', rating: 4.5 },
    { name: 'Sunsuper (now Australian Retirement Trust)', type: 'Industry', members: '2.3M', rating: 4.4 },
    { name: 'REST Super', type: 'Industry', members: '1.9M', rating: 4.3 },
    { name: 'HESTA', type: 'Industry', members: '870K', rating: 4.4 },
    { name: 'Cbus Super', type: 'Industry', members: '850K', rating: 4.2 },
    { name: 'UniSuper', type: 'Industry', members: '650K', rating: 4.6 },
    { name: 'First State Super', type: 'Industry', members: '780K', rating: 4.1 },
    { name: 'Colonial First State', type: 'Retail', members: '750K', rating: 3.9 },
    { name: 'AMP Super', type: 'Retail', members: '600K', rating: 3.8 },
  ];

  const investmentOptions = [
    { value: 'conservative', label: 'Conservative', expectedReturn: 5.5, description: 'Lower risk, steady growth' },
    { value: 'balanced', label: 'Balanced', expectedReturn: 7.5, description: 'Mix of growth and defensive assets' },
    { value: 'growth', label: 'Growth', expectedReturn: 8.5, description: 'Higher growth potential' },
    { value: 'aggressive', label: 'Aggressive', expectedReturn: 9.5, description: 'Maximum growth, higher risk' },
    { value: 'ethical', label: 'Ethical/ESG', expectedReturn: 7.2, description: 'Sustainable investing focus' },
  ];

  const filteredFunds = popularFunds.filter(fund =>
    fund.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onFormSubmit = async (data: SuperFormData) => {
    setIsSubmitting(true);
    try {
      const selectedOption = investmentOptions.find(opt => opt.value === data.investmentOption);
      
      const result = await addHolding({
        type: 'super',
        name: data.fundName,
        quantity: 1,
        purchasePrice: data.balance,
        currentPrice: data.balance,
        currency: 'AUD',
        region: 'AU',
        purchaseDate: new Date().toISOString().split('T')[0],
        metadata: {
          fundName: data.fundName,
          contributionRate: data.contributionRate,
          investmentOption: data.investmentOption,
          expectedReturn: selectedOption?.expectedReturn || 7.5,
          employerContribution: data.employerContribution,
          memberNumber: data.memberNumber,
          notes: data.notes,
          addedAt: new Date().toISOString(),
        },
      });

      if (result.error) {
        alert('Error adding super fund: ' + result.error);
      } else {
        alert('Super fund added successfully!');
        reset();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting super form:', error);
      alert('Error adding super fund');
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
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Add Superannuation Fund</h2>
                  <p className="text-slate-600">Track your super balance and performance</p>
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
            {/* Left Panel - Fund Search */}
            <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search super funds..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Popular Super Funds</h3>
                <div className="space-y-2">
                  {filteredFunds.map((fund) => (
                    <button
                      key={fund.name}
                      onClick={() => {
                        register('fundName').onChange({ target: { value: fund.name } });
                        setSearchQuery(fund.name);
                      }}
                      className="w-full p-3 text-left border border-slate-200 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">{fund.name}</h4>
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <span>{fund.type} Fund</span>
                            <span>•</span>
                            <span>{fund.members} members</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-xs font-medium">{fund.rating}</span>
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
                    Fund Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      {...register('fundName')}
                      type="text"
                      value={searchQuery || watchedValues.fundName}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        register('fundName').onChange(e);
                      }}
                      placeholder="Enter or select fund name"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {errors.fundName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fundName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {errors.contributionRate && (
                      <p className="mt-1 text-sm text-red-600">{errors.contributionRate.message}</p>
                    )}
                  </div>
                </div>

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
                        {option.label} ({option.expectedReturn}% expected) - {option.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Employer Contribution (AUD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      {...register('employerContribution', { valueAsNumber: true })}
                      type="number"
                      step="10"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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

                {/* Summary */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Super Summary</h4>
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
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Super Fund'}
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