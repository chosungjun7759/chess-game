/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { PieceSVG } from './PieceSVG';
import KidsSchool from './KidsSchool';

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PieceColor = 'white' | 'black';

interface PieceData {
  id: number;
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

// PvP 대면(face-to-face) 모드 및 애니메이션 보강 스타일
const EXTRA_CSS = `
.piece { transition: transform 0.32s ease; }
.being-captured { pointer-events: none; }
.being-captured .piece-inner { animation: capShrink 0.3s ease forwards; }
@keyframes capShrink { to { opacity: 0; transform: scale(0.2) rotate(25deg); } }
/* 2인 대결: 검은 팀 말은 맞은편 플레이어가 바로 보도록 180도 회전 */
.pvp-mode .piece[data-color="black"] .piece-inner { transform: rotate(180deg); }
.pvp-mode .being-captured[data-color="black"] .piece-inner { animation: capShrinkB 0.3s ease forwards; }
@keyframes capShrinkB { from { transform: rotate(180deg); } to { opacity: 0; transform: scale(0.2) rotate(205deg); } }
/* 검은 팀 승진 선택창 회전 */
.promo-overlay.pvp-black .promo-box { transform: rotate(180deg); }
/* 검은 팀 쪽(보드 위) 상태창 회전 */
.info-box.pvp-top { transform: rotate(180deg); margin: 0 0 0.6vh 0; }
`;

function makeSetup(): (PieceData | null)[] {
  let uid = 0;
  const mk = (color: PieceColor, type: PieceType): PieceData => ({ id: ++uid, type, color, hasMoved: false });
  const pawns = (c: PieceColor) => Array.from({ length: 8 }, () => mk(c, 'pawn'));
  const back = (c: PieceColor) => (['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as PieceType[]).map(t => mk(c, t));
  return [...back('black'), ...pawns('black'), ...Array(32).fill(null), ...pawns('white'), ...back('white')];
}

// 기물 부족으로 인한 무승부: K vs K, K+미약한말 vs K, 같은 색 칸 비숍끼리의 K+B vs K+B
function isInsufficientMaterial(board: (PieceData | null)[]): boolean {
  const pieces: PieceData[] = [];
  const idxOf: number[] = [];
  board.forEach((p, i) => { if (p && p.type !== 'king') { pieces.push(p); idxOf.push(i); } });

  if (pieces.length === 0) return true;
  if (pieces.length === 1 && (pieces[0].type === 'bishop' || pieces[0].type === 'knight')) return true;
  if (
    pieces.length === 2 &&
    pieces[0].type === 'bishop' && pieces[1].type === 'bishop' &&
    pieces[0].color !== pieces[1].color
  ) {
    const sqColor = (idx: number) => (Math.floor(idx / 8) + (idx % 8)) % 2;
    if (sqColor(idxOf[0]) === sqColor(idxOf[1])) return true;
  }
  return false;
}

// 3수 동형 반복 판정을 위한 국면 지문: 기물 배치 + 다음 차례 + 앙파상 칸
function serializePosition(board: (PieceData | null)[], turn: PieceColor, epSquare: number | null): string {
  let s = '';
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    s += p ? p.color[0] + p.type[0] : '--';
  }
  return `${s}|${turn}|${epSquare ?? '-'}`;
}

export default function App() {
  const [boardState, setBoardState] = useState<(PieceData | null)[]>(makeSetup());
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [turn, setTurn] = useState<PieceColor | ''>('');
  const [gameOver, setGameOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameMode, setGameMode] = useState<'tutorial' | 'match' | 'pvp' | 'school' | 'menu' | ''>('');
  const [gameDiff, setGameDiff] = useState<string>('');
  const [showMenu, setShowMenu] = useState(true);
  const [showDiffOptions, setShowDiffOptions] = useState(false);
  const [status, setStatus] = useState('모드를 골라주세요!');
  const [bgmOn, setBgmOn] = useState(false);
  const [bgmId, setBgmId] = useState('iQIkgz9P-nM');
  const [dying, setDying] = useState<{ piece: PieceData; idx: number } | null>(null);
  const [promotionData, setPromotionData] = useState<{ idx: number; color: PieceColor; from: number } | null>(null);
  const [epSquare, setEpSquare] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: number; to: number } | null>(null);
  const [halfmoveClock, setHalfmoveClock] = useState(0);

  const playerRef = useRef<any>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dyingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameModeRef = useRef(gameMode);
  const positionCountsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  const fitBoard = useCallback(() => {
    const root = document.documentElement;
    const cont = document.querySelector('.container') as HTMLElement | null;
    const board = document.querySelector('.board') as HTMLElement | null;
    if (!cont || !board) return;
    // 보드를 뺀 나머지(제목·버튼·상태창·여백·테두리 전부)의 실제 높이를 재서 남는 공간에 보드를 맞춤.
    // 보드 폭이 바뀌면 글줄 수가 바뀔 수 있어 두 번 계산
    for (let k = 0; k < 2; k++) {
      const uiH = cont.getBoundingClientRect().height - board.getBoundingClientRect().height + 12;
      const size = Math.max(120, Math.min(Math.floor(window.innerWidth * 0.97), Math.floor(window.innerHeight - uiH)));
      root.style.setProperty('--board-size', size + 'px');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', fitBoard);
    fitBoard();
    return () => window.removeEventListener('resize', fitBoard);
  }, [fitBoard]);

  // PvP 진입/이탈 시 상태창 개수가 달라지므로 보드 크기 재계산
  useEffect(() => { fitBoard(); }, [gameMode, showMenu, fitBoard]);

  useEffect(() => {
    const createPlayer = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '1',
        width: '1',
        videoId: bgmId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 0, loop: 1, playlist: bgmId, playsinline: 1 }
      });
    };
    // API가 이미 로드된 상태(재마운트 등)면 즉시 생성, 아니면 콜백 등록
    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playSound = (elId: string) => {
    const el = document.getElementById(elId) as HTMLAudioElement | null;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  };

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

