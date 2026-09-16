/** The completion chime: an open fifth, struck as two bells at once.
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

/** A bell rings on partials that are not whole-number multiples of its note,
 *  and the high ones die away first. That inharmonicity is the difference
 *  between a struck bell and a stack of plain sines. Each entry is
 *  [frequency multiple, level, tail length]. */
const PARTIALS: readonly (readonly [number, number, number])[] = [
  [1, 1, 1],
  [2.01, 0.52, 0.7],
  [2.99, 0.24, 0.45],
  [4.18, 0.13, 0.26],
  [5.43, 0.07, 0.16],
];

/** E5 and B5 — a fifth apart, and struck together rather than in sequence.
 *
 *  Two notes played one after another form a short melodic figure, and a
 *  melodic figure is the thing an ear recognises and files against something
 *  it has heard before; that is what made the previous rising third read as
 *  Duolingo's. Landing them 12ms apart is under the threshold where they
 *  separate into events, so this arrives as one bright thing instead. The
 *  fifth is left open — no third between them — which reads as clear rather
 *  than cheerful, and wears better for something heard dozens of times a day.
 *  Each entry is [hz, delay, decay] in seconds. */
const NOTES: readonly (readonly [number, number, number])[] = [
  [659.25, 0, 1.2],
  [987.77, 0.012, 1.2],
];

/** Quiet on purpose. Loudness is the first thing to grate on a sound heard
 *  this often; the interval and the ring are doing the work instead. */
const PEAK = 0.063;

function strike(ac: AudioContext, out: AudioNode, at: number, hz: number, decay: number): void {
  for (const [multiple, level, tail] of PARTIALS) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz * multiple, at);

    // Ramping from near-silence rather than jumping is what keeps the attack
    // from clicking. An exponential ramp cannot touch zero, hence the floor.
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, PEAK * level), at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay * tail);

    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + decay * tail + 0.02);
  }
}

export function playTickSound(): void {
  const ac = ready();
  if (!ac) return;

  // A shared lowpass rounds off the topmost partials, so the strike reads as
  // struck metal rather than glare.
  const tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 6000;
  tone.connect(ac.destination);

  // A beat of lead-in, so the first partial is scheduled rather than racing
  // the clock it is scheduled against.
  const start = ac.currentTime + 0.01;
  for (const [hz, delay, decay] of NOTES) strike(ac, tone, start + delay, hz, decay);
}
