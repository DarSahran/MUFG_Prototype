import React, { useState } from 'react';
import { BookOpen, Play, Clock, TrendingUp, Shield, Calculator, ChevronRight, Award, CheckCircle, Star, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const EducationCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('basics');
  const [completedArticles, setCompletedArticles] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState(0);

  const categories = [
    { id: 'basics', label: 'Superannuation Basics', icon: BookOpen },
    { id: 'investing', label: 'Investment Strategies', icon: TrendingUp },
    { id: 'risk', label: 'Risk Management', icon: Shield },
    { id: 'planning', label: 'Retirement Planning', icon: Calculator },
    { id: 'advanced', label: 'Advanced Topics', icon: Award },
  ];

  const handleArticleComplete = (articleTitle: string) => {
    if (!completedArticles.includes(articleTitle)) {
      const newCompleted = [...completedArticles, articleTitle];
      setCompletedArticles(newCompleted);
      
      // Calculate progress
      const totalArticles = Object.values(content).flat().length;
      setUserProgress((newCompleted.length / totalArticles) * 100);
      
      // Store in localStorage
      localStorage.setItem('educationProgress', JSON.stringify(newCompleted));
    }
  };

  // Load progress from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('educationProgress');
    if (saved) {
      const completed = JSON.parse(saved);
      setCompletedArticles(completed);
      const totalArticles = Object.values(content).flat().length;
      setUserProgress((completed.length / totalArticles) * 100);
    }
  }, []);
  const content = {
    basics: [
      {
        title: 'What is Superannuation?',
        description: 'Understanding the Australian retirement savings system',
        duration: '5 min read',
        type: 'article',
        content: `Superannuation is Australia's retirement savings system designed to provide income during retirement. Here are the key components:

**How It Works:**
- Mandatory contributions from your employer (currently 11% of salary)
- Voluntary additional contributions you can make
- Government co-contributions for eligible individuals
- Tax advantages to encourage long-term savings

**Key Benefits:**
- Compounding growth over decades
- Tax-advantaged environment
- Professional fund management
- Insurance coverage options

**Types of Contributions:**
1. **Employer Contributions**: Mandatory 11% of your salary
2. **Salary Sacrifice**: Pre-tax contributions from your salary
3. **After-tax Contributions**: Personal contributions from your take-home pay
4. **Government Co-contribution**: Up to $500 matching for eligible earners

**Important Limits:**
- Concessional cap: $27,500 per year (2023-24)
- Non-concessional cap: $110,000 per year
- Total superannuation balance affects contribution caps

Understanding these basics is crucial for making informed decisions about your retirement future.`
      },
      {
        title: 'Understanding Contribution Caps',
        description: 'Maximum amounts you can contribute each year',
        duration: '3 min read',
        type: 'article',
        content: `Contribution caps limit how much you can add to your super each year while receiving tax benefits:

**Concessional Contributions Cap: $27,500**
- Includes employer contributions
- Salary sacrifice contributions
- Personal deductible contributions
- Taxed at 15% in super fund

**Non-concessional Contributions Cap: $110,000**
- After-tax personal contributions
- Not taxed on entry to super fund
- Can bring forward up to 3 years ($330,000)

**Excess Contributions:**
- Concessional excess: Taxed at marginal rate minus 15%
- Non-concessional excess: Taxed at 47% or can be withdrawn

**Strategies:**
- Use carry-forward unused concessional cap space
- Time contributions around financial year end
- Consider spouse splitting strategies
- Monitor total superannuation balance impacts`
      },
      {
        title: 'Choosing the Right Super Fund',
        description: 'Factors to consider when selecting a superannuation fund',
        duration: '7 min read',
        type: 'article',
        content: `Selecting the right super fund can significantly impact your retirement outcome:

**Key Factors to Consider:**

**1. Fees and Costs:**
- Administration fees (annual and monthly)
- Investment fees (typically 0.50% - 2.00%)
- Insurance premiums
- Exit fees and switching costs

**2. Investment Options:**
- Range of investment choices
- Asset allocation options
- Ethical/sustainable investment options
- International exposure

**3. Performance:**
- Long-term returns (10+ years)
- Risk-adjusted performance
- Consistency across market cycles
- Benchmark comparisons

**4. Services:**
- Online platform quality
- Financial advice access
- Insurance options
- Member benefits and tools

**5. Fund Size and Stability:**
- Assets under management
- Member numbers
- Fund history and stability
- Merger and acquisition activity

**Types of Funds:**
- Industry funds (non-profit)
- Retail funds (for-profit)
- Corporate funds (employer-specific)
- Self-managed super funds (SMSF)

Take time to research and compare - the difference in fees and performance can mean hundreds of thousands in your final balance.`
      }
    ],
    investing: [
      {
        title: 'Asset Allocation Strategies',
        description: 'How to balance your investment portfolio',
        duration: '6 min read',
        type: 'article',
        content: `Asset allocation is one of the most important investment decisions you'll make:

**Core Asset Classes:**

**1. Growth Assets (Higher Risk/Return):**
- Australian shares (20-40% typical allocation)
- International shares (20-35% typical allocation)
- Property/REITs (5-15% typical allocation)

**2. Defensive Assets (Lower Risk/Return):**
- Fixed income/bonds (10-30% typical allocation)
- Cash and term deposits (0-10% typical allocation)

**Age-Based Allocation Rules:**
- Conservative: 100 - Age = Growth assets percentage
- Moderate: 110 - Age = Growth assets percentage
- Aggressive: 120 - Age = Growth assets percentage

**Example for 35-year-old:**
- Conservative: 65% growth, 35% defensive
- Moderate: 75% growth, 25% defensive
- Aggressive: 85% growth, 15% defensive

**Rebalancing Strategy:**
- Review allocation quarterly
- Rebalance when drift exceeds 5%
- Consider tax implications
- Use new contributions for rebalancing

**Lifecycle Investing:**
- Start aggressive when young
- Gradually reduce risk approaching retirement
- Consider target-date funds for automatic adjustment

Remember: Time in the market beats timing the market for long-term investors.`
      },
      {
        title: 'Dollar-Cost Averaging',
        description: 'The benefits of regular, consistent investing',
        duration: '4 min read',
        type: 'article',
        content: `Dollar-cost averaging is a powerful strategy built into superannuation:

**How It Works:**
- Regular contributions regardless of market conditions
- Buy more units when prices are low
- Buy fewer units when prices are high
- Smooths out market volatility over time

**Benefits:**
1. **Reduces timing risk** - No need to predict market movements
2. **Emotional discipline** - Removes fear and greed from decisions
3. **Lower average cost** - Mathematical advantage in volatile markets
4. **Automatic process** - Employer contributions happen automatically

**Real Example:**
Monthly contribution: $500
- Month 1: $500 buys 50 units at $10 each
- Month 2: $500 buys 100 units at $5 each  
- Month 3: $500 buys 25 units at $20 each
- Average cost: $8.57 per unit vs average price $11.67

**Maximizing the Strategy:**
- Increase contributions during market downturns
- Stay consistent through all market cycles
- Avoid stopping contributions during volatility
- Consider additional voluntary contributions

**Superannuation Advantage:**
Your employer contributions happen automatically, providing perfect dollar-cost averaging without any effort on your part.`
      }
    ],
    risk: [
      {
        title: 'Understanding Investment Risk',
        description: 'Types of risk and how to manage them',
        duration: '8 min read',
        type: 'article',
        content: `Understanding different types of investment risk helps you make better decisions:

**Types of Risk:**

**1. Market Risk:**
- Systematic risk affecting all investments
- Cannot be diversified away
- Examples: Global financial crisis, pandemic impacts

**2. Specific Risk:**
- Risk specific to individual companies/sectors
- Can be reduced through diversification
- Examples: Company bankruptcy, industry disruption

**3. Inflation Risk:**
- Risk that returns won't keep pace with inflation
- Particularly affects fixed-income investments
- Long-term average inflation ~2-3% annually

**4. Liquidity Risk:**
- Risk of not being able to sell investments quickly
- Generally low for super due to long-term nature
- Important for emergency access needs

**5. Currency Risk:**
- Risk from international investment exposure
- Australian dollar movements affect returns
- Can be hedged but at a cost

**Risk Management Strategies:**

**Diversification:**
- Spread investments across asset classes
- Geographic diversification
- Sector diversification
- Time diversification (long investment period)

**Risk Tolerance Assessment:**
- Consider your age and time to retirement
- Emotional capacity for volatility
- Financial capacity for potential losses
- Recovery time from major losses

**Risk vs. Return Trade-off:**
- Higher potential returns require accepting higher risk
- Conservative investments provide stability but lower returns
- The key is finding the right balance for your situation

Remember: The biggest risk for young investors is being too conservative and not allowing enough time for growth.`
      }
    ],
    planning: [
      {
        title: 'Retirement Income Planning',
        description: 'How much you need and strategies to get there',
        duration: '10 min read',
        type: 'article',
        content: `Planning for retirement income requires understanding your needs and options:

**The ASFA Retirement Standard (2023):**
- Modest lifestyle: $31,323 per year (couple), $22,572 (single)
- Comfortable lifestyle: $71,724 per year (couple), $50,981 (single)

**The 4% Rule:**
- Withdraw 4% of your super balance annually
- Comfortable retirement: Need ~$1.3M in super
- Modest retirement: Need ~$565,000 in super

**Income Sources in Retirement:**

**1. Superannuation:**
- Account-based pensions
- Annuities for guaranteed income
- Transition to retirement pensions

**2. Age Pension:**
- Asset and income tested
- Maximum couple rate: $41,156 per year
- Provides safety net and inflation protection

**3. Other Investments:**
- Investment properties
- Share portfolios outside super
- Term deposits and bonds

**Strategies to Boost Retirement Income:**

**1. Salary Sacrifice:**
- Reduce taxable income
- Boost super with tax-advantaged contributions
- Can save significant tax over time

**2. Spouse Contributions:**
- Contribute to lower-earning spouse's super
- Tax offset available for contributions
- Evens out retirement balances

**3. Government Co-contributions:**
- Up to $500 matching for eligible earners
- Income thresholds apply
- Effectively doubles your contribution

**4. Catch-up Contributions:**
- Use unused concessional cap space
- Available from age 60 if balance under $500k
- Opportunity to boost super later in career

Start planning early - compound growth over decades makes the biggest difference to your retirement outcome.`
      }
    ],
    advanced: [
      {
        title: 'Self-Managed Super Funds (SMSF)',
        description: 'When and how to consider running your own super fund',
        duration: '12 min read',
        type: 'article',
        content: `Self-Managed Super Funds (SMSFs) offer greater control but require significant responsibility:

**What is an SMSF?**
- You become the trustee of your own super fund
- Can have up to 4 members (usually family)
- Direct control over all investment decisions
- Must comply with superannuation and tax laws

**When to Consider an SMSF:**
- Super balance over $200,000 (cost-effectiveness threshold)
- Want direct property investment
- Desire specific investment strategies
- Have time and knowledge for administration
- Want to invest in collectibles or art

**Responsibilities:**
- Annual audits and tax returns
- Investment strategy documentation
- Compliance with sole purpose test
- Separation of fund and personal assets
- Regular trustee meetings and minutes

**Costs:**
- Setup: $1,000-$3,000
- Annual administration: $2,000-$5,000
- Audit fees: $500-$1,500
- Break-even typically around $200,000 balance

**Investment Options:**
- Direct shares and ETFs
- Term deposits and bonds
- Residential and commercial property
- Collectibles (art, wine, classic cars)
- Cryptocurrency (limited)
- International investments

**Risks and Considerations:**
- Personal liability for compliance breaches
- Time commitment for administration
- Limited recourse if things go wrong
- Potential for emotional investment decisions
- Liquidity constraints

SMSFs aren't suitable for everyone - carefully consider whether the benefits outweigh the responsibilities and costs.`
      },
      {
        title: 'International Investing Through Super',
        description: 'Accessing global markets through your superannuation',
        duration: '8 min read',
        type: 'article',
        content: `International investing through super provides global diversification:

**Why Invest Internationally?**
- Diversification beyond Australian market
- Access to different economic cycles
- Currency diversification benefits
- Exposure to global growth companies
- Reduced concentration risk

**How to Invest Internationally:**

**1. International ETFs:**
- VGS (MSCI World ex-Australia)
- VTS (US Total Market)
- VEU (All-World ex-US)
- VGAD (Hedged international shares)

**2. Managed Funds:**
- International equity options
- Emerging markets funds
- Regional specific funds (Europe, Asia)
- Sector-specific international funds

**3. Direct International Shares:**
- Available through some super funds
- Higher costs and complexity
- Currency conversion considerations

**Currency Hedging:**
- Hedged funds reduce currency risk
- Unhedged funds provide currency exposure
- Consider mix of both approaches
- Australian dollar movements impact returns

**Tax Considerations:**
- Foreign tax credits available
- Withholding taxes on dividends
- Currency gains/losses treatment
- Reporting requirements

**Recommended Allocation:**
- Young investors: 30-50% international
- Moderate investors: 20-35% international
- Conservative investors: 10-25% international

International investing through super is tax-effective and provides essential diversification for long-term wealth building.`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-0 px-0">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-500 py-16 px-4 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">Education Center</h1>
            <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-2xl">
              Unlock your financial confidence! Explore easy-to-understand guides, practical tips, and expert insights to help you master superannuation, investing, and retirement planning. Whether you’re just starting or looking to optimize your strategy, our resources are here to empower your financial journey.
            </p>
            
            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full p-1 mb-6 max-w-md">
              <div className="flex items-center justify-between text-white text-sm mb-2">
                <span>Learning Progress</span>
                <span>{Math.round(userProgress)}%</span>
              </div>
              <div className="bg-white/30 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${userProgress}%` }}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <span className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium"><TrendingUp className="w-4 h-4 mr-2" /> Grow Your Wealth</span>
              <span className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium"><Shield className="w-4 h-4 mr-2" /> Manage Risk</span>
              <span className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium"><Calculator className="w-4 h-4 mr-2" /> Plan Retirement</span>
              <span className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium"><Users className="w-4 h-4 mr-2" /> {completedArticles.length} Articles Read</span>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative z-10">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200 max-w-xs w-full flex flex-col items-center">
              <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
              <h2 className="font-bold text-slate-900 text-lg mb-2">Featured Resource</h2>
              <p className="text-slate-600 text-sm mb-4 text-center">"What is Superannuation?"<br/>Start with the basics and build your knowledge step by step.</p>
              <button
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all duration-200"
                onClick={() => setSelectedCategory('basics')}
              >
                Read Now
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Topics</h2>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-700 font-semibold shadow'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {content[selectedCategory as keyof typeof content].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 hover:shadow-2xl transition-shadow duration-200">
                  <div className="p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h3>
                        {completedArticles.includes(item.title) && (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                      <p className="text-slate-600 mb-4 text-base">{item.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{item.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {item.type === 'video' ? <Play className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                          <span className="capitalize">{item.type}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>4.8/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {!completedArticles.includes(item.title) && (
                        <button
                          onClick={() => handleArticleComplete(item.title)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                      )}
                      <ChevronRight className="w-6 h-6 text-slate-300" />
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50">
                    <div className="prose prose-slate max-w-none">
                      <ReactMarkdown
                        children={item.content}
                        remarkPlugins={[remarkGfm]}
                        components={{
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="text-blue-700" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-2 text-slate-900" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-800" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2" {...props} />,
                          code: ({node, ...props}) => <code className="bg-slate-100 px-1 rounded text-pink-600" {...props} />,
                        }}
                      />
                    </div>
                    
                    {/* Article Actions */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
                          <Star className="w-4 h-4" />
                          <span className="text-sm">Rate Article</span>
                        </button>
                        <button className="flex items-center space-x-2 text-slate-600 hover:text-slate-700 transition-colors">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Share</span>
                        </button>
                      </div>
                      {!completedArticles.includes(item.title) && (
                        <button
                          onClick={() => handleArticleComplete(item.title)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Learning Path Recommendations */}
        <div className="max-w-6xl mx-auto px-4 mt-12">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">🎯 Recommended Learning Path</h2>
            <p className="text-blue-100 mb-6">Based on your progress and investment profile</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Next: Risk Management</h3>
                <p className="text-sm text-blue-100">Learn how to balance risk and return in your portfolio</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Suggested: Advanced Topics</h3>
                <p className="text-sm text-blue-100">Ready for SMSF and international investing strategies</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Quiz: Test Your Knowledge</h3>
                <p className="text-sm text-blue-100">Interactive quiz on superannuation basics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};