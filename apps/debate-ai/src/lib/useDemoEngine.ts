import { useEffect } from 'react';
import { useDebateStore } from '../store/debateStore';
import { useSettingsStore } from '../store/settingsStore';
import { MODELS } from '../data/models';
import type { BestIdeaResult } from '../types';

const DEMO_LEFT = MODELS.find((m) => m.id === 'gpt-4o')!;
const DEMO_RIGHT = MODELS.find((m) => m.id === 'claude-3.5-sonnet')!;

export const DEMO_BRAINSTORM_TURNS = [
  {
    side: 'left' as const,
    text: "What if the whole film is told from the perspective of a letter that never gets sent? Every scene is a memory triggered by the act of writing it — we never see the recipient, only the sender's world unraveling.",
    status: 'done' as const,
  },
  {
    side: 'right' as const,
    text: "Yes, and — the letter keeps getting rewritten. We see multiple drafts, each one more honest than the last. The film's structure *is* the drafting process: every cut is a line crossed out. The final version is the film itself.",
    status: 'done' as const,
  },
  {
    side: 'lead' as const,
    leadType: 'steer' as const,
    text: "Strong thread forming. The 'drafts as cuts' mechanic is genuinely fresh — it externalises interiority without voiceover and gives the editor a structural language. Keep building on this thread.",
    status: 'done' as const,
  },
  {
    side: 'left' as const,
    text: "The sender is writing to someone who died before the letter could be sent. The film becomes about learning to say the thing you never said — and the final draft is the version they'd have wanted to receive.",
    status: 'done' as const,
  },
  {
    side: 'right' as const,
    text: "Or flip it entirely: the unsent letter is a breakup letter, but the recipient is a city, not a person. That's a film about grief as urban displacement.",
    status: 'done' as const,
  },
  {
    side: 'lead' as const,
    leadType: 'synthesis' as const,
    text: "Best idea: the unsent letter as narrative spine — each draft is a cut, the film structure mirrors the rewriting process. The sender writes to someone who died before it could be sent; the final draft becomes the version they'd have wanted to receive. The other ideas are strong variants of the same spine.",
    status: 'done' as const,
  },
];

export const DEMO_BEST_IDEA: BestIdeaResult = {
  winningIdea: 'An unsent letter as narrative spine — each draft is a cut',
  pitch: 'A film structured as the rewriting process itself, culminating in the version the sender finally meant.',
  runnerUps: [
    {
      title: 'The recipient is deceased',
      pitch: 'Learning to say what was never said before it was too late.',
    },
    {
      title: 'The recipient is a city',
      pitch: 'A breakup letter to a place — grief as urban displacement.',
    },
  ],
  rationale:
    "The drafts-as-cuts mechanic earns its place because it's both formal and emotional: it externalises interiority without voiceover, gives the editor a structural language, and lets the audience feel the revision in real time. The other ideas are strong variants of the same spine — they extend it rather than replace it.",
};

/**
 * In demo mode, pre-fills the setup screen with Brainstorm format + Film
 * subject so the format card and subject selector are immediately visible.
 */
export function useDemoEngine() {
  const isDemoMode = useSettingsStore((s) => s.isDemoMode);

  useEffect(() => {
    if (!isDemoMode) return;
    const { assignDebater, setPersonaName, setStance, setFormat, setSubject, setTopic } =
      useDebateStore.getState();

    assignDebater('left', DEMO_LEFT);
    setPersonaName('left', 'GPT-4o');
    setStance('left', 'Idea Partner A');
    assignDebater('right', DEMO_RIGHT);
    setPersonaName('right', 'Claude 3.5');
    setStance('right', 'Idea Partner B');
    setFormat('brainstorm');
    setSubject('film');
    setTopic('A film told through an unsent letter');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Populates the arena with scripted brainstorm turns (including Lead steer +
 * synthesis) and advances to the 'done' phase for the BestIdeaReveal.
 * Called by ArenaScreen on mount in demo mode.
 */
export function runBrainstormDemo() {
  const { addTurn, setBestIdeaResult, finishDebate } = useDebateStore.getState();
  DEMO_BRAINSTORM_TURNS.forEach((t) => addTurn(t));
  setBestIdeaResult(DEMO_BEST_IDEA);
  finishDebate();
}
