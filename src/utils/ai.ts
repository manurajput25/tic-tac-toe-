import { CellValue, Player, WinningLine, GameMode, BotDifficulty } from '../types/game';

// Check win condition for 3x3
export function checkWin3x3(board: CellValue[]): WinningLine | null {
  const lines: { indices: number[]; direction: WinningLine['direction']; rowOrCol?: number }[] = [
    // Rows
    { indices: [0, 1, 2], direction: 'horizontal', rowOrCol: 0 },
    { indices: [3, 4, 5], direction: 'horizontal', rowOrCol: 1 },
    { indices: [6, 7, 8], direction: 'horizontal', rowOrCol: 2 },
    // Columns
    { indices: [0, 3, 6], direction: 'vertical', rowOrCol: 0 },
    { indices: [1, 4, 7], direction: 'vertical', rowOrCol: 1 },
    { indices: [2, 5, 8], direction: 'vertical', rowOrCol: 2 },
    // Diagonals
    { indices: [0, 4, 8], direction: 'diagonal-main' },
    { indices: [2, 4, 6], direction: 'diagonal-anti' },
  ];

  for (const line of lines) {
    const [a, b, c] = line.indices;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }

  return null;
}

// Check win condition for 4x4 (4 in a row to win)
export function checkWin4x4(board: CellValue[]): WinningLine | null {
  const lines: { indices: number[]; direction: WinningLine['direction']; rowOrCol?: number }[] = [];

  // Rows
  for (let r = 0; r < 4; r++) {
    lines.push({
      indices: [r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3],
      direction: 'horizontal',
      rowOrCol: r,
    });
  }

  // Columns
  for (let c = 0; c < 4; c++) {
    lines.push({
      indices: [c, c + 4, c + 8, c + 12],
      direction: 'vertical',
      rowOrCol: c,
    });
  }

  // Diagonals
  lines.push({ indices: [0, 5, 10, 15], direction: 'diagonal-main' });
  lines.push({ indices: [3, 6, 9, 12], direction: 'diagonal-anti' });

  for (const line of lines) {
    const [a, b, c, d] = line.indices;
    if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d]) {
      return line;
    }
  }

  return null;
}

// Check win condition for 6x6 (4 in a row to win on a 36-cell grid)
export function checkWin6x6(board: CellValue[]): WinningLine | null {
  const lines: { indices: number[]; direction: WinningLine['direction']; rowOrCol?: number }[] = [];

  // Rows (4 consecutive in each row)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c <= 2; c++) {
      lines.push({
        indices: [r * 6 + c, r * 6 + c + 1, r * 6 + c + 2, r * 6 + c + 3],
        direction: 'horizontal',
        rowOrCol: r,
      });
    }
  }

  // Columns (4 consecutive in each column)
  for (let c = 0; c < 6; c++) {
    for (let r = 0; r <= 2; r++) {
      lines.push({
        indices: [r * 6 + c, (r + 1) * 6 + c, (r + 2) * 6 + c, (r + 3) * 6 + c],
        direction: 'vertical',
        rowOrCol: c,
      });
    }
  }

  // Diagonals down-right (\)
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c <= 2; c++) {
      lines.push({
        indices: [
          r * 6 + c,
          (r + 1) * 6 + c + 1,
          (r + 2) * 6 + c + 2,
          (r + 3) * 6 + c + 3,
        ],
        direction: 'diagonal-main',
      });
    }
  }

  // Diagonals down-left (/)
  for (let r = 0; r <= 2; r++) {
    for (let c = 3; c < 6; c++) {
      lines.push({
        indices: [
          r * 6 + c,
          (r + 1) * 6 + c - 1,
          (r + 2) * 6 + c - 2,
          (r + 3) * 6 + c - 3,
        ],
        direction: 'diagonal-anti',
      });
    }
  }

  for (const line of lines) {
    const [a, b, c, d] = line.indices;
    if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d]) {
      return line;
    }
  }

  return null;
}

