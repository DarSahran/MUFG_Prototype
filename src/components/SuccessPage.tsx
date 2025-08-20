import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Download, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscription } from '../hooks/useSubscription';

export const SuccessPage: React.FC = () => {
  const { subscription, getSubscriptionPlan, refetch } = useSubscription();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Refetch subscription data to get the latest status
    const fetchLatestData = async () => {
      try {
        await refetch();
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to allow webhook processing
    const timer = setTimeout(fetchLatestData, 2000);
    return () => clearTimeout(timer);
  }, [refetch]);

  const subscriptionPlan = getSubscriptionPlan();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to {subscriptionPlan?.name || 'SuperAI Advisor'}!
          </h1>
          <p className="text-xl text-slate-600 mb-6">
            Your subscription has been successfully activated. You now have access to all premium features.
          </p>
          
          {subscriptionPlan && (
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-green-100 text-green-800 rounded-full font-medium">
              <Star className="w-5 h-5" />
              <span>{subscriptionPlan.name} Plan Active</span>
            </div>
          )}
        </motion.div>

        {/* Subscription Details */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Subscription Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Plan</label>
                  <p className="text-lg font-semibold text-slate-900">
                    {subscriptionPlan?.name || 'SuperAI Plan'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <p className="text-lg font-semibold text-green-600 capitalize">
                    {subscription.subscription_status.replace('_', ' ')}
                  </p>
                </div>
                
                {subscription.current_period_end && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Next Billing Date</label>
                    <p className="text-lg font-semibold text-slate-900">
                      {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {subscriptionPlan && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Price</label>
                    <p className="text-lg font-semibold text-slate-900">
                      ${subscriptionPlan.price}/{subscriptionPlan.interval}
                    </p>
                  </div>
                )}
                
                {subscription.payment_method_brand && subscription.payment_method_last4 && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Payment Method</label>
                    <p className="text-lg font-semibold text-slate-900">
                      {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What's Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Explore Your Dashboard</h3>
              <p className="text-sm text-slate-600 mb-4">
                Access your personalized investment dashboard with AI-powered insights
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Chat with AI Advisor</h3>
              <p className="text-sm text-slate-600 mb-4">
                Get personalized investment advice from our AI advisor
              </p>
              <button 
                onClick={() => window.location.href = '/?view=combined-ai'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Chatting
              </button>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Download Resources</h3>
              <p className="text-sm text-slate-600 mb-4">
                Access exclusive guides and investment resources
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                View Resources
              </button>
            </div>
          </div>
        </motion.div>

        {/* Features Highlight */}
        {subscriptionPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-6">Your {subscriptionPlan.name} Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionPlan.features.slice(0, 8).map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-blue-100">{feature}</span>
                </div>
              ))}
            </div>
            
            {subscriptionPlan.features.length > 8 && (
              <p className="text-blue-100 text-sm mt-4">
                +{subscriptionPlan.features.length - 8} more features available
              </p>
            )}
          </motion.div>
        )}

        {/* Support Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Need Help Getting Started?</h3>
          <p className="text-slate-600 mb-6">
            Our support team is here to help you make the most of your SuperAI Advisor subscription.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
              Contact Support
            </button>
            <button 
              onClick={() => window.location.href = '/?view=education'}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              View Learning Center
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};