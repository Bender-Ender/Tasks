import { describe, expect, it } from 'vitest';
import { playTickSound } from '../src/lib/sound';

describe('playTickSound', () => {
  // These tests run without a DOM, which is the same shape as a browser that
  // refuses us an AudioContext. Ticking a box must still work there.
  it('is a silent no-op when there is no audio to be had', () => {
    expect(() => playTickSound()).not.toThrow();
  });

  it('stays a no-op when called repeatedly', () => {
    expect(() => {
      for (let i = 0; i < 5; i++) playTickSound();
    }).not.toThrow();
  });
});
