// Filigrane tres discret (5-6% d'opacite) evoquant la goutte BLOODZ et le
// croissant/etoile - jamais le drapeau algerien plaque tel quel, juste une
// texture de fond subtile qui ne nuit jamais a la lisibilite du contenu.
export function BrandWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute pointer-events-none select-none ${className}`}
      viewBox="0 0 400 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M200 20C200 20 60 190 60 300C60 375 122 440 200 440C278 440 340 375 340 300C340 190 200 20 200 20Z"
        fill="var(--color-brand)"
        opacity="0.06"
      />
      <circle cx="220" cy="300" r="55" fill="none" stroke="var(--color-vital)" strokeWidth="10" opacity="0.05" />
      <path
        d="M200 258l9 26 27 0-22 17 8 26-22-16-22 16 8-26-22-17 27 0z"
        fill="var(--color-vital)"
        opacity="0.05"
      />
    </svg>
  );
}
