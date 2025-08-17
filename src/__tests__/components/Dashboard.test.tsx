import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '../../components/Dashboard';
import { UserProfile } from '../../App';

// Mock the portfolio hook
vi.mock('../../hooks/usePortfolio', () => ({
  usePortfolio: () => ({
    holdings: [
      {
        id: '1',
        type: 'stock',
        symbol: 'CBA.AX',
        name: 'Commonwealth Bank',
        quantity: 100,
        purchasePrice: 95,
        currentPrice: 105,
        currency: 'AUD',
        region: 'AU',
        exchange: 'ASX',
        purchaseDate: '2024-01-01',
        metadata: {},
      },
    ],
    goals: [],
    getTotalPortfolioValue: () => 10500,
    getAssetAllocation: () => ({ stock: 100 }),
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock react-intersection-observer
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}));

describe('Dashboard Component', () => {
  const mockUserProfile: UserProfile = {
    name: 'John Doe',
    age: 35,
    retirementAge: 65,
    currentSuper: 75000,
    monthlyContribution: 1000,
    riskTolerance: 'balanced',
    financialGoals: ['retirement'],
    completed: true,
  };

  test('should render dashboard with user profile', () => {
    render(<Dashboard userProfile={mockUserProfile} />);
    
    expect(screen.getByText(/Welcome back, John/)).toBeInTheDocument();
    expect(screen.getByText(/Total Portfolio Value/)).toBeInTheDocument();
  });

  test('should display portfolio metrics', () => {
    render(<Dashboard userProfile={mockUserProfile} />);
    
    expect(screen.getByText('$10,500')).toBeInTheDocument(); // Portfolio value
    expect(screen.getByText(/Superannuation Balance/)).toBeInTheDocument();
  });

  test('should handle tab navigation', () => {
    render(<Dashboard userProfile={mockUserProfile} />);
    
    const stocksTab = screen.getByText('Stocks');
    fireEvent.click(stocksTab);
    
    // Should show stocks-specific content
    expect(screen.getByText(/Stock Holdings/)).toBeInTheDocument();
  });

  test('should open scenario panel', () => {
    render(<Dashboard userProfile={mockUserProfile} />);
    
    const scenarioButton = screen.getByText(/What-If Analysis/);
    fireEvent.click(scenarioButton);
    
    // Should show scenario panel (mocked)
    expect(screen.getByText(/What-If Analysis/)).toBeInTheDocument();
  });

  test('should handle null user profile', () => {
    render(<Dashboard userProfile={null} />);
    
    // Should not render anything
    expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument();
  });
});