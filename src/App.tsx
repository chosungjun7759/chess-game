/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PieceColor = 'white' | 'black';

interface PieceData {
  emoji: string;
  type: PieceType;
  color: PieceColor;
  desc: string;
}

const INITIAL_BOARD: (PieceData | null)[] = [
  { emoji: '♜', type: 'rook', color: 'black', desc: "난 성벽 전차 '룩'! 앞, 뒤, 양옆으로 끝까지 쌩~ 달릴 수 있어!" },
  { emoji: '♞', type: 'knight', color: 'black', desc: "난 기사 '나이트'! 점프력이 최고지. 'L'자 모양으로 훌쩍 뛸 거야!" },
  { emoji: '♝', type: 'bishop', color: 'black', desc: "난 마법사 '비숍'! X자 모양(대각선)으로만 스르륵 날아다녀." },
  { emoji: '♛', type: 'queen', color: 'black', desc: "내가 바로 '여왕'! 앞, 뒤, 양옆, 대각선 어디든 마음대로 갈 수 있는 슈퍼 파워!" },
  { emoji: '♚', type: 'king', color: 'black', desc: "에헴, 난 대장 '킹'이다. 느려서 모든 방향으로 1칸씩만 갈 수 있지." },
  { emoji: '♝', type: 'bishop', color: 'black', desc: "난 마법사 '비숍'! X자 모양(대각선)으로만 스르륵 날아다녀." },
  { emoji: '♞', type: 'knight', color: 'black', desc: "난 기사 '나이트'! 점프력이 최고지. 'L'자 모양으로 훌쩍 뛸 거야!" },
  { emoji: '♜', type: 'rook', color: 'black', desc: "난 성벽 전차 '룩'! 앞, 뒤, 양옆으로 끝까지 쌩~ 달릴 수 있어!" },
  { emoji: '♟', type: 'pawn', color: 'black', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♟', type: 'pawn', color: 'black', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♟', type: 'pawn', color: 'black', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♟', type: 'pawn', color: 'black', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♟', type: 'pawn', color: 'black', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♟', type: 'pawn', color: 'black', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♟', type: 'pawn', color: 'black', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♟', type: 'pawn', color: 'black', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  ...Array(32).fill(null),
  { emoji: '♙', type: 'pawn', color: 'white', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♙', type: 'pawn', color: 'white', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♙', type: 'pawn', color: 'white', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♙', type: 'pawn', color: 'white', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♙', type: 'pawn', color: 'white', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♙', type: 'pawn', color: 'white', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♙', type: 'pawn', color: 'white', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♙', type: 'pawn', color: 'white', desc: "난 꼬마 병사 '폰'! 무조건 앞으로만 1칸씩! (처음엔 2칸도 가능해!)" },
  { emoji: '♖', type: 'rook', color: 'white', desc: "난 성벽 전차 '룩'! 앞, 뒤, 양옆으로 끝까지 쌩~ 달릴 수 있어!" },
  { emoji: '♘', type: 'knight', color: 'white', desc: "난 기사 '나이트'! 점프력이 최고지. 'L'자 모양으로 훌쩍 뛸 거야!" },
  { emoji: '♗', type: 'bishop', color: 'white', desc: "난 마법사 '비숍'! X자 모양(대각선)으로만 스르륵 날아다녀." },
  { emoji: '♕', type: 'queen', color: 'white', desc: "내가 바로 '여왕'! 앞, 뒤, 양옆, 대각선 어디든 마음대로 갈 수 있는 슈퍼 파워!" },
  { emoji: '♔', type: 'king', color: 'white', desc: "에헴, 난 대장 '킹'이다. 느려서 모든 방향으로 1칸씩만 갈 수 있지." },
  { emoji: '♗', type: 'bishop', color: 'white', desc: "난 마법사 '비숍'! X자 모양(대각선)으로만 스르륵 날아다녀." },
  { emoji: '♘', type: 'knight', color: 'white', desc: "난 기사 '나이트'! 점프력이 최고지. 'L'자 모양으로 훌쩍 뛸 거야!" },
  { emoji: '♖', type: 'rook', color: 'white', desc: "난 성벽 전차 '룩'! 앞, 뒤, 양옆으로 끝까지 쌩~ 달릴 수 있어!" },
];

export default function App() {
  const [boardState, setBoardState] = useState<(PieceData | null)[]>(INITIAL_BOARD);
  const [selectedSquareIndex, setSelectedSquareIndex] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [status, setStatus] = useState<string>("말을 터치해서 움직여보세요!");
  const [tutorialText, setTutorialText] = useState<string>("안녕! 나는 체스 요정이야. 궁금한 레고 친구를 터치해 봐!");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const playerRef = useRef<any>(null);
  const captureSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: 'iQIkgz9P-nM',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          'autoplay': 0,
          'loop': 1,
          'playlist': 'iQIkgz9P-nM'
        }
      });
    };

    // Initialize capture sound
    captureSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3');
  }, []);

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
    const row = Math.floor(index / 8);
    const col = index % 8;
    const isValid = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

    if (type === 'rook' || type === 'bishop' || type === 'queen') {
      const directions: [number, number][] = [];
      if (type === 'rook' || type === 'queen') directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      if (type === 'bishop' || type === 'queen') directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);

      directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          const nextRow = row + dr * i;
          const nextCol = col + dc * i;
          if (!isValid(nextRow, nextCol)) break;

          const nextIndex = nextRow * 8 + nextCol;
          const pieceAtNext = currentBoard[nextIndex];

          if (!pieceAtNext) {
            moves.push(nextIndex);
          } else {
            if (pieceAtNext.color !== color) {
              moves.push(nextIndex);
            }
            break;
          }
        }
      });
    }

    if (type === 'knight') {
      const jumps: [number, number][] = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      jumps.forEach(([dr, dc]) => {
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (isValid(nextRow, nextCol)) {
          const nextIndex = nextRow * 8 + nextCol;
          const pieceAtNext = currentBoard[nextIndex];
          if (!pieceAtNext || pieceAtNext.color !== color) moves.push(nextIndex);
        }
      });
    }

    if (type === 'king') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (isValid(nextRow, nextCol)) {
            const nextIndex = nextRow * 8 + nextCol;
            const pieceAtNext = currentBoard[nextIndex];
            if (!pieceAtNext || pieceAtNext.color !== color) moves.push(nextIndex);
          }
        }
      }
    }

    if (type === 'pawn') {
      const dir = color === 'white' ? -1 : 1;
      const isValidPawnForward = (r: number, c: number) => isValid(r, c) && !currentBoard[r * 8 + c];

      if (isValidPawnForward(row + dir, col)) {
        const forwardIndex = (row + dir) * 8 + col;
        moves.push(forwardIndex);

        if ((color === 'white' && row === 6) || (color === 'black' && row === 1)) {
          if (isValidPawnForward(row + dir * 2, col)) moves.push((row + dir * 2) * 8 + col);
        }
      }

      const isValidPawnCapture = (r: number, c: number) => isValid(r, c) && currentBoard[r * 8 + c] && currentBoard[r * 8 + c]?.color !== color;
      if (isValidPawnCapture(row + dir, col - 1)) moves.push((row + dir) * 8 + col - 1);
      if (isValidPawnCapture(row + dir, col + 1)) moves.push((row + dir) * 8 + col + 1);
    }
    return moves;
  }, []);

  const resetGame = () => {
    setBoardState(INITIAL_BOARD);
    setSelectedSquareIndex(null);
    setValidMoves([]);
    setStatus("말을 터치해서 움직여보세요!");
    setTutorialText("안녕! 나는 체스 요정이야. 궁금한 레고 친구를 터치해 봐!");
    setGameOver(false);
  };

  const handleSquareClick = (index: number) => {
    if (gameOver) return;

    const clickedPiece = boardState[index];

    if (selectedSquareIndex !== null) {
      if (index === selectedSquareIndex) {
        setSelectedSquareIndex(null);
        setValidMoves([]);
        setStatus("선택 취소");
        setTutorialText("다른 체스 친구를 선택해 보세요!");
      } else if (validMoves.includes(index)) {
        const movingPiece = boardState[selectedSquareIndex];
        if (movingPiece) {
          const newBoard = [...boardState];
          const capturedPiece = newBoard[index];
          
          newBoard[index] = movingPiece;
          newBoard[selectedSquareIndex] = null;
          setBoardState(newBoard);
          
          if (capturedPiece) {
            captureSoundRef.current?.play();
            setStatus(`얍! ${capturedPiece.emoji}를 물리쳤어요!`);
            
            if (capturedPiece.type === 'king') {
              setGameOver(true);
              setStatus(`축하합니다! ${movingPiece.color === 'white' ? '하얀' : '까만'} 팀이 승리했어요!`);
              setTutorialText("대단해! 왕을 잡아서 게임이 끝났어. 다시 하려면 아래 버튼을 눌러줘!");
            }
          } else {
            setStatus(`스르륵~ 이동 완료!`);
          }
        }
        setSelectedSquareIndex(null);
        setValidMoves([]);
      } else {
        setTutorialText("앗, 거기는 갈 수 없는 길이야! 초록색 불빛을 따라가봐!");
      }
    } else {
      if (clickedPiece) {
        setSelectedSquareIndex(index);
        setTutorialText(clickedPiece.desc);
        setStatus(`어디로 갈까요? 초록색 길을 터치하세요!`);
        const moves = calculateValidMoves(index, clickedPiece.type, clickedPiece.color, boardState);
        setValidMoves(moves);
      }
    }
  };

  return (
    <div className="lego-chess-container flex flex-col items-center">
      <h1 className="game-title text-[5vmin] text-lego-red mb-[1vh]">레고 체스 튜토리얼</h1>
      
      <div className="flex gap-2 mb-[1vh]">
        <button 
          onClick={toggleBGM}
          className={`bgm-btn px-[3vmin] py-[1vmin] text-[2.5vmin] font-comic text-white rounded-[2vmin] shadow-md transition-colors ${isPlaying ? 'bg-[#4CAF50]' : 'bg-lego-red'}`}
        >
          {isPlaying ? '🔇 구구단송 끄기' : '🎵 신나는 구구단송 켜기'}
        </button>
        {gameOver && (
          <button 
            onClick={resetGame}
            className="bg-blue-500 hover:bg-blue-600 px-[3vmin] py-[1vmin] text-[2.5vmin] font-comic text-white rounded-[2vmin] shadow-md transition-colors"
          >
            🔄 다시 하기
          </button>
        )}
      </div>
      
      <div id="youtube-player" className="hidden"></div>

      <div className="lego-board">
        {Array.from({ length: 64 }).map((_, index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isDark = (row + col) % 2 !== 0;
          const isSelected = selectedSquareIndex === index;
          const isValidMove = validMoves.includes(index);
          const piece = boardState[index];

          return (
            <div
              key={index}
              onClick={() => handleSquareClick(index)}
              className={`square ${isDark ? 'dark-square' : 'light-square'} ${isValidMove ? 'valid-move' : ''}`}
            >
              <AnimatePresence>
                {piece && (
                  <motion.div
                    key={`${piece.type}-${piece.color}-${index}`}
                    layoutId={`piece-${piece.type}-${piece.color}-${index}`}
                    className={`piece ${isSelected ? 'selected' : ''}`}
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{
                      scale: isSelected ? 1.15 : 1,
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
      
      <div className="tutorial-box mt-[1.5vh] p-[2vmin] bg-[#fffde7] border-[0.5vmin] border-dashed border-lego-yellow rounded-[2vmin] text-[2.5vmin] text-center w-[90%] min-h-[6vh] shadow-sm text-[#333]">
        {tutorialText}
      </div>
    </div>
  );
}
