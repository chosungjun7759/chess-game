/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PieceColor = 'white' | 'black';

interface PieceData {
  emoji: string;
  type: PieceType;
  color: PieceColor;
  desc: string;
}

function makePawns(color: PieceColor) {
  const isBlack = color === 'black';
  return Array.from({ length: 8 }, () => ({
    emoji: isBlack ? '♟' : '♙',
    type: 'pawn' as PieceType,
    color: color,
    desc: isBlack ? "난 검은색 '폰'! 앞으로 전진!" : "난 하얀색 '폰'! 무조건 앞으로 전진!"
  }));
}

const TUTORIAL_SETUP: (PieceData | null)[] = [
  { emoji: '♜', type: 'rook', color: 'black', desc: "난 성벽 전차 '룩'! 직진 대마왕!" }, { emoji: '♞', type: 'knight', color: 'black', desc: "난 기사 '나이트'! 점프력이 최고지!" }, { emoji: '♝', type: 'bishop', color: 'black', desc: "난 마법사 '비숍'! 대각선으로 날아다녀." }, { emoji: '♛', type: 'queen', color: 'black', desc: "내가 바로 '여왕'! 어디든 갈 수 있어!" }, { emoji: '♚', type: 'king', color: 'black', desc: "에헴, 난 대장 '킹'이다. 1칸씩만 움직여." }, { emoji: '♝', type: 'bishop', color: 'black', desc: "난 마법사 '비숍'! 대각선으로 날아다녀." }, { emoji: '♞', type: 'knight', color: 'black', desc: "난 기사 '나이트'! 점프력이 최고지!" }, { emoji: '♜', type: 'rook', color: 'black', desc: "난 성벽 전차 '룩'! 직진 대마왕!" },
  ...makePawns('black'),
  ...Array(32).fill(null), // 중간 비우기
  ...makePawns('white'),
  { emoji: '♖', type: 'rook', color: 'white', desc: "난 성벽 전차 '룩'! 직진 대마왕!" }, { emoji: '♘', type: 'knight', color: 'white', desc: "난 기사 '나이트'! 점프력이 최고지!" }, { emoji: '♗', type: 'bishop', color: 'white', desc: "난 마법사 '비숍'! 대각선으로 날아다녀." }, { emoji: '♕', type: 'queen', color: 'white', desc: "내가 바로 '여왕'! 어디든 갈 수 있어!" }, { emoji: '♔', type: 'king', color: 'white', desc: "에헴, 난 대장 '킹'이다. 1칸씩만 움직여." }, { emoji: '♗', type: 'bishop', color: 'white', desc: "난 마법사 '비숍'! 대각선으로 날아다녀." }, { emoji: '♘', type: 'knight', color: 'white', desc: "난 기사 '나이트'! 점프력이 최고지!" }, { emoji: '♖', type: 'rook', color: 'white', desc: "난 성벽 전차 '룩'! 직진 대마왕!" },
];

const MATCH_SETUP: (PieceData | null)[] = [
  { emoji: '♜', type: 'rook', color: 'black', desc: "흑색 룩" }, { emoji: '♞', type: 'knight', color: 'black', desc: "흑색 나이트" }, { emoji: '♝', type: 'bishop', color: 'black', desc: "흑색 비숍" }, { emoji: '♛', type: 'queen', color: 'black', desc: "흑색 퀸" }, { emoji: '♚', type: 'king', color: 'black', desc: "흑색 킹" }, { emoji: '♝', type: 'bishop', color: 'black', desc: "흑색 비숍" }, { emoji: '♞', type: 'knight', color: 'black', desc: "흑색 나이트" }, { emoji: '♜', type: 'rook', color: 'black', desc: "흑색 룩" },
  ...makePawns('black').map(p => ({ ...p, desc: "흑색 폰" })),
  ...Array(32).fill(null),
  ...makePawns('white').map(p => ({ ...p, desc: "백색 폰" })),
  { emoji: '♖', type: 'rook', color: 'white', desc: "백색 룩" }, { emoji: '♘', type: 'knight', color: 'white', desc: "백색 나이트" }, { emoji: '♗', type: 'bishop', color: 'white', desc: "백색 비숍" }, { emoji: '♕', type: 'queen', color: 'white', desc: "백색 퀸" }, { emoji: '♔', type: 'king', color: 'white', desc: "백색 킹" }, { emoji: '♗', type: 'bishop', color: 'white', desc: "백색 비숍" }, { emoji: '♘', type: 'knight', color: 'white', desc: "백색 나이트" }, { emoji: '♖', type: 'rook', color: 'white', desc: "백색 룩" }
];

