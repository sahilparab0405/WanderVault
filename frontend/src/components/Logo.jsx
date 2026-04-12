/**
 * WanderVault Logo — Clean wordmark with hand-crafted compass SVG
 * Style: Yatra / Cleartrip-inspired. No emoji, no clipart.
 * 
 * "Wander" → Poppins Bold #1a2b4a
 * "Vault"  → Poppins Bold #FF6B35
 * Icon     → Compass SVG, #FF6B35, left of text
 * Height   → 32px total
 */

export default function Logo({ size = 'default', showText = true, className = '' }) {
  const sizes = {
    small:   { icon: 22, text: 13, gap: 6 },
    default: { icon: 28, text: 16, gap: 7 },
    large:   { icon: 40, text: 22, gap: 9 },
  };

  const s = sizes[size] || sizes.default;

  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: `${s.gap}px` }}
      aria-label="WanderVault"
    >
      {/* Compass icon — hand-crafted SVG, no emoji */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer circle */}
        <circle cx="16" cy="16" r="14" stroke="#FF6B35" strokeWidth="1.8" />

        {/* Compass needle — North (orange) */}
        <path
          d="M16 16 L13.5 8 L16 10.5 L18.5 8 Z"
          fill="#FF6B35"
        />
        {/* Compass needle — South (muted) */}
        <path
          d="M16 16 L13.5 24 L16 21.5 L18.5 24 Z"
          fill="#FF6B35"
          fillOpacity="0.3"
        />

        {/* Cardinal dot — center */}
        <circle cx="16" cy="16" r="2" fill="#FF6B35" />

        {/* Tick marks at E and W */}
        <line x1="3" y1="16" x2="5.5" y2="16" stroke="#1a2b4a" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="26.5" y1="16" x2="29" y2="16" stroke="#1a2b4a" strokeWidth="1.6" strokeLinecap="round" />
      </svg>

      {/* Wordmark */}
      {showText && (
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: `${s.text}px`,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          <span style={{ color: '#1a2b4a' }}>Wander</span>
          <span style={{ color: '#FF6B35' }}>Vault</span>
        </span>
      )}
    </div>
  );
}
