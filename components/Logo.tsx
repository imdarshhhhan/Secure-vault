/** A vault door with a keyhole. */
export default function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Secure Vault logo">
      <rect width="32" height="32" rx="8" fill="#0b5d63" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#eef8f9" strokeWidth="2" />
      <circle cx="16" cy="14" r="2.6" fill="#eef8f9" />
      <path d="M14.8 15.5h2.4l.8 6h-4z" fill="#eef8f9" />
    </svg>
  );
}