// Check win condition for 12x12 (6 in a row to win on a 144-cell grid)
const WINNING_LINES_12x12: { indices: number[]; direction: WinningLine['direction']; rowOrCol?: number }[] = (() => {
  const lines: { indices: number[]; direction: WinningLine['direction']; rowOrCol?: number }[] = [];
  // Rows (6 consecutive in each row)
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c <= 6; c++) {
      lines.push({
        indices: [
          r * 12 + c,
          r * 12 + c + 1,
          r * 12 + c + 2,
          r * 12 + c + 3,
          r * 12 + c + 4,
          r * 12 + c + 5,
        ],
        direction: 'horizontal',
        rowOrCol: r,
      });
    }
  }

  // Columns (6 consecutive in each column)
  for (let c = 0; c < 12; c++) {
    for (let r = 0; r <= 6; r++) {
      lines.push({
        indices: [
          r * 12 + c,
          (r + 1) * 12 + c,
          (r + 2) * 12 + c,
          (r + 3) * 12 + c,
          (r + 4) * 12 + c,
          (r + 5) * 12 + c,
        ],
        direction: 'vertical',
        rowOrCol: c,
      });
    }
  }

  // Diagonals down-right (\)
  for (let r = 0; r <= 6; r++) {
    for (let c = 0; c <= 6; c++) {
      lines.push({
        indices: [
          r * 12 + c,
          (r + 1) * 12 + c + 1,
          (r + 2) * 12 + c + 2,
          (r + 3) * 12 + c + 3,
          (r + 4) * 12 + c + 4,
          (r + 5) * 12 + c + 5,
        ],
        direction: 'diagonal-main',
      });
    }
  }

  // Diagonals down-left (/)
  for (let r = 0; r <= 6; r++) {
    for (let c = 5; c < 12; c++) {
      lines.push({
        indices: [
          r * 12 + c,
          (r + 1) * 12 + c - 1,
          (r + 2) * 12 + c - 2,
          (r + 3) * 12 + c - 3,
          (r + 4) * 12 + c - 4,
          (r + 5) * 12 + c - 5,
        ],
        direction: 'diagonal-anti',
      });
    }
  }

  return lines;
})();

export function checkWin12x12(board: CellValue[]): WinningLine | null {
  for (let i = 0; i < WINNING_LINES_12x12.length; i++) {
    const line = WINNING_LINES_12x12[i];
    const [a, b, c, d, e, f] = line.indices;
    const val = board[a];
    if (val && val === board[b] && val === board[c] && val === board[d] && val === board[e] && val === board[f]) {
      return line;
    }
  }
  return null;
}

export function checkWin(board: CellValue[], mode: GameMode): WinningLine | null {
  if (mode === 'grid12x12') {
    return checkWin12x12(board);
  }
  if (mode === 'grid6x6') {
    return checkWin6x6(board);
  }
  if (mode === 'grid4x4') {
    return checkWin4x4(board);
  }
  return checkWin3x3(board);
}

// Check if board is full (for classic modes)
export function isBoardFull(board: CellValue[]): boolean {
  return board.every(cell => cell !== null);
}

