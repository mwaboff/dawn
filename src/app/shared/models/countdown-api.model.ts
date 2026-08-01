/**
 * A countdown's advancement mode — the field that answers "when do I tick this?".
 *
 * Mirrors the Daggerheart SRD (p. 68). Note that "dynamic" is not a value of its own:
 * `PROGRESS` and `CONSEQUENCE` are the two dynamic kinds, differing only in which column of
 * the Dynamic Countdown Advancement table they read.
 */
export type CountdownType = 'STANDARD' | 'PROGRESS' | 'CONSEQUENCE' | 'LONG_TERM';

/** What a countdown does after its effect triggers at 0 (SRD p. 69, Advanced Countdown Features). */
export type CountdownLoop = 'NONE' | 'LOOP' | 'LOOP_INCREASING' | 'LOOP_DECREASING';

export interface CountdownResponse {
  id: number;
  campaignId: number;
  name: string;
  type: CountdownType;
  loopBehavior: CountdownLoop;
  startingValue: number;
  currentValue: number;
  note?: string;
  displayOrder: number;
  createdAt: string;
  lastModifiedAt: string;
}

export interface CreateCountdownRequest {
  campaignId: number;
  name: string;
  type: CountdownType;
  loopBehavior: CountdownLoop;
  startingValue: number;
  note?: string;
}

export interface UpdateCountdownRequest {
  name: string;
  type: CountdownType;
  loopBehavior: CountdownLoop;
  startingValue: number;
  note?: string;
}

/**
 * The trigger text shown beside each countdown, so a GM never has to remember which kind
 * advances when. Quoted from the SRD's advancement rules.
 */
export const COUNTDOWN_TYPE_OPTIONS: readonly {
  value: CountdownType;
  label: string;
  trigger: string;
}[] = [
  { value: 'STANDARD', label: 'Standard', trigger: 'Tick down 1 on every action roll.' },
  {
    value: 'PROGRESS',
    label: 'Progress',
    trigger: 'Toward something good. Crit 3 · Succ+Hope 2 · Succ+Fear 1 · failures 0.',
  },
  {
    value: 'CONSEQUENCE',
    label: 'Consequence',
    trigger: 'Toward something bad. Fail+Fear 3 · Fail+Hope 2 · Succ+Fear 1 · successes 0.',
  },
  { value: 'LONG_TERM', label: 'Long-term', trigger: 'Tick down 1 on a long rest.' },
];

export const COUNTDOWN_LOOP_OPTIONS: readonly { value: CountdownLoop; label: string }[] = [
  { value: 'NONE', label: 'Stops at 0' },
  { value: 'LOOP', label: 'Loops' },
  { value: 'LOOP_INCREASING', label: 'Loops, +1 each time' },
  { value: 'LOOP_DECREASING', label: 'Loops, −1 each time' },
];
