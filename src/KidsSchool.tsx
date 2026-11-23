/**
 * 꼬마 체스 학교 — 6살 아이용 단계별 체스 배우기 모드
 * - 말 하나씩 배우기(별 모으기) → 잡기 → 체크 피하기 → 한 수 체크메이트
 * - 큰 글씨, 칭찬 메시지, 힌트, 소리 내어 읽어주기(브라우저 음성 합성)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PieceSVG, PieceType, PieceColor } from './PieceSVG';

interface P { id: number; t: PieceType; c: PieceColor }
type Board = (P | null)[];
type Goal = 'stars' | 'capture' | 'escape' | 'mate';

interface Level {
  pieces: string[];          // 예: 'wR a1', 'bP d3'
  stars?: string[];
  goal?: Goal;               // 기본값 'stars'
  only?: PieceType;          // 이 종류의 말만 움직일 수 있음
  hint?: [string, string];   // 정답 [출발, 도착]
  say?: string;              // 단계별 안내
}

interface Lesson {
  key: string;
  icon: PieceType;
  iconColor?: PieceColor;
  title: string;
  intro: string;
  levels: Level[];
}

// ───────────────────────── 수업 내용 ─────────────────────────
const LESSONS: Lesson[] = [
  {
    key: 'rook', icon: 'rook', title: '룩 기차',
    intro: '룩은 기차처럼 앞, 뒤, 옆으로 쭉쭉 달려요! 하얀 말을 누르고 초록 점을 눌러서 별을 모두 모아 보자!',
    levels: [
      { pieces: ['wR a1'], stars: ['a6', 'f6'] },
      { pieces: ['wR d4'], stars: ['d8', 'h8', 'h1'] },
      { pieces: ['wR a1'], stars: ['c1', 'c7', 'g7', 'g2'] },
    ],
  },
  {
    key: 'bishop', icon: 'bishop', title: '비숍 미끄럼틀',
    intro: '비숍은 대각선으로만 미끄럼틀을 타요! 그래서 언제나 같은 색 칸에만 있어요.',
    levels: [
      { pieces: ['wB c1'], stars: ['e3', 'g5', 'd8'] },
      { pieces: ['wB f1'], stars: ['b5', 'e8', 'h5'] },
    ],
  },
  {
    key: 'queen', icon: 'queen', title: '힘센 퀸',
    intro: '퀸은 룩과 비숍을 합친 제일 힘센 말이에요! 쭉쭉 가로세로, 대각선 모두 갈 수 있어요.',
    levels: [
      { pieces: ['wQ d1'], stars: ['d6', 'h2', 'a2'] },
      { pieces: ['wQ a8'], stars: ['e4', 'e8', 'a4'] },
    ],
  },
  {
    key: 'king', icon: 'king', title: '킹 산책',
    intro: '킹은 제일 소중한 왕이에요! 어느 방향이든 딱 한 칸씩만 천천히 걸어요.',
    levels: [
      { pieces: ['wK e1'], stars: ['e3', 'f4', 'd5'] },
      { pieces: ['wK a1'], stars: ['c3', 'e2', 'g4'] },
    ],
  },
  {
    key: 'knight', icon: 'knight', title: '나이트 점프',
    intro: '나이트는 기역 자 모양으로 폴짝 점프해요! 다른 말이 막고 있어도 뛰어넘을 수 있어요.',
    levels: [
      { pieces: ['wN b1'], stars: ['c3', 'd5', 'f6'] },
      { pieces: ['wN g1', 'wP e2', 'wP f2', 'wP g2', 'wP h2'], stars: ['f3', 'e5', 'c6'], only: 'knight',
        say: '폰들이 막고 있어도 괜찮아! 나이트는 뛰어넘을 수 있어.' },
    ],
  },
  {
    key: 'pawn', icon: 'pawn', title: '용감한 폰',
    intro: '폰은 앞으로만 한 칸씩 가요. 처음에는 두 칸도 갈 수 있어요! 상대 말을 잡을 때만 대각선으로 가요.',
    levels: [
      { pieces: ['wP e2'], stars: ['e4', 'e6', 'e8'], say: '맨 끝 줄까지 가면 퀸으로 변신해요!' },
      { pieces: ['wP c2', 'bP d3', 'bP e4', 'bP f5'], goal: 'capture', hint: ['c2', 'd3'],
        say: '폰은 대각선으로 잡아요! 검은 폰 3개를 모두 잡아 보자.' },
    ],
  },
  {
    key: 'capture', icon: 'pawn', iconColor: 'black', title: '잡기 놀이',
    intro: '상대 말이 있는 칸으로 가면 그 말을 잡을 수 있어요! 빨간 동그라미를 눌러서 검은 말을 모두 잡아 보자.',
    levels: [
      { pieces: ['wR a1', 'bP a6', 'bP f6', 'bP f2'], goal: 'capture', hint: ['a1', 'a6'] },
      { pieces: ['wN b1', 'bP c3', 'bP e4', 'bP g5'], goal: 'capture', hint: ['b1', 'c3'] },
      { pieces: ['wQ d1', 'bP d5', 'bN g8', 'bR a2'], goal: 'capture', hint: ['d1', 'd5'] },
    ],
  },
  {
    key: 'check', icon: 'king', title: '체크 피하기',
    intro: '킹이 공격받는 걸 체크라고 해요! 체크가 되면 꼭 킹을 안전한 곳으로 옮겨야 해요. 빨간 X 칸은 위험한 곳이에요.',
    levels: [
      { pieces: ['wK e1', 'bR e8'], goal: 'escape', only: 'king', hint: ['e1', 'd1'],
        say: '검은 룩이 킹을 노려요! 초록 칸으로 피하자.' },
      { pieces: ['wK e4', 'bR e8', 'bR a5'], goal: 'escape', only: 'king', hint: ['e4', 'd3'],
        say: '룩이 두 개예요! 두 룩이 모두 못 오는 칸을 찾아봐.' },
      { pieces: ['wK e1', 'bQ e2'], goal: 'escape', only: 'king', hint: ['e1', 'e2'],
        say: '공격하는 말을 킹이 직접 잡아도 돼요!' },
    ],
  },
  {
    key: 'mate', icon: 'king', iconColor: 'black', title: '체크메이트!',
    intro: '킹이 도망칠 곳이 하나도 없는 체크를 체크메이트라고 해요. 체크메이트를 하면 이겨요! 한 번에 체크메이트를 해 보자.',
    levels: [
      { pieces: ['bK g8', 'bP f7', 'bP g7', 'bP h7', 'wR a1', 'wK g1'], goal: 'mate', hint: ['a1', 'a8'],
        say: '검은 킹은 자기 폰에 막혀서 앞으로 못 도망가요!' },
      { pieces: ['bK a8', 'wK b6', 'wQ c7'], goal: 'mate', hint: ['c7', 'b7'],
        say: '퀸을 킹 바로 옆으로! 하얀 킹이 퀸을 지켜 줘요.' },
      { pieces: ['bK h8', 'wR a7', 'wR b1', 'wK e1'], goal: 'mate', hint: ['b1', 'b8'],
        say: '룩 두 개가 사다리처럼 차례로 막아요!' },
    ],
  },
];

const NAME: Record<PieceType, string> = { king: '킹', queen: '퀸', rook: '룩', bishop: '비숍', knight: '나이트', pawn: '폰' };
const NAME_TOPIC: Record<PieceType, string> = { king: '킹은', queen: '퀸은', rook: '룩은', bishop: '비숍은', knight: '나이트는', pawn: '폰은' };
const NAME_OBJ: Record<PieceType, string> = { king: '킹을', queen: '퀸을', rook: '룩을', bishop: '비숍을', knight: '나이트를', pawn: '폰을' };
const LETTER: Record<string, PieceType> = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
const PRAISE = ['참 잘했어요!', '최고예요!', '대단해요!', '멋져요!', '천재인데요?'];

const sq = (n: string) => (8 - Number(n[1])) * 8 + (n.charCodeAt(0) - 97);

// ───────────────────────── 작은 체스 엔진 ─────────────────────────
function buildBoard(level: Level): Board {
  const b: Board = Array(64).fill(null);
  level.pieces.forEach((s, i) => {
    const [code, at] = s.split(' ');
    b[sq(at)] = { id: i + 1, c: code[0] === 'w' ? 'white' : 'black', t: LETTER[code[1]] };
  });
  return b;
}

const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
const LINES = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAGS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

// 이 말이 공격하는 칸들
function attacksFrom(b: Board, i: number): number[] {
  const p = b[i]!;
  const r = Math.floor(i / 8), c = i % 8;
  const out: number[] = [];
  const slide = (dirs: number[][]) => dirs.forEach(([dr, dc]) => {
    for (let k = 1; k < 8; k++) {
      const nr = r + dr * k, nc = c + dc * k;
      if (!inside(nr, nc)) break;
      out.push(nr * 8 + nc);
      if (b[nr * 8 + nc]) break;
    }
  });
  const step = (dirs: number[][]) => dirs.forEach(([dr, dc]) => { if (inside(r + dr, c + dc)) out.push((r + dr) * 8 + c + dc); });
  if (p.t === 'rook' || p.t === 'queen') slide(LINES);
  if (p.t === 'bishop' || p.t === 'queen') slide(DIAGS);
  if (p.t === 'knight') step(KNIGHT);
  if (p.t === 'king') step([...LINES, ...DIAGS]);
  if (p.t === 'pawn') step(p.c === 'white' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
  return out;
}

function isAttacked(b: Board, i: number, by: PieceColor) {
  for (let j = 0; j < 64; j++) if (b[j]?.c === by && attacksFrom(b, j).includes(i)) return true;
  return false;
}

function pseudoMoves(b: Board, i: number): number[] {
  const p = b[i];
  if (!p) return [];
  const r = Math.floor(i / 8), c = i % 8;
  if (p.t === 'pawn') {
    const out: number[] = [];
    const dir = p.c === 'white' ? -1 : 1;
    const start = p.c === 'white' ? 6 : 1;
    if (inside(r + dir, c) && !b[(r + dir) * 8 + c]) {
      out.push((r + dir) * 8 + c);
      if (r === start && !b[(r + 2 * dir) * 8 + c]) out.push((r + 2 * dir) * 8 + c);
    }
    [-1, 1].forEach(dc => {
      if (!inside(r + dir, c + dc)) return;
      const t = b[(r + dir) * 8 + c + dc];
      if (t && t.c !== p.c && t.t !== 'king') out.push((r + dir) * 8 + c + dc);
    });
    return out;
  }
  return attacksFrom(b, i).filter(j => !b[j] || (b[j]!.c !== p.c && b[j]!.t !== 'king'));
}

function applyMove(b: Board, from: number, to: number): { board: Board; promoted: boolean } {
  const nb = b.slice();
  const p = { ...nb[from]! };
  let promoted = false;
  if (p.t === 'pawn' && (to < 8 || to >= 56)) { p.t = 'queen'; promoted = true; }
  nb[to] = p;
  nb[from] = null;
  return { board: nb, promoted };
}

const kingOf = (b: Board, color: PieceColor) => b.findIndex(p => p?.t === 'king' && p.c === color);
const enemy = (c: PieceColor): PieceColor => (c === 'white' ? 'black' : 'white');

function inCheck(b: Board, color: PieceColor) {
  const k = kingOf(b, color);
  return k !== -1 && isAttacked(b, k, enemy(color));
}

function legalMoves(b: Board, i: number): number[] {
  const p = b[i];
  if (!p) return [];
  return pseudoMoves(b, i).filter(to => !inCheck(applyMove(b, i, to).board, p.c));
}

function hasAnyLegal(b: Board, color: PieceColor) {
  for (let i = 0; i < 64; i++) if (b[i]?.c === color && legalMoves(b, i).length) return true;
  return false;
}

// ───────────────────────── 진행 기록 · 음성 ─────────────────────────
const PROGRESS_KEY = 'chessKidsProgress';
const VOICE_KEY = 'chessKidsVoice';

function loadProgress(): Record<string, number> {
  try {
    const v = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch { return {}; }
}
function saveProgress(p: Record<string, number>) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* 저장 불가 시 무시 */ }
}
function loadVoice(): boolean {
  try { return localStorage.getItem(VOICE_KEY) !== 'off'; } catch { return true; }
}

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
function speakText(text: string) {
  if (!canSpeak) return;
  try {
    const clean = text.replace(/\p{Extended_Pictographic}|️/gu, '').trim();
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ko-KR';
    u.rate = 0.95;
    u.pitch = 1.15;
    window.speechSynthesis.speak(u);
  } catch { /* 음성 미지원 시 무시 */ }
}