// Minimax algorithm for Classic 3x3
function minimax(
  board: CellValue[],
  depth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  humanPlayer: Player
): number {
  const win = checkWin3x3(board);
  if (win) {
    const winner = board[win.indices[0]];
    if (winner === aiPlayer) return 10 - depth;
    if (winner === humanPlayer) return depth - 10;
  }

  if (isBoardFull(board) || depth >= 7) {
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer;
        const score = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = humanPlayer;
        const score = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

// Find optimal move for 3x3
export function getBestMove3x3(
  board: CellValue[],
  aiPlayer: Player,
  difficulty: BotDifficulty = 'unbeatable'
): number {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  const availableMoves: number[] = [];

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) availableMoves.push(i);
  }

  if (availableMoves.length === 0) return -1;

  // Easy mode: 75% random, 25% take immediate win/block
  if (difficulty === 'easy') {
    if (Math.random() < 0.75) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // Medium mode: Take winning move or block opponent win, otherwise 50% minimax / 50% random
  if (difficulty === 'medium') {
    // 1. Can AI win?
    for (const move of availableMoves) {
      board[move] = aiPlayer;
      if (checkWin3x3(board)) {
        board[move] = null;
        return move;
      }
      board[move] = null;
    }
    // 2. Can Human win? Block them
    for (const move of availableMoves) {
      board[move] = humanPlayer;
      if (checkWin3x3(board)) {
        board[move] = null;
        return move;
      }
      board[move] = null;
    }
    if (Math.random() < 0.4) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // Master / Unbeatable: Full minimax
  // If first move and board is empty, pick center or random corner for variety
  if (availableMoves.length === 9) {
    const openings = [0, 2, 4, 6, 8];
    return openings[Math.floor(Math.random() * openings.length)];
  }

  let bestVal = -Infinity;
  let bestMove = availableMoves[0];

  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const moveVal = minimax(board, 0, false, aiPlayer, humanPlayer);
    board[move] = null;

    if (moveVal > bestVal) {
      bestVal = moveVal;
      bestMove = move;
    }
  }

  return bestMove;
}

// AI for Infinite 3-Piece Mode:
// Must take into account which piece will be deleted if player already has 3 pieces!
export function getBestMoveInfinite(
  board: CellValue[],
  aiHistory: number[],
  humanHistory: number[],
  aiPlayer: Player,
  difficulty: BotDifficulty = 'unbeatable'
): number {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  const availableMoves: number[] = [];

  for (let i = 0; i < 9; i++) {
    // Cannot play where a piece currently exists unless it's the piece that will be removed on this move
    if (board[i] === null) {
      availableMoves.push(i);
    }
  }

  if (availableMoves.length === 0) return -1;

  if (difficulty === 'easy' && Math.random() < 0.6) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 1. Direct win simulation:
  for (const move of availableMoves) {
    const simulatedBoard = [...board];
    if (aiHistory.length >= 3) {
      simulatedBoard[aiHistory[0]] = null;
    }
    simulatedBoard[move] = aiPlayer;
    if (checkWin3x3(simulatedBoard)) {
      return move;
    }
  }

  // 2. Direct block simulation (prevent human from winning on their next turn):
  for (const move of availableMoves) {
    const simulatedBoard = [...board];
    if (humanHistory.length >= 3) {
      simulatedBoard[humanHistory[0]] = null;
    }
    simulatedBoard[move] = humanPlayer;
    if (checkWin3x3(simulatedBoard)) {
      return move;
    }
  }

  // 3. Positional preference: Center (4) > Corners (0, 2, 6, 8) > Edges
  const weights = [3, 2, 3, 2, 4, 2, 3, 2, 3];
  let bestScore = -1;
  let bestMove = availableMoves[0];

  for (const move of availableMoves) {
    let score = weights[move] + Math.random() * 0.5;
    // Prefer moves that don't immediately forfeit center
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// AI for 4x4 Grid Mode
export function getBestMove4x4(
  board: CellValue[],
  aiPlayer: Player,
  difficulty: BotDifficulty = 'unbeatable'
): number {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  const availableMoves: number[] = [];

  for (let i = 0; i < 16; i++) {
    if (board[i] === null) availableMoves.push(i);
  }

  if (availableMoves.length === 0) return -1;

  // 1. Can AI win in one move?
  for (const move of availableMoves) {
    board[move] = aiPlayer;
    if (checkWin4x4(board)) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  // 2. Must AI block human immediate win?
  for (const move of availableMoves) {
    board[move] = humanPlayer;
    if (checkWin4x4(board)) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  // Easy / Medium variance
  if (difficulty === 'easy' && Math.random() < 0.7) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Central 2x2 square [5, 6, 9, 10] is most valuable in 4x4
  const centerMoves = [5, 6, 9, 10].filter(idx => board[idx] === null);
  if (centerMoves.length > 0 && Math.random() < 0.8) {
    return centerMoves[Math.floor(Math.random() * centerMoves.length)];
  }

  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

// AI Bot Move Generator for 6x6 Grid
export function getBestMove6x6(
  board: CellValue[],
  aiPlayer: Player,
  difficulty: BotDifficulty = 'unbeatable'
): number {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  const availableMoves: number[] = [];

  for (let i = 0; i < 36; i++) {
    if (board[i] === null) availableMoves.push(i);
  }

  if (availableMoves.length === 0) return -1;

  // 1. Can Gemini win in one move?
  for (const move of availableMoves) {
    board[move] = aiPlayer;
    if (checkWin6x6(board)) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  // 2. Must Gemini block human immediate win?
  for (const move of availableMoves) {
    board[move] = humanPlayer;
    if (checkWin6x6(board)) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  // Easy mode: random pick
  if (difficulty === 'easy' && Math.random() < 0.65) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 3. Central 4x4 inner zone (rows 1..4, cols 1..4) is high tactical value
  const innerCentralIndices = [
    7, 8, 9, 10,
    13, 14, 15, 16,
    19, 20, 21, 22,
    25, 26, 27, 28
  ];
  const centerMoves = innerCentralIndices.filter(idx => board[idx] === null);

  // Core 2x2 epicenter
  const coreEpicenter = [14, 15, 20, 21].filter(idx => board[idx] === null);
  if (coreEpicenter.length > 0 && Math.random() < 0.85) {
    return coreEpicenter[Math.floor(Math.random() * coreEpicenter.length)];
  }

  if (centerMoves.length > 0 && Math.random() < 0.75) {
    return centerMoves[Math.floor(Math.random() * centerMoves.length)];
  }

  // Adjacent moves to existing AI pieces
  const adjacentMoves = availableMoves.filter(idx => {
    const r = Math.floor(idx / 6);
    const c = idx % 6;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 6 && nc >= 0 && nc < 6) {
          const neighbor = board[nr * 6 + nc];
          if (neighbor === aiPlayer || neighbor === humanPlayer) return true;
        }
      }
    }
    return false;
  });

  if (adjacentMoves.length > 0) {
    return adjacentMoves[Math.floor(Math.random() * adjacentMoves.length)];
  }

  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

// AI Bot Move Generator for 12x12 Mega Grid (Connect 6)
export function getBestMove12x12(
  board: CellValue[],
  aiPlayer: Player,
  difficulty: BotDifficulty = 'unbeatable'
): number {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  const availableMoves: number[] = [];

  for (let i = 0; i < 144; i++) {
    if (board[i] === null) availableMoves.push(i);
  }

  if (availableMoves.length === 0) return -1;

  // Easy mode: occasional random play
  if (difficulty === 'easy' && Math.random() < 0.6) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 1. Direct Win Check (Can AI win right now?)
  for (const move of availableMoves) {
    board[move] = aiPlayer;
    if (checkWin12x12(board)) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  // 2. Direct Block Check (Can Human win on next turn?)
  for (const move of availableMoves) {
    board[move] = humanPlayer;
    if (checkWin12x12(board)) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  // If board is empty, play near the center
  const centerSquares = [
    5 * 12 + 5, 5 * 12 + 6,
    6 * 12 + 5, 6 * 12 + 6,
    5 * 12 + 4, 6 * 12 + 7,
  ].filter((idx) => board[idx] === null);

  if (availableMoves.length >= 143 && centerSquares.length > 0) {
    return centerSquares[Math.floor(Math.random() * centerSquares.length)];
  }

  // 3. Score potential candidate cells within distance 2 of existing moves
  const candidateMoves = availableMoves.filter((idx) => {
    const r = Math.floor(idx / 12);
    const c = idx % 12;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 12 && nc >= 0 && nc < 12) {
          if (board[nr * 12 + nc] !== null) return true;
        }
      }
    }
    return false;
  });

  const movesToEvaluate = candidateMoves.length > 0 ? candidateMoves : availableMoves;

  let bestMove = movesToEvaluate[0];
  let highestScore = -Infinity;

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const move of movesToEvaluate) {
    const r = Math.floor(move / 12);
    const c = move % 12;
    let score = 0;

    // Center bias
    const distFromCenter = Math.abs(r - 5.5) + Math.abs(c - 5.5);
    score += (12 - distFromCenter) * 2;

    for (const [dr, dc] of directions) {
      let aiCount = 0;
      let humanCount = 0;

      for (let step = 1; step <= 5; step++) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr < 0 || nr >= 12 || nc < 0 || nc >= 12) break;
        const val = board[nr * 12 + nc];
        if (val === aiPlayer) aiCount++;
        else if (val === humanPlayer) humanCount++;
        else break;
      }

      for (let step = 1; step <= 5; step++) {
        const nr = r - dr * step;
        const nc = c - dc * step;
        if (nr < 0 || nr >= 12 || nc < 0 || nc >= 12) break;
        const val = board[nr * 12 + nc];
        if (val === aiPlayer) aiCount++;
        else if (val === humanPlayer) humanCount++;
        else break;
      }

      if (aiCount === 4) score += 3000;
      else if (aiCount === 3) score += 400;
      else if (aiCount === 2) score += 60;
      else if (aiCount === 1) score += 10;

      if (humanCount === 4) score += 2500;
      else if (humanCount === 3) score += 350;
      else if (humanCount === 2) score += 50;
    }

    score += Math.random() * 5;

    if (score > highestScore) {
      highestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// Coach Hint: compute the best suggested move for the current player
export function getHintMove(
  board: CellValue[],
  currentPlayer: Player,
  mode: GameMode,
  xHistory: number[] = [],
  oHistory: number[] = []
): number {
  if (mode === 'grid12x12') {
    return getBestMove12x12(board, currentPlayer, 'unbeatable');
  }
  if (mode === 'grid6x6') {
    return getBestMove6x6(board, currentPlayer, 'unbeatable');
  }
  if (mode === 'grid4x4') {
    return getBestMove4x4(board, currentPlayer, 'unbeatable');
  }
  if (mode === 'infinite3') {
    const aiHist = currentPlayer === 'X' ? xHistory : oHistory;
    const huHist = currentPlayer === 'X' ? oHistory : xHistory;
    return getBestMoveInfinite(board, aiHist, huHist, currentPlayer, 'unbeatable');
  }
  return getBestMove3x3(board, currentPlayer, 'unbeatable');
}