export default function App() {
  const [boardState, setBoardState] = useState<(PieceData | null)[]>(Array(64).fill(null));
  const [selectedSquareIndex, setSelectedSquareIndex] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [captureMoves, setCaptureMoves] = useState<number[]>([]);
  const [status, setStatus] = useState<string>("모드를 선택해 주세요!");
  const [tutorialText, setTutorialText] = useState<string>("모드를 선택해 주세요!");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [promotionData, setPromotionData] = useState<{ from: number; to: number; color: PieceColor } | null>(null);
  const [capturedIndex, setCapturedIndex] = useState<number | null>(null);
  
  const [currentMode, setCurrentMode] = useState<'tutorial' | 'match' | null>(null);
  const [difficulty, setDifficulty] = useState<'level1' | 'level2' | 'level3' | 'level4' | 'level5' | null>(null);
  const [turn, setTurn] = useState<PieceColor>('white');
  const [showMenu, setShowMenu] = useState(true);
  const [showDifficulty, setShowDifficulty] = useState(false);
  
  const [currentVideoId, setCurrentVideoId] = useState('iQIkgz9P-nM');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const captureSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fitBoard = () => {
      if (!containerRef.current) return;
      const root = document.documentElement;
      const title = containerRef.current.querySelector('.game-title') as HTMLElement;
      const controls = containerRef.current.querySelector('.music-controls') as HTMLElement;
      const tutBox = containerRef.current.querySelector('.tutorial-box') as HTMLElement;
      const statusText = containerRef.current.querySelector('.game-status') as HTMLElement;

      const uiHeight = (title?.offsetHeight || 0) + 
                       (controls?.offsetHeight || 0) + 
                       (tutBox?.offsetHeight || 0) + 
                       (statusText?.offsetHeight || 0) + 60; 
      
      const availableHeight = window.innerHeight - uiHeight;
      const availableWidth = window.innerWidth * 0.95;

      const size = Math.floor(Math.min(availableWidth, availableHeight));
      root.style.setProperty('--board-size', `${size}px`);
    };

    window.addEventListener('resize', fitBoard);
    fitBoard();

    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: currentVideoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          'autoplay': 0,
          'loop': 1,
          'playlist': currentVideoId
        }
      });
    };

    // Initialize capture sound
    captureSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3');

    return () => window.removeEventListener('resize', fitBoard);
  }, []);

  const handleMusicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVideoId = e.target.value;
    setCurrentVideoId(newVideoId);
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(newVideoId);
      setIsPlaying(true);
    }
  };

  const toggleBGM = () => {
    // 구구단송 버튼을 누를 때, '팡!' 소리 스피커도 같이 전원을 켜줍니다! (아이패드 필수 보안 통과 로직)
    captureSoundRef.current?.load();

    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const calculateValidMoves = useCallback((index: number, type: PieceType, color: PieceColor, currentBoard: (PieceData | null)[]) => {
    const moves: number[] = [];
    const caps: number[] = [];
    const row = Math.floor(index / 8);
    const col = index % 8;
    const isValid = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

    const register = (nr: number, nc: number) => {
      if (!isValid(nr, nc)) return false;
      const targetIndex = nr * 8 + nc;
      const pieceAtNext = currentBoard[targetIndex];
      if (!pieceAtNext) {
        moves.push(targetIndex);
        return true;
      }
      if (pieceAtNext.color !== color) {
        caps.push(targetIndex);
      }
      return false;
    };

    if (type === 'rook' || type === 'bishop' || type === 'queen') {
      const directions: [number, number][] = [];
      if (type === 'rook' || type === 'queen') directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      if (type === 'bishop' || type === 'queen') directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);

      directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!register(row + dr * i, col + dc * i)) break;
        }
      });
    }

    if (type === 'knight') {
      const jumps: [number, number][] = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      jumps.forEach(([dr, dc]) => register(row + dr, col + dc));
    }

    if (type === 'king') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          register(row + dr, col + dc);
        }
      }
    }

    if (type === 'pawn') {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      
      if (isValid(row + dir, col) && !currentBoard[(row + dir) * 8 + col]) {
        moves.push((row + dir) * 8 + col);
        if (row === startRow && !currentBoard[(row + dir * 2) * 8 + col]) {
          moves.push((row + dir * 2) * 8 + col);
        }
      }

      [-1, 1].forEach(dc => {
        const nr = row + dir;
        const nc = col + dc;
        if (isValid(nr, nc)) {
          const target = currentBoard[nr * 8 + nc];
          if (target && target.color !== color) {
            caps.push(nr * 8 + nc);
          }
        }
      });
    }
    return { moves, caps };
  }, []);

  const resetGame = () => {
    setShowMenu(true);
    setShowDifficulty(false);
    setCurrentMode(null);
    setDifficulty(null);
    setBoardState(Array(64).fill(null));
    setSelectedSquareIndex(null);
    setValidMoves([]);
    setCaptureMoves([]);
    setPromotionData(null);
    setCapturedIndex(null);
    setStatus("모드를 선택해 주세요!");
    setTutorialText("모드를 선택해 주세요!");
    setGameOver(false);
    setTurn('white');
  };

  const startTutorial = () => {
    setCurrentMode('tutorial');
    setShowMenu(false);
    setBoardState(JSON.parse(JSON.stringify(TUTORIAL_SETUP)));
    setTurn('white');
    setTutorialText("연습 모드! 하얀 팀도, 검은 팀도 다 만져볼 수 있어!");
    setStatus("말을 터치해서 움직여보세요!");
  };

  const startMatch = (diff: 'level1' | 'level2' | 'level3' | 'level4' | 'level5') => {
    setCurrentMode('match');
    setDifficulty(diff);
    setShowMenu(false);
    setBoardState(JSON.parse(JSON.stringify(MATCH_SETUP)));
    setTurn('white');
    setTutorialText(`컴퓨터랑 대결! 아들 차례니까 하얀 팀 먼저!`);
    setStatus("아들 차례입니다! 멋지게 공격해봐요!");
  };

  const computerMove = useCallback((currentBoard: (PieceData | null)[]) => {
    const PIECE_VALUE: Record<string, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };

    let allPossibleMoves: { from: number; to: number; captureValue: number; isCapture: boolean }[] = [];
    for (let i = 0; i < 64; i++) {
      if (currentBoard[i] && currentBoard[i]?.color === 'black') {
        const { moves, caps } = calculateValidMoves(i, currentBoard[i]!.type, 'black', currentBoard);
        moves.forEach(toIdx => {
          allPossibleMoves.push({ from: i, to: toIdx, captureValue: 0, isCapture: false });
        });
        caps.forEach(toIdx => {
          const targetPiece = currentBoard[toIdx];
          const captureValue = targetPiece ? PIECE_VALUE[targetPiece.type] || 0 : 0;
          allPossibleMoves.push({ from: i, to: toIdx, captureValue, isCapture: true });
        });
      }
    }

    if (allPossibleMoves.length === 0) {
      setTutorialText("컴퓨터가 움직일 곳이 없어요! 백색 승리!");
      return;
    }

    let chosenMove: { from: number; to: number; isCapture: boolean } | null = null;

    if (difficulty === 'level1') {
      // 1단계: 완전 랜덤
      chosenMove = allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
    } else if (difficulty === 'level2') {
      // 2단계: 가끔 먹기 (50% 확률)
      const captures = allPossibleMoves.filter(m => m.isCapture);
      if (captures.length > 0 && Math.random() > 0.5) {
        chosenMove = captures[Math.floor(Math.random() * captures.length)];
      } else {
        chosenMove = allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
      }
    } else if (difficulty === 'level3') {
      // 3단계: 무조건 제일 비싼 거 먹기
      const maxValue = Math.max(...allPossibleMoves.map(m => m.captureValue));
      const bestCaptures = allPossibleMoves.filter(m => m.captureValue === maxValue);
      chosenMove = bestCaptures[Math.floor(Math.random() * bestCaptures.length)];
    } else if (difficulty === 'level4') {
      // 4단계: 먹기 + 중앙 차지하기
      const scoredMoves = allPossibleMoves.map(m => {
        const r = Math.floor(m.to / 8);
        const c = m.to % 8;
        const centerBonus = 7 - (Math.abs(r - 3.5) + Math.abs(c - 3.5));
        return { ...m, score: (m.captureValue * 10) + centerBonus };
      });
      const maxScore = Math.max(...scoredMoves.map(m => m.score));
      const best = scoredMoves.filter(m => m.score === maxScore);
      chosenMove = best[Math.floor(Math.random() * best.length)];
    } else if (difficulty === 'level5') {
      // 5단계: 예언자 (죽을 자리 피하기 + 먹기 + 중앙)
      const scoredMoves = allPossibleMoves.map(m => {
        const r = Math.floor(m.to / 8);
        const c = m.to % 8;
        const centerBonus = 7 - (Math.abs(r - 3.5) + Math.abs(c - 3.5));
        let score = (m.captureValue * 10) + centerBonus;

        // 가상 보드에서 시뮬레이션 (원본 boardState 절대 변경 안 함)
        const sim = [...currentBoard];
        sim[m.to] = sim[m.from];
        sim[m.from] = null;

        for (let j = 0; j < 64; j++) {
          if (sim[j] && sim[j]?.color === 'white') {
            const { moves: wm, caps: wc } = calculateValidMoves(j, sim[j]!.type, 'white', sim);
            if ([...wm, ...wc].includes(m.to)) {
              score -= 50;
              break;
            }
          }
        }

        return { ...m, score };
      });

      const maxScore = Math.max(...scoredMoves.map(m => m.score));
      const best = scoredMoves.filter(m => m.score === maxScore);
      chosenMove = best[Math.floor(Math.random() * best.length)];
    }

    if (chosenMove) {
      const from = chosenMove.from;
      const to = chosenMove.to;
      
      setTimeout(() => {
        const movingPiece = currentBoard[from];
        if (movingPiece) {
          const newBoard = [...currentBoard];
          const capturedPiece = newBoard[to];
          
          if (capturedPiece) {
            setCapturedIndex(to);
            captureSoundRef.current?.play();
          }

          newBoard[to] = movingPiece;
          newBoard[from] = null;

          // 폰 승진 로직 (컴퓨터는 항상 퀸)
          if (movingPiece.type === 'pawn' && (to < 8 || to >= 56)) {
            newBoard[to] = {
              ...movingPiece,
              type: 'queen',
              emoji: movingPiece.color === 'white' ? '♕' : '♛',
              desc: "내가 바로 '여왕'! 어디든 갈 수 있어!"
            };
          }

          setBoardState(newBoard);
          
          setTimeout(() => {
            setCapturedIndex(null);
            if (capturedPiece) {
              setStatus(`얍! 적군 ${capturedPiece.emoji}을(를) 물리쳤어요!`);
              if (capturedPiece.type === 'king') {
                setGameOver(true);
                const winner = movingPiece.color === 'white' ? '하얀 팀(아들)' : '검은 팀(컴퓨터)';
                setStatus(`🎉 게임 종료! ${winner} 승리! 🎉`);
                setTutorialText(`체크메이트! ${winner}이 이겼습니다!`);
                return;
              }
            } else {
              setStatus(`스르륵~ 이동 완료!`);
            }
            setTurn('white');
            setTutorialText("아들 차례입니다! 멋지게 공격해봐요!");
          }, 300);
        }
      }, 800);
    }
  }, [difficulty, calculateValidMoves]);

  const handleSquareClick = (index: number) => {
    if (gameOver || showMenu || promotionData) return;
    if (currentMode === 'match' && turn !== 'white') return;

    const clickedPiece = boardState[index];

    if (selectedSquareIndex !== null) {
      if (index === selectedSquareIndex) {
        setSelectedSquareIndex(null);
        setValidMoves([]);
        setCaptureMoves([]);
        setStatus("선택 취소");
        setTutorialText("다른 체스 친구를 선택해 보세요!");
      } else if (clickedPiece && clickedPiece.color === boardState[selectedSquareIndex]?.color) {
        setSelectedSquareIndex(index);
        setTutorialText(currentMode === 'tutorial' ? clickedPiece.desc : "어디로 이동할까요?");
        setStatus(`어디로 갈까요? 초록색 길을 터치하세요!`);
        const { moves, caps } = calculateValidMoves(index, clickedPiece.type, clickedPiece.color, boardState);
        setValidMoves(moves);
        setCaptureMoves(caps);
      } else if (validMoves.includes(index) || captureMoves.includes(index)) {
        const from = selectedSquareIndex;
        const to = index;
        const movingPiece = boardState[from];
        
        if (movingPiece) {
          const capturedPiece = boardState[to];
          
          const finalizeMove = (promotedPiece?: PieceData) => {
            const newBoard = [...boardState];
            if (capturedPiece) {
              setCapturedIndex(to);
              captureSoundRef.current?.play();
            }
            
            newBoard[to] = promotedPiece || movingPiece;
            newBoard[from] = null;
            setBoardState(newBoard);

            setTimeout(() => {
              setCapturedIndex(null);
              if (capturedPiece) {
                setStatus(`얍! ${capturedPiece.emoji}를 물리쳤어요!`);
                if (capturedPiece.type === 'king' && currentMode === 'match') {
                  setGameOver(true);
                  const winner = movingPiece.color === 'white' ? '하얀 팀(아들)' : '검은 팀(컴퓨터)';
                  setStatus(`🎉 게임 종료! ${winner} 승리! 🎉`);
                  setTutorialText(`체크메이트! ${winner}이 이겼습니다!`);
                  return;
                }
              } else {
                setStatus(`스르륵~ 이동 완료!`);
              }

              if (currentMode === 'match') {
                setTurn('black');
                setTutorialText("컴퓨터 로봇이 생각 중입니다... 🤔");
                computerMove(newBoard);
              } else {
                setTutorialText("연습 모드! 하얀 팀도, 검은 팀도 다 만져볼 수 있어!");
              }
            }, 300);
          };

          if (movingPiece.type === 'pawn' && (to < 8 || to >= 56)) {
            setPromotionData({ from, to, color: movingPiece.color });
          } else {
            finalizeMove();
          }
        }
        setSelectedSquareIndex(null);
        setValidMoves([]);
        setCaptureMoves([]);
      } else {
        setTutorialText("앗, 거기는 갈 수 없는 길이야! 초록색 불빛을 따라가봐!");
      }
    } else {
      if (clickedPiece) {
        if (currentMode === 'match' && clickedPiece.color !== 'white') {
          setTutorialText("지금은 아들 차례니까 하얀 말만!");
          return;
        }

        setSelectedSquareIndex(index);
        setTutorialText(currentMode === 'tutorial' ? clickedPiece.desc : "어디로 이동할까요?");
        setStatus(`어디로 갈까요? 초록색 길을 터치하세요!`);
        const { moves, caps } = calculateValidMoves(index, clickedPiece.type, clickedPiece.color, boardState);
        setValidMoves(moves);
        setCaptureMoves(caps);
      }
    }
  };

  const handlePromotion = (type: PieceType, emoji: string) => {
    if (!promotionData) return;
    const { from, to, color } = promotionData;
    const promotedPiece: PieceData = {
      type,
      emoji,
      color,
      desc: color === 'white' ? `하얀 ${type}` : `검은 ${type}`
    };
    
    const capturedPiece = boardState[to];
    const newBoard = [...boardState];
    
    if (capturedPiece) {
      setCapturedIndex(to);
      captureSoundRef.current?.play();
    }
    
    newBoard[to] = promotedPiece;
    newBoard[from] = null;
    setBoardState(newBoard);
    setPromotionData(null);

    setTimeout(() => {
      setCapturedIndex(null);
      if (capturedPiece) {
        setStatus(`얍! ${capturedPiece.emoji}를 물리쳤어요!`);
        if (capturedPiece.type === 'king' && currentMode === 'match') {
          setGameOver(true);
          const winner = color === 'white' ? '하얀 팀(아들)' : '검은 팀(컴퓨터)';
          setStatus(`🎉 게임 종료! ${winner} 승리! 🎉`);
          setTutorialText(`체크메이트! ${winner}이 이겼습니다!`);
          return;
        }
      } else {
        setStatus(`스르륵~ 이동 완료!`);
      }

      if (currentMode === 'match') {
        setTurn('black');
        setTutorialText("컴퓨터 로봇이 생각 중입니다... 🤔");
        computerMove(newBoard);
      } else {
        setTutorialText("연습 모드! 하얀 팀도, 검은 팀도 다 만져볼 수 있어!");
      }
    }, 300);
  };

  return (
    <div className="lego-chess-container" ref={containerRef}>
      <h1 className="game-title">레고 체스 마스터</h1>
      
      <div className="music-controls">
        <select 
          id="bgm-select" 
          className="bgm-select"
          value={currentVideoId}
          onChange={handleMusicChange}
        >
          <option value="iQIkgz9P-nM">🎵 신나는 구구단송</option>
          <option value="SEwmVVhlqyg">🎻 똑똑해지는 모차르트</option>
        </select>
        <button 
          onClick={toggleBGM}
          className={`bgm-btn ${isPlaying ? 'bg-[#4CAF50]' : ''}`}
        >
          {isPlaying ? '🔇 음악 끄기' : '▶️ 음악 켜기'}
        </button>
        {(gameOver || !showMenu) && (
          <button 
            onClick={resetGame}
            className="bgm-btn bg-[#1976d2]"
          >
            🔄 메뉴로 가기
          </button>
        )}
      </div>
      
      <div id="youtube-player" className="hidden"></div>

      <div className="lego-board">
        {promotionData && (
          <div className="promo-overlay">
            <div className="promo-box">
              <div className="promo-title">🎉 폰 승진! 어떤 말로 바꿀까요?</div>
              <div className="promo-pieces">
                {[
                  { type: 'queen', emoji: promotionData.color === 'white' ? '♕' : '♛' },
                  { type: 'rook', emoji: promotionData.color === 'white' ? '♖' : '♜' },
                  { type: 'bishop', emoji: promotionData.color === 'white' ? '♗' : '♝' },
                  { type: 'knight', emoji: promotionData.color === 'white' ? '♘' : '♞' },
                ].map((p) => (
                  <button 
                    key={p.type}
                    className="promo-piece-btn" 
                    onClick={() => handlePromotion(p.type as PieceType, p.emoji)}
                  >
                    {p.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {showMenu && (
          <div className="menu-overlay">
            <div className="menu-title">어떤 모드로 해볼까?</div>
            {!showDifficulty ? (
              <>
                <button className="menu-btn" onClick={startTutorial}>1. 튜토리얼 (혼자 연습하기)</button>
                <button className="menu-btn" onClick={() => setShowDifficulty(true)}>2. 컴퓨터랑 대결하기</button>
              </>
            ) : (
              <div className="diff-container">
                <button className="diff-btn bg-[#8bc34a]" onClick={() => startMatch('level1')}>1단계: 입문 (랜덤 로봇)</button>
                <button className="diff-btn bg-[#ffca28] !text-[#333]" onClick={() => startMatch('level2')}>2단계: 초급 (변덕쟁이)</button>
                <button className="diff-btn bg-[#ff9800]" onClick={() => startMatch('level3')}>3단계: 중급 (먹보 로봇)</button>
                <button className="diff-btn bg-[#f44336]" onClick={() => startMatch('level4')}>4단계: 고급 (전략가 로봇)</button>
                <button className="diff-btn bg-[#9c27b0]" onClick={() => startMatch('level5')}>5단계: 마스터 (예언자 로봇)</button>
                <button className="menu-btn mt-4" onClick={() => setShowDifficulty(false)}>뒤로 가기</button>
              </div>
            )}
          </div>
        )}
        {Array.from({ length: 64 }).map((_, index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isDark = (row + col) % 2 !== 0;
          const isSelected = selectedSquareIndex === index;
          const isValidMove = validMoves.includes(index);
          const isCaptureMove = captureMoves.includes(index);
          const isBeingCaptured = capturedIndex === index;
          const piece = boardState[index];

          return (
            <div
              key={index}
              onClick={() => handleSquareClick(index)}
              className={`square ${isDark ? 'dark-square' : 'light-square'} ${isValidMove ? 'valid-move' : ''} ${isCaptureMove ? 'capture-move' : ''}`}
            >
              <AnimatePresence>
                {piece && (
                  <motion.div
                    key={`${piece.type}-${piece.color}-${index}`}
                    layoutId={`piece-${piece.type}-${piece.color}-${index}`}
                    className={`piece ${isSelected ? 'selected' : ''} ${isBeingCaptured ? 'being-captured' : ''}`}
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{
                      scale: 1,
                      rotate: 0,
                      opacity: 1,
                      transform: `translate(0, 0)`,
                    }}
                    exit={{ scale: 0, rotate: 360, opacity: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 30,
                      opacity: { duration: 0.2 }
                    }}
                  >
                    {piece.emoji}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="game-status text-[3vmin] text-[#333] mt-[1vh] font-bold">{status}</p>
      
      <div className="tutorial-box">
        {tutorialText}
      </div>
    </div>
  );
}