const KS_CSS = `
.ks-bar { display:flex; gap:1.4vmin; align-items:center; justify-content:center; width:min(97vw, max(100%, 560px)); margin:0.6vh 0; flex-wrap:wrap; }
.ks-label { font-weight:900; color:#1976d2; font-size:clamp(14px,3vmin,20px); }
.ks-btn { padding:1vmin 2.2vmin; font-size:clamp(13px,2.7vmin,18px); font-weight:bold; border:none; border-radius:2vmin;
  color:#fff; font-family:inherit; cursor:pointer; box-shadow:0.3vmin 0.3vmin 1vmin rgba(0,0,0,.2); transition:transform .1s; }
.ks-btn:active { transform:scale(.94); }
.info-box.ks-msg { width:min(97vw, max(100%, 560px)); font-size:clamp(15px,3.3vmin,22px); font-weight:800; line-height:1.4; min-height:3.2em;
  display:flex; align-items:center; justify-content:center; }
.ks-star { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:calc(var(--sq)*0.62);
  z-index:12; pointer-events:none; animation:ksBob 1s ease-in-out infinite alternate; }
.ks-x { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#e53935;
  font-size:calc(var(--sq)*0.6); font-weight:900; z-index:16; pointer-events:none; text-shadow:0 0 0.6vmin #fff; }
.sq.ks-hint { box-shadow:inset 0 0 0 calc(var(--sq)*0.09) #ff4081; animation:ksHint .55s infinite alternate; z-index:14; }
@keyframes ksBob { from { transform:translateY(-6%) scale(.95); } to { transform:translateY(6%) scale(1.05); } }
@keyframes ksHint { from { filter:brightness(1); } to { filter:brightness(1.35); } }
.ks-overlay { position:absolute; inset:0; background:rgba(255,255,255,.97); z-index:100; display:flex; flex-direction:column;
  align-items:center; padding:2.5vmin; overflow-y:auto; }
.ks-overlay.center { justify-content:center; text-align:center; }
.ks-title { font-size:clamp(17px,4.2vmin,28px); font-weight:900; color:#d32f2f; margin-bottom:1.5vmin; }
.ks-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5vmin; width:100%; }
.ks-card { background:#fff8e1; border:0.5vmin solid #fbc02d; border-radius:2.5vmin; padding:1vmin 0.5vmin; display:flex;
  flex-direction:column; align-items:center; font-family:inherit; cursor:pointer; color:#333; }
.ks-card.done { background:#e8f5e9; border-color:#43a047; }
.ks-card:active { transform:scale(.95); }
.ks-card .ic { width:calc(var(--sq)*0.95); height:calc(var(--sq)*0.95); }
.ks-card .ic svg { width:100%; height:100%; overflow:visible; }
.ks-card .nm { font-size:clamp(11px,2.5vmin,16px); font-weight:800; }
.ks-card .pg { font-size:clamp(10px,2.2vmin,14px); letter-spacing:-0.1em; }
.ks-big { width:calc(var(--sq)*2.2); height:calc(var(--sq)*2.2); margin-bottom:1vmin; }
.ks-big svg { width:100%; height:100%; overflow:visible; }
.ks-text { font-size:clamp(15px,3.4vmin,23px); font-weight:700; color:#333; line-height:1.5; margin-bottom:2.5vmin; word-break:keep-all; }
.ks-win { position:absolute; inset:0; background:rgba(255,255,255,.88); z-index:90; display:flex; flex-direction:column;
  align-items:center; justify-content:center; text-align:center; overflow:hidden; }
.ks-win .big { font-size:clamp(26px,7vmin,48px); font-weight:900; color:#ff6f00; animation:ksPop .5s ease-out; }
.ks-conf { position:absolute; top:-10%; font-size:calc(var(--sq)*0.6); animation:ksFall 2.2s linear forwards; pointer-events:none; }
@keyframes ksPop { 0% { transform:scale(.3); } 70% { transform:scale(1.15); } 100% { transform:scale(1); } }
@keyframes ksFall { to { transform:translateY(calc(var(--board-size) * 1.2)) rotate(540deg); opacity:.2; } }
`;

