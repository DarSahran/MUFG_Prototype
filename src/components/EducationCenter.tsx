import React, { useState } from 'react';
import { BookOpen, Play, Clock, TrendingUp, Shield, Calculator, ChevronRight, Award, CheckCircle, Star, Users, ChevronDown, Brain, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticleModal } from './EducationCenter/ArticleModal';
import { useEducationProgress } from '../hooks/useEducationProgress';

export const EducationCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('basics');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const { progress, getProgressStats, isArticleCompleted, getQuizScore } = useEducationProgress();

  const stats = getProgressStats();

  const categories = [
    { 
      id: 'basics', 
      label: 'Superannuation Basics', 
      icon: BookOpen,
      description: 'Essential knowledge for getting started',
      color: 'from-blue-500 to-blue-600',
      articles: 3
    },
    { 
      id: 'investing', 
      label: 'Investment Strategies', 
      icon: TrendingUp,
      description: 'Build wealth with smart investing',
      color: 'from-green-500 to-green-600',
      articles: 4
    },
    { 
      id: 'risk', 
      label: 'Risk Management', 
      icon: Shield,
      description: 'Protect and grow your investments',
      color: 'from-orange-500 to-orange-600',
      articles: 3
    },
    { 
      id: 'planning', 
      label: 'Retirement Planning', 
      icon: Calculator,
      description: 'Plan for your financial future',
      color: 'from-purple-500 to-purple-600',
      articles: 4
    },
    { 
      id: 'advanced', 
      label: 'Advanced Topics', 
      icon: Award,
      description: 'Expert-level strategies',
      color: 'from-red-500 to-red-600',
      articles: 3
    },
  ];

  const content = {
    basics: [
      {
        id: 'super-basics',
        title: 'What is Superannuation?',
        description: 'Understanding the Australian retirement savings system and how it works for you.',
        duration: '5 min read',
        difficulty: 'Beginner',
        content: `Superannuation is Australia's retirement savings system designed to provide income during retirement. Here are the key components you need to understand:

**How Superannuation Works:**
- Your employer contributes 11% of your salary to your super fund
- You can make additional voluntary contributions
- The money is invested and grows over time
- You can access it when you reach preservation age (usually 60)

**Key Benefits:**
- Tax advantages: Contributions are taxed at only 15%
- Compound growth over decades
- Professional fund management
- Insurance coverage options

**Types of Contributions:**
1. **Employer Contributions**: Mandatory 11% of your salary
2. **Salary Sacrifice**: Pre-tax contributions from your salary  
3. **After-tax Contributions**: Personal contributions from your take-home pay
4. **Government Co-contribution**: Up to $500 matching for eligible earners

**Important Limits for 2024:**
- Concessional cap: $27,500 per year
- Non-concessional cap: $110,000 per year
- Total superannuation balance affects contribution caps

Understanding these basics is the foundation for making smart decisions about your retirement savings.`,
        quiz: [
          {
            question: "What is the current superannuation guarantee rate that employers must contribute?",
            options: ["9.5%", "10%", "11%", "12%"],
            correct: 2,
            explanation: "The superannuation guarantee rate is currently 11% of your ordinary time earnings."
          },
          {
            question: "What is the concessional contribution cap for 2024?",
            options: ["$25,000", "$27,500", "$30,000", "$35,000"],
            correct: 1,
            explanation: "The concessional contribution cap is $27,500 per year, which includes employer and salary sacrifice contributions."
          },
          {
            question: "At what age can you typically access your superannuation?",
            options: ["55", "60", "65", "67"],
            correct: 1,
            explanation: "The preservation age is typically 60, though this varies slightly based on your birth year."
          }
        ]
      },
      {
        id: 'contribution-caps',
        title: 'Understanding Contribution Caps',
        description: 'Learn about the limits on how much you can contribute to super each year.',
        duration: '4 min read',
        difficulty: 'Beginner',
        content: `Contribution caps are annual limits on how much you can add to your super while receiving tax benefits. Understanding these is crucial for maximizing your retirement savings.

**Concessional Contributions Cap: $27,500**
- Includes employer contributions (11% of salary)
- Salary sacrifice contributions
- Personal deductible contributions
- Taxed at only 15% in your super fund

**Non-concessional Contributions Cap: $110,000**
- After-tax personal contributions
- Not taxed when entering your super fund
- Can bring forward up to 3 years ($330,000 total)

**What Happens if You Exceed the Caps:**
- Concessional excess: Taxed at your marginal rate minus 15%
- Non-concessional excess: Taxed at 47% or can be withdrawn

**Smart Strategies:**
- Use carry-forward unused concessional cap space from previous years
- Time contributions around the financial year end
- Consider spouse contribution splitting
- Monitor your total superannuation balance as it affects caps

**Carry-Forward Rules:**
- Available if your total super balance is under $500,000
- Can use unused cap space from the last 5 years
- Must have been eligible to make contributions in those years`,
        quiz: [
          {
            question: "What is the tax rate on concessional contributions in your super fund?",
            options: ["0%", "15%", "30%", "47%"],
            correct: 1,
            explanation: "Concessional contributions are taxed at 15% when they enter your super fund, which is usually much lower than your marginal tax rate."
          },
          {
            question: "How many years can you bring forward non-concessional contributions?",
            options: ["1 year", "2 years", "3 years", "5 years"],
            correct: 2,
            explanation: "You can bring forward up to 3 years of non-concessional contributions, allowing up to $330,000 in one year."
          },
          {
            question: "What is the total super balance threshold for carry-forward concessional contributions?",
            options: ["$300,000", "$400,000", "$500,000", "$600,000"],
            correct: 2,
            explanation: "You can only use carry-forward concessional contributions if your total super balance is under $500,000 on June 30 of the previous year."
          }
        ]
      },
      {
        id: 'choosing-super-fund',
        title: 'Choosing the Right Super Fund',
        description: 'Key factors to consider when selecting your superannuation fund.',
        duration: '6 min read',
        difficulty: 'Intermediate',
        content: `Choosing the right super fund is one of the most important financial decisions you'll make. The difference between a good and poor fund can mean hundreds of thousands of dollars over your working life.

**Key Factors to Evaluate:**

**1. Fees and Costs**
- Administration fees: Look for funds charging under $100 per year
- Investment fees: Typically 0.50% - 2.00% of your balance
- Insurance premiums: Can vary significantly between funds
- Performance fees: Some funds charge extra for good performance

**2. Investment Performance**
- Focus on long-term returns (10+ years)
- Compare risk-adjusted performance, not just raw returns
- Look for consistency across different market cycles
- Check performance against relevant benchmarks

**3. Investment Options**
- Range of investment choices (conservative to aggressive)
- Quality of underlying investments
- Access to international markets
- Ethical/sustainable investment options

**4. Services and Features**
- Quality of online platform and mobile app
- Access to financial advice
- Insurance options and coverage
- Member benefits and additional services

**5. Fund Stability**
- Total assets under management
- Number of members
- Fund history and track record
- Any recent mergers or changes

**Types of Super Funds:**
- **Industry Funds**: Run for members' benefit, not profit
- **Retail Funds**: Run by banks and financial institutions
- **Corporate Funds**: Set up by employers for their staff
- **Self-Managed Super Funds (SMSF)**: You control the investments

**Red Flags to Avoid:**
- High fees without corresponding performance
- Limited investment options
- Poor customer service ratings
- Frequent strategy changes
- Lack of transparency in reporting`,
        quiz: [
          {
            question: "What should you prioritize when comparing super funds?",
            options: ["Highest returns only", "Lowest fees only", "Long-term performance after fees", "Most investment options"],
            correct: 2,
            explanation: "Long-term performance after fees is the most important factor, as it shows the actual returns you'll receive."
          },
          {
            question: "What type of super fund is run for members' benefit, not profit?",
            options: ["Retail funds", "Industry funds", "Corporate funds", "SMSF"],
            correct: 1,
            explanation: "Industry funds are run by trustees for the benefit of members, not to generate profits for shareholders."
          },
          {
            question: "What is a reasonable annual administration fee for a super fund?",
            options: ["Under $50", "Under $100", "Under $200", "Under $500"],
            correct: 1,
            explanation: "Good super funds typically charge under $100 per year in administration fees. Higher fees can significantly impact your retirement balance."
          }
        ]
      }
    ],
    investing: [
      {
        id: 'asset-allocation',
        title: 'Asset Allocation Strategies',
        description: 'Learn how to balance your investment portfolio for optimal returns.',
        duration: '7 min read',
        difficulty: 'Intermediate',
        content: `Asset allocation is the process of dividing your investments among different asset classes to balance risk and return according to your goals and risk tolerance.

**Core Asset Classes:**

**Growth Assets (Higher Risk/Return):**
- **Australian Shares (20-40%)**: Direct exposure to Australian companies
- **International Shares (20-35%)**: Global diversification and growth
- **Property/REITs (5-15%)**: Real estate exposure through listed trusts

**Defensive Assets (Lower Risk/Return):**
- **Fixed Income/Bonds (10-30%)**: Government and corporate bonds
- **Cash (0-10%)**: Term deposits and high-interest savings

**Age-Based Allocation Guidelines:**
- **Conservative Rule**: 100 - Your Age = Growth assets percentage
- **Moderate Rule**: 110 - Your Age = Growth assets percentage  
- **Aggressive Rule**: 120 - Your Age = Growth assets percentage

**Example for a 35-year-old:**
- Conservative: 65% growth, 35% defensive
- Moderate: 75% growth, 25% defensive
- Aggressive: 85% growth, 15% defensive

**Rebalancing Strategy:**
- Review your allocation every 3-6 months
- Rebalance when any asset class drifts more than 5% from target
- Use new contributions to rebalance rather than selling
- Consider tax implications when rebalancing

**Lifecycle Investing:**
- Start with higher growth allocation when young
- Gradually shift to more defensive assets as you approach retirement
- Consider target-date funds for automatic lifecycle adjustment

**Key Principles:**
- Diversification reduces risk without necessarily reducing returns
- Time in the market beats timing the market
- Regular rebalancing maintains your desired risk level
- Lower fees mean more money working for you`,
        quiz: [
          {
            question: "According to the moderate allocation rule, what percentage should a 30-year-old have in growth assets?",
            options: ["70%", "75%", "80%", "85%"],
            correct: 2,
            explanation: "Using the moderate rule (110 - Age), a 30-year-old should have 80% in growth assets."
          },
          {
            question: "How often should you review your asset allocation?",
            options: ["Monthly", "Every 3-6 months", "Annually", "Only when markets crash"],
            correct: 1,
            explanation: "Regular reviews every 3-6 months help ensure your allocation stays on track without over-managing."
          },
          {
            question: "When should you rebalance your portfolio?",
            options: ["Every month", "When any asset drifts 5% from target", "Only during market crashes", "Never"],
            correct: 1,
            explanation: "Rebalancing when any asset class drifts more than 5% from your target allocation helps maintain your desired risk level."
          }
        ]
      }
    ],
    risk: [
      {
        id: 'investment-risk',
        title: 'Understanding Investment Risk',
        description: 'Learn about different types of risk and how to manage them effectively.',
        duration: '8 min read',
        difficulty: 'Intermediate',
        content: `Understanding investment risk is crucial for making informed decisions about your superannuation. Risk isn't just about losing money - it's about the uncertainty of returns.

**Types of Investment Risk:**

**1. Market Risk (Systematic Risk)**
- Affects all investments in a market
- Cannot be eliminated through diversification
- Examples: Economic recessions, interest rate changes, global crises
- Managed through: Asset allocation and time diversification

**2. Specific Risk (Unsystematic Risk)**
- Risk specific to individual companies or sectors
- Can be reduced through diversification
- Examples: Company bankruptcy, management changes, industry disruption
- Managed through: Diversification across companies and sectors

**3. Inflation Risk**
- Risk that your returns won't keep pace with rising prices
- Particularly affects cash and fixed-income investments
- Over time, inflation erodes purchasing power
- Managed through: Growth assets that typically beat inflation

**4. Liquidity Risk**
- Risk of not being able to sell investments quickly
- Generally low concern for super due to long-term nature
- More relevant for direct property or unlisted investments
- Managed through: Maintaining some liquid investments

**5. Currency Risk**
- Risk from international investment exposure
- Australian dollar movements affect international returns
- Can work for or against you
- Managed through: Currency hedging (though this costs money)

**Risk Management Strategies:**

**Diversification:**
- Spread investments across different asset classes
- Invest in different geographic regions
- Include various sectors and company sizes
- Use time diversification (regular investing over time)

**Risk Tolerance Assessment:**
- Consider your emotional capacity for volatility
- Assess your financial capacity for potential losses
- Factor in your time horizon until retirement
- Account for your ability to recover from losses

**The Risk-Return Trade-off:**
- Higher potential returns require accepting higher risk
- Conservative investments provide stability but lower long-term returns
- The key is finding the right balance for your situation
- Young investors can typically afford more risk

**Common Risk Mistakes:**
- Being too conservative when young (inflation risk)
- Panic selling during market downturns
- Putting all money in one asset class
- Ignoring fees (which guarantee lower returns)
- Trying to time the market`,
        quiz: [
          {
            question: "Which type of risk can be reduced through diversification?",
            options: ["Market risk", "Systematic risk", "Specific risk", "Inflation risk"],
            correct: 2,
            explanation: "Specific (unsystematic) risk can be reduced by diversifying across different companies and sectors."
          },
          {
            question: "What is the biggest risk for young investors?",
            options: ["Market volatility", "Being too conservative", "Currency risk", "Liquidity risk"],
            correct: 1,
            explanation: "For young investors, being too conservative is often the biggest risk as it may not provide enough growth to beat inflation over time."
          },
          {
            question: "How does time help manage investment risk?",
            options: ["It eliminates all risk", "It allows recovery from short-term volatility", "It guarantees positive returns", "It reduces fees"],
            correct: 1,
            explanation: "Time allows you to ride out short-term market volatility and benefit from long-term growth trends."
          }
        ]
      }
    ],
    planning: [
      {
        id: 'retirement-income',
        title: 'Retirement Income Planning',
        description: 'Calculate how much you need and strategies to achieve your retirement goals.',
        duration: '10 min read',
        difficulty: 'Intermediate',
        content: `Planning for retirement income requires understanding how much you'll need and the best strategies to get there.

**How Much Do You Need?**

**ASFA Retirement Standard (2024):**
- **Modest Lifestyle**: $32,000 per year (single), $46,000 (couple)
- **Comfortable Lifestyle**: $51,000 per year (single), $72,000 (couple)

**The 4% Rule:**
- Withdraw 4% of your super balance annually in retirement
- For comfortable retirement: Need ~$1.3M in super (single)
- For modest retirement: Need ~$800,000 in super (single)

**Income Sources in Retirement:**

**1. Superannuation (Primary Source)**
- Account-based pensions: Flexible withdrawals
- Annuities: Guaranteed income for life
- Transition to retirement pensions: For those still working

**2. Age Pension (Safety Net)**
- Maximum rate: $29,000 per year (single), $44,000 (couple)
- Asset and income tested
- Provides inflation protection and healthcare benefits

**3. Other Investments**
- Investment properties outside super
- Share portfolios in personal name
- Term deposits and bonds
- Part-time work income

**Strategies to Boost Retirement Income:**

**1. Maximize Super Contributions**
- Use full concessional cap ($27,500)
- Make after-tax contributions for government co-contribution
- Consider spouse contributions for tax offsets

**2. Investment Strategy**
- Maintain appropriate growth allocation
- Minimize fees through low-cost options
- Regular rebalancing
- Tax-effective investing

**3. Timing Strategies**
- Transition to retirement pensions
- Timing of lump sum withdrawals
- Managing tax in retirement
- Estate planning considerations

**Retirement Income Phases:**
- **Accumulation**: Building your super balance
- **Pre-retirement**: Optimizing for retirement
- **Early retirement**: Managing drawdowns
- **Later retirement**: Preserving capital and managing longevity risk`,
        quiz: [
          {
            question: "According to the 4% rule, how much super do you need for a comfortable retirement ($51,000/year)?",
            options: ["$1.0M", "$1.3M", "$1.5M", "$2.0M"],
            correct: 1,
            explanation: "Using the 4% rule: $51,000 ÷ 0.04 = $1.275M, so approximately $1.3M is needed."
          },
          {
            question: "What is the main benefit of account-based pensions?",
            options: ["Guaranteed income", "Tax-free withdrawals", "Flexible withdrawals", "Higher returns"],
            correct: 2,
            explanation: "Account-based pensions offer flexible withdrawals, allowing you to adjust your income based on your needs and market conditions."
          },
          {
            question: "At what age can you typically start a transition to retirement pension?",
            options: ["55", "60", "65", "Your preservation age"],
            correct: 3,
            explanation: "You can start a transition to retirement pension at your preservation age, which varies from 55-60 depending on when you were born."
          }
        ]
      }
    ],
    advanced: [
      {
        id: 'smsf-guide',
        title: 'Self-Managed Super Funds (SMSF)',
        description: 'Comprehensive guide to running your own superannuation fund.',
        duration: '12 min read',
        difficulty: 'Advanced',
        content: `Self-Managed Super Funds (SMSFs) offer the ultimate control over your retirement savings, but they come with significant responsibilities and aren't suitable for everyone.

**What is an SMSF?**
- You become the trustee of your own super fund
- Can have up to 4 members (typically family members)
- Complete control over investment decisions
- Must comply with superannuation and tax laws

**When to Consider an SMSF:**
- Super balance over $200,000 (cost-effectiveness threshold)
- Want to invest directly in property
- Desire specific investment strategies not available in retail funds
- Have time and knowledge for ongoing administration
- Want to invest in collectibles, art, or other alternative assets

**SMSF Responsibilities:**
- Prepare and implement an investment strategy
- Keep accurate records and accounts
- Arrange annual audits by approved auditors
- Lodge annual returns with the ATO
- Ensure compliance with superannuation laws
- Separate fund assets from personal assets

**Costs of Running an SMSF:**
- Setup costs: $1,000 - $3,000
- Annual administration: $2,000 - $5,000
- Audit fees: $500 - $1,500 annually
- Investment costs: Brokerage, property costs, etc.
- Break-even point: Usually around $200,000 balance

**Investment Options:**
- Direct Australian and international shares
- Term deposits and bonds
- Residential and commercial property
- Collectibles (art, wine, classic cars) - with restrictions
- Cryptocurrency (limited and complex)
- Listed and unlisted trusts

**Key Compliance Requirements:**
- Sole purpose test: Fund must be maintained solely for retirement benefits
- In-house asset rules: Maximum 5% in related party assets
- Arm's length transactions: All dealings must be at market rates
- Separation of assets: Fund assets must be separate from personal assets

**Common SMSF Mistakes:**
- Insufficient diversification
- Emotional investment decisions
- Poor record keeping
- Mixing personal and fund expenses
- Not understanding compliance requirements

**Is an SMSF Right for You?**
Consider an SMSF if you:
- Have sufficient balance ($200,000+)
- Want direct property investment
- Have time for administration (5-10 hours per month)
- Understand investment principles
- Are comfortable with compliance responsibilities

SMSFs aren't suitable if you:
- Want a "set and forget" approach
- Have limited investment knowledge
- Don't have time for administration
- Want someone else to be responsible for compliance`,
        quiz: [
          {
            question: "What is the typical break-even balance for an SMSF to be cost-effective?",
            options: ["$100,000", "$150,000", "$200,000", "$300,000"],
            correct: 2,
            explanation: "Most experts suggest $200,000 as the minimum balance where SMSF costs become competitive with retail super funds."
          },
          {
            question: "What is the maximum percentage of in-house assets allowed in an SMSF?",
            options: ["5%", "10%", "15%", "25%"],
            correct: 0,
            explanation: "SMSFs can hold a maximum of 5% in in-house assets (investments in related parties)."
          },
          {
            question: "What is the sole purpose test?",
            options: ["Fund must only invest in shares", "Fund must be for retirement benefits only", "Fund must have one member only", "Fund must be audited annually"],
            correct: 1,
            explanation: "The sole purpose test requires that the fund be maintained solely to provide retirement benefits to members."
          }
        ]
      }
    ]
  };

  const handleArticleClick = (article: any) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
  const categoryArticles = content[selectedCategory as keyof typeof content] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-500 py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
                Education Center
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
                Master superannuation, investing, and retirement planning with our comprehensive learning resources.
              </p>
            </motion.div>

            {/* Progress Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.totalArticles}</div>
                <div className="text-sm text-blue-100">Articles Read</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.completedQuizzes}</div>
                <div className="text-sm text-blue-100">Quizzes Completed</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.averageScore}%</div>
                <div className="text-sm text-blue-100">Average Score</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">{Math.round(stats.totalTimeSpent / 60)}h</div>
                <div className="text-sm text-blue-100">Time Spent</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Learning Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              const completedArticles = categoryArticles.filter(article => 
                isArticleCompleted(article.id)
              ).length;
              
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:scale-102'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {category.label}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{category.articles} articles</span>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-green-600 font-medium">
                            {completedArticles}/{category.articles} completed
                          </div>
                          <div className="w-12 bg-slate-200 rounded-full h-1">
                            <div 
                              className="bg-green-500 h-1 rounded-full transition-all duration-500"
                              style={{ width: `${(completedArticles / category.articles) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Selected Category Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200"
          >
            <div className="flex items-center space-x-4 mb-8">
              <div className={`p-4 rounded-xl bg-gradient-to-r ${selectedCategoryData?.color}`}>
                {selectedCategoryData && <selectedCategoryData.icon className="w-8 h-8 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedCategoryData?.label}</h2>
                <p className="text-slate-600">{selectedCategoryData?.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryArticles.map((article, index) => {
                const isCompleted = isArticleCompleted(article.id);
                const quizScore = getQuizScore(article.id);
                
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:bg-white transition-all duration-300 cursor-pointer"
                    onClick={() => handleArticleClick(article)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {article.description}
                        </p>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{article.duration}</span>
                        </div>
                        <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                          {article.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Brain className="w-4 h-4 text-purple-500" />
                        <span className="text-purple-600 font-medium">Quiz</span>
                      </div>
                    </div>

                    {quizScore !== null && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">Quiz Score</span>
                          <span className="text-lg font-bold text-green-600">{quizScore}%</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        {isCompleted ? 'Review Article' : 'Read Article'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {categoryArticles.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No articles available in this category yet.</p>
                <p className="text-sm mt-2">Check back soon for new content!</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Learning Path Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white"
        >
          <div className="text-center mb-8">
            <Target className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">🎯 Your Learning Journey</h2>
            <p className="text-blue-100 mb-6">Based on your progress and investment profile</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">Next: Risk Management</h3>
              <p className="text-sm text-blue-100 mb-4">Learn how to balance risk and return in your portfolio</p>
              <button 
                onClick={() => setSelectedCategory('risk')}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
              >
                Start Learning
              </button>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">Suggested: Advanced Topics</h3>
              <p className="text-sm text-blue-100 mb-4">Ready for SMSF and international investing strategies</p>
              <button 
                onClick={() => setSelectedCategory('advanced')}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
              >
                Explore Advanced
              </button>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">Test Your Knowledge</h3>
              <p className="text-sm text-blue-100 mb-4">Take quizzes to reinforce your learning</p>
              <div className="text-lg font-bold mb-2">{stats.averageScore}%</div>
              <div className="text-xs text-blue-100">Average Quiz Score</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Article Modal */}
      <ArticleModal
        isOpen={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        article={selectedArticle}
        category={selectedCategory}
      />
    </div>
  );
};