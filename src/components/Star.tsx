/** Handgetekend sterretje, het terugkerende BRANIE-tekentje. */
export default function Star({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      className={`star ${className}`}
      viewBox="0 0 100 100"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M50 4 C53 26 57 38 63 41 C70 44 82 44 96 47 C82 52 70 55 64 60 C59 66 56 78 52 96 C48 78 44 66 38 60 C32 55 18 52 4 50 C18 46 31 44 37 40 C43 36 47 25 50 4 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
