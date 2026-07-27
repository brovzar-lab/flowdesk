import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DebaterPodium } from './DebaterPodium';
import { useDebateStore } from '../store/debateStore';
import { MODELS } from '../data/models';

describe('DebaterPodium', () => {
  beforeEach(() => {
    useDebateStore.getState().reset();
  });

  it('shows empty drop zone when no debater assigned', () => {
    render(<DebaterPodium side="left" />);
    expect(screen.getByTestId('podium-left')).toBeInTheDocument();
    expect(screen.getByText('Drag a model here')).toBeInTheDocument();
  });

  it('shows assigned model info after store is updated', () => {
    useDebateStore.getState().assignDebater('left', MODELS[0]);
    render(<DebaterPodium side="left" />);
    expect(screen.getByText(MODELS[0].name)).toBeInTheDocument();
    expect(screen.getByText(MODELS[0].provider)).toBeInTheDocument();
  });

  it('right podium only shows right debater', () => {
    useDebateStore.getState().assignDebater('left', MODELS[0]);
    useDebateStore.getState().assignDebater('right', MODELS[1]);
    render(<DebaterPodium side="right" />);
    expect(screen.getByText(MODELS[1].name)).toBeInTheDocument();
    expect(screen.queryByText(MODELS[0].name)).not.toBeInTheDocument();
  });

  it('removes debater from store when remove button is clicked', () => {
    useDebateStore.getState().assignDebater('left', MODELS[0]);
    render(<DebaterPodium side="left" />);
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(useDebateStore.getState().config.leftDebater).toBeNull();
  });

  it('assigns model to left podium on drop', () => {
    render(<DebaterPodium side="left" />);
    const podium = screen.getByTestId('podium-left');

    fireEvent.drop(podium, {
      dataTransfer: { getData: (key: string) => (key === 'modelId' ? MODELS[0].id : '') },
    });

    expect(useDebateStore.getState().config.leftDebater?.model.id).toBe(MODELS[0].id);
  });

  it('assigns model to right podium on drop independently', () => {
    render(<DebaterPodium side="right" />);
    const podium = screen.getByTestId('podium-right');

    fireEvent.drop(podium, {
      dataTransfer: { getData: (key: string) => (key === 'modelId' ? MODELS[2].id : '') },
    });

    expect(useDebateStore.getState().config.rightDebater?.model.id).toBe(MODELS[2].id);
    expect(useDebateStore.getState().config.leftDebater).toBeNull();
  });
});
