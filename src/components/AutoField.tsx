import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const IDLE_MS = 600;

/**
 * A text field that saves itself: on idle, on blur, and on unmount if there is
 * anything pending. There is no Save button anywhere in the app, so the pending
 * edit must never be able to escape without being written.
 */
export function AutoField({
  value,
  onCommit,
  maxLength,
  label,
  multiline,
  placeholder,
  className,
  required,
}: {
  value: string;
  onCommit: (next: string) => void;
  maxLength: number;
  label: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ draft, value, onCommit, required });
  latest.current = { draft, value, onCommit, required };

  // Adopt changes that came from elsewhere (another device, an undo) unless the
  // field is mid-edit with something unsaved.
  useEffect(() => {
    if (timer.current === undefined) setDraft(value);
  }, [value]);

  const commit = (next: string) => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const trimmed = next.trim();
    if (required && trimmed.length === 0) {
      setDraft(latest.current.value); // an empty title is not a valid state
      return;
    }
    if (trimmed !== latest.current.value) onCommit(trimmed);
  };

  // Flush on unmount — closing the detail view must not lose the last keystrokes.
  useEffect(
    () => () => {
      if (timer.current !== undefined) {
        clearTimeout(timer.current);
        const { draft: d, value: v, onCommit: c, required: r } = latest.current;
        const trimmed = d.trim();
        if (trimmed !== v && !(r && trimmed.length === 0)) c(trimmed);
      }
    },
    [],
  );

  const onChange = (next: string) => {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), IDLE_MS);
  };

  // A fixed row count clips a long description with no scrollbar to hint at
  // it, so the textarea grows to fit whatever is in it.
  const area = useRef<HTMLTextAreaElement | null>(null);
  const fit = useCallback(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useLayoutEffect(fit, [draft, multiline, fit]);

  const shared = {
    value: draft,
    maxLength,
    placeholder,
    'aria-label': label,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onBlur: () => commit(draft),
    className: `w-full resize-none bg-transparent outline-none placeholder:text-faint ${className ?? ''}`,
  };

  const remaining = maxLength - draft.length;

  return (
    <div>
      {multiline ? <textarea {...shared} ref={area} rows={2} /> : <input {...shared} />}
      <div className="text-faint mt-2 flex justify-between text-[11.5px]">
        <span>{label}</span>
        <span className={remaining <= maxLength * 0.1 ? 'text-soon font-medium tabular-nums' : 'tabular-nums'}>
          {draft.length} / {maxLength}
        </span>
      </div>
      <div className="bg-line mt-1.5 h-px" />
    </div>
  );
}
