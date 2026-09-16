import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { playTickSound } from '../src/lib/sound';

/** Enough of the Web Audio API to record what was scheduled. `connect` returns
 *  its argument so the `osc.connect(gain).connect(out)` chaining in the module
 *  works the way it does in a browser. */
function fakeAudio() {
  const frequencies: number[] = [];
  const started: number[] = [];

  const node = () => ({ connect: <T>(next: T) => next });
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });

  const ctx = {
    state: 'running',
    currentTime: 0,
    destination: node(),
    resume() {},
    createBiquadFilter: () => ({ ...node(), type: '', frequency: param() }),
    createGain: () => ({ ...node(), gain: param() }),
    createOscillator: () => ({
      ...node(),
      type: '',
      frequency: {
        ...param(),
        setValueAtTime(hz: number) {
          frequencies.push(hz);
        },
      },
      start(at: number) {
        started.push(at);
      },
      stop() {},
    }),
  };

  return { ctx, frequencies, started };
}

describe('playTickSound with no audio available', () => {
  // Same shape as a browser that refuses us an AudioContext. Ticking a box
  // must still work there — a silent tick, never an error.
  it('is a silent no-op', () => {
    expect(() => playTickSound()).not.toThrow();
  });

  it('stays a no-op when called repeatedly', () => {
    expect(() => {
      for (let i = 0; i < 5; i++) playTickSound();
    }).not.toThrow();
  });
});

describe('playTickSound with audio', () => {
  const audio = fakeAudio();

  beforeAll(() => {
    (globalThis as { window?: unknown }).window = { AudioContext: function () { return audio.ctx; } };
    playTickSound();
  });

  afterAll(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  // The chosen sound is an open fifth — E5 and B5 — struck as bells. Each note
  // rings on five inharmonic partials, so two notes schedule ten oscillators.
  // Pinning the notes here means changing the sound has to be a decision
  // rather than a drift.
  it('strikes E5 and B5, five partials each', () => {
    expect(audio.frequencies).toHaveLength(10);

    const e5 = audio.frequencies.slice(0, 5);
    const b5 = audio.frequencies.slice(5);

    expect(e5[0]).toBeCloseTo(659.25, 2);
    expect(b5[0]).toBeCloseTo(987.77, 2);

    // A perfect fifth is a frequency ratio of 3:2. The fifth is left open —
    // no third between the two — which is what keeps it clear rather than
    // cheerful.
    expect(b5[0]! / e5[0]!).toBeCloseTo(1.5, 2);
  });

  it('rings each note on partials that are not whole multiples', () => {
    const [fundamental, ...rest] = audio.frequencies.slice(0, 5) as number[];
    const ratios = rest.map((hz) => hz / fundamental!);

    expect(ratios).toHaveLength(4);
    // Whole-number multiples would make it an organ, not a bell.
    for (const ratio of ratios) expect(Math.abs(ratio - Math.round(ratio))).toBeGreaterThan(0.005);
  });

  // The whole point of this sound is that it is NOT a melodic figure — two
  // notes far enough apart to be heard in sequence is what made the previous
  // chime read as Duolingo's. Below roughly 50ms an ear stops separating them
  // into events, so the gap staying small is the property to protect.
  it('strikes the two notes close enough together to read as one event', () => {
    expect(audio.started).toHaveLength(10);
    const firstNote = Math.min(...audio.started.slice(0, 5));
    const secondNote = Math.min(...audio.started.slice(5));
    const gap = secondNote - firstNote;

    expect(gap).toBeCloseTo(0.012, 3);
    expect(gap).toBeLessThan(0.05);
  });
});
