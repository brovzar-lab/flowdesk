import { Router, type Request, type Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '../middleware/auth';
import type {
  PlanDailyRequest,
  PlanDailyResponse,
  ScheduleBlock,
  ClaudeScheduleOutput,
  Task,
  CalendarEvent,
} from '../types';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] });

function buildPrompt(
  tasks: Task[],
  calendarEvents: CalendarEvent[],
  workdayStart: number,
  workdayEnd: number,
): string {
  const pendingTasks = tasks.filter((t) => !t.done);
  return [
    `Workday: ${workdayStart}:00 to ${workdayEnd}:00.`,
    '',
    'Tasks to schedule:',
    ...pendingTasks.map(
      (t) => `- [${t.type}] ${t.title} (${t.durationMin} min, id: ${t.id})`,
    ),
    '',
    calendarEvents.length > 0
      ? `Existing calendar events (already booked — work around them):\n${calendarEvents.map((e) => `- ${e.title}: ${e.start} to ${e.end}`).join('\n')}`
      : 'No existing calendar events.',
    '',
    'Return ONLY valid JSON with this exact shape (no markdown fences, no extra text):',
    '{',
    '  "schedule": [',
    '    {',
    '      "id": "block-1",',
    '      "taskId": "<task id>",',
    '      "title": "<task title>",',
    '      "type": "<deep|meeting|shallow>",',
    '      "startHour": <number>,',
    '      "startMin": <number>,',
    '      "durationMin": <number>',
    '    }',
    '  ],',
    '  "rationale": "<one paragraph explaining scheduling decisions>"',
    '}',
  ].join('\n');
}

function isTaskType(value: string): value is 'deep' | 'meeting' | 'shallow' {
  return value === 'deep' || value === 'meeting' || value === 'shallow';
}

function parseClaudeOutput(raw: string): ClaudeScheduleOutput {
  const cleaned = raw
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();

  const parsed: unknown = JSON.parse(cleaned);

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>)['schedule']) ||
    typeof (parsed as Record<string, unknown>)['rationale'] !== 'string'
  ) {
    throw new Error('Claude response does not match expected shape');
  }

  const raw_obj = parsed as { schedule: unknown[]; rationale: string };

  const schedule: ScheduleBlock[] = raw_obj.schedule.map((block, i) => {
    if (typeof block !== 'object' || block === null) {
      throw new Error(`schedule[${i}] is not an object`);
    }
    const b = block as Record<string, unknown>;
    if (
      typeof b['id'] !== 'string' ||
      typeof b['taskId'] !== 'string' ||
      typeof b['title'] !== 'string' ||
      typeof b['type'] !== 'string' ||
      !isTaskType(b['type']) ||
      typeof b['startHour'] !== 'number' ||
      typeof b['startMin'] !== 'number' ||
      typeof b['durationMin'] !== 'number'
    ) {
      throw new Error(`schedule[${i}] has invalid fields`);
    }
    return {
      id: b['id'],
      taskId: b['taskId'],
      title: b['title'],
      type: b['type'],
      startHour: b['startHour'],
      startMin: b['startMin'],
      durationMin: b['durationMin'],
    };
  });

  return { schedule, rationale: raw_obj.rationale };
}

router.post(
  '/daily',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Partial<PlanDailyRequest>;

    if (
      !Array.isArray(body.tasks) ||
      !Array.isArray(body.calendarEvents) ||
      typeof body.workdayStart !== 'number' ||
      typeof body.workdayEnd !== 'number'
    ) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const { tasks, calendarEvents, workdayStart, workdayEnd } = body as PlanDailyRequest;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system:
          'You are a productivity assistant. Schedule these tasks into the workday. ' +
          'Prioritize deep work in the morning, schedule meetings in the afternoon, ' +
          'batch shallow tasks together. Leave 5-minute buffers between blocks. ' +
          'Return a JSON array of schedule blocks.',
        messages: [
          {
            role: 'user',
            content: buildPrompt(tasks, calendarEvents, workdayStart, workdayEnd),
          },
        ],
      });

      const textBlock = message.content.find((c) => c.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        res.status(502).json({ error: 'No text response from Claude' });
        return;
      }

      const output = parseClaudeOutput(textBlock.text);
      const response: PlanDailyResponse = output;
      res.json(response);
    } catch (err) {
      console.error('Plan daily error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(502).json({ error: `AI planning failed: ${message}` });
    }
  },
);

export default router;
