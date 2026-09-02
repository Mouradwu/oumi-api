export function BloodDrop({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 120 138" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dropBody" x1="20" y1="10" x2="100" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F2545B" />
          <stop offset="55%" stopColor="#E13341" />
          <stop offset="100%" stopColor="#A31F2C" />
        </linearGradient>
        <radialGradient id="dropShine" cx="38%" cy="30%" r="35%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="128" rx="34" ry="7" fill="#E13341" opacity="0.12" />
      <path
        d="M60 6C60 6 20 58 20 88C20 110.09 38.24 128 60 128C81.76 128 100 110.09 100 88C100 58 60 6 60 6Z"
        fill="url(#dropBody)"
      />
      <path
        d="M60 6C60 6 20 58 20 88C20 110.09 38.24 128 60 128C81.76 128 100 110.09 100 88C100 58 60 6 60 6Z"
        fill="url(#dropShine)"
      />
      <path d="M39 82c0 0 5-6 12-6s12 6 12 6" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
