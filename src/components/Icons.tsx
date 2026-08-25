type P = { size?: number; className?: string };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const svg = (size: number, className: string | undefined, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const Plus = ({ size = 20, className }: P) =>
  svg(size, className, <path d="M12 5v14M5 12h14" {...stroke} strokeWidth={2} />);

export const Check = ({ size = 14, className }: P) =>
  svg(size, className, <path d="M20 6L9 17l-5-5" {...stroke} strokeWidth={3.2} />);

export const Sunrise = ({ size = 20, className }: P) =>
  svg(size, className, <path d="M12 3v5M6.5 10.5L5 9M17.5 10.5L19 9M3 18h18M6 18a6 6 0 0 1 12 0" {...stroke} />);

export const Stack = ({ size = 20, className }: P) =>
  svg(size, className, <path d="M4 7h16M4 12h16M4 17h10" {...stroke} />);

export const Search = ({ size = 20, className }: P) =>
  svg(
    size,
    className,
    <>
      <circle cx="11" cy="11" r="7" {...stroke} />
      <path d="M20 20l-3.5-3.5" {...stroke} />
    </>,
  );

export const Back = ({ size = 22, className }: P) =>
  svg(size, className, <path d="M15 5l-7 7 7 7" {...stroke} strokeWidth={1.9} />);

export const Chevron = ({ size = 16, className }: P) =>
  svg(size, className, <path d="M9 6l6 6-6 6" {...stroke} strokeWidth={2} />);

export const Calendar = ({ size = 17, className }: P) =>
  svg(
    size,
    className,
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="3" {...stroke} />
      <path d="M3.5 10h17M8 3v4M16 3v4" {...stroke} />
    </>,
  );

export const Trash = ({ size = 17, className }: P) =>
  svg(size, className, <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...stroke} />);

export const Drag = ({ size = 16, className }: P) =>
  svg(
    size,
    className,
    <g fill="currentColor">
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="9" cy={y} r="1.5" />
          <circle cx="15" cy={y} r="1.5" />
        </g>
      ))}
    </g>,
  );

export const Close = ({ size = 20, className }: P) =>
  svg(size, className, <path d="M6 6l12 12M18 6L6 18" {...stroke} strokeWidth={1.9} />);

export const Panel = ({ size = 16, className }: P) =>
  svg(
    size,
    className,
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" {...stroke} strokeWidth={1.8} />
      <path d="M14.5 4v16" {...stroke} strokeWidth={1.8} />
    </>,
  );