    const add = (nr: number, nc: number, flag: Move['flag'] = 'normal', iCapIdx: number | null = null) => {
      if (!ok(nr, nc)) return false;
      const t = state[nr * 8 + nc];
      if (!t) {
        moves.push({ to: nr * 8 + nc, flag, captureIdx: iCapIdx });
        return true;
      }
      // 킹은 잡을 수 없음 (튜토리얼처럼 차례가 자유로운 모드에서 킹이 잡히는 문제 방지)
      if (t.color !== p.color && t.type !== 'king') {
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
          const epVictim = state[r * 8 + (c + dc)];
          if (t && t.color !== p.color && t.type !== 'king') moves.push({ to: (r + dir) * 8 + (c + dc), flag: 'normal', captureIdx: (r + dir) * 8 + (c + dc) });
          // 앙파상은 옆 칸에 '상대' 폰이 있을 때만 (같은 팀 폰을 잡거나 빈 칸으로 대각 이동하는 오류 방지)
          else if (!t && currentEpSq === (r + dir) * 8 + (c + dc) && epVictim?.type === 'pawn' && epVictim.color !== p.color) moves.push({ to: currentEpSq, flag: 'ep', captureIdx: r * 8 + (c + dc) });
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
    const enemyColor: PieceColor = p.color === 'white' ? 'black' : 'white';

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
    const color: PieceColor = isMax ? 'black' : 'white';
    const moves = getAllLegalMoves(color, state, currentEp);

    if (moves.length === 0) {
      let kingIdx = -1;
      for (let i = 0; i < 64; i++) { if (state[i]?.type === 'king' && state[i]?.color === color) { kingIdx = i; break; } }
      if (kingIdx === -1) return isMax ? -999999 : 999999;
      if (isSquareAttacked(kingIdx, isMax ? 'white' : 'black', state)) return isMax ? -500000 : 500000;
      return 0;
    }

    if (depth === 0) return evaluate(state);

    // Move Ordering: 비싼 말을 잡는 수부터 먼저 계산하여 가지치기 효율 향상
    moves.sort((a, b) => {
      const va = a.captureIdx !== null ? (VAL[state[a.captureIdx]!.type] || 0) : 0;
      const vb = b.captureIdx !== null ? (VAL[state[b.captureIdx]!.type] || 0) : 0;
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

  const saveGameResult = useCallback((winnerName: string, mode: string, difficulty: string) => {
    try {
      const key = 'chessMasterResults';
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      history.push({ winnerName, mode, difficulty, date: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(history.slice(-200)));
    } catch {
      // localStorage 사용 불가(시크릿 모드 등) — 조용히 무시
    }
  }, []);

  // [핵심 수정] stale closure 제거: 항상 '이동이 반영된 보드'를 인자로 받는다
  const afterMove = useCallback((board: (PieceData | null)[], to: number, nextEp: number | null, nextHalfmove: number) => {
    if (gameModeRef.current === 'menu') return;
    setEpSquare(nextEp);
    setHalfmoveClock(nextHalfmove);

    const movedColor = board[to]!.color;
    const nextColor: PieceColor = movedColor === 'white' ? 'black' : 'white';
    const myLegalMoves = getAllLegalMoves(nextColor, board, nextEp);

    if (myLegalMoves.length === 0) {
      let myKingIdx = -1;
      for (let i = 0; i < 64; i++) { if (board[i]?.type === 'king' && board[i]?.color === nextColor) { myKingIdx = i; break; } }
      const isCheck = myKingIdx !== -1 && isSquareAttacked(myKingIdx, movedColor, board);

      setGameOver(true);
      if (isCheck) {
        playSound('checkmate-sound');
        let winnerText = movedColor === 'white' ? '하얀 팀' : '검은 팀';
        if (gameMode === 'match') {
          winnerText = movedColor === 'white' ? '하얀 팀(마스터)' : '검은 팀(컴퓨터)';
        }
        setStatus(`🎉 체크메이트! ${winnerText} 승리! 🎉`);
        saveGameResult(winnerText, gameMode, gameDiff);
      } else {
        setStatus(`🤝 스테일메이트! 무승부입니다.`);
        saveGameResult('무승부', gameMode, gameDiff);
      }
      return;
    }

    if (isInsufficientMaterial(board)) {
      setGameOver(true);
      setStatus('🤝 기물이 부족해서 무승부입니다.');
      saveGameResult('무승부', gameMode, gameDiff);
      return;
    }

    if (nextHalfmove >= 100) {
      setGameOver(true);
      setStatus('🤝 50수 동안 기물을 잡거나 폰이 움직이지 않아 무승부입니다.');
      saveGameResult('무승부', gameMode, gameDiff);
      return;
    }

    const posKey = serializePosition(board, nextColor, nextEp);
    const seenCount = (positionCountsRef.current.get(posKey) || 0) + 1;
    positionCountsRef.current.set(posKey, seenCount);
    if (seenCount >= 3) {
      setGameOver(true);
      setStatus('🤝 같은 상황이 3번 반복되어 무승부입니다.');
      saveGameResult('무승부', gameMode, gameDiff);
      return;
    }

    if (gameMode === 'match') {
      if (movedColor === 'white') {
        setTurn('black');
        setStatus('컴퓨터 로봇이 생각 중... 🤔');
      } else {
        setTurn('white');
        setStatus('마스터 차례! 멋지게 공격해봐요!');
      }
    } else if (gameMode === 'pvp') {
      setTurn(nextColor);
      setStatus(nextColor === 'white' ? '하얀 팀 차례! 멋지게 공격해봐요!' : '검은 팀 차례! 멋지게 반격해봐요!');
    } else {
      setStatus('연습 모드! 하얀 팀·검은 팀 모두 자유롭게 연습해봐!');
    }
  }, [gameMode, gameDiff, getAllLegalMoves, isSquareAttacked, saveGameResult]);

  // [핵심 수정] 다음 보드를 동기적으로 계산 → setBoardState와 afterMove가 동일한 보드를 사용
  const executeRealMove = useCallback((from: number, move: Move, isPlayer: boolean) => {
    setIsAnimating(true);
    setSelIdx(null);
    setValidMoves([]);
    setLastMove({ from, to: move.to });

    let nextEp: number | null = null;
    if (move.flag === 'pawn_double') nextEp = (from + move.to) / 2;

    const mover = boardState[from]!;
    const nextHalfmove = (mover.type === 'pawn' || move.captureIdx !== null) ? 0 : halfmoveClock + 1;
    const next = boardState.map(x => x ? { ...x } : null);

    if (move.captureIdx !== null) {
      // React 상태 기반 캡처 애니메이션 (직접 DOM 조작 제거)
      setDying({ piece: boardState[move.captureIdx]!, idx: move.captureIdx });
      if (dyingTimerRef.current) clearTimeout(dyingTimerRef.current);
      dyingTimerRef.current = setTimeout(() => setDying(null), 300);
      playSound('capture-sound');
      next[move.captureIdx] = null;
    }

    if (move.flag === 'castle_ks') {
      next[move.to - 1] = { ...next[move.to + 1]!, hasMoved: true };
      next[move.to + 1] = null;
    } else if (move.flag === 'castle_qs') {
      next[move.to + 1] = { ...next[move.to - 2]!, hasMoved: true };
      next[move.to - 2] = null;
    }

    next[move.to] = { ...next[from]!, hasMoved: true };
    next[from] = null;

    const isPromo = mover.type === 'pawn' && (move.to < 8 || move.to >= 56);
    const autoPromo = isPromo && (gameMode === 'tutorial' || (!isPlayer && gameMode === 'match'));
    if (autoPromo) next[move.to] = { ...next[move.to]!, type: 'queen' };

    setBoardState(next);

    animTimerRef.current = setTimeout(() => {
      if (gameModeRef.current === 'menu') return;
      setIsAnimating(false);
      if (isPromo && !autoPromo) {
        setPromotionData({ idx: move.to, color: mover.color, from });
      } else {
        afterMove(next, move.to, nextEp, nextHalfmove);
      }
    }, 350);
  }, [boardState, gameMode, afterMove, halfmoveClock]);

  const bestMoveWithMinimax = useCallback((depth: number) => {
    const all = getAllLegalMoves('black', boardState, epSquare);
    if (!all.length) return null;
    all.sort((a, b) => (b.captureIdx !== null ? (VAL[boardState[b.captureIdx]!.type] || 0) : 0) - (a.captureIdx !== null ? (VAL[boardState[a.captureIdx]!.type] || 0) : 0));
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
        const maxV = Math.max(...caps.map(m => VAL[boardState[m.captureIdx!]!.type] || 0));
        const best = caps.filter(m => (VAL[boardState[m.captureIdx!]!.type] || 0) === maxV);
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
  }, [boardState, epSquare, gameDiff, gameMode, gameOver, getAllLegalMoves, applyMoveInPlace, undoMoveInPlace, executeRealMove, getPST, bestMoveWithMinimax, isSquareAttacked]);

  useEffect(() => {
    if (turn === 'black' && gameMode === 'match' && !gameOver && !isAnimating) {
      aiTimerRef.current = setTimeout(computerMove, 700);
      return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
    }
  }, [turn, gameMode, gameOver, isAnimating, computerMove]);

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

  // [핵심 수정] 승진 반영 보드를 동기 계산 후 afterMove에 전달 → 승진 직후 체크메이트 정확 판정
  const handlePromotion = (type: PieceType) => {
    if (!promotionData) return;
    const { idx } = promotionData;
    const next = boardState.map(x => x ? { ...x } : null);
    next[idx] = { ...next[idx]!, type, hasMoved: true };
    setBoardState(next);
    setPromotionData(null);
    afterMove(next, idx, null, 0);
  };

  const startTutorial = () => {
    setGameMode('tutorial');
    setGameOver(false);
    setIsAnimating(false);
    setTurn('');
    setEpSquare(null);
    setLastMove(null);
    setDying(null);
    setShowMenu(false);
    setShowDiffOptions(false);
    setBoardState(makeSetup());
    setHalfmoveClock(0);
    positionCountsRef.current = new Map([[serializePosition(makeSetup(), 'white', null), 1]]);
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
    setDying(null);
    setShowMenu(false);
    setShowDiffOptions(false);
    setBoardState(makeSetup());
    setHalfmoveClock(0);
    positionCountsRef.current = new Map([[serializePosition(makeSetup(), 'white', null), 1]]);
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
    setDying(null);
    setShowMenu(false);
    setShowDiffOptions(false);
    setBoardState(makeSetup());
    setHalfmoveClock(0);
    positionCountsRef.current = new Map([[serializePosition(makeSetup(), 'white', null), 1]]);
    setStatus('2인 대결 시작! 하얀 팀 먼저 움직이세요!');
  };

  const startSchool = () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setGameMode('school');
    setGameDiff('');
    setGameOver(false);
    setIsAnimating(false);
    setTurn('');
    setSelIdx(null);
    setValidMoves([]);
    setLastMove(null);
    setDying(null);
    setShowMenu(false);
    setShowDiffOptions(false);
    setStatus('');
  };

  const restartGame = () => {
    if (gameMode === 'tutorial') startTutorial();
    else if (gameMode === 'match') startMatch(gameDiff);
    else if (gameMode === 'pvp') startPvP();
  };

  const goToMenu = () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    if (dyingTimerRef.current) clearTimeout(dyingTimerRef.current);
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
    setDying(null);
    setEpSquare(null);
    setHalfmoveClock(0);
    positionCountsRef.current = new Map();
  };

  const handleHomeClick = () => {
    if (gameMode === '' || gameMode === 'menu') return;
    if (gameMode === 'school') { goToMenu(); return; }
    setShowConfirm(true);
  };

  const confirmHome = (yes: boolean) => {
    setShowConfirm(false);
    if (yes) goToMenu();
  };

  const inPvP = gameMode === 'pvp' && !showMenu;
  const inSchool = gameMode === 'school' && !showMenu;

  return (
    <div className="container">
      <style>{EXTRA_CSS}</style>
      <h1 className="game-title">♟ 체스마스터</h1>
      {/* 휴대폰 가로 화면은 보드가 너무 작아지므로 세로로 돌리도록 안내 */}
      <div className="rotate-hint">📱<br />휴대폰을 세로로 돌려 주세요!</div>

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

      {/* PvP 대면 모드: 맞은편(검은 팀) 플레이어용 상태창 — 180도 회전 */}
      {inPvP && <p className="info-box pvp-top">{status}</p>}

      {inSchool && <KidsSchool onExit={goToMenu} onLayout={fitBoard} />}

      {!inSchool && <>
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
                key={d.id}
                className={`piece ${selIdx === i ? 'selected' : ''}`}
                data-color={d.color}
                style={{ transform: `translate(calc(var(--sq)*${c}),calc(var(--sq)*${r}))` }}
              >
                <div className="piece-inner">
                  <PieceSVG type={d.type} color={d.color} uid={String(d.id)} />
                </div>
              </div>
            );
          })}
          {/* 잡힌 말 소멸 애니메이션 (React 상태 기반) */}
          {dying && (
            <div
              key={`dying-${dying.piece.id}`}
              className="piece being-captured"
              data-color={dying.piece.color}
              style={{
                transform: `translate(calc(var(--sq)*${dying.idx % 8}),calc(var(--sq)*${Math.floor(dying.idx / 8)}))`,
                pointerEvents: 'none'
              }}
            >
              <div className="piece-inner">
                <PieceSVG type={dying.piece.type} color={dying.piece.color} uid={`x${dying.piece.id}`} />
              </div>
            </div>
          )}

          {showMenu && (
            <div className="menu-overlay">
              <div className="menu-title">어떤 모드로 해볼까?</div>
              {!showDiffOptions ? (
                <>
                  <button className="menu-btn" onClick={startTutorial}>1. 튜토리얼 (혼자 연습하기)</button>
                  <button className="menu-btn" onClick={() => setShowDiffOptions(true)}>2. 컴퓨터랑 대결하기</button>
                  <button className="menu-btn" onClick={startPvP} style={{ background: '#4caf50', color: 'white', borderColor: '#388e3c' }}>3. 2인 대결 (마주보고 같이 하기)</button>
                  <button className="menu-btn" onClick={startSchool} style={{ background: '#ec407a', color: 'white', borderColor: '#ad1457' }}>4. 🐣 꼬마 체스 학교 (처음 배우는 친구)</button>
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
      </>}

      {promotionData && (
        <div className={`promo-overlay ${gameMode === 'pvp' && promotionData.color === 'black' ? 'pvp-black' : ''}`}>
          <div className="promo-box">
            <div className="promo-title">🎉 폰 승진! 어떤 말로 바꿀까요?</div>
            <div className="promo-pieces">
              {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map(t => (
                <button key={t} className="promo-btn" onClick={() => handlePromotion(t)}>
                  <div style={{ width: '100%', height: '100%' }}>
                    <PieceSVG type={t} color={promotionData.color} uid={`pm${t}`} />
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

      {gameOver && !showMenu && gameMode !== 'menu' && (
        <div className="promo-overlay">
          <div className="promo-box">
            <div className="promo-title">게임 종료!</div>
            <p style={{ marginBottom: '2vh' }}>{status}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2vmin' }}>
              <button className="menu-btn" style={{ width: 'auto', padding: '1vh 4vh' }} onClick={restartGame}>다시 하기</button>
              <button className="menu-btn" style={{ width: 'auto', padding: '1vh 4vh', background: '#ff9800', color: 'white' }} onClick={goToMenu}>메뉴로</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
