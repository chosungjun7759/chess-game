import React from 'react';

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

// 체스 말 SVG (App.tsx에서 분리 — 꼬마 체스 학교와 공용)
export function PieceSVG({ type, color, uid }: { type: PieceType; color: PieceColor; uid: string }) {
  const isW = color === 'white';
  const p = (isW ? 'W' : 'B') + uid;
  const [b1, b2, b3] = isW ? ['#fffef5', '#d8c8a8', '#9a8060'] : ['#8a6238', '#2e1a0c', '#0e0806'];
  const [s1, s2] = isW ? ['#d0b888', '#7a5c38'] : ['#402010', '#100806'];
  const ol = isW ? '#3a2410' : '#d8a850';
  const spC = isW ? 'rgba(255,255,240,0.70)' : 'rgba(255,210,90,0.30)';
  const shC = isW ? '#2a180a' : '#000000';
  const sw = 0.85;

  const mkBase = (rx = 11) => {
    const x1 = (22.5 - rx).toFixed(1), x2 = (22.5 + rx).toFixed(1);
    const x3 = (22.5 - rx + 1.8).toFixed(1), x4 = (22.5 + rx - 1.8).toFixed(1);
    return (
      <>
        <ellipse cx="22.5" cy="41.5" rx={(rx + 1.5).toFixed(1)} ry="1.8" fill="rgba(0,0,0,0.28)" />
        <path d={`M${x1},39 Q22.5,41.8 ${x2},39 L${x4},35.5 Q22.5,37.8 ${x3},35.5 Z`}
          fill={`url(#lg${p})`} stroke={ol} strokeWidth={sw} />
      </>
    );
  };

  const defs = (
    <defs>
      <radialGradient id={`rg${p}`} cx="33%" cy="25%" r="72%" gradientUnits="objectBoundingBox">
        <stop offset="0%" stopColor={b1} />
        <stop offset="45%" stopColor={b2} />
        <stop offset="100%" stopColor={b3} />
      </radialGradient>
      <linearGradient id={`lg${p}`} x1="5%" y1="0%" x2="95%" y2="100%">
        <stop offset="0%" stopColor={s1} />
        <stop offset="100%" stopColor={s2} />
      </linearGradient>
      <radialGradient id={`sp${p}`} cx="25%" cy="20%" r="55%" gradientUnits="objectBoundingBox">
        <stop offset="0%" stopColor={spC} />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
      <filter id={`sf${p}`} x="-50%" y="-40%" width="200%" height="200%">
        <feDropShadow dx="0.7" dy="2" stdDeviation="1.5" floodColor={shC} floodOpacity="0.45" />
      </filter>
    </defs>
  );

  switch (type) {
    case 'pawn': return (
      <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {defs} {mkBase(9.5)}
        <path d="M15.5,35.5 C13.5,29.5 14.5,24.5 17,21.5 C18.5,19.8 19.5,18.5 20,17.5 L25,17.5 C25.5,18.5 26.5,19.8 28,21.5 C30.5,24.5 31.5,29.5 29.5,35.5 Z" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} filter={`url(#sf${p})`} />
        <path d="M20,17.5 Q19.5,15.2 19.5,14.5 Q20.5,13.4 22.5,13.2 Q24.5,13.4 25.5,14.5 Q25.5,15.2 25,17.5 Z" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <circle cx="22.5" cy="9.2" r="6" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} filter={`url(#sf${p})`} />
        <ellipse cx="19.2" cy="7" rx="3.2" ry="2.2" fill={`url(#sp${p})`} opacity="0.85" />
        <ellipse cx="18.8" cy="26" rx="2.8" ry="4" fill={`url(#sp${p})`} opacity="0.6" />
      </svg>
    );
    case 'rook': return (
      <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {defs} {mkBase(11)}
        <path d="M14,35.5 L14,17.5 Q13.8,15.8 15.5,15.5 L29.5,15.5 Q31.2,15.8 31,17.5 L31,35.5 Z" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} filter={`url(#sf${p})`} />
        <path d="M14,15.5 L14,10.5 L18,10.5 L18,13.5 L20,13.5 L20,10.5 L25,10.5 L25,13.5 L27,13.5 L27,10.5 L31,10.5 L31,15.5 Z" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <line x1="19" y1="15.5" x2="19" y2="35.5" stroke={ol} strokeWidth="0.5" opacity="0.3" />
        <line x1="26" y1="15.5" x2="26" y2="35.5" stroke={ol} strokeWidth="0.5" opacity="0.3" />
        <line x1="14" y1="13.5" x2="18" y2="13.5" stroke={ol} strokeWidth="0.5" opacity="0.35" />
        <line x1="20" y1="13.5" x2="25" y2="13.5" stroke={ol} strokeWidth="0.5" opacity="0.35" />
        <line x1="27" y1="13.5" x2="31" y2="13.5" stroke={ol} strokeWidth="0.5" opacity="0.35" />
        <rect x="15" y="17.5" width="5" height="16" rx="2" fill={`url(#sp${p})`} opacity="0.45" />
      </svg>
    );
    case 'knight': return (
      <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {defs} {mkBase(10.5)}
        <path d="M 13,35.5 C 12.5,27.5 13,22 14.5,18 C 15.5,15 15,12.5 16.5,10.5 C 17.5,9 18.5,7.5 20,6.5 L 22,5.8 C 23.2,6.2 23.8,7.8 23,9 C 25.2,9.5 27.5,11 29,13.5 C 30.5,16 30.5,18.5 29.5,20.5 C 28.5,22.5 27,23.5 28.5,26 L 32,35.5 Z" fill={`url(#rg${p})`} stroke={ol} strokeWidth="0.9" filter={`url(#sf${p})`} />
        <path d="M 20,6.5 L 18.5,9 L 22.5,8.8 Z" fill={ol} opacity="0.75" />
        <circle cx="24.8" cy="11.5" r="1.7" fill={ol} />
        <circle cx="25.3" cy="11" r="0.7" fill={isW ? 'rgba(255,255,230,0.9)' : 'rgba(255,220,90,0.85)'} />
        <ellipse cx="29.2" cy="19.5" rx="1.3" ry="0.85" fill={ol} opacity="0.5" />
        <path d="M 23,9 C 21.5,10.5 20.5,12 19.8,13.5 C 19,15 18.5,16.5 18,18" stroke={ol} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M 24.5,14.5 C 26,15.5 27,17 27.5,18.5" stroke={ol} strokeWidth="0.65" fill="none" opacity="0.35" />
        <ellipse cx="18.5" cy="14" rx="2.5" ry="4.5" fill={`url(#sp${p})`} opacity="0.6" />
      </svg>
    );
    case 'bishop': return (
      <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {defs} {mkBase(10)}
        <path d="M16.5,35.5 C15,29 15.5,23.5 18,20 C19.5,18 20.5,17 21,16.5 L24,16.5 C24.5,17 25.5,18 27,20 C29.5,23.5 30,29 28.5,35.5 Z" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} filter={`url(#sf${p})`} />
        <path d="M16.5,16.5 Q22.5,18.8 28.5,16.5 Q27.5,14.2 22.5,13.8 Q17.5,14.2 16.5,16.5 Z" fill={`url(#lg${p})`} stroke={ol} strokeWidth={sw} />
        <circle cx="22.5" cy="10.5" r="4.2" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} filter={`url(#sf${p})`} />
        <path d="M 20,9 L 25,12.5" stroke={ol} strokeWidth="1.4" strokeLinecap="round" />
        <ellipse cx="22.5" cy="6.3" rx="1.4" ry="2.2" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <ellipse cx="20.3" cy="8.8" rx="2.3" ry="1.7" fill={`url(#sp${p})`} opacity="0.8" />
        <ellipse cx="19.5" cy="25.5" rx="2.5" ry="4.5" fill={`url(#sp${p})`} opacity="0.55" />
      </svg>
    );
    case 'queen': return (
      <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {defs} {mkBase(11.5)}
        <path d="M14.5,35.5 C13,29 14,23.5 17,20 C18.5,18 20,17 21,16.5 L24,16.5 C25,17 26.5,18 28,20 C31,23.5 32,29 30.5,35.5 Z" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} filter={`url(#sf${p})`} />
        <path d="M16,16.5 Q22.5,18.8 29,16.5 Q28,14 22.5,13.5 Q17,14 16,16.5 Z" fill={`url(#lg${p})`} stroke={ol} strokeWidth={sw} />
        <path d="M15.5,13.5 Q18.5,10 22.5,9 Q26.5,10 29.5,13.5" stroke={ol} strokeWidth="0.75" fill="none" strokeLinecap="round" opacity="0.8" />
        <circle cx="13.5" cy="12" r="2.1" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <circle cx="18.5" cy="9" r="2.1" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <circle cx="22.5" cy="7.5" r="2.4" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <circle cx="26.5" cy="9" r="2.1" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <circle cx="31.5" cy="12" r="2.1" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <circle cx="22" cy="7" r="1.1" fill={`url(#sp${p})`} opacity="0.9" />
        <ellipse cx="19" cy="25.5" rx="3" ry="4.5" fill={`url(#sp${p})`} opacity="0.5" />
      </svg>
    );
    case 'king': return (
      <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        {defs} {mkBase(11.5)}
        <path d="M14.5,35.5 C13,29 14,23.5 17,20 C18.5,18 20,17 21,16.5 L24,16.5 C25,17 26.5,18 28,20 C31,23.5 32,29 30.5,35.5 Z" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} filter={`url(#sf${p})`} />
        <path d="M16,16.5 Q22.5,18.8 29,16.5 Q28,14 22.5,13.5 Q17,14 16,16.5 Z" fill={`url(#lg${p})`} stroke={ol} strokeWidth={sw} />
        <rect x="20.8" y="4.5" width="3.4" height="11" rx="1.5" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} filter={`url(#sf${p})`} />
        <rect x="17" y="7.8" width="11" height="3.4" rx="1.5" fill={`url(#rg${p})`} stroke={ol} strokeWidth={sw} />
        <rect x="20.8" y="7.8" width="3.4" height="3.4" rx="0.5" fill={isW ? 'rgba(255,255,220,0.4)' : 'rgba(255,200,60,0.2)'} />
        <ellipse cx="21.2" cy="6.5" rx="1.3" ry="2" fill={`url(#sp${p})`} opacity="0.75" />
        <ellipse cx="19" cy="25.5" rx="3" ry="4.5" fill={`url(#sp${p})`} opacity="0.5" />
      </svg>
    );
    default: return <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" />;
  }
}
