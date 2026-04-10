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
  desc: string;
}

// ── 기물 가치 (센티폰 단위) ──
const VAL: Record<PieceType, number> = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 950, king: 20000 };

// ── 기물-위치 테이블 (PST) — 백 기준, 흑은 수직 미러 ──
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

function pieceSVG(type: PieceType, color: PieceColor) {
  const isW = color === 'white';
  const F = isW ? '#f0ece0' : '#1c1810';
  const F2 = isW ? '#e0dbc8' : '#2c2418';
  const S = isW ? '#1a1510' : '#c0a870';
  const D = isW ? '#1a1510' : '#e0c898';
  const sw = 1.5;

  // ★ 핵심 수정: attribute 방식 → style="" 방식으로 변경
  // React에서는 style 객체로 전달
  const G = { fill: F, stroke: S, strokeWidth: `${sw}px`, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const G2 = { fill: F2, stroke: S, strokeWidth: `${sw}px`, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const Gd = { fill: D, stroke: 'none' };
  const Gl = { fill: 'none', stroke: D, strokeWidth: '1px', strokeLinecap: 'round' as const };

  const base = <rect x="9.5" y="36" width="26" height="3.8" rx="1.9" style={G} />;

  switch (type) {
    case 'pawn':
      return (
        <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22.5" cy="9.5" r="5.5" style={G} />
          <path d="M 19,15 C 15.5,17 13.5,21 14,26 C 14.5,29.5 17,32 17,32 L 28,32 C 28,32 30.5,29.5 31,26 C 31.5,21 29.5,17 26,15 Z" style={G} />
          <path d="M 11,36.2 L 34,36.2 L 33,32.5 C 29,32 16,32 12,32.5 Z" style={G} />
          {base}
        </svg>
      );
    case 'rook':
      return (
        <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
          <path d="M 9.5,14 L 9.5,9 L 14,9 L 14,12.5 L 18.5,12.5 L 18.5,9 L 22.5,9 L 22.5,12.5 L 27,12.5 L 27,9 L 31.5,9 L 31.5,12.5 L 35.5,12.5 L 35.5,9 L 35.5,14 Z" style={G} />
          <rect x="12" y="14" width="21" height="14" rx="1" style={G} />
          <path d="M 10,28 L 35,28 L 35,36.2 L 10,36.2 Z" style={G} />
          {base}
          <line x1="14.5" y1="14" x2="14.5" y2="28" style={Gl} />
          <line x1="30.5" y1="14" x2="30.5" y2="28" style={Gl} />
        </svg>
      );
    case 'knight':
      return (
        <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
          <path d="M 22,11 C 18.5,10.5 15,12.5 13.5,16.5 C 12,20.5 13,25.5 17,28 L 11.5,28 L 11.5,36.5 L 33.5,36.5 L 33.5,28 L 29,28 C 33,25.5 34.5,20.5 33,16.5 C 31.5,12.5 27,10.5 22,11 Z" style={G} />
          <path d="M 22,11 L 24.5,6 L 29,10" style={{ fill: F, stroke: S, strokeWidth: `${sw}px`, strokeLinejoin: 'round' }} />
          <circle cx="17" cy="19" r="2" style={Gd} />
          <path d="M 13.5,24.5 Q 16,23 17.5,25.5" style={Gl} />
          <path d="M 22,11 C 22,11 21,15 20,18" style={Gl} />
          {base}
        </svg>
      );
    case 'bishop':
      return (
        <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22.5" cy="7" r="3.5" style={G} />
          <path d="M 22.5,10.5 C 17,14 13.5,20.5 14.5,27 C 15,31.5 19,35 22.5,35 C 26,35 30,31.5 30.5,27 C 31.5,20.5 28,14 22.5,10.5 Z" style={G} />
          <path d="M 14.5,27.5 C 17.5,29 27.5,29 30.5,27.5" style={{ fill: 'none', stroke: S, strokeWidth: `${sw}px` }} />
          <path d="M 11.5,36.2 L 33.5,36.2 L 33,32.5 C 29.5,33.5 15.5,33.5 12,32.5 Z" style={G} />
          {base}
          <line x1="22.5" y1="10.5" x2="22.5" y2="27" style={Gl} />
        </svg>
      );
    case 'queen':
      return (
        <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
          <circle cx="5.5" cy="8" r="2.8" style={G} />
          <circle cx="14" cy="3.5" r="2.8" style={G} />
          <circle cx="22.5" cy="1.8" r="2.8" style={G} />
          <circle cx="31" cy="3.5" r="2.8" style={G} />
          <circle cx="39.5" cy="8" r="2.8" style={G} />
          <path d="M 5.5,8 L 8.5,27 L 36.5,27 L 39.5,8 L 31,17.5 L 22.5,1.8 L 14,17.5 Z" style={G} />
          <path d="M 8.5,27 L 11,33.5 L 34,33.5 L 36.5,27 Z" style={G2} />
          <path d="M 9,27 C 13,25.5 32,25.5 36,27" style={{ fill: 'none', stroke: S, strokeWidth: `${sw}px` }} />
          {base}
        </svg>
      );
    case 'king':
      return (
        <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
          <rect x="21" y="1" width="3.5" height="13" rx="1.75" style={G} />
          <rect x="16.5" y="4.5" width="12" height="3.5" rx="1.75" style={G} />
          <path d="M 12.5,37 L 12.5,28 C 12.5,20.5 17,17.5 22.5,17.5 C 28,17.5 32.5,20.5 32.5,28 L 32.5,37 Z" style={G} />
          <path d="M 12.5,28 C 16,26.5 29,26.5 32.5,28" style={{ fill: 'none', stroke: S, strokeWidth: `${sw}px` }} />
          <path d="M 11,37 L 34,37 L 33.5,33.5 C 30,34.5 15,34.5 11.5,33.5 Z" style={G2} />
          {base}
        </svg>
      );
    default:
      return <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"></svg>;
  }
}

function makeSetup(): (PieceData | null)[] {
  const row = (color: PieceColor, type: PieceType) => ({ type, color, desc: DESC[color][type] });
  const pawns = (c: PieceColor) => Array(8).fill(null).map(() => row(c, 'pawn'));
  const back = (c: PieceColor) => (['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as PieceType[]).map(t => row(c, t));
  return [...back('black'), ...pawns('black'), ...Array(32).fill(null), ...pawns('white'), ...back('white')];
}

export default function App() {
  const [boardState, setBoardState] = useState<(PieceData | null)[]>(makeSetup());
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [moveCells, setMoveCells] = useState<number[]>([]);
  const [capCells, setCapCells] = useState<number[]>([]);
  const [turn, setTurn] = useState<PieceColor | ''>('');
  const [gameOver, setGameOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameMode, setGameMode] = useState<'tutorial' | 'match' | ''>('');
  const [gameDiff, setGameDiff] = useState<string>('');
  const [showMenu, setShowMenu] = useState(true);
  const [showDiffOptions, setShowDiffOptions] = useState(false);
  const [status, setStatus] = useState('모드를 골라주세요!');
  const [bgmOn, setBgmOn] = useState(false);
  const [bgmId, setBgmId] = useState('iQIkgz9P-nM');
  const [capturedIdx, setCapturedIdx] = useState<number | null>(null);
  const [promotionData, setPromotionData] = useState<{ idx: number; color: PieceColor; from: number; captured: PieceData | null } | null>(null);

  const playerRef = useRef<any>(null);

  useEffect(() => {
    const fitBoard = () => {
      const root = document.documentElement;
      const title = document.querySelector('.game-title') as HTMLElement;
      const ctrls = document.querySelector('.music-controls') as HTMLElement;
      const info = document.querySelector('.info-box') as HTMLElement;
      const uiH = (title?.offsetHeight || 0) + (ctrls?.offsetHeight || 0) + (info?.offsetHeight || 0) + 52;
      const size = Math.floor(Math.min(window.innerWidth * 0.97, window.innerHeight - uiH));
      root.style.setProperty('--board-size', size + 'px');
    };
    window.addEventListener('resize', fitBoard);
    fitBoard();
    return () => window.removeEventListener('resize', fitBoard);
  }, []);

  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: bgmId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 0, loop: 1, playlist: bgmId }
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
      setBgmOn(true);
    }
  };

  const calcMoves = useCallback((idx: number, state: (PieceData | null)[]) => {
    const p = state[idx];
    if (!p) return { moves: [], caps: [] };
    const moves: number[] = [];
    const caps: number[] = [];
    const r = Math.floor(idx / 8);
    const c = idx % 8;
    const ok = (nr: number, nc: number) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;

    const reg = (nr: number, nc: number) => {
      if (!ok(nr, nc)) return false;
      const t = state[nr * 8 + nc];
      if (!t) {
        moves.push(nr * 8 + nc);
        return true;
      }
      if (t.color !== p.color) caps.push(nr * 8 + nc);
      return false;
    };

    const slide = (dirs: [number, number][]) =>
      dirs.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) if (!reg(r + dr * i, c + dc * i)) break;
      });

    if (p.type === 'rook' || p.type === 'queen') slide([[-1, 0], [1, 0], [0, -1], [0, 1]]);
    if (p.type === 'bishop' || p.type === 'queen') slide([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    if (p.type === 'knight')
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => reg(r + dr, c + dc));
    if (p.type === 'king')
      [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => reg(r + dr, c + dc));
    if (p.type === 'pawn') {
      const dir = p.color === 'white' ? -1 : 1;
      const sr = p.color === 'white' ? 6 : 1;
      if (ok(r + dir, c) && !state[(r + dir) * 8 + c]) {
        moves.push((r + dir) * 8 + c);
        if (r === sr && !state[(r + dir * 2) * 8 + c]) moves.push((r + dir * 2) * 8 + c);
      }
      [-1, 1].forEach(dc => {
        if (ok(r + dir, c + dc)) {
          const t = state[(r + dir) * 8 + (c + dc)];
          if (t && t.color !== p.color) caps.push((r + dir) * 8 + (c + dc));
        }
      });
    }
    return { moves, caps };
  }, []);

  const getAllMoves = useCallback((color: PieceColor, state: (PieceData | null)[]) => {
    const caps: { from: number; to: number; isCapture: boolean }[] = [];
    const quiets: { from: number; to: number; isCapture: boolean }[] = [];
    for (let i = 0; i < 64; i++) {
      if (!state[i] || state[i]!.color !== color) continue;
      const { moves, caps: cs } = calcMoves(i, state);
      cs.forEach(to => caps.push({ from: i, to, isCapture: true }));
      moves.forEach(to => quiets.push({ from: i, to, isCapture: false }));
    }
    return [...caps, ...quiets];
  }, [calcMoves]);

  const applyMove = (state: (PieceData | null)[], from: number, to: number) => {
    const s = [...state];
    s[to] = s[from];
    s[from] = null;
    return s;
  };

  const getPST = (piece: PieceData, idx: number) => {
    const tbl = PST[piece.type];
    if (!tbl) return 0;
    const r = Math.floor(idx / 8);
    return piece.color === 'white' ? tbl[idx] : tbl[(7 - r) * 8 + (idx % 8)];
  };

  const evaluate = useCallback((state: (PieceData | null)[]) => {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      if (!state[i]) continue;
      const p = state[i]!;
      const v = VAL[p.type] + getPST(p, i);
      score += p.color === 'black' ? v : -v;
    }
    return score;
  }, []);

  const minimax = useCallback((state: (PieceData | null)[], depth: number, isMax: boolean, alpha: number, beta: number): number => {
    if (!state.some(p => p && p.type === 'king' && p.color === 'black')) return -500000;
    if (!state.some(p => p && p.type === 'king' && p.color === 'white')) return 500000;
    if (depth === 0) return evaluate(state);

    const color = isMax ? 'black' : 'white';
    const moves = getAllMoves(color, state);
    if (moves.length === 0) return isMax ? -200000 : 200000;

    if (isMax) {
      let best = -Infinity;
      for (const m of moves) {
        const v = minimax(applyMove(state, m.from, m.to), depth - 1, false, alpha, beta);
        if (v > best) best = v;
        if (v > alpha) alpha = v;
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of moves) {
        const v = minimax(applyMove(state, m.from, m.to), depth - 1, true, alpha, beta);
        if (v < best) best = v;
        if (v < beta) beta = v;
        if (beta <= alpha) break;
      }
      return best;
    }
  }, [evaluate, getAllMoves]);

  const bestMove = useCallback((depth: number) => {
    const all = getAllMoves('black', boardState);
    if (all.length === 0) return null;
    let bestScore = -Infinity;
    let cands: { from: number; to: number; isCapture: boolean }[] = [];
    for (const m of all) {
      const sim = applyMove(boardState, m.from, m.to);
      if (!sim.some(p => p && p.type === 'king' && p.color === 'white')) return m;
      const s = minimax(sim, depth - 1, false, -Infinity, Infinity);
      if (s > bestScore) {
        bestScore = s;
        cands = [m];
      } else if (s === bestScore) {
        cands.push(m);
      }
    }
    return cands[Math.floor(Math.random() * cands.length)];
  }, [boardState, getAllMoves, minimax]);

  const afterMove = useCallback((from: number, to: number, isPlayer: boolean, captured: PieceData | null) => {
    if (captured && captured.type === 'king') {
      const winner = boardState[to]?.color === 'white' ? '하얀 팀(아들)' : '검은 팀(컴퓨터)';
      setGameOver(true);
      setStatus(`🎉 게임 종료! ${winner} 승리! 🎉`);
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
    } else {
      setStatus('연습 모드! 하얀 팀·검은 팀 모두 만져볼 수 있어!');
    }
  }, [boardState, gameMode]);

  const computerMove = useCallback(() => {
    if (gameMode !== 'match' || gameOver) return;
    const all = getAllMoves('black', boardState);
    if (all.length === 0) {
      setGameOver(true);
      setStatus('컴퓨터가 움직일 곳이 없어요! 아들 승리! 🎉');
      return;
    }

    let chosen: { from: number; to: number; isCapture: boolean } | null = null;

    if (gameDiff === 'level1') {
      chosen = all[Math.floor(Math.random() * all.length)];
    } else if (gameDiff === 'level2') {
      const caps = all.filter(m => m.isCapture);
      if (caps.length > 0) {
        const maxV = Math.max(...caps.map(m => VAL[boardState[m.to]!.type] || 0));
        const best = caps.filter(m => (VAL[boardState[m.to]!.type] || 0) === maxV);
        chosen = best[Math.floor(Math.random() * best.length)];
      } else chosen = all[Math.floor(Math.random() * all.length)];
    } else if (gameDiff === 'level3') {
      const scored = all.map(m => {
        const capVal = m.isCapture ? (VAL[boardState[m.to]!.type] || 0) : 0;
        const myVal = VAL[boardState[m.from]!.type] || 0;
        const pstGain = getPST(boardState[m.from]!, m.to) - getPST(boardState[m.from]!, m.from);
        const sim = applyMove(boardState, m.from, m.to);
        let danger = 0;
        for (let j = 0; j < 64; j++) {
          if (!sim[j] || sim[j]!.color !== 'white') continue;
          const { moves: wm, caps: wc } = calcMoves(j, sim);
          if ([...wm, ...wc].includes(m.to)) {
            danger = myVal * 0.9;
            break;
          }
        }
        return { ...m, score: capVal + pstGain * 0.5 - danger };
      });
      const maxS = Math.max(...scored.map(m => m.score));
      const best = scored.filter(m => m.score === maxS);
      chosen = best[Math.floor(Math.random() * best.length)];
    } else if (gameDiff === 'level4') {
      chosen = bestMove(2);
    } else if (gameDiff === 'level5') {
      chosen = bestMove(3);
    }

    if (!chosen) chosen = all[Math.floor(Math.random() * all.length)];
    
    const { from, to, isCapture } = chosen;
    if (isCapture) {
      setIsAnimating(true);
      const targetData = boardState[to];
      setCapturedIdx(to);
      setTimeout(() => {
        setBoardState(prev => {
          const next = [...prev];
          next[to] = next[from];
          next[from] = null;
          return next;
        });
        setCapturedIdx(null);
        setIsAnimating(false);
        afterMove(from, to, false, targetData);
      }, 320);
    } else {
      setIsAnimating(true);
      setBoardState(prev => {
        const next = [...prev];
        next[to] = next[from];
        next[from] = null;
        return next;
      });
      setTimeout(() => {
        setIsAnimating(false);
        afterMove(from, to, false, null);
      }, 250);
    }
  }, [boardState, gameDiff, gameMode, gameOver, getAllMoves, bestMove, afterMove, calcMoves]);

  useEffect(() => {
    if (turn === 'black' && !gameOver && !isAnimating) {
      const timer = setTimeout(computerMove, 700);
      return () => clearTimeout(timer);
    }
  }, [turn, gameOver, isAnimating, computerMove]);

  const onSqClick = (idx: number) => {
    if (gameOver || isAnimating || promotionData) return;
    if (gameMode === 'match' && turn !== 'white') return;
    const clicked = boardState[idx];

    if (selIdx !== null) {
      if (idx === selIdx) {
        setSelIdx(null);
        setMoveCells([]);
        setCapCells([]);
        return;
      }
      if (clicked && clicked.color === boardState[selIdx]!.color) {
        setSelIdx(idx);
        const { moves, caps } = calcMoves(idx, boardState);
        setMoveCells(moves);
        setCapCells(caps);
        return;
      }

      if (moveCells.includes(idx)) {
        const from = selIdx;
        const to = idx;
        const piece = boardState[from]!;
        const isPromoRank = to < 8 || to >= 56;

        if (piece.type === 'pawn' && isPromoRank) {
          if (gameMode === 'tutorial') {
            setBoardState(prev => {
              const next = [...prev];
              next[to] = { ...piece, type: 'queen' };
              next[from] = null;
              return next;
            });
            setSelIdx(null);
            setMoveCells([]);
            setCapCells([]);
            afterMove(from, to, true, null);
          } else {
            setPromotionData({ idx: to, color: piece.color, from, captured: null });
          }
        } else {
          setBoardState(prev => {
            const next = [...prev];
            next[to] = next[from];
            next[from] = null;
            return next;
          });
          setSelIdx(null);
          setMoveCells([]);
          setCapCells([]);
          afterMove(from, to, true, null);
        }
      } else if (capCells.includes(idx)) {
        const from = selIdx;
        const to = idx;
        const piece = boardState[from]!;
        const targetData = boardState[to];
        const isPromoRank = to < 8 || to >= 56;

        if (piece.type === 'pawn' && isPromoRank) {
          if (gameMode === 'tutorial') {
            setCapturedIdx(to);
            setTimeout(() => {
              setBoardState(prev => {
                const next = [...prev];
                next[to] = { ...piece, type: 'queen' };
                next[from] = null;
                return next;
              });
              setCapturedIdx(null);
              setSelIdx(null);
              setMoveCells([]);
              setCapCells([]);
              afterMove(from, to, true, targetData);
            }, 320);
          } else {
            setPromotionData({ idx: to, color: piece.color, from, captured: targetData });
          }
        } else {
          setCapturedIdx(to);
          setTimeout(() => {
            setBoardState(prev => {
              const next = [...prev];
              next[to] = next[from];
              next[from] = null;
              return next;
            });
            setCapturedIdx(null);
            setSelIdx(null);
            setMoveCells([]);
            setCapCells([]);
            afterMove(from, to, true, targetData);
          }, 320);
        }
      } else {
        setStatus('거긴 못 가! 초록 불빛을 눌러!');
      }
    } else {
      if (!clicked) return;
      if (gameMode === 'match' && clicked.color !== 'white') {
        setStatus('아들 차례니까 하얀 말만 움직여!');
        return;
      }
      setSelIdx(idx);
      const { moves, caps } = calcMoves(idx, boardState);
      setMoveCells(moves);
      setCapCells(caps);
      setStatus(gameMode === 'tutorial' ? clicked.desc : '어디로 이동할까요?');
    }
  };

  const handlePromotion = (type: PieceType) => {
    if (!promotionData) return;
    const { idx, color, from, captured } = promotionData;
    setBoardState(prev => {
      const next = [...prev];
      next[idx] = { type, color, desc: DESC[color][type] };
      next[from] = null;
      return next;
    });
    setPromotionData(null);
    setSelIdx(null);
    setMoveCells([]);
    setCapCells([]);
    afterMove(from, idx, true, captured);
  };

  const startTutorial = () => {
    setGameMode('tutorial');
    setGameOver(false);
    setIsAnimating(false);
    setTurn('');
    setShowMenu(false);
    setBoardState(makeSetup());
    setStatus('연습 모드! 하얀 팀·검은 팀 모두 만져볼 수 있어!');
  };

  const startMatch = (diff: string) => {
    setGameMode('match');
    setGameDiff(diff);
    setGameOver(false);
    setIsAnimating(false);
    setTurn('white');
    setShowMenu(false);
    setBoardState(makeSetup());
    setStatus('컴퓨터 대결 시작! 아들 차례 — 하얀 말을 먼저 움직여!');
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
      </div>

      <div id="youtube-player" style={{ display: 'none' }}></div>

      <div className="board-wrap">
        <div className="board">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className={`sq ${(Math.floor(i / 8) + (i % 8)) % 2 === 0 ? 'light' : 'dark'} ${moveCells.includes(i) ? 'valid' : ''} ${capCells.includes(i) ? 'capture' : ''}`}
              onClick={() => onSqClick(i)}
            />
          ))}
          {boardState.map((d, i) => {
            if (!d) return null;
            const r = Math.floor(i / 8);
            const c = i % 8;
            return (
              <div
                key={i}
                className={`piece ${selIdx === i ? 'selected' : ''} ${capturedIdx === i ? 'being-captured' : ''}`}
                style={{ transform: `translate(calc(var(--sq)*${c}),calc(var(--sq)*${r}))` }}
              >
                <div className="piece-inner">
                  {pieceSVG(d.type, d.color)}
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
        <div className="promo-overlay">
          <div className="promo-box">
            <div className="promo-title">🎉 폰 승진! 어떤 말로 바꿀까요?</div>
            <div className="promo-pieces">
              {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map(t => (
                <button key={t} className="promo-btn" onClick={() => handlePromotion(t)}>
                  <div style={{ width: '100%', height: '100%' }}>
                    {pieceSVG(t, promotionData.color)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameOver && (
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
