export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
  price: number;
  currency: string;
  interval?: 'month' | 'year';
  features: string[];
  popular?: boolean;
  category: 'free' | 'pro' | 'family' | 'enterprise';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  // SuperAI Pro - Monthly
  {
    id: 'prod_StvkdUD1tH82UM',
    priceId: 'price_1Ry7t7CrbvEh5Z2rRrBDBC9V',
    name: 'SuperAI Pro',
    description: 'Most popular for serious investors',
    mode: 'subscription',
    price: 29.00,
    currency: 'USD',
    interval: 'month',
    category: 'pro',
    popular: true,
    features: [
      'Unlimited portfolio holdings',
      'Weekly AI insights & recommendations',
      'Advanced forecasting & Monte Carlo simulations',
      'Real-time market data & alerts',
      'Tax optimization strategies',
      'Risk analysis & rebalancing suggestions',
      'Priority email & chat support',
      'Advanced charts & analytics',
      'Portfolio performance benchmarking',
      'Goal tracking & milestone alerts',
      'Export reports (PDF/Excel)',
      'What-if scenario modeling'
    ]
  },
  // SuperAI Pro - Yearly
  {
    id: 'prod_StvlpzT1JArLyT',
    priceId: 'price_1Ry7uFCrbvEh5Z2rfksYAgi3',
    name: 'SuperAI Pro',
    description: 'Most popular for serious investors (Annual)',
    mode: 'subscription',
    price: 299.00,
    currency: 'USD',
    interval: 'year',
    category: 'pro',
    popular: true,
    features: [
      'Everything in monthly Pro plan',
      'Save $49 per year (14% discount)',
      'Priority feature requests',
      'Extended support hours'
    ]
  },
  // SuperAI Family - Monthly
  {
    id: 'prod_StvlDgT0U1g6cm',
    priceId: 'price_1Ry7taCrbvEh5Z2r6oamOPoQ',
    name: 'SuperAI Family',
    description: 'Perfect for families & couples',
    mode: 'subscription',
    price: 49.00,
    currency: 'USD',
    interval: 'month',
    category: 'family',
    features: [
      'Everything in Pro, plus:',
      'Up to 4 family member accounts',
      'Shared family financial goals',
      'Joint portfolio management',
      'Family financial education resources',
      'Spouse contribution optimization',
      'Estate planning guidance',
      'Family meeting scheduler',
      'Consolidated reporting across accounts',
      'Child education savings planning',
      'Family risk assessment tools',
      'Inheritance planning features'
    ]
  },
  // SuperAI Family - Yearly
  {
    id: 'prod_StvmE2NiBc7JYG',
    priceId: 'price_1Ry7udCrbvEh5Z2r4DUcNQlB',
    name: 'SuperAI Family',
    description: 'Perfect for families & couples (Annual)',
    mode: 'subscription',
    price: 499.00,
    currency: 'USD',
    interval: 'year',
    category: 'family',
    features: [
      'Everything in monthly Family plan',
      'Save $89 per year (15% discount)',
      'Annual family financial review',
      'Priority family support'
    ]
  },
  // SuperAI Enterprise - Monthly
  {
    id: 'prod_StvmdTwQRq4MSA',
    priceId: 'price_1Ry7v4CrbvEh5Z2rgmtLGpfT',
    name: 'SuperAI Enterprise',
    description: 'For wealth managers & institutions',
    mode: 'subscription',
    price: 199.00,
    currency: 'USD',
    interval: 'month',
    category: 'enterprise',
    features: [
      'Everything in Family, plus:',
      'Unlimited client accounts',
      'White-label dashboard options',
      'Advanced API access & integrations',
      'Custom investment strategies',
      'Dedicated account manager',
      'Phone support & training',
      'Advanced compliance reporting',
      'Team collaboration tools',
      'Custom alerts & notifications',
      'Priority feature requests',
      'SMSF advanced analytics',
      'Institutional-grade security',
      'Custom branding options'
    ]
  },
  // SuperAI Enterprise - Yearly
  {
    id: 'prod_StvnUjBNw9Yq0b',
    priceId: 'price_1Ry7vdCrbvEh5Z2rvNwlvR4H',
    name: 'SuperAI Enterprise',
    description: 'For wealth managers & institutions (Annual)',
    mode: 'subscription',
    price: 1999.00,
    currency: 'USD',
    interval: 'year',
    category: 'enterprise',
    features: [
      'Everything in monthly Enterprise plan',
      'Save $389 per year (16% discount)',
      'Quarterly business reviews',
      'Custom integration support',
      'Dedicated technical support'
    ]
  }
];

export const getProductsByCategory = (category: string) => {
  return STRIPE_PRODUCTS.filter(product => product.category === category);
};

export const getProductByPriceId = (priceId: string) => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};

export const getProductById = (productId: string) => {
  return STRIPE_PRODUCTS.find(product => product.id === productId);
};

export const getMonthlyAndYearlyProducts = () => {
  const grouped = STRIPE_PRODUCTS.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = { monthly: null, yearly: null };
    }
    
    if (product.interval === 'month') {
      acc[product.category].monthly = product;
    } else if (product.interval === 'year') {
      acc[product.category].yearly = product;
    }
    
    return acc;
  }, {} as Record<string, { monthly: StripeProduct | null; yearly: StripeProduct | null }>);
  
  return grouped;
};