import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Shield, Plus,
  BarChart3, PieChart, Activity, RefreshCw, Calendar, Clock,
  AlertTriangle, CheckCircle, Eye, Settings, Download, Wifi, Bell
} from 'lucide-react';

// Import enhanced components
import { TotalValueCard } from './KPICards/TotalValueCard';
import { SuperValueCard } from './KPICards/SuperValueCard';
import { ProjectedIncomeCard } from './KPICards/ProjectedIncomeCard';
import { RiskProfileCard } from './KPICards/RiskProfileCard';
import { AllocationPieChart } from './Charts/AllocationPieChart';
import { AssetTrendChart } from './Charts/AssetTrendChart';
import { PerformanceChart } from './Charts/PerformanceChart';
import { StocksTab } from './AssetTabs/StocksTab';
import { SuperTab } from './AssetTabs/SuperTab';
import { PropertyTab } from './AssetTabs/PropertyTab';
import { CryptoTab } from './AssetTabs/CryptoTab';
import { ScenarioPanel } from '../ScenarioAnalysis/ScenarioPanel';
import { usePortfolio } from '../../hooks/usePortfolio';
import { portfolioEngine } from '../../utils/portfolioEngine';
import { UserProfile } from '../../App';

interface DashboardProps {
  userProfile: UserProfile | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const { holdings, goals, getTotalPortfolioValue, getAssetAllocation } = usePortfolio();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'stocks' | 'super' | 'property' | 'crypto'>('overview');
  const [showScenarioPanel, setShowScenarioPanel] = useState(false);
  const [portfolioMetrics, setPortfolioMetrics] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (holdings.length > 0) {
      calculatePortfolioMetrics();
    }
  }, [holdings]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedTab === 'overview') {
        handleRefresh();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedTab]);

  const calculatePortfolioMetrics = () => {
    try {
      const unifiedAssets = holdings.map(holding => ({
        id: holding.id,
        type: holding.type,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        purchasePrice: holding.purchasePrice,
        currentPrice: holding.currentPrice,
        value: holding.quantity * holding.currentPrice,
        currency: holding.currency,
        region: holding.region,
        exchange: holding.exchange,
        purchaseDate: holding.purchaseDate,
        expectedReturn: 0.075,
        volatility: 0.15,
        metadata: holding.metadata || {},
      }));

      const totalValue = portfolioEngine.calculatePortfolioValue(unifiedAssets);
      const allocation = portfolioEngine.calculateAssetAllocation(unifiedAssets);
      const diversificationScore = portfolioEngine.getDiversificationScore(unifiedAssets);
      const riskScore = portfolioEngine.getRiskScore(unifiedAssets);

      setPortfolioMetrics({
        totalValue,
        allocation,
        diversificationScore,
        riskScore,
        assetCount: holdings.length,
      });
    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    calculatePortfolioMetrics();
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  if (!userProfile) return null;

  const totalPortfolioValue = portfolioMetrics?.totalValue || getTotalPortfolioValue();
  const assetAllocation = portfolioMetrics?.allocation || getAssetAllocation();
  
  // Calculate performance metrics
  const totalGainLoss = holdings.reduce((sum, holding) => {
    return sum + (holding.currentPrice - holding.purchasePrice) * holding.quantity;
  }, 0);
  const totalCost = holdings.reduce((sum, holding) => sum + holding.purchasePrice * holding.quantity, 0);
  const overallReturn = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview', 
      count: holdings.length,
      icon: BarChart3 
    },
    { 
      id: 'stocks', 
      label: 'Stocks', 
      count: holdings.filter(h => h.type === 'stock').length,
      icon: TrendingUp 
    },
    { 
      id: 'super', 
      label: 'Super', 
      count: holdings.filter(h => h.type === 'super').length,
      icon: Target 
    },
    { 
      id: 'property', 
      label: 'Property', 
      count: holdings.filter(h => h.type === 'property').length,
      icon: Settings 
    },
    { 
      id: 'crypto', 
      label: 'Crypto', 
      count: holdings.filter(h => h.type === 'crypto').length,
      icon: Activity 
    },
  ];

  const renderTabContent = () => {
    const stockHoldings = holdings.filter(h => h.type === 'stock');
    const superHoldings = holdings.filter(h => h.type === 'super');
    const propertyHoldings = holdings.filter(h => h.type === 'property');
    const cryptoHoldings = holdings.filter(h => h.type === 'crypto');

    switch (selectedTab) {
      case 'stocks':
        return <StocksTab holdings={stockHoldings} userProfile={userProfile} />;
      case 'super':
        return <SuperTab holdings={superHoldings} userProfile={userProfile} />;
      case 'property':
        return <PropertyTab holdings={propertyHoldings} userProfile={userProfile} />;
      case 'crypto':
        return <CryptoTab holdings={cryptoHoldings} userProfile={userProfile} />;
      default:
        return (
          <div className="space-y-8">
            {/* KPI Cards */}
            <motion.div 
              ref={statsRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <TotalValueCard 
                value={totalPortfolioValue}
                change={overallReturn}
                inView={statsInView}
                delay={0}
              />
              <SuperValueCard 
                value={userProfile.currentSuper}
                monthlyContribution={userProfile.monthlyContribution}
                inView={statsInView}
                delay={0.1}
              />
              <ProjectedIncomeCard 
                userProfile={userProfile}
                portfolioValue={totalPortfolioValue}
                inView={statsInView}
                delay={0.2}
              />
              <RiskProfileCard 
                riskProfile={userProfile.riskTolerance}
                riskScore={portfolioMetrics?.riskScore || 50}
                inView={statsInView}
                delay={0.3}
              />
            </motion.div>

            {/* Market Summary Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-xl p-6 text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Market Status: </span>
                    <span className="text-green-400 font-medium">Open</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-5 h-5 text-blue-400" />
                    <span className="text-sm">Live Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-sm">Updated: {lastUpdated.toLocaleTimeString()}</span>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Refresh</span>
                </button>
              </div>
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <AssetTrendChart 
                  holdings={holdings}
                  timeframe="3M"
                />
              </div>
              <div>
                <AllocationPieChart 
                  allocation={assetAllocation}
                  totalValue={totalPortfolioValue}
                />
              </div>
            </div>

            {/* Performance Chart */}
            <PerformanceChart 
              holdings={holdings}
              userProfile={userProfile}
            />

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-100"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Add Investment</span>
                </button>
                <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <Download className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Export Report</span>
                </button>
                <button 
                  onClick={() => setShowScenarioPanel(true)}
                  className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">What-If Analysis</span>
                </button>
                <button className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Set Alerts</span>
                </button>
              </div>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Welcome back, {userProfile.name.split(' ')[0]} 👋
              </h1>
              <p className="text-lg text-slate-600">
                Your portfolio is {overallReturn >= 0 ? 'performing well' : 'ready for optimization'} • 
                <span className={`font-medium ml-1 ${overallReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overallReturn >= 0 ? '+' : ''}{overallReturn.toFixed(2)}% overall return
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">Live Data</span>
              </div>
              <button
                onClick={() => setShowScenarioPanel(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Eye className="w-4 h-4" />
                <span>What-If Analysis</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg mb-8 border border-slate-100"
        >
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`flex items-center space-x-3 py-4 px-2 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="p-6">
            {renderTabContent()}
          </div>
        </motion.div>

        {/* Scenario Analysis Panel */}
        {showScenarioPanel && (
          <ScenarioPanel
            holdings={holdings}
            userProfile={userProfile}
            onClose={() => setShowScenarioPanel(false)}
          />
        )}
      </div>
    </div>
  );
};
