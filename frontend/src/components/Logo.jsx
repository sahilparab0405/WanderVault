/**
 * WanderVault Original Logo Component
 * 
 * Design: Circular vault door with an airplane flying out,
 * paired with "Wander" (navy) + "Vault" (orange) wordmark.
 * 
 * Hand-crafted SVG — no clipart, no emoji, no icon libraries.
 */

export default function Logo({ size = 'default', showText = true, className = '' }) {
  // Size presets
  const sizes = {
    small: { icon: 28, text: 14, gap: 4 },
    default: { icon: 34, text: 17, gap: 6 },
    large: { icon: 48, text: 24, gap: 8 },
  };

  const s = sizes[size] || sizes.default;

  return (
    <div 
      className={`flex items-center ${className}`} 
      style={{ gap: `${s.gap}px` }}
      aria-label="WanderVault"
    >
      {/* Vault + Airplane Icon */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer vault door circle */}
        <circle 
          cx="22" 
          cy="24" 
          r="20" 
          stroke="#1a2b4a" 
          strokeWidth="3" 
          fill="none" 
        />
        
        {/* Inner vault ring */}
        <circle 
          cx="22" 
          cy="24" 
          r="13" 
          stroke="#1a2b4a" 
          strokeWidth="2" 
          fill="none" 
        />

        {/* Vault handle — horizontal bar */}
        <line 
          x1="14" y1="24" 
          x2="30" y2="24" 
          stroke="#1a2b4a" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />

        {/* Vault handle — vertical bar */}
        <line 
          x1="22" y1="16" 
          x2="22" y2="32" 
          stroke="#1a2b4a" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />

        {/* Vault locking dots — 4 compass points */}
        <circle cx="22" cy="17.5" r="1.5" fill="#1a2b4a" />
        <circle cx="22" cy="30.5" r="1.5" fill="#1a2b4a" />
        <circle cx="14.5" cy="24" r="1.5" fill="#1a2b4a" />
        <circle cx="29.5" cy="24" r="1.5" fill="#1a2b4a" />

        {/* Airplane flying out from vault — positioned top-right */}
        <g transform="translate(31, 8) rotate(-30)">
          {/* Fuselage */}
          <path
            d="M0 5 L12 3 L14 5 L12 7 L0 5Z"
            fill="#FF6B35"
          />
          {/* Top wing */}
          <path
            d="M4 5 L7 0 L9 0 L7 5Z"
            fill="#FF6B35"
          />
          {/* Bottom wing */}
          <path
            d="M4 5 L7 10 L9 10 L7 5Z"
            fill="#FF6B35"
          />
          {/* Tail fin */}
          <path
            d="M0 5 L-1 2.5 L1 2.5Z"
            fill="#FF6B35"
          />
          <path
            d="M0 5 L-1 7.5 L1 7.5Z"
            fill="#FF6B35"
          />
        </g>
      </svg>

      {/* Wordmark Text */}
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
