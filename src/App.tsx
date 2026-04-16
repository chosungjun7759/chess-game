/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PieceColor = 'white' | 'black';

interface PieceData {
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
}

interface Move {
  from?: number;
  to: number;
  flag: 'normal' | 'pawn_double' | 'ep' | 'castle_ks' | 'castle_qs';
  captureIdx: number | null;
}

const VAL: Record<PieceType, number> = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 950, king: 20000 };

const PST: Record<PieceType, number[]> = {
  pawn: [
     0,  0,  0,  0,  0,  0,  0,  0,
    60, 60, 60, 60, 60, 60, 60, 60,
    15, 15, 25, 38, 38, 25, 15, 15,
     8,  8, 14, 32, 32, 14,  8,  8,
     2,  2,  5, 25, 25,  5,  2,  2,
     5, -3,-10,  0,  0,-10, -3,  5,
     5, 10, 10,-22,-22, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  knight: [
    -55,-45,-30,-30,-30,-30,-45,-55,
    -42,-22,  0,  2,  2,  0,-22,-42,
    -28,  2, 14, 18, 18, 14,  2,-28,
    -28,  6, 18, 24, 24, 18,  6,-28,
    -28,  2, 18, 24, 24, 18,  2,-28,
    -28,  6, 12, 18, 18, 12,  6,-28,
    -42,-22,  2,  6,  6,  2,-22,-42,
    -55,-45,-30,-28,-28,-30,-45,-55
  ],
  bishop: [
    -22,-12,-12,-12,-12,-12,-12,-22,
    -12,  0,  0,  0,  0,  0,  0,-12,
    -12,  0,  6, 12, 12,  6,  0,-12,
    -12,  6,  8, 12, 12,  8,  6,-12,
    -12,  0, 12, 12, 12, 12,  0,-12,
    -12, 12, 12, 12, 12, 12, 12,-12,
    -12,  6,  0,  0,  0,  0,  6,-12,
    -22,-12,-12,-12,-12,-12,-12,-22
  ],
  rook: [
     0,  0,  0,  5,  5,  0,  0,  0,
     8, 12, 12, 12, 12, 12, 12,  8,
    -6,  0,  0,  0,  0,  0,  0, -6,
    -6,  0,  0,  0,  0,  0,  0, -6,
    -6,  0,  0,  0,  0,  0,  0, -6,
    -6,  0,  0,  0,  0,  0,  0, -6,
    -6,  0,  0,  0,  0,  0,  0, -6,
     0,  0,  0,  6,  6,  0,  0,  0
  ],
  queen: [
    -22,-12,-12, -6, -6,-12,-12,-22,
    -12,  0,  0,  0,  0,  0,  0,-12,
    -12,  0,  6,  6,  6,  6,  0,-12,
     -6,  0,  6,  6,  6,  6,  0, -6,
      0,  0,  6,  6,  6,  6,  0, -6,
    -12,  6,  6,  6,  6,  6,  0,-12,
    -12,  0,  6,  0,  0,  0,  0,-12,
    -22,-12,-12, -6, -6,-12,-12,-22
  ],
  king: [
    -35,-45,-45,-55,-55,-45,-45,-35,
    -35,-45,-45,-55,-55,-45,-45,-35,
    -35,-45,-45,-55,-55,-45,-45,-35,
    -35,-45,-45,-55,-55,-45,-45,-35,
    -22,-32,-32,-42,-42,-32,-32,-22,
    -12,-22,-22,-22,-22,-22,-22,-12,
     25, 25,  0,  0,  0,  0, 25, 25,
     25, 35, 12,  0,  0, 12, 35, 25
  ]
};

const DESC: Record<PieceColor, Record<PieceType, string>> = {
  black: {
    rook: "검은 '룩'! 직선으로 끝까지!",
    knight: "검은 '나이트'! L자로 뛰기!",
    bishop: "검은 '비숍'! 대각선 전문.",
    queen: "검은 '퀸'! 전방위 이동!",
    king: "검은 '킹'! 모든 방향 1칸.",
    pawn: "검은 '폰'! 앞으로 전진!"
  },
  white: {
    rook: "하얀 '룩'! 직선으로 끝까지!",
    knight: "하얀 '나이트'! L자로 뛰기!",
    bishop: "하얀 '비숍'! 대각선 전문.",
    queen: "하얀 '퀸'! 전방위 이동!",
    king: "하얀 '킹'! 모든 방향 1칸.",
    pawn: "하얀 '폰'! 앞으로 전진!"
  }
};

function PieceSVG({ type, color }: { type: PieceType; color: PieceColor }) {
  const isW = color === 'white';
  const p = isW ? 'W' : 'B';
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

function makeSetup(): (PieceData | null)[] {
  const row = (color: PieceColor, type: PieceType) => ({ type, color, hasMoved: false });
  const pawns = (c: PieceColor) => Array(8).fill(null).map(() => row(c, 'pawn'));
  const back = (c: PieceColor) => (['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as PieceType[]).map(t => row(c, t));
  return [...back('black'), ...pawns('black'), ...Array(32).fill(null), ...pawns('white'), ...back('white')];
}

export default function App() {
  const [boardState, setBoardState] = useState<(PieceData | null)[]>(makeSetup());
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [turn, setTurn] = useState<PieceColor | ''>('');
  const [gameOver, setGameOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameMode, setGameMode] = useState<'tutorial' | 'match' | 'pvp' | 'menu' | ''>('');
  const [gameDiff, setGameDiff] = useState<string>('');
  const [showMenu, setShowMenu] = useState(true);
  const [showDiffOptions, setShowDiffOptions] = useState(false);
  const [status, setStatus] = useState('모드를 골라주세요!');
  const [bgmOn, setBgmOn] = useState(false);
  const [bgmId, setBgmId] = useState('iQIkgz9P-nM');
  const [capturedIdx, setCapturedIdx] = useState<number | null>(null);
  const [promotionData, setPromotionData] = useState<{ idx: number; color: PieceColor; from: number } | null>(null);
  const [epSquare, setEpSquare] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: number; to: number } | null>(null);

  const playerRef = useRef<any>(null);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fitBoard = useCallback(() => {
    const root = document.documentElement;
    const title = document.querySelector('.game-title') as HTMLElement;
    const ctrls = document.querySelector('.music-controls') as HTMLElement;
    const info = document.querySelector('.info-box') as HTMLElement;

    const titleR = title ? title.getBoundingClientRect() : { height: 0 };
    const ctrlsR = ctrls ? ctrls.getBoundingClientRect() : { height: 0 };
    const infoR = info ? info.getBoundingClientRect() : { height: 0 };

    const uiH = (titleR.height + ctrlsR.height + infoR.height) + 48;
    const size = Math.max(120, Math.min(Math.floor(window.innerWidth * 0.97), Math.floor(window.innerHeight - uiH)));
    root.style.setProperty('--board-size', size + 'px');
  }, []);

  useEffect(() => {
    window.addEventListener('resize', fitBoard);
    fitBoard();
    return () => window.removeEventListener('resize', fitBoard);
  }, [fitBoard]);

  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '1',
        width: '1',
        videoId: bgmId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 0, loop: 1, playlist: bgmId, playsinline: 1 }
      });
    };
  }, []);

  const toggleBGM = () => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;
    if (bgmOn) {
      playerRef.current.pauseVideo();
      setBgmOn(false);
    } else {
      playerRef.current.playVideo();
      setBgmOn(true);
    }
  };

  const handleBGMChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setBgmId(id);
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(id);
      if (!bgmOn) playerRef.current.stopVideo();
    }
  };

  const isSquareAttacked = useCallback((idx: number, attackerColor: PieceColor, state: (PieceData | null)[]) => {
    const r = Math.floor(idx / 8);
    const c = idx % 8;
    const ok = (nr: number, nc: number) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;

    const pDir = attackerColor === 'white' ? 1 : -1;
    if (ok(r + pDir, c - 1) && state[(r + pDir) * 8 + c - 1]?.type === 'pawn' && state[(r + pDir) * 8 + c - 1]?.color === attackerColor) return true;
    if (ok(r + pDir, c + 1) && state[(r + pDir) * 8 + c + 1]?.type === 'pawn' && state[(r + pDir) * 8 + c + 1]?.color === attackerColor) return true;

    for (const m of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
      if (ok(r + m[0], c + m[1]) && state[(r + m[0]) * 8 + c + m[1]]?.type === 'knight' && state[(r + m[0]) * 8 + c + m[1]]?.color === attackerColor) return true;
    }
    for (const m of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
      if (ok(r + m[0], c + m[1]) && state[(r + m[0]) * 8 + c + m[1]]?.type === 'king' && state[(r + m[0]) * 8 + c + m[1]]?.color === attackerColor) return true;
    }

    const checkSlide = (dirs: number[][], types: PieceType[]) => {
      for (const d of dirs) {
        for (let i = 1; i < 8; i++) {
          const nr = r + d[0] * i;
          const nc = c + d[1] * i;
          if (!ok(nr, nc)) break;
          const t = state[nr * 8 + nc];
          if (t) {
            if (t.color === attackerColor && types.includes(t.type)) return true;
            break;
          }
        }
      }
      return false;
    };
    if (checkSlide([[-1, 0], [1, 0], [0, -1], [0, 1]], ['rook', 'queen'])) return true;
    if (checkSlide([[-1, -1], [-1, 1], [1, -1], [1, 1]], ['bishop', 'queen'])) return true;

    return false;
  }, []);

  const getPseudoMoves = useCallback((idx: number, state: (PieceData | null)[], currentEpSq: number | null) => {
    const p = state[idx];
    if (!p) return [];
    const moves: Move[] = [];
    const r = Math.floor(idx / 8);
    const c = idx % 8;
    const ok = (nr: number, nc: number) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;

    const add = (nr: number, nc: number, flag: Move['flag'] = 'normal', capIdx: number | null = null) => {
      if (!ok(nr, nc)) return false;
      const t = state[nr * 8 + nc];
      if (!t) {
        moves.push({ to: nr * 8 + nc, flag, captureIdx: capIdx });
        return true;
      }
      if (t.color !== p.color) {
        moves.push({ to: nr * 8 + nc, flag, captureIdx: nr * 8 + nc });
      }
      return false;
    };

    if (p.type === 'rook' || p.type === 'queen') [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(d => { for (let i = 1; i < 8; i++) if (!add(r + d[0] * i, c + d[1] * i)) break; });
    if (p.type === 'bishop' || p.type === 'queen') [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(d => { for (let i = 1; i < 8; i++) if (!add(r + d[0] * i, c + d[1] * i)) break; });
    if (p.type === 'knight') [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(d => add(r + d[0], c + d[1]));
    if (p.type === 'king') [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(d => add(r + d[0], c + d[1]));

    if (p.type === 'pawn') {
      const dir = p.color === 'white' ? -1 : 1;
      const startR = p.color === 'white' ? 6 : 1;
      if (ok(r + dir, c) && !state[(r + dir) * 8 + c]) {
        moves.push({ to: (r + dir) * 8 + c, flag: 'normal', captureIdx: null });
        if (r === startR && !state[(r + dir * 2) * 8 + c]) moves.push({ to: (r + dir * 2) * 8 + c, flag: 'pawn_double', captureIdx: null });
      }
      [-1, 1].forEach(dc => {
        if (ok(r + dir, c + dc)) {
          const t = state[(r + dir) * 8 + (c + dc)];
          if (t && t.color !== p.color) moves.push({ to: (r + dir) * 8 + (c + dc), flag: 'normal', captureIdx: (r + dir) * 8 + (c + dc) });
          else if (currentEpSq === (r + dir) * 8 + (c + dc)) moves.push({ to: currentEpSq, flag: 'ep', captureIdx: r * 8 + (c + dc) });
        }
      });
    }
    return moves;
  }, []);

  const applyMoveInPlace = useCallback((state: (PieceData | null)[], move: Move & { from: number }) => {
    const p = state[move.from]!;
    const undo = {
      targetPiece: state[move.to],
      capPiece: null as PieceData | null,
      hasMoved: p.hasMoved,
      rookFromIdx: null as number | null,
      rookToIdx: null as number | null,
      rookHasMoved: null as boolean | null,
      promoted: false,
      newEp: null as number | null
    };

    if (move.captureIdx !== null && move.captureIdx !== move.to) {
      undo.capPiece = state[move.captureIdx];
      state[move.captureIdx] = null;
    }

    if (move.flag === 'castle_ks') {
      const ri = move.to + 1;
      undo.rookFromIdx = ri;
      undo.rookToIdx = move.to - 1;
      undo.rookHasMoved = state[ri]?.hasMoved ?? false;
      state[move.to - 1] = state[ri];
      state[ri] = null;
      if (state[move.to - 1]) state[move.to - 1]!.hasMoved = true;
    } else if (move.flag === 'castle_qs') {
      const ri = move.to - 2;
      undo.rookFromIdx = ri;
      undo.rookToIdx = move.to + 1;
      undo.rookHasMoved = state[ri]?.hasMoved ?? false;
      state[move.to + 1] = state[ri];
      state[ri] = null;
      if (state[move.to + 1]) state[move.to + 1]!.hasMoved = true;
    } else if (move.flag === 'pawn_double') {
      undo.newEp = (move.from + move.to) / 2;
    }

    state[move.to] = p;
    state[move.from] = null;
    p.hasMoved = true;

    if (p.type === 'pawn' && (move.to < 8 || move.to >= 56)) {
      p.type = 'queen';
      undo.promoted = true;
    }
    return undo;
  }, []);

  const undoMoveInPlace = useCallback((state: (PieceData | null)[], move: Move & { from: number }, undo: any) => {
    const p = state[move.to]!;
    if (undo.promoted) p.type = 'pawn';
    state[move.from] = p;
    state[move.to] = undo.targetPiece;
    p.hasMoved = undo.hasMoved;

    if (move.captureIdx !== null && move.captureIdx !== move.to) {
      state[move.captureIdx] = undo.capPiece;
    }

    if (move.flag === 'castle_ks' || move.flag === 'castle_qs') {
      if (undo.rookFromIdx !== null && undo.rookToIdx !== null) {
        state[undo.rookFromIdx] = state[undo.rookToIdx];
        state[undo.rookToIdx] = null;
        if (state[undo.rookFromIdx]) state[undo.rookFromIdx]!.hasMoved = undo.rookHasMoved;
      }
    }
  }, []);

  const getLegalMoves = useCallback((idx: number, state: (PieceData | null)[], currentEpSq: number | null) => {
    const p = state[idx];
    if (!p) return [];
    const pseudo = getPseudoMoves(idx, state, currentEpSq);
    const legal: Move[] = [];
    const enemyColor = p.color === 'white' ? 'black' : 'white';

    for (const m of pseudo) {
      const undo = applyMoveInPlace(state, { from: idx, ...m });
      let myKingIdx = -1;
      for (let i = 0; i < 64; i++) { if (state[i]?.type === 'king' && state[i]?.color === p.color) { myKingIdx = i; break; } }
      if (myKingIdx !== -1 && !isSquareAttacked(myKingIdx, enemyColor, state)) {
        legal.push(m);
      }
      undoMoveInPlace(state, { from: idx, ...m }, undo);
    }

    if (p.type === 'king' && !p.hasMoved && !isSquareAttacked(idx, enemyColor, state)) {
      if (state[idx + 3]?.type === 'rook' && state[idx + 3]?.color === p.color && !state[idx + 3]?.hasMoved) {
        if (!state[idx + 1] && !state[idx + 2]) {
          if (!isSquareAttacked(idx + 1, enemyColor, state) && !isSquareAttacked(idx + 2, enemyColor, state)) {
            legal.push({ to: idx + 2, flag: 'castle_ks', captureIdx: null });
          }
        }
      }
      if (state[idx - 4]?.type === 'rook' && state[idx - 4]?.color === p.color && !state[idx - 4]?.hasMoved) {
        if (!state[idx - 1] && !state[idx - 2] && !state[idx - 3]) {
          if (!isSquareAttacked(idx - 1, enemyColor, state) && !isSquareAttacked(idx - 2, enemyColor, state)) {
            legal.push({ to: idx - 2, flag: 'castle_qs', captureIdx: null });
          }
        }
      }
    }
    return legal;
  }, [getPseudoMoves, isSquareAttacked, applyMoveInPlace, undoMoveInPlace]);

  const getAllLegalMoves = useCallback((color: PieceColor, state: (PieceData | null)[], currentEpSq: number | null) => {
    const all: (Move & { from: number })[] = [];
    for (let i = 0; i < 64; i++) {
      if (state[i] && state[i]!.color === color) {
        const moves = getLegalMoves(i, state, currentEpSq);
        moves.forEach(m => all.push({ from: i, ...m }));
      }
    }
    return all;
  }, [getLegalMoves]);

  const simulateMove = useCallback((state: (PieceData | null)[], move: Move & { from: number }) => {
    const sim = state.map(x => x ? { ...x } : null);
    let newEp: number | null = null;
    if (move.captureIdx !== null) sim[move.captureIdx] = null;

    if (move.flag === 'castle_ks') {
      sim[move.to - 1] = sim[move.to + 1];
      sim[move.to + 1] = null;
    } else if (move.flag === 'castle_qs') {
      sim[move.to + 1] = sim[move.to - 2];
      sim[move.to - 2] = null;
    } else if (move.flag === 'pawn_double') {
      newEp = (move.from + move.to) / 2;
    }

    sim[move.to] = sim[move.from];
    sim[move.from] = null;
    sim[move.to]!.hasMoved = true;

    if (sim[move.to]!.type === 'pawn' && (move.to < 8 || move.to >= 56)) {
      sim[move.to]!.type = 'queen';
    }
    return { sim, newEp };
  }, []);

  const getPST = useCallback((piece: PieceData, idx: number) => {
    const tbl = PST[piece.type];
    if (!tbl) return 0;
    const r = Math.floor(idx / 8);
    const c = idx % 8;
    return piece.color === 'white' ? tbl[idx] : tbl[(7 - r) * 8 + c];
  }, []);

  const evaluate = useCallback((state: (PieceData | null)[]) => {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      if (!state[i]) continue;
      const p = state[i]!;
      const v = VAL[p.type] + getPST(p, i);
      score += p.color === 'black' ? v : -v;
    }
    return score;
  }, [getPST]);

  const minimax = useCallback((state: (PieceData | null)[], depth: number, isMax: boolean, alpha: number, beta: number, currentEp: number | null): number => {
    const color = isMax ? 'black' : 'white';
    const moves = getAllLegalMoves(color, state, currentEp);

    if (moves.length === 0) {
      let kingIdx = -1;
      for (let i = 0; i < 64; i++) { if (state[i]?.type === 'king' && state[i]?.color === color) { kingIdx = i; break; } }
      if (kingIdx === -1) return isMax ? -999999 : 999999;
      if (isSquareAttacked(kingIdx, isMax ? 'white' : 'black', state)) return isMax ? -500000 : 500000;
      return 0;
    }

    if (depth === 0) return evaluate(state);

    // 🟢 Move Ordering: 비싼 말을 잡아먹는 수부터 먼저 계산하여 속도 향상
    moves.sort((a, b) => {
      const va = a.captureIdx !== null ? (VAL[state[a.captureIdx!]?.type] || 0) : 0;
      const vb = b.captureIdx !== null ? (VAL[state[b.captureIdx!]?.type] || 0) : 0;
      return vb - va;
    });

    if (isMax) {
      let best = -Infinity;
      for (const m of moves) {
        const undo = applyMoveInPlace(state, m);
        const v = minimax(state, depth - 1, false, alpha, beta, undo.newEp);
        undoMoveInPlace(state, m, undo);
        best = Math.max(best, v);
        alpha = Math.max(alpha, v);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of moves) {
        const undo = applyMoveInPlace(state, m);
        const v = minimax(state, depth - 1, true, alpha, beta, undo.newEp);
        undoMoveInPlace(state, m, undo);
        best = Math.min(best, v);
        beta = Math.min(beta, v);
        if (beta <= alpha) break;
      }
      return best;
    }
  }, [evaluate, getAllLegalMoves, applyMoveInPlace, undoMoveInPlace, isSquareAttacked]);

  const saveGameResultToFirebase = useCallback((winnerName: string, mode: string, difficulty: string) => {
    // Firebase logic placeholder
    console.log('Saving game result:', { winnerName, mode, difficulty, date: new Date().toLocaleString() });
  }, []);

  const afterMove = useCallback((to: number, isPlayer: boolean, nextEp: number | null) => {
    if (gameMode === 'menu') return;
    setEpSquare(nextEp);

    const movedColor = boardState[to]!.color;
    const nextColor = movedColor === 'white' ? 'black' : 'white';
    const myLegalMoves = getAllLegalMoves(nextColor, boardState, nextEp);

    if (myLegalMoves.length === 0) {
      let myKingIdx = -1;
      for (let i = 0; i < 64; i++) { if (boardState[i]?.type === 'king' && boardState[i]?.color === nextColor) { myKingIdx = i; break; } }
      const isCheck = isSquareAttacked(myKingIdx, movedColor, boardState);

      setGameOver(true);
      if (isCheck) {
        const checkmateSound = document.getElementById('checkmate-sound') as HTMLAudioElement;
        if (checkmateSound) {
          checkmateSound.currentTime = 0;
          checkmateSound.play().catch(e => console.log(e));
        }
        let winnerText = movedColor === 'white' ? '하얀 팀' : '검은 팀';
        if (gameMode === 'match') {
          winnerText = movedColor === 'white' ? '하얀 팀(마스터)' : '검은 팀(컴퓨터)';
        }
        setStatus(`🎉 체크메이트! ${winnerText} 승리! 🎉`);
        saveGameResultToFirebase(winnerText, gameMode, gameDiff);
      } else {
        setStatus(`🤝 스테일메이트! 무승부입니다.`);
        saveGameResultToFirebase('무승부', gameMode, gameDiff);
      }
      return;
    }

    if (gameMode === 'match') {
      if (isPlayer) {
        setTurn('black');
        setStatus('컴퓨터 로봇이 생각 중... 🤔');
      } else {
        setTurn('white');
        setStatus('아들 차례! 멋지게 공격해봐요!');
      }
    } else if (gameMode === 'pvp') {
      setTurn(nextColor);
      setStatus(nextColor === 'white' ? '하얀 팀 차례! 멋지게 공격해봐요!' : '검은 팀 차례! 멋지게 반격해봐요!');
    } else {
      setStatus('연습 모드! 하얀 팀·검은 팀 모두 자유롭게 연습해봐!');
    }
  }, [boardState, gameMode, getAllLegalMoves, isSquareAttacked]);

  const executeRealMove = useCallback((from: number, move: Move, isPlayer: boolean) => {
    setIsAnimating(true);
    setSelIdx(null);
    setValidMoves([]);

    setLastMove({ from, to: move.to });

    let nextEp: number | null = null;
    if (move.flag === 'pawn_double') nextEp = (from + move.to) / 2;

    if (move.captureIdx !== null) {
      const capEl = document.getElementById(`p${move.captureIdx}`);
      if (capEl) {
        capEl.removeAttribute('id');
        capEl.classList.add('being-captured');
        capEl.addEventListener('animationend', () => capEl.remove(), { once: true });
        // Bug 3 Fix: Fallback for browsers where animationend might not fire
        setTimeout(() => { if (capEl.parentNode) capEl.remove(); }, 400);
      }
      setCapturedIdx(move.captureIdx);
      setTimeout(() => setCapturedIdx(null), 300);

      const captureSound = document.getElementById('capture-sound') as HTMLAudioElement;
      if (captureSound) {
        captureSound.currentTime = 0;
        captureSound.play().catch(e => console.log(e));
      }
    }

    setBoardState(prev => {
      const next = [...prev];
      if (move.captureIdx !== null) next[move.captureIdx] = null;

      if (move.flag === 'castle_ks') {
        next[move.to - 1] = next[move.to + 1];
        next[move.to + 1] = null;
      } else if (move.flag === 'castle_qs') {
        next[move.to + 1] = next[move.to - 2];
        next[move.to - 2] = null;
      }

      next[move.to] = { ...next[from]!, hasMoved: true };
      next[from] = null;
      return next;
    });

    const checkPromo = (to: number) => {
      const piece = boardState[from];
      if (piece && piece.type === 'pawn' && (to < 8 || to >= 56)) {
        if (gameMode === 'tutorial' || (!isPlayer && gameMode === 'match')) {
          setBoardState(prev => {
            const next = [...prev];
            next[to] = { ...next[to]!, type: 'queen' };
            return next;
          });
          animTimerRef.current = setTimeout(() => {
            if (gameMode === 'menu') return; // Bug 5 Fix
            setIsAnimating(false);
            afterMove(to, isPlayer, nextEp);
          }, 350);
        } else {
          animTimerRef.current = setTimeout(() => {
            if (gameMode === 'menu') return; // Bug 5 Fix
            setPromotionData({ idx: to, color: piece.color, from });
            setIsAnimating(false);
          }, 350);
        }
      } else {
        animTimerRef.current = setTimeout(() => {
          if (gameMode === 'menu') return; // Bug 5 Fix
          setIsAnimating(false);
          afterMove(to, isPlayer, nextEp);
        }, 350);
      }
    };

    checkPromo(move.to);
  }, [boardState, gameMode, afterMove]);

  const bestMoveWithMinimax = useCallback((depth: number) => {
    const all = getAllLegalMoves('black', boardState, epSquare);
    if (!all.length) return null;
    all.sort((a, b) => (b.captureIdx !== null ? (VAL[boardState[b.captureIdx!]?.type] || 0) : 0) - (a.captureIdx !== null ? (VAL[boardState[a.captureIdx!]?.type] || 0) : 0));
    let bestScore = -Infinity;
    let cands: (Move & { from: number })[] = [];
    for (const m of all) {
      const undo = applyMoveInPlace(boardState, m);
      const s = minimax(boardState, depth - 1, false, -Infinity, Infinity, undo.newEp);
      undoMoveInPlace(boardState, m, undo);
      if (s > bestScore) {
        bestScore = s;
        cands = [m];
      } else if (s === bestScore) {
        cands.push(m);
      }
    }
    return cands[Math.floor(Math.random() * cands.length)] || null;
  }, [boardState, epSquare, getAllLegalMoves, applyMoveInPlace, undoMoveInPlace, minimax]);

  const computerMove = useCallback(() => {
    if (gameMode !== 'match' || gameOver) return;
    const allMoves = getAllLegalMoves('black', boardState, epSquare);
    if (allMoves.length === 0) {
      setGameOver(true);
      setStatus('컴퓨터가 움직일 곳이 없어요! 마스터 승리! 🎉');
      return;
    }

    let chosen: (Move & { from: number }) | null = null;
    if (gameDiff === 'level1') {
      chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (gameDiff === 'level2') {
      const caps = allMoves.filter(m => m.captureIdx !== null);
      if (caps.length > 0) {
        const maxV = Math.max(...caps.map(m => VAL[boardState[m.captureIdx!]?.type] || 0));
        const best = caps.filter(m => (VAL[boardState[m.captureIdx!]?.type] || 0) === maxV);
        chosen = best[Math.floor(Math.random() * best.length)];
      } else {
        chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
      }
    } else if (gameDiff === 'level3') {
      const scored = allMoves.map(m => {
        const target = m.captureIdx !== null ? boardState[m.captureIdx] : null;
        const mover = boardState[m.from]!;
        const capVal = target ? (VAL[target.type] || 0) : 0;
        const myVal = VAL[mover.type] || 0;
        const pstGain = getPST(mover, m.to) - getPST(mover, m.from);

        const undo = applyMoveInPlace(boardState, m);
        // Bug 6 Fix: Use isSquareAttacked for faster danger check O(n)
        const danger = isSquareAttacked(m.to, 'white', boardState) ? myVal * 0.9 : 0;
        undoMoveInPlace(boardState, m, undo);

        return { ...m, score: capVal + pstGain * 0.5 - danger };
      });
      const maxS = Math.max(...scored.map(m => m.score));
      const best = scored.filter(m => m.score === maxS);
      chosen = best[Math.floor(Math.random() * best.length)];
    } else if (gameDiff === 'level4') {
      chosen = bestMoveWithMinimax(2);
    } else if (gameDiff === 'level5') {
      chosen = bestMoveWithMinimax(3);
    }

    if (!chosen) chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
    executeRealMove(chosen.from, chosen, false);
  }, [boardState, epSquare, gameDiff, gameMode, gameOver, getAllLegalMoves, applyMoveInPlace, undoMoveInPlace, minimax, executeRealMove, getPST, bestMoveWithMinimax]);

  useEffect(() => {
    if (turn === 'black' && !gameOver && !isAnimating) {
      aiTimerRef.current = setTimeout(computerMove, 700);
      return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
    }
  }, [turn, gameOver, isAnimating, computerMove]);

  const onSqClick = (idx: number) => {
    if (gameOver || isAnimating || promotionData) return;
    if (gameMode === 'match' && turn !== 'white') return;
    const clicked = boardState[idx];

    if (selIdx !== null) {
      if (idx === selIdx) {
        setSelIdx(null);
        setValidMoves([]);
        return;
      }
      if (clicked && clicked.color === boardState[selIdx]!.color) {
        setSelIdx(idx);
        setValidMoves(getLegalMoves(idx, boardState, epSquare));
        return;
      }

      const move = validMoves.find(m => m.to === idx);
      if (move) executeRealMove(selIdx, move, true);
      else setStatus('거긴 못 가! 초록색이나 붉은색 타겟을 눌러!');
    } else {
      if (!clicked) return;
      if (gameMode === 'match' && clicked.color !== 'white') {
        setStatus('마스터 차례니까 하얀 말만 움직여!');
        return;
      }
      if (gameMode === 'pvp' && clicked.color !== turn) {
        setStatus(turn === 'white' ? '지금은 하얀 팀 차례야!' : '지금은 검은 팀 차례야!');
        return;
      }
      setSelIdx(idx);
      setValidMoves(getLegalMoves(idx, boardState, epSquare));
      setStatus(gameMode === 'tutorial' ? DESC[clicked.color][clicked.type] : '어디로 갈까요? (합법적인 수만 표시됨)');
    }
  };

  const handlePromotion = (type: PieceType) => {
    if (!promotionData) return;
    const { idx, color } = promotionData;
    setBoardState(prev => {
      const next = [...prev];
      next[idx] = { type, color, hasMoved: true };
      return next;
    });
    setPromotionData(null);
    afterMove(idx, true, null);
  };

  const startTutorial = () => {
    setGameMode('tutorial');
    setGameOver(false);
    setIsAnimating(false);
    setTurn('');
    setEpSquare(null);
    setLastMove(null);
    setShowMenu(false);
    setBoardState(makeSetup());
    setStatus('연습 모드! 하얀 팀·검은 팀 모두 자유롭게 연습해봐!');
  };

  const startMatch = (diff: string) => {
    setGameMode('match');
    setGameDiff(diff);
    setGameOver(false);
    setIsAnimating(false);
    setTurn('white');
    setEpSquare(null);
    setLastMove(null);
    setShowMenu(false);
    setBoardState(makeSetup());
    setStatus('컴퓨터 대결 시작! 마스터 차례 — 하얀 말을 먼저 움직여!');
  };

  const startPvP = () => {
    setGameMode('pvp');
    setGameDiff('');
    setGameOver(false);
    setIsAnimating(false);
    setTurn('white');
    setEpSquare(null);
    setLastMove(null);
    setShowMenu(false);
    setBoardState(makeSetup());
    setStatus('2인 대결 시작! 하얀 팀 먼저 움직이세요!');
  };

  const handleHomeClick = () => {
    if (gameMode === '' || gameMode === 'menu') return;
    setShowConfirm(true);
  };

  const confirmHome = (yes: boolean) => {
    setShowConfirm(false);
    if (yes) {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      setShowMenu(true);
      setShowDiffOptions(false);
      setGameOver(true);
      setGameMode('menu');
      setIsAnimating(false);
      setStatus('모드를 골라주세요!');
      setSelIdx(null);
      setValidMoves([]);
      setPromotionData(null);
      setLastMove(null);
    }
  };

  return (
    <div className="container">
      <h1 className="game-title">♟ 체스마스터</h1>

      <div className="music-controls">
        <select className="bgm-select" value={bgmId} onChange={handleBGMChange}>
          <option value="iQIkgz9P-nM">🎵 신나는 구구단송</option>
          <option value="SEwmVVhlqyg">🎻 똑똑해지는 모차르트</option>
        </select>
        <button className="bgm-btn" onClick={toggleBGM} style={{ background: bgmOn ? '#4caf50' : 'var(--lego-red)' }}>
          {bgmOn ? '🔇 음악 끄기' : '▶ 음악 켜기'}
        </button>
        <button className="bgm-btn" onClick={handleHomeClick} style={{ background: '#ff9800' }}>🏠 메뉴로</button>
      </div>

      <audio id="capture-sound" src="https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3" preload="auto"></audio>
      <audio id="checkmate-sound" src="https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3" preload="auto"></audio>
      <div id="youtube-player" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}></div>

      <div className={`board-wrap ${gameMode === 'pvp' ? 'pvp-mode' : ''}`}>
        <div className="board">
          {Array.from({ length: 64 }).map((_, i) => {
            const move = validMoves.find(m => m.to === i);
            const isKing = boardState[i]?.type === 'king';
            const isCheck = isKing && isSquareAttacked(i, boardState[i]!.color === 'white' ? 'black' : 'white', boardState);
            const isLastMove = lastMove && (lastMove.from === i || lastMove.to === i);
            return (
              <div
                key={i}
                className={`sq ${(Math.floor(i / 8) + (i % 8)) % 2 === 0 ? 'light' : 'dark'} ${move ? (move.captureIdx !== null ? 'capture sq-capture' : 'valid') : ''} ${isCheck ? 'check-warning' : ''} ${isLastMove ? 'last-move' : ''}`}
                onClick={() => onSqClick(i)}
              />
            );
          })}
          {boardState.map((d, i) => {
            if (!d) return null;
            const r = Math.floor(i / 8);
            const c = i % 8;
            return (
              <div
                key={i}
                id={`p${i}`}
                className={`piece ${selIdx === i ? 'selected' : ''} ${capturedIdx === i ? 'being-captured' : ''}`}
                data-color={d.color}
                style={{ transform: `translate(calc(var(--sq)*${c}),calc(var(--sq)*${r}))` }}
              >
                <div className="piece-inner">
                  <PieceSVG type={d.type} color={d.color} />
                </div>
              </div>
            );
          })}

          {showMenu && (
            <div className="menu-overlay">
              <div className="menu-title">어떤 모드로 해볼까?</div>
              {!showDiffOptions ? (
                <>
                  <button className="menu-btn" onClick={startTutorial}>1. 튜토리얼 (혼자 연습하기)</button>
                  <button className="menu-btn" onClick={() => setShowDiffOptions(true)}>2. 컴퓨터랑 대결하기</button>
                  <button className="menu-btn" onClick={startPvP} style={{ background: '#4caf50', color: 'white', borderColor: '#388e3c' }}>3. 2인 대결 (친구랑 같이 하기)</button>
                </>
              ) : (
                <div className="diff-container" style={{ display: 'flex' }}>
                  <button className="diff-btn" style={{ background: '#8bc34a' }} onClick={() => startMatch('level1')}>1단계: 입문 (랜덤 로봇)</button>
                  <button className="diff-btn" style={{ background: '#ffca28', color: '#333' }} onClick={() => startMatch('level2')}>2단계: 초급 (탐욕 로봇)</button>
                  <button className="diff-btn" style={{ background: '#ff9800' }} onClick={() => startMatch('level3')}>3단계: 중급 (안전 로봇)</button>
                  <button className="diff-btn" style={{ background: '#f44336' }} onClick={() => startMatch('level4')}>4단계: 고급 (전략가 2수)</button>
                  <button className="diff-btn" style={{ background: '#9c27b0' }} onClick={() => startMatch('level5')}>5단계: 마스터 (예언자 3수)</button>
                  <button className="menu-btn" style={{ marginTop: '1vh' }} onClick={() => setShowDiffOptions(false)}>뒤로 가기</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="info-box">{status}</p>

      {promotionData && (
        <div className={`promo-overlay ${gameMode === 'pvp' && promotionData.color === 'black' ? 'pvp-black' : ''}`}>
          <div className="promo-box">
            <div className="promo-title">🎉 폰 승진! 어떤 말로 바꿀까요?</div>
            <div className="promo-pieces">
              {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map(t => (
                <button key={t} className="promo-btn" onClick={() => handlePromotion(t)}>
                  <div style={{ width: '100%', height: '100%' }}>
                    <PieceSVG type={t} color={promotionData.color} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="promo-overlay" style={{ zIndex: 999 }}>
          <div className="promo-box">
            <div className="promo-title">진행 중인 게임이 사라집니다.<br />처음 메뉴로 돌아갈까요?</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2vmin', marginTop: '3vmin' }}>
              <button className="bgm-btn" style={{ background: '#4caf50', padding: '1.5vmin 3vmin' }} onClick={() => confirmHome(true)}>네, 돌아갈래요</button>
              <button className="bgm-btn" style={{ background: '#d32f2f', padding: '1.5vmin 3vmin' }} onClick={() => confirmHome(false)}>아니요, 계속할래요</button>
            </div>
          </div>
        </div>
      )}

      {gameOver && !showMenu && (
        <div className="promo-overlay" onClick={() => window.location.reload()}>
          <div className="promo-box">
            <div className="promo-title">게임 종료!</div>
            <p style={{ marginBottom: '2vh' }}>{status}</p>
            <button className="menu-btn" style={{ width: 'auto', padding: '1vh 4vh' }}>다시 하기</button>
          </div>
        </div>
      )}
    </div>
  );
}
