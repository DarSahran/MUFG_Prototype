import React, { useState } from 'react';
import { Check, X, Star, Zap, Crown, Users, TrendingUp, Shield, Calculator, Bot, BarChart3, Globe, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscription } from '../hooks/useSubscription';
import { STRIPE_PRODUCTS, getMonthlyAndYearlyProducts } from '../stripe-config';

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedTier, setSelectedTier] = useState<string>('pro');
  const { createCheckoutSession, loading: subscriptionLoading } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const groupedProducts = getMonthlyAndYearlyProducts();
  
  const pricingTiers = [
    {
      id: 'free',
      name: 'SuperAI Free',
      tagline: 'Perfect for getting started',
      audience: 'New investors & students',
      icon: TrendingUp,
      color: 'blue',
      pricing: {
        monthly: 0,
        yearly: 0,
        yearlyDiscount: 0,
      },
      features: {
        included: [
          'Basic portfolio tracking (up to 5 holdings)',
          'Monthly AI insights & recommendations',
          'Educational content access',
          'Basic retirement calculator',
          'Mobile app access',
          'Email support',
          'Standard market data (15-min delay)',
          'Basic asset allocation guidance'
        ],
        limitations: [
          'Limited to 5 holdings',
          '1 AI consultation per month',
          'Basic charts only',
          'No advanced forecasting',
          'No real-time data',
          'No export features'
        ]
      },
      cta: 'Start Free',
      popular: false
    },
    ...Object.entries(groupedProducts).map(([category, products]) => {
      const monthlyProduct = products.monthly;
      const yearlyProduct = products.yearly;
      
      if (!monthlyProduct && !yearlyProduct) return null;
      
      const baseProduct = monthlyProduct || yearlyProduct!;
      const monthlyPrice = monthlyProduct?.price || 0;
      const yearlyPrice = yearlyProduct?.price || 0;
      const yearlyDiscount = monthlyPrice > 0 && yearlyPrice > 0 
        ? Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)
        : 0;
      
      return {
        id: category,
        name: baseProduct.name,
        tagline: baseProduct.description,
        audience: category === 'pro' ? 'Active investors & professionals' :
                 category === 'family' ? 'Families & financial planning together' :
                 'Financial advisors & institutions',
        icon: category === 'pro' ? Zap : category === 'family' ? Users : Crown,
        color: category === 'pro' ? 'green' : category === 'family' ? 'purple' : 'orange',
        pricing: {
          monthly: monthlyPrice,
          yearly: yearlyPrice,
          yearlyDiscount,
        },
        features: {
          included: baseProduct.features,
          limitations: category === 'pro' ? [
            'Up to 3 AI consultations per week',
            'Standard API rate limits',
            'No white-label features'
          ] : category === 'family' ? [
            'Maximum 4 family members',
            'Shared AI consultation limits'
          ] : []
        },
        cta: category === 'enterprise' ? 'Contact Sales' : 
             category === 'family' ? 'Start Family Plan' : 'Start Pro Trial',
        popular: category === 'pro',
        monthlyProduct,
        yearlyProduct,
      };
    }).filter(Boolean)
  ];

  const handlePurchase = async (tier: any) => {
    if (tier.id === 'free') {
      // Handle free tier signup
      return;
    }
    
    if (tier.id === 'enterprise') {
      // Handle enterprise contact
      window.location.href = 'mailto:enterprise@superaiadvisor.com';
      return;
    }
    
    const product = billingCycle === 'monthly' ? tier.monthlyProduct : tier.yearlyProduct;
    if (!product) {
      alert('Product not available for selected billing cycle');
      return;
    }
    
    setCheckoutLoading(tier.id);
    try {
      await createCheckoutSession(product.priceId, 'subscription');
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout: ' + error.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const comparisonFeatures = [
    {
      category: 'Portfolio Management',
      features: [
        { name: 'Holdings Tracking', free: '5 holdings', pro: 'Unlimited', family: 'Unlimited', enterprise: 'Unlimited' },
        { name: 'Real-time Data', free: false, pro: true, family: true, enterprise: true },
        { name: 'Performance Analytics', free: 'Basic', pro: 'Advanced', family: 'Advanced', enterprise: 'Institutional' },
        { name: 'Goal Tracking', free: '1 goal', pro: '10 goals', family: 'Family goals', enterprise: 'Unlimited' },
      ]
    },
    {
      category: 'AI Features',
      features: [
        { name: 'AI Recommendations', free: '1/month', pro: '3/week', family: '5/week', enterprise: 'Unlimited' },
        { name: 'Market Insights', free: 'Monthly', pro: 'Weekly', family: 'Weekly', enterprise: 'Daily' },
        { name: 'Risk Analysis', free: 'Basic', pro: 'Advanced', family: 'Family-focused', enterprise: 'Institutional' },
        { name: 'Tax Optimization', free: false, pro: true, family: 'Family tax planning', enterprise: true },
      ]
    },
    {
      category: 'Family & Collaboration',
      features: [
        { name: 'Family Accounts', free: false, pro: false, family: 'Up to 4 members', enterprise: 'Unlimited' },
        { name: 'Shared Goals', free: false, pro: false, family: true, enterprise: true },
        { name: 'Joint Planning', free: false, pro: false, family: true, enterprise: true },
        { name: 'Estate Planning', free: false, pro: false, family: 'Basic', enterprise: 'Advanced' },
      ]
    },
    {
      category: 'Forecasting & Analysis',
      features: [
        { name: 'Retirement Calculator', free: 'Basic', pro: 'Advanced', family: 'Family planning', enterprise: 'Custom' },
        { name: 'Monte Carlo Simulation', free: false, pro: true, family: true, enterprise: true },
        { name: 'Scenario Modeling', free: false, pro: '5 scenarios', family: '10 scenarios', enterprise: 'Unlimited' },
        { name: 'Benchmarking', free: false, pro: 'Market indices', family: 'Family benchmarks', enterprise: 'Custom benchmarks' },
      ]
    },
    {
      category: 'Support & Features',
      features: [
        { name: 'Support', free: 'Email', pro: 'Email + Chat', family: 'Priority support', enterprise: 'Phone + Dedicated AM' },
        { name: 'Data Export', free: false, pro: 'PDF/Excel', family: 'Family reports', enterprise: 'API + Custom' },
        { name: 'Mobile App', free: true, pro: true, family: true, enterprise: true },
        { name: 'API Access', free: false, pro: 'Limited', family: 'Standard', enterprise: 'Full' },
      ]
    }
  ];

  const getPrice = (tier: any) => {
    if (tier.pricing.monthly === 0) return 'Free';
    const price = billingCycle === 'monthly' ? tier.pricing.monthly : tier.pricing.yearly;
    const period = billingCycle === 'monthly' ? '/month' : '/year';
    return `$${price}${period}`;
  };

  const getSavings = (tier: any) => {
    if (tier.pricing.monthly === 0 || billingCycle === 'monthly') return null;
    const monthlyCost = tier.pricing.monthly * 12;
    const savings = monthlyCost - tier.pricing.yearly;
    return `Save $${savings} (${tier.pricing.yearlyDiscount}% off)`;
  };

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'button') => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-500',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-500',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-500',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-500',
        button: 'bg-orange-600 hover:bg-orange-700'
      }
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant];
  };

  const renderFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-slate-400 mx-auto" />
      );
    }
    return <span className="text-sm font-medium text-slate-900">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-500 py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
                Choose Your Investment Journey
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
                From free portfolio tracking to enterprise-grade wealth management. 
                Find the perfect plan for your financial goals.
              </p>
            </motion.div>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center space-x-4 mb-8"
            >
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-blue-200'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingCycle === 'yearly' ? 'bg-green-600' : 'bg-white/30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-blue-200'}`}>
                Yearly
              </span>
              {billingCycle === 'yearly' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Save up to 16%
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            const isPopular = tier.popular;
            
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                  isPopular 
                    ? 'border-green-500 scale-105' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${getColorClasses(tier.color, 'bg')} rounded-2xl mb-4`}>
                      <Icon className={`w-8 h-8 ${getColorClasses(tier.color, 'text')}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                    <p className="text-slate-600 mb-4">{tier.tagline}</p>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        {getPrice(tier)}
                      </div>
                      {getSavings(tier) && (
                        <div className="text-sm text-green-600 font-medium">
                          {getSavings(tier)}
                        </div>
                      )}
                      <div className="text-sm text-slate-500 mt-1">
                        {tier.audience}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {tier.features.included.slice(0, 6).map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                    
                    {tier.features.included.length > 6 && (
                      <div className="text-sm text-slate-500 italic">
                        +{tier.features.included.length - 6} more features
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePurchase(tier)}
                    disabled={checkoutLoading === tier.id}
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                      isPopular 
                        ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl' 
                        : `${getColorClasses(tier.color, 'button')} shadow-md hover:shadow-lg`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {checkoutLoading === tier.id ? 'Loading...' : tier.cta}
                  </button>

                  {tier.id === 'free' && (
                    <p className="text-xs text-slate-500 text-center mt-3">
                      No credit card required
                    </p>
                  )}
                  
                  {(tier.id === 'pro' || tier.id === 'family') && (
                    <p className="text-xs text-slate-500 text-center mt-3">
                      14-day free trial • Cancel anytime
                    </p>
                  )}
                  
                  {tier.id === 'enterprise' && (
                    <p className="text-xs text-slate-500 text-center mt-3">
                      Custom pricing available
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16"
        >
          <div className="p-8 border-b border-slate-200">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
              Compare All Features
            </h2>
            <p className="text-slate-600 text-center">
              Detailed breakdown of what's included in each plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Features</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Free</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 bg-green-50">
                    <div className="flex items-center justify-center space-x-2">
                      <span>Pro</span>
                      <Star className="w-4 h-4 text-green-600" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 bg-purple-50">
                    <div className="flex items-center justify-center space-x-2">
                      <span>Family</span>
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonFeatures.map((category) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-slate-25">
                      <td colSpan={5} className="px-6 py-3 text-sm font-bold text-slate-800 bg-slate-100">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">{feature.name}</td>
                        <td className="px-6 py-4 text-center">{renderFeatureValue(feature.free)}</td>
                        <td className="px-6 py-4 text-center bg-green-25">{renderFeatureValue(feature.pro)}</td>
                        <td className="px-6 py-4 text-center bg-purple-25">{renderFeatureValue(feature.family)}</td>
                        <td className="px-6 py-4 text-center">{renderFeatureValue(feature.enterprise)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center p-6 bg-white rounded-xl shadow-lg"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">50,000+ Users</h3>
            <p className="text-slate-600">
              Join thousands of Australians already optimizing their superannuation with AI
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center p-6 bg-white rounded-xl shadow-lg"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">$2.3B+ Tracked</h3>
            <p className="text-slate-600">
              Total portfolio value managed through our platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center p-6 bg-white rounded-xl shadow-lg"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Bank-Level Security</h3>
            <p className="text-slate-600">
              Your financial data is protected with enterprise-grade encryption
            </p>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-slate-600 mb-6">
                Yes! You can change your plan at any time. Upgrades take effect immediately, 
                and downgrades take effect at the end of your current billing cycle.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Is there a free trial for paid plans?
              </h3>
              <p className="text-slate-600 mb-6">
                Pro and Family plans include a 14-day free trial. Enterprise plans include a 30-day trial 
                with full onboarding support.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                What's included in the Family plan?
              </h3>
              <p className="text-slate-600">
                The Family plan supports up to 4 family members with shared goals, joint planning tools, 
                and consolidated reporting. Perfect for couples and families planning together.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                How accurate are the AI recommendations?
              </h3>
              <p className="text-slate-600 mb-6">
                Our AI has a 94% accuracy rate for portfolio optimization suggestions, 
                trained on decades of market data and validated by financial experts.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Is my financial data secure?
              </h3>
              <p className="text-slate-600 mb-6">
                Absolutely. We use bank-level encryption, never store login credentials, 
                and are SOC 2 Type II certified. Your data is never shared with third parties.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Do you offer refunds?
              </h3>
              <p className="text-slate-600">
                Yes, we offer a 30-day money-back guarantee for all paid plans. 
                No questions asked.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Wealth?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of smart investors using AI to maximize their retirement savings
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handlePurchase(pricingTiers.find(t => t.popular))}
                disabled={!!checkoutLoading}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-lg disabled:opacity-50"
              >
                Start Free Trial
              </button>
              <button className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/10 transition-colors font-bold text-lg">
                Schedule Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};