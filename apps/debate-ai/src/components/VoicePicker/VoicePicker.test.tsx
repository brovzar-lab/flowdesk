import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoicePicker } from './VoicePicker';
import { useDebateStore } from '../../store/debateStore';
import { useSettingsStore } from '../../store/settingsStore';
import { AVAILABLE_VOICES } from '../../data/voices';
import { MODELS } from '../../data/models';

function assignLeft() {
  useDebateStore.getState().assignDebater('left', MODELS[0]);
}

describe('VoicePicker', () => {
  beforeEach(() => {
    useDebateStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('renders a select with all 8 voice options', () => {
    assignLeft();
    render(<VoicePicker side="left" />);
    const select = screen.getByTestId('voice-select-left');
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll('option')).toHaveLength(AVAILABLE_VOICES.length);
  });

  it('renders a preview button', () => {
    assignLeft();
    render(<VoicePicker side="left" />);
    expect(screen.getByTestId('voice-preview-left')).toBeInTheDocument();
  });

  it('defaults to the first voice', () => {
    assignLeft();
    render(<VoicePicker side="left" />);
    const select = screen.getByTestId('voice-select-left') as HTMLSelectElement;
    expect(select.value).toBe(AVAILABLE_VOICES[0].id);
  });

  it('updates store when voice is changed', () => {
    assignLeft();
    render(<VoicePicker side="left" />);
    const select = screen.getByTestId('voice-select-left');
    fireEvent.change(select, { target: { value: AVAILABLE_VOICES[2].id } });
    expect(useDebateStore.getState().config.leftDebater?.voiceId).toBe(AVAILABLE_VOICES[2].id);
  });

  it('calls /api/tts with voiceId and preview text on preview click', async () => {
    assignLeft();
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(mockBlob) });
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() });

    const mockAudio = { play: vi.fn().mockResolvedValue(undefined), onended: null, onerror: null };
    vi.stubGlobal('Audio', vi.fn(() => mockAudio));

    render(<VoicePicker side="left" />);
    fireEvent.click(screen.getByTestId('voice-preview-left'));

    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/tts');
    const body = JSON.parse(opts.body);
    expect(body.voiceId).toBe(AVAILABLE_VOICES[0].id);
    expect(body.text).toBeTruthy();
  });

  it('shows demo toast when TTS fails in demo mode', async () => {
    useSettingsStore.setState({ isDemoMode: true });
    assignLeft();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    render(<VoicePicker side="left" />);
    fireEvent.click(screen.getByTestId('voice-preview-left'));

    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
  });
});
