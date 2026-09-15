/** The completion chime.
 *
 *  Synthesised rather than shipped as an audio file: a few hundred bytes of
 *  code instead of a request, and nothing to fetch at the moment it has to
 *  play. Every call is best-effort — a browser that will not give us audio
 *  gets a silent tick, never an error. */

/** One context, made lazily. A browser only lets one start inside a user
 *  gesture, and ticking a box is always a gesture. */
let context: AudioContext | null = null;

function ready(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  try {
    context ??= new window.AudioContext();
  } catch {
    return null; // blocked by policy, or no output device
  }
  // Safari parks a fresh context until a gesture unlocks it.
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** A rising perfect fifth. The interval is what makes it read as resolved
 *  rather than merely loud — worth more than volume for something that fires
 *  this often. */
const NOTES: readonly { hz: number; delay: number }[] = [
  { hz: 659.25, delay: 0 }, // E5
  { hz: 987.77, delay: 0.075 }, // B5
];

const PEAK = 0.16; // deliberately quiet; it repeats all day
const DECAY = 0.24; // seconds

export function playTickSound(): void {
  const ac = ready();
  if (!ac) return;

  // A shared lowpass takes the glassy edge off a pair of raw sines.
  const tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2600;
  tone.connect(ac.destination);

  for (const { hz, delay } of NOTES) {
    const start = ac.currentTime + delay;

    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, start);

    // Ramping from near-silence rather than jumping is what keeps the attack
    // from clicking. An exponential ramp cannot touch zero, hence 0.0001.
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(PEAK, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + DECAY);

    osc.connect(gain).connect(tone);
    osc.start(start);
    osc.stop(start + DECAY + 0.02);
  }
}
