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

  // The chosen sound is a major third — E5 then G#5 — struck as bells. Each
  // note rings on five inharmonic partials, so two notes schedule ten
  // oscillators. Pinning the notes here means changing the sound has to be a
  // decision rather than a drift.
  it('strikes E5 and G#5, five partials each', () => {
    expect(audio.frequencies).toHaveLength(10);

    const e5 = audio.frequencies.slice(0, 5);
    const gs5 = audio.frequencies.slice(5);

    expect(e5[0]).toBeCloseTo(659.25, 2);
    expect(gs5[0]).toBeCloseTo(830.61, 2);

    // A major third is a frequency ratio of about 1.26.
    expect(gs5[0]! / e5[0]!).toBeCloseTo(1.26, 2);
  });

  it('rings each note on partials that are not whole multiples', () => {
    const [fundamental, ...rest] = audio.frequencies.slice(0, 5) as number[];
    const ratios = rest.map((hz) => hz / fundamental!);

    expect(ratios).toHaveLength(4);
    // Whole-number multiples would make it an organ, not a bell.
    for (const ratio of ratios) expect(Math.abs(ratio - Math.round(ratio))).toBeGreaterThan(0.005);
  });

  it('delays the second note so the third is heard as rising, not as a chord', () => {
    expect(audio.started).toHaveLength(10);
    const firstNote = Math.min(...audio.started.slice(0, 5));
    const secondNote = Math.min(...audio.started.slice(5));
    expect(secondNote - firstNote).toBeCloseTo(0.085, 3);
  });
});
