import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DEMO_EVENTS } from '../lib/mockData';
import InsightsScreen from './InsightsScreen';

// Recharts needs ResizeObserver as a proper class (uses `new`)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

vi.mock('../lib/store', () => ({
  useAppStore: () => ({ events: DEMO_EVENTS }),
}));

describe('InsightsScreen', () => {
  beforeAll(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('renders without crashing with mock store data', () => {
    render(<InsightsScreen />);
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('shows all 3 chart sections', () => {
    render(<InsightsScreen />);
    expect(screen.getByText(/Daily Feeds/i)).toBeInTheDocument();
    expect(screen.getByText(/Sleep \(hrs/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Diapers/i)).toBeInTheDocument();
  });

  it('shows all 3 predictions after loading', async () => {
    render(<InsightsScreen />);
    await waitFor(
      () => {
        expect(screen.getByText('Next feed')).toBeInTheDocument();
        expect(screen.getByText('Afternoon nap window')).toBeInTheDocument();
        expect(screen.getByText('Fussy window')).toBeInTheDocument();
      },
      { timeout: 1500 },
    );
  });

  it('shows the "Share with Pediatrician" button', () => {
    render(<InsightsScreen />);
    expect(screen.getByRole('button', { name: /Share with Pediatrician/i })).toBeInTheDocument();
  });

  it('shows skeleton placeholders while predictions load', () => {
    render(<InsightsScreen />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows summary stat row with avg feeds and sleep', () => {
    render(<InsightsScreen />);
    expect(screen.getByText(/Avg feeds\/day/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg sleep\/day/i)).toBeInTheDocument();
  });
});
