import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Star, Crown, CheckCircle, ArrowRight } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { usePlanAccess } from '../../hooks/usePlanAccess';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'api_limit' | 'realtime_access' | 'advanced_features';
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  reason = 'api_limit'
}) => {
  const { createCheckoutSession } = useSubscription();
  const { userPlan } = usePlanAccess();

  const plans = [
    {
      id: 'pro',
      name: 'SuperAI Pro',
      price: 29,
      priceId: 'price_1Ry7t7CrbvEh5Z2rRrBDBC9V',
      icon: Zap,
      color: 'green',
      features: [
        '100 AI queries per month',
        'Real-time market data',
        'Advanced portfolio analytics',
        'Priority email support',
        'Export reports (PDF/Excel)'
      ],
      highlight: reason === 'api_limit' || reason === 'realtime_access'
    },
    {
      id: 'family',
      name: 'SuperAI Family',
      price: 49,
      priceId: 'price_1Ry7taCrbvEh5Z2r6oamOPoQ',
      icon: Star,
      color: 'purple',
      features: [
        '200 AI queries per month',
        'Up to 4 family accounts',
        'Shared financial goals',
        'Family reporting dashboard',
        'Joint portfolio management'
      ],
      highlight: false
    },
    {
      id: 'enterprise',
      name: 'SuperAI Enterprise',
      price: 199,
      priceId: 'price_1Ry7v4CrbvEh5Z2rgmtLGpfT',
      icon: Crown,
      color: 'orange',
      features: [
        '1000 AI queries per month',
        'Unlimited client accounts',
        'API access & integrations',
        'Dedicated account manager',
        'Custom branding options'
      ],
      highlight: reason === 'advanced_features'
    }
  ];

  const getReasonMessage = () => {
    switch (reason) {
      case 'api_limit':
        return {
          title: 'You\'ve reached your AI query limit',
          description: 'Upgrade to continue getting personalized financial advice and market insights.',
          icon: Zap
        };
      case 'realtime_access':
        return {
          title: 'Real-time data requires an upgrade',
          description: 'Get live market updates and real-time portfolio tracking with a premium plan.',
          icon: Star
        };
      case 'advanced_features':
        return {
          title: 'Advanced features available',
          description: 'Unlock powerful analytics, API access, and enterprise-grade tools.',
          icon: Crown
        };
      default:
        return {
          title: 'Upgrade your plan',
          description: 'Get more features and higher limits with a premium subscription.',
          icon: Zap
        };
    }
  };

  const handleUpgrade = async (priceId: string) => {
    try {
      await createCheckoutSession(priceId, 'subscription');
    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process: ' + error.message);
    }
  };

  const reasonInfo = getReasonMessage();
  const ReasonIcon = reasonInfo.icon;

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
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ReasonIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{reasonInfo.title}</h2>
                  <p className="text-slate-600 mt-1">{reasonInfo.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Current Plan Info */}
          {userPlan && (
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Current Plan: {userPlan.name}</h3>
                  <p className="text-sm text-slate-600">
                    {userPlan.remaining}/{userPlan.features.apiCallLimit} AI queries remaining
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">Resets in</div>
                  <div className="font-semibold text-slate-900">
                    {Math.ceil((new Date(userPlan.resetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plans */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isHighlighted = plan.highlight;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
                      isHighlighted 
                        ? 'border-blue-500 bg-blue-50 scale-105' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                          Recommended
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className={`inline-flex items-center justify-center w-16 h-16 bg-${plan.color}-100 rounded-2xl mb-4`}>
                        <Icon className={`w-8 h-8 text-${plan.color}-600`} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-slate-900 mb-1">
                        ${plan.price}<span className="text-lg text-slate-600">/month</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpgrade(plan.priceId)}
                      className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                        isHighlighted 
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl' 
                          : `bg-${plan.color}-600 hover:bg-${plan.color}-700 shadow-md hover:shadow-lg`
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Upgrade to {plan.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Benefits Summary */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Why Upgrade?</h3>
                <p className="text-blue-100 mb-4">
                  Get unlimited access to AI-powered financial insights and real-time market data
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-semibold mb-1">More AI Queries</div>
                    <div className="text-blue-100">Get up to 1000 monthly queries</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-semibold mb-1">Real-Time Data</div>
                    <div className="text-blue-100">Live market updates & alerts</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-semibold mb-1">Advanced Analytics</div>
                    <div className="text-blue-100">Portfolio optimization tools</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};