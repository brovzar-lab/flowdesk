import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormatSelector } from './FormatSelector';
import { DEBATE_FORMATS } from '../../data/formats';

describe('FormatSelector', () => {
  it('renders all 6 format cards', () => {
    render(<FormatSelector selectedFormat="classic" onSelect={vi.fn()} />);
    for (const format of DEBATE_FORMATS) {
      expect(screen.getByTestId(`format-card-${format.id}`)).toBeInTheDocument();
    }
  });

  it('shows the label and blurb for each format', () => {
    render(<FormatSelector selectedFormat="classic" onSelect={vi.fn()} />);
    expect(screen.getByText('Classic Debate')).toBeInTheDocument();
    expect(screen.getByText('Heated Argument')).toBeInTheDocument();
  });

  it('marks selected format as aria-pressed=true', () => {
    render(<FormatSelector selectedFormat="heated" onSelect={vi.fn()} />);
    expect(screen.getByTestId('format-card-heated')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('format-card-classic')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onSelect with the clicked format id', () => {
    const onSelect = vi.fn();
    render(<FormatSelector selectedFormat="classic" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('format-card-discussion'));
    expect(onSelect).toHaveBeenCalledWith('discussion');
  });

  it('calls onSelect with the correct id for each format', () => {
    const onSelect = vi.fn();
    render(<FormatSelector selectedFormat="classic" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('format-card-oxford'));
    expect(onSelect).toHaveBeenCalledWith('oxford');
  });
});
