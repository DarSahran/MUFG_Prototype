import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
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
  
  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (holdings.length > 0) {
      calculatePortfolioMetrics();
    }
  }, [holdings]);

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
        expectedReturn: 0.075, // Default, would be calculated
        volatility: 0.15, // Default, would be calculated
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

  if (!userProfile) return null;

  const totalPortfolioValue = portfolioMetrics?.totalValue || getTotalPortfolioValue();
  const assetAllocation = portfolioMetrics?.allocation || getAssetAllocation();

  const tabs = [
    { id: 'overview', label: 'Overview', count: holdings.length },
    { id: 'stocks', label: 'Stocks', count: holdings.filter(h => h.type === 'stock').length },
    { id: 'super', label: 'Super', count: holdings.filter(h => h.type === 'super').length },
    { id: 'property', label: 'Property', count: holdings.filter(h => h.type === 'property').length },
    { id: 'crypto', label: 'Crypto', count: holdings.filter(h => h.type === 'crypto').length },
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
          <div className="space-y-6">
            {/* KPI Cards */}
            <motion.div 
              ref={statsRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              <TotalValueCard 
                value={totalPortfolioValue}
                change={7.2}
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AssetTrendChart 
                  holdings={holdings}
                  timeframe="6M"
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
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Welcome back, {userProfile.name.split(' ')[0]}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Your portfolio is {totalPortfolioValue > userProfile.currentSuper ? 'growing' : 'ready for optimization'}
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowScenarioPanel(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <span>What-If Analysis</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Asset Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-6 px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

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