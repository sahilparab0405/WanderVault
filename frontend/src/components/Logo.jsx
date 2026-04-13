import React from 'react';

const Logo = ({ size = 'md', dark = false }) => {
  const sizes = {
    sm: { icon: 32, text: 20, gap: 10, rx: 9 },
    md: { icon: 40, text: 24, gap: 12, rx: 12 },
    lg: { icon: 52, text: 34, gap: 14, rx: 14 }
  };

  const s = sizes[size] || sizes.md;
  const ic = s.icon;
  const cx = ic / 2;
  const cy = ic / 2;
  const spread = ic * 0.4;
  const rise = ic * 0.18;

  const iconBg = dark ? '#FF6B35' : '#1a2b4a';
  const pathStroke = '#FFFFFF';
  const dotFill = dark ? '#FFFFFF' : '#FF6B35';
  const wanderColor = dark ? '#FFFFFF' : '#1a2b4a';

  const p1x = cx - spread;
  const p1y = cy + rise;
  const p2x = cx - spread * 0.4;
  const p2y = cy - rise * 1.5;
  const p3x = cx;
  const p3y = cy + rise;
  const p4x = cx + spread * 0.4;
  const p4y = cy - rise * 1.5;
  const p5x = cx + spread;
  const p5y = cy + rise;

  return (
    <div className="wv-logo-container" style={{
      display: 'flex',
      alignItems: 'center',
      gap: s.gap,
      userSelect: 'none',
      cursor: 'default'
    }}>
      <svg
        width={ic}
        height={ic}
        viewBox={`0 0 ${ic} ${ic}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width={ic}
          height={ic}
          rx={s.rx}
          fill={iconBg}
        />
        <path
          d={`M${p1x} ${p1y} 
              L${p2x} ${p2y} 
              L${p3x} ${p3y} 
              L${p4x} ${p4y} 
              L${p5x} ${p5y}`}
          stroke={pathStroke}
          strokeWidth={ic * 0.07} // Results in approx 2.8px for md (40px)
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Start dot */}
        <circle cx={p1x} cy={p1y} 
          r={ic / 10} fill={dotFill}/>
        {/* End dot */}
        <circle cx={p5x} cy={p5y} 
          r={ic / 10} fill={dotFill}/>
        {/* End ring */}
        <circle cx={p5x} cy={p5y}
          r={ic / 5}
          stroke={pathStroke}
          strokeWidth={ic * 0.04}
          fill="none"
        />
      </svg>

      <div style={{ display: 'flex', 
        flexDirection: 'column', 
        lineHeight: 1 }}>
        <span style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: s.text,
          fontWeight: 700,
          letterSpacing: '-1px',
          lineHeight: 1.1,
          display: 'flex'
        }}>
          <span style={{ color: wanderColor }}>
            Wander
          </span>
          <span style={{ color: '#FF6B35' }}>
            Vault
          </span>
        </span>
        {size === 'lg' && (
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: '#6B7280',
            letterSpacing: '3px',
            marginTop: 4,
            fontWeight: 400
          }}>
            SMART TRAVEL PLANNING
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
