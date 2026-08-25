import { useCallback, useRef, useState } from 'react';

/**
 * A small pointer-driven vertical sortable. Pointer events cover mouse, touch
 * and pen with one code path, and `setPointerCapture` keeps the drag alive when
 * the finger strays outside the row.
 *
 * Rows are measured once at drag start, so a row's height may vary between
 * rows but must not change *during* a drag.
 */

export interface DragHandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
  style: React.CSSProperties;
  'aria-hidden': true;
}

interface Props<T extends { id: string }> {
  items: readonly T[];
  onMove: (from: number, to: number) => void;
  className?: string;
  children: (item: T, ctx: { handle: DragHandleProps; dragging: boolean; index: number }) => React.ReactNode;
}

export function SortableList<T extends { id: string }>({ items, onMove, className, children }: Props<T>) {
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const [drag, setDrag] = useState<{ id: string; from: number; to: number; dy: number } | null>(null);

  const begin = useCallback(
    (index: number, item: T) => (e: React.PointerEvent) => {
      // Let the browser handle right-click and multi-touch gestures.
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const startY = e.clientY;
      const mids = items.map((i) => {
        const el = rowRefs.current.get(i.id);
        if (!el) return Number.POSITIVE_INFINITY;
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });

      let to = index;
      setDrag({ id: item.id, from: index, to, dy: 0 });

      const move = (ev: PointerEvent) => {
        const dy = ev.clientY - startY;
        const y = mids[index]! + dy;
        // Walk outward from the origin to find the row whose midpoint we passed.
        let next = index;
        for (let i = 0; i < mids.length; i++) {
          if (i < index && y < mids[i]!) {
            next = i;
            break;
          }
          if (i > index && y > mids[i]!) next = i;
        }
        to = next;
        setDrag({ id: item.id, from: index, to, dy });
      };

      const end = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        setDrag(null);
        if (to !== index) onMove(index, to);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    },
    [items, onMove],
  );

  /** Rows between the origin and the target slide one place to make room. */
  const shiftFor = (index: number): number => {
    if (!drag || index === drag.from) return 0;
    const el = rowRefs.current.get(items[index]!.id);
    const height = el ? el.getBoundingClientRect().height : 0;
    if (drag.to > drag.from && index > drag.from && index <= drag.to) return -height;
    if (drag.to < drag.from && index < drag.from && index >= drag.to) return height;
    return 0;
  };

  return (
    <ul className={className}>
      {items.map((item, index) => {
        const isDragging = drag?.id === item.id;
        const offset = isDragging ? drag.dy : shiftFor(index);
        return (
          <li
            key={item.id}
            ref={(el) => {
              if (el) rowRefs.current.set(item.id, el);
              else rowRefs.current.delete(item.id);
            }}
            style={{
              transform: offset ? `translateY(${offset}px)` : undefined,
              transition: isDragging ? 'none' : 'transform 150ms ease',
              zIndex: isDragging ? 10 : undefined,
              position: 'relative',
            }}
          >
            {children(item, {
              index,
              dragging: isDragging,
              handle: {
                onPointerDown: begin(index, item),
                style: { touchAction: 'none', cursor: 'grab' },
                'aria-hidden': true,
              },
            })}
          </li>
        );
      })}
    </ul>
  );
}