interface Props { onExit: () => void; onLayout: () => void }

export default function KidsSchool({ onExit, onLayout }: Props) {
  const [view, setView] = useState<'list' | 'intro' | 'play'>('list');
  const [lessonIdx, setLessonIdx] = useState(0);
  const [levelIdx, setLevelIdx] = useState(0);
  const [board, setBoard] = useState<Board>(Array(64).fill(null));
  const [stars, setStars] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState<number[]>([]);
  const [bad, setBad] = useState<number[]>([]);
  const [hintSq, setHintSq] = useState<number[]>([]);
  const [hintStep, setHintStep] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: number; to: number } | null>(null);
  const [msg, setMsg] = useState('배우고 싶은 수업을 골라 봐!');
  const [phase, setPhase] = useState<'play' | 'won' | 'retry'>('play');
  const [praise, setPraise] = useState(PRAISE[0]);
  const [progress, setProgress] = useState<Record<string, number>>(loadProgress);
  const [voice, setVoice] = useState(loadVoice);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lesson = LESSONS[lessonIdx];
  const level = lesson.levels[levelIdx];
  const goal: Goal = level.goal ?? 'stars';

  // 화면 전환이나 안내 문장 줄 수가 바뀌면 보드 크기 다시 맞춤
  useEffect(() => { onLayout(); }, [view, msg, onLayout]);
  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    if (canSpeak) try { window.speechSynthesis.cancel(); } catch { /* 무시 */ }
  }, []);

  const say = useCallback((text: string, speakIt = true) => {
    setMsg(text);
    if (speakIt && voice) speakText(text);
  }, [voice]);

  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    try { localStorage.setItem(VOICE_KEY, next ? 'on' : 'off'); } catch { /* 무시 */ }
    if (!next && canSpeak) try { window.speechSynthesis.cancel(); } catch { /* 무시 */ }
    if (next) speakText('읽어주기를 켰어요!');
  };

  const firstMessage = (lv: Level): string => {
    const g = lv.goal ?? 'stars';
    if (lv.say) return lv.say;
    if (g === 'stars') return '하얀 말을 누르고, 초록 점을 눌러서 별을 모두 모아 보자!';
    if (g === 'capture') return '빨간 동그라미 칸으로 가면 잡을 수 있어요. 검은 말을 모두 잡아 보자!';
    if (g === 'escape') return '체크! 킹을 안전한 초록 칸으로 옮겨 주세요.';
    return '한 번에 체크메이트를 해 보자!';
  };

  const loadLevel = useCallback((li: number, lv: number, speakIt = true) => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    const L = LESSONS[li].levels[lv];
    setLessonIdx(li);
    setLevelIdx(lv);
    setBoard(buildBoard(L));
    setStars((L.stars ?? []).map(sq));
    setSel(null); setMoves([]); setBad([]); setHintSq([]); setHintStep(0);
    setLastMove(null);
    setPhase('play');
    setView('play');
    say(firstMessage(L), speakIt);
  }, [say]);

  const openLesson = (li: number) => {
    setLessonIdx(li);
    setLevelIdx(0);
    setView('intro');
    say(`${LESSONS[li].title} 수업이에요!`, false);
    if (voice) speakText(LESSONS[li].intro);
  };

  const backToList = () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    setView('list');
    say('배우고 싶은 수업을 골라 봐!', false);
  };

  const canMove = (p: P | null) => !!p && p.c === 'white' && (!level.only || p.t === level.only);

  const select = (i: number, speakIt = true) => {
    const p = board[i]!;
    const lm = legalMoves(board, i);
    setSel(i);
    setMoves(lm);
    setBad(goal === 'escape' && p.t === 'king' ? pseudoMoves(board, i).filter(t => !lm.includes(t)) : []);
    if (!lm.length) say(`이 ${NAME_TOPIC[p.t]} 지금 갈 수 있는 곳이 없어요. 다른 말을 눌러 봐!`, speakIt);
    else if (goal === 'escape') say('초록 칸은 안전해요! 빨간 X 칸은 위험해요.', speakIt);
    else say(`${NAME_OBJ[p.t]} 골랐어요! 초록 점으로 움직여 봐.`, speakIt);
  };

  const win = (text: string) => {
    setPhase('won');
    setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    const prev = progress[lesson.key] ?? 0;
    if (levelIdx + 1 > prev) {
      const np = { ...progress, [lesson.key]: levelIdx + 1 };
      setProgress(np);
      saveProgress(np);
    }
    say(text);
  };

  const failAndRetry = (text: string) => {
    setPhase('retry');
    say(text);
    retryTimer.current = setTimeout(() => loadLevel(lessonIdx, levelIdx, false), 2600);
  };

  const doMove = (from: number, to: number) => {
    const captured = board[to];
    const { board: nb, promoted } = applyMove(board, from, to);
    setBoard(nb);
    setLastMove({ from, to });
    setSel(null); setMoves([]); setBad([]); setHintSq([]); setHintStep(0);

    if (goal === 'stars') {
      const hit = stars.includes(to);
      const left = stars.filter(s => s !== to);
      setStars(left);
      if (!left.length) return win(promoted ? '폰이 퀸으로 변신했어요! 별을 모두 모았어요!' : '별을 모두 모았어요!');
      const extra = promoted ? '폰이 퀸으로 변신했어요! ' : '';
      return say(`${extra}${hit ? '⭐ 별을 찾았다! ' : '좋아요! '}남은 별은 ${left.length}개!`);
    }

    if (goal === 'capture') {
      const left = nb.filter(p => p?.c === 'black').length;
      if (!left) return win('검은 말을 모두 잡았어요!');
      if (!hasAnyLegal(nb, 'white')) return failAndRetry('더 움직일 수 없게 됐어요. 처음부터 다시 해 보자!');
      const extra = promoted ? '폰이 퀸으로 변신했어요! ' : '';
      return say(`${extra}${captured ? `와! 잡았다! 남은 검은 말은 ${left}개!` : `남은 검은 말은 ${left}개! 빨간 동그라미를 찾아봐.`}`);
    }

    if (goal === 'escape') {
      return win(captured ? '공격하던 말을 킹이 잡았어요! 이제 안전해요!' : '잘 피했어요! 이제 킹이 안전해요!');
    }

    // mate
    const check = inCheck(nb, 'black');
    if (check && !hasAnyLegal(nb, 'black')) return win('체크메이트! 검은 킹이 도망갈 곳이 없어요. 이겼다!');
    if (check) return failAndRetry('체크는 했지만 검은 킹이 도망갈 곳이 있어요. 다시 해 보자!');
    return failAndRetry('아깝다! 체크가 아니에요. 다시 해 보자!');
  };

  const onSq = (i: number) => {
    if (view !== 'play' || phase !== 'play') return;
    const p = board[i];
    if (sel !== null) {
      if (i === sel) { setSel(null); setMoves([]); setBad([]); return; }
      if (moves.includes(i)) return doMove(sel, i);
      if (bad.includes(i)) return say('앗! 거기로 가면 킹이 또 공격받아요. 초록 칸을 찾아봐!');
      if (canMove(p)) return select(i);
    }
    if (canMove(p)) return select(i);
    if (p?.c === 'white') return say(`이번에는 ${NAME_OBJ[level.only!]} 움직여 보자!`);
    if (p?.c === 'black') return say('그건 검은 말이에요. 하얀 말을 눌러 줘!');
    if (sel !== null) return say('초록 점이 있는 칸으로만 갈 수 있어요!');
    say('먼저 하얀 말을 눌러 봐!');
  };

  const onHint = () => {
    if (phase !== 'play') return;
    // 정답 말이 아직 출발 칸에 있을 때만 정답 힌트, 아니면 아래의 일반 힌트
    const hintReady = !!level.hint && board[sq(level.hint[0])]?.id === buildBoard(level)[sq(level.hint[0])]?.id;
    if (level.hint && hintReady) {
      const [f, t] = level.hint.map(sq);
      if (hintStep === 0) {
        setHintStep(1); setHintSq([f]);
        return say(`반짝이는 ${NAME_OBJ[board[f]!.t]} 움직여 봐!`);
      }
      setHintSq([f, t]);
      select(f, false);
      return say('반짝이는 칸으로 가 봐!');
    }
    // 일반 힌트: 별(또는 잡을 말)에 바로 갈 수 있으면 그 칸을, 아니면 말을 반짝이게
    const from = board.findIndex((p, i) => canMove(p) && legalMoves(board, i).length > 0);
    if (from === -1) return say('🔄 다시 하기를 눌러서 처음부터 해 보자!');
    const lm = legalMoves(board, from);
    const direct = goal === 'capture' ? lm.filter(t => board[t]?.c === 'black') : lm.filter(t => stars.includes(t));
    select(from, false);
    if (direct.length) {
      setHintSq([from, direct[0]]);
      return say(goal === 'capture' ? '반짝이는 칸의 검은 말을 잡을 수 있어요!' : '반짝이는 칸에 별이 있어요!');
    }
    setHintSq([from]);
    say(goal === 'capture' ? '지금은 바로 못 잡아요. 검은 말에 가까운 칸으로 가 보자!' : '별까지 한 번에는 못 가요. 별에 가까운 칸으로 먼저 가 보자!');
  };

  const nextStep = () => {
    if (levelIdx + 1 < lesson.levels.length) return loadLevel(lessonIdx, levelIdx + 1);
    if (lessonIdx + 1 < LESSONS.length) return openLesson(lessonIdx + 1);
    backToList();
    say('모든 수업을 마쳤어요! 이제 진짜 체스 마스터예요!');
  };

  const lastLevel = levelIdx + 1 >= lesson.levels.length;
  const whiteCheck = view === 'play' && inCheck(board, 'white');
  const blackCheck = view === 'play' && inCheck(board, 'black');

  return (
    <>
      <style>{KS_CSS}</style>

      <div className="ks-bar">
        <span className="ks-label">
          🐣 꼬마 체스 학교{view === 'play' ? ` · ${lesson.title} ${levelIdx + 1}/${lesson.levels.length}` : ''}
        </span>
      </div>

      <div className="board-wrap">
        <div className="board">
          {Array.from({ length: 64 }).map((_, i) => {
            const light = (Math.floor(i / 8) + (i % 8)) % 2 === 0;
            const isMove = view === 'play' && moves.includes(i);
            const isCap = isMove && !!board[i];
            const kingInCheck = board[i]?.t === 'king' &&
              ((board[i]!.c === 'white' && whiteCheck) || (board[i]!.c === 'black' && blackCheck));
            const cls = [
              'sq', light ? 'light' : 'dark',
              isMove ? (isCap ? 'capture sq-capture' : 'valid') : '',
              kingInCheck ? 'check-warning' : '',
              lastMove && (lastMove.from === i || lastMove.to === i) ? 'last-move' : '',
              hintSq.includes(i) ? 'ks-hint' : '',
            ].join(' ');
            return (
              <div key={i} className={cls} onClick={() => onSq(i)}>
                {view === 'play' && stars.includes(i) && !board[i] && <span className="ks-star">⭐</span>}
                {view === 'play' && bad.includes(i) && <span className="ks-x">✖</span>}
              </div>
            );
          })}

          {view === 'play' && board.map((p, i) => p && (
            <div
              key={p.id}
              className={`piece ${sel === i ? 'selected' : ''}`}
              data-color={p.c}
              style={{ transform: `translate(calc(var(--sq)*${i % 8}),calc(var(--sq)*${Math.floor(i / 8)}))` }}
            >
              <div className="piece-inner">
                <PieceSVG type={p.t} color={p.c} uid={`k${lessonIdx}-${levelIdx}-${p.id}`} />
              </div>
            </div>
          ))}

          {view === 'list' && (
            <div className="ks-overlay">
              <div className="ks-title">어떤 말을 배워 볼까?</div>
              <div className="ks-grid">
                {LESSONS.map((L, li) => {
                  const done = progress[L.key] ?? 0;
                  return (
                    <button key={L.key} className={`ks-card ${done >= L.levels.length ? 'done' : ''}`} onClick={() => openLesson(li)}>
                      <div className="ic"><PieceSVG type={L.icon} color={L.iconColor ?? 'white'} uid={`list${li}`} /></div>
                      <div className="nm">{li + 1}. {L.title}</div>
                      <div className="pg">{'⭐'.repeat(done)}{'☆'.repeat(L.levels.length - done)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'intro' && (
            <div className="ks-overlay center">
              <div className="ks-title">{lessonIdx + 1}. {lesson.title}</div>
              <div className="ks-big"><PieceSVG type={lesson.icon} color={lesson.iconColor ?? 'white'} uid={`intro${lessonIdx}`} /></div>
              <div className="ks-text">{lesson.intro}</div>
              <button className="ks-btn" style={{ background: '#43a047', fontSize: 'clamp(16px,3.6vmin,24px)', padding: '1.4vmin 5vmin' }}
                onClick={() => loadLevel(lessonIdx, 0)}>시작! ▶</button>
            </div>
          )}

          {view === 'play' && phase === 'won' && (
            <div className="ks-win">
              {['⭐', '🎉', '🌟', '🎈', '⭐', '🎊', '🌟', '🎉'].map((e, k) => (
                <span key={k} className="ks-conf" style={{ left: `${6 + k * 12}%`, animationDelay: `${(k % 4) * 0.18}s` }}>{e}</span>
              ))}
              <div className="big">{praise}</div>
              <div className="ks-text" style={{ marginTop: '1.5vmin' }}>
                {lastLevel ? `🏅 ${lesson.title} 수업을 모두 마쳤어요!` : `${levelIdx + 1}단계 성공!`}
              </div>
              <div style={{ display: 'flex', gap: '2vmin' }}>
                <button className="ks-btn" style={{ background: '#1976d2' }} onClick={() => loadLevel(lessonIdx, levelIdx)}>🔄 한 번 더</button>
                <button className="ks-btn" style={{ background: '#43a047' }} onClick={nextStep}>
                  {!lastLevel ? '다음 단계 ▶' : lessonIdx + 1 < LESSONS.length ? '다음 수업 ▶' : '수업 목록 ▶'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="info-box ks-msg">{msg}</p>

      <div className="ks-bar">
        {view === 'play' && (
          <>
            <button className="ks-btn" style={{ background: '#7b1fa2' }} onClick={backToList}>📚 수업 목록</button>
            <button className="ks-btn" style={{ background: '#ff9800' }} onClick={onHint}>💡 힌트</button>
            <button className="ks-btn" style={{ background: '#1976d2' }} onClick={() => loadLevel(lessonIdx, levelIdx)}>🔄 다시 하기</button>
          </>
        )}
        {view === 'intro' && <button className="ks-btn" style={{ background: '#7b1fa2' }} onClick={backToList}>📚 수업 목록</button>}
        {view === 'list' && <button className="ks-btn" style={{ background: '#d32f2f' }} onClick={onExit}>🏠 처음 메뉴로</button>}
        {canSpeak && (
          <button className="ks-btn" style={{ background: voice ? '#43a047' : '#9e9e9e' }} onClick={toggleVoice}>
            {voice ? '🔊 읽어주기 켬' : '🔈 읽어주기 끔'}
          </button>
        )}
      </div>
    </>
  );
}
