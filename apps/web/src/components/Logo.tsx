interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d6d" />
            <stop offset="100%" stopColor="#c9184a" />
          </linearGradient>
        </defs>
        <path
          d="M20 4 C20 4 8 18 8 26 C8 32.627 13.373 38 20 38 C26.627 38 32 32.627 32 26 C32 18 20 4 20 4 Z"
          fill="url(#dropGrad)"
        />
        <path
          d="M16 24 C16 24 18 22 20 22 C22 22 24 24 24 24"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <span
        className="font-bold tracking-tight"
        style={{ fontSize: size * 0.9 }}
      >
        oumi
      </span>
    </div>
  );
}