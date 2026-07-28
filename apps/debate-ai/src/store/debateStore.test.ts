import { describe, it, expect, beforeEach } from 'vitest';
import { useDebateStore } from './debateStore';
import { MODELS } from '../data/models';
import { DEFAULT_VOICE_ID, AVAILABLE_VOICES } from '../data/voices';

function store() {
  return useDebateStore.getState();
}

describe('debateStore', () => {
  beforeEach(() => {
    store().reset();
  });

  it('initialises in setup phase', () => {
    expect(store().phase).toBe('setup');
  });

  it('sets topic', () => {
    store().setTopic('Is pineapple on pizza acceptable?');
    expect(store().config.topic).toBe('Is pineapple on pizza acceptable?');
  });

  it('defaults format to classic', () => {
    expect(store().config.format).toBe('classic');
  });

  it('sets format', () => {
    store().setFormat('heated');
    expect(store().config.format).toBe('heated');
  });

  it('resets format to classic on reset', () => {
    store().setFormat('oxford');
    store().reset();
    expect(store().config.format).toBe('classic');
  });

  it('assigns a model to left side', () => {
    store().assignDebater('left', MODELS[0]);
    expect(store().config.leftDebater?.model.id).toBe(MODELS[0].id);
    expect(store().config.rightDebater).toBeNull();
  });

  it('assigns debater with default voiceId', () => {
    store().assignDebater('left', MODELS[0]);
    expect(store().config.leftDebater?.voiceId).toBe(DEFAULT_VOICE_ID);
  });

  it('sets voiceId on an assigned debater', () => {
    store().assignDebater('left', MODELS[0]);
    store().setVoiceId('left', AVAILABLE_VOICES[3].id);
    expect(store().config.leftDebater?.voiceId).toBe(AVAILABLE_VOICES[3].id);
  });

  it('setVoiceId is a no-op when debater not assigned', () => {
    store().setVoiceId('left', AVAILABLE_VOICES[1].id);
    expect(store().config.leftDebater).toBeNull();
  });

  it('preserves voiceId when model is reassigned', () => {
    store().assignDebater('left', MODELS[0]);
    store().setVoiceId('left', AVAILABLE_VOICES[4].id);
    store().assignDebater('left', MODELS[2]);
    expect(store().config.leftDebater?.voiceId).toBe(AVAILABLE_VOICES[4].id);
  });

  it('assigns models to both sides independently', () => {
    store().assignDebater('left', MODELS[0]);
    store().assignDebater('right', MODELS[1]);
    expect(store().config.leftDebater?.model.id).toBe(MODELS[0].id);
    expect(store().config.rightDebater?.model.id).toBe(MODELS[1].id);
  });

  it('replaces existing debater model when reassigned', () => {
    store().assignDebater('left', MODELS[0]);
    store().assignDebater('left', MODELS[2]);
    expect(store().config.leftDebater?.model.id).toBe(MODELS[2].id);
  });

  it('preserves persona name when model is reassigned', () => {
    store().assignDebater('left', MODELS[0]);
    store().setPersonaName('left', 'Pessimist Pete');
    store().assignDebater('left', MODELS[2]);
    expect(store().config.leftDebater?.personaName).toBe('Pessimist Pete');
  });

  it('removes debater from a side', () => {
    store().assignDebater('left', MODELS[0]);
    store().removeDebater('left');
    expect(store().config.leftDebater).toBeNull();
  });

  it('removing one side does not affect the other', () => {
    store().assignDebater('left', MODELS[0]);
    store().assignDebater('right', MODELS[1]);
    store().removeDebater('left');
    expect(store().config.leftDebater).toBeNull();
    expect(store().config.rightDebater?.model.id).toBe(MODELS[1].id);
  });

  it('does not start debate without a topic', () => {
    store().assignDebater('left', MODELS[0]);
    store().assignDebater('right', MODELS[1]);
    store().setTopic('');
    store().startDebate();
    expect(store().phase).toBe('setup');
  });

  it('does not start debate without both debaters', () => {
    store().setTopic('Test topic');
    store().assignDebater('left', MODELS[0]);
    store().startDebate();
    expect(store().phase).toBe('setup');
  });

  it('transitions to debating when all conditions met', () => {
    store().setTopic('Test topic');
    store().assignDebater('left', MODELS[0]);
    store().assignDebater('right', MODELS[1]);
    store().startDebate();
    expect(store().phase).toBe('debating');
  });

  it('pauses from debating', () => {
    store().setTopic('Test');
    store().assignDebater('left', MODELS[0]);
    store().assignDebater('right', MODELS[1]);
    store().startDebate();
    store().pauseDebate();
    expect(store().phase).toBe('paused');
  });

  it('resumes from paused', () => {
    store().setTopic('Test');
    store().assignDebater('left', MODELS[0]);
    store().assignDebater('right', MODELS[1]);
    store().startDebate();
    store().pauseDebate();
    store().resumeDebate();
    expect(store().phase).toBe('debating');
  });

  it('concludes from debating', () => {
    store().setTopic('Test');
    store().assignDebater('left', MODELS[0]);
    store().assignDebater('right', MODELS[1]);
    store().startDebate();
    store().concludeDebate();
    expect(store().phase).toBe('concluding');
  });

  it('adds turns with sequential ids', () => {
    store().addTurn({ side: 'left', text: 'Opening argument', status: 'done' });
    store().addTurn({ side: 'right', text: 'Counter argument', status: 'streaming' });
    expect(store().turns).toHaveLength(2);
    expect(store().turns[0].id).toBe('turn-1');
    expect(store().turns[1].id).toBe('turn-2');
  });

  it('updates the last turn in place', () => {
    store().addTurn({ side: 'left', text: 'Partial...', status: 'streaming' });
    store().updateLastTurn('Full response complete.', 'done');
    expect(store().turns[0].text).toBe('Full response complete.');
    expect(store().turns[0].status).toBe('done');
  });

  it('sets intensity and syncs to config', () => {
    store().setIntensity(5);
    expect(store().intensity).toBe(5);
    expect(store().config.intensity).toBe(5);
  });

  it('resets all state to initial values', () => {
    store().setTopic('Will be cleared');
    store().assignDebater('left', MODELS[0]);
    store().addTurn({ side: 'left', text: 'Hello', status: 'done' });
    store().reset();
    expect(store().phase).toBe('setup');
    expect(store().config.leftDebater).toBeNull();
    expect(store().turns).toHaveLength(0);
  });
});
