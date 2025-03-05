import React, { useState, useEffect } from 'react';

// Add TypeScript types
type Cell = [number, number];
type Board = number[][];
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

const SudokuGame: React.FC = () => {
  // Game states
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [gameBoard, setGameBoard] = useState<Board>([]);
  const [originalBoard, setOriginalBoard] = useState<Board>([]);
  const [completed, setCompleted] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [invalidCells, setInvalidCells] = useState<Cell[]>([]);

  // Generate a completed Sudoku board
  const generateSolvedBoard = (): Board => {
    // Create empty 9x9 board
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    
    // Fill diagonal 3x3 boxes first (these can be filled independently)
    fillDiagonalBoxes(board);
    
    // Fill the rest of the board
    solveBoard(board);
    
    return board;
  };

  // Fill the three diagonal 3x3 boxes
  const fillDiagonalBoxes = (board: Board): void => {
    for (let box = 0; box < 9; box += 3) {
      fillBox(board, box, box);
    }
  };

  // Fill a 3x3 box with valid numbers
  const fillBox = (board: Board, rowStart: number, colStart: number): void => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Shuffle the array
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    
    let numIndex = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        board[rowStart + i][colStart + j] = nums[numIndex++];
      }
    }
  };

  // Function to solve the Sudoku board using backtracking
  const solveBoard = (board: Board): boolean => {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) return true; // Board is solved
    
    const [row, col] = emptyCell;
    
    // Try each number 1-9
    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        
        if (solveBoard(board)) {
          return true;
        }
        
        board[row][col] = 0; // Backtrack
      }
    }
    
    return false; // Trigger backtracking
  };

  // Find an empty cell in the board
  const findEmptyCell = (board: Board): Cell | null => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          return [row, col];
        }
      }
    }
    return null; // No empty cells
  };

  // Check if placing a number is valid
  const isValidPlacement = (board: Board, row: number, col: number, num: number): boolean => {
    // Check row
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) return false;
    }
    
    // Check column
    for (let i = 0; i < 9; i++) {
      if (board[i][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  };

  // Create a playable board by removing some numbers
  const createPlayableBoard = (solvedBoard: Board, difficulty: Difficulty): Board => {
    const board = JSON.parse(JSON.stringify(solvedBoard));
    const cellsToRemove = {
      'easy': 30,
      'medium': 40,
      'hard': 50,
      'expert': 60
    }[difficulty];
    
    let removed = 0;
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      
      if (board[row][col] !== 0) {
        board[row][col] = 0;
        removed++;
      }
    }
    
    return board;
  };

  // Start a new game
  const startNewGame = (): void => {
    const solvedBoard = generateSolvedBoard();
    const playableBoard = createPlayableBoard(solvedBoard, difficulty);
    
    setGameBoard(JSON.parse(JSON.stringify(playableBoard)));
    setOriginalBoard(JSON.parse(JSON.stringify(playableBoard)));
    setSelectedCell(null);
    setCompleted(false);
    setTimer(0);
    setTimerRunning(true);
    setGameStarted(true);
    setInvalidCells([]);
  };

  // Handle cell selection
  const handleCellSelect = (row: number, col: number): void => {
    // Can't select cells that were filled in originally
    if (originalBoard[row][col] !== 0) return;
    
    setSelectedCell([row, col]);
  };

  // Handle number input
  const handleNumberInput = (num: number): void => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    const newBoard = [...gameBoard];
    newBoard[row][col] = num === newBoard[row][col] ? 0 : num; // Toggle if same number
    setGameBoard(newBoard);
    
    // Check if the board is completed correctly
    if (isBoardFilled(newBoard)) {
      if (isBoardValid(newBoard)) {
        setCompleted(true);
        setTimerRunning(false);
      }
    }
    
    // Highlight invalid cells
    highlightInvalidCells(newBoard);
  };

  // Check if the board is completely filled
  const isBoardFilled = (board: Board): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) return false;
      }
    }
    return true;
  };

  // Check if the current board state is valid
  const isBoardValid = (board: Board): boolean => {
    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Set<number>();
      for (let col = 0; col < 9; col++) {
        const num = board[row][col];
        if (num === 0) continue;
        if (seen.has(num)) return false;
        seen.add(num);
      }
    }
    
    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Set<number>();
      for (let row = 0; row < 9; row++) {
        const num = board[row][col];
        if (num === 0) continue;
        if (seen.has(num)) return false;
        seen.add(num);
      }
    }
    
    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
      for (let boxCol = 0; boxCol < 9; boxCol += 3) {
        const seen = new Set<number>();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const num = board[boxRow + i][boxCol + j];
            if (num === 0) continue;
            if (seen.has(num)) return false;
            seen.add(num);
          }
        }
      }
    }
    
    return true;
  };

  // Highlight invalid cells
  const highlightInvalidCells = (board: Board): void => {
    const invalid: Cell[] = [];
    
    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Map<number, number>();
      for (let col = 0; col < 9; col++) {
        const num = board[row][col];
        if (num === 0) continue;
        if (seen.has(num)) {
          invalid.push([row, col]);
          invalid.push([row, seen.get(num)!]);
        }
        seen.set(num, col);
      }
    }
    
    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Map<number, number>();
      for (let row = 0; row < 9; row++) {
        const num = board[row][col];
        if (num === 0) continue;
        if (seen.has(num)) {
          invalid.push([row, col]);
          invalid.push([seen.get(num)!, col]);
        }
        seen.set(num, row);
      }
    }
    
    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
      for (let boxCol = 0; boxCol < 9; boxCol += 3) {
        const seen = new Map<number, [number, number]>();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = boxRow + i;
            const col = boxCol + j;
            const num = board[row][col];
            if (num === 0) continue;
            if (seen.has(num)) {
              invalid.push([row, col]);
              const [prevI, prevJ] = seen.get(num)!;
              invalid.push([boxRow + prevI, boxCol + prevJ]);
            }
            seen.set(num, [i, j]);
          }
        }
      }
    }
    
    setInvalidCells(invalid);
  };

  // Show hints (one cell)
  const showHint = (): void => {
    if (!gameStarted) return;
    
    // Find a random empty or incorrect cell and fill it with the correct value
    const solvedBoard = generateSolvedBoard(); // Get a solution
    const emptyOrIncorrectCells: Cell[] = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameBoard[row][col] === 0 || gameBoard[row][col] !== solvedBoard[row][col]) {
          emptyOrIncorrectCells.push([row, col]);
        }
      }
    }
    
    if (emptyOrIncorrectCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyOrIncorrectCells.length);
      const [row, col] = emptyOrIncorrectCells[randomIndex];
      
      const newBoard = [...gameBoard];
      newBoard[row][col] = solvedBoard[row][col];
      setGameBoard(newBoard);
      
      // Check if the board is completed correctly
      if (isBoardFilled(newBoard) && isBoardValid(newBoard)) {
        setCompleted(true);
        setTimerRunning(false);
      }
      
      highlightInvalidCells(newBoard);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check if a cell is in the invalidCells list
  const isInvalidCell = (row: number, col: number): boolean => {
    return invalidCells.some(cell => cell[0] === row && cell[1] === col);
  };

  // Check if a cell is the selected cell
  const isSelectedCell = (row: number, col: number): boolean => {
    return selectedCell !== null && selectedCell[0] === row && selectedCell[1] === col;
  };

  // Check if a cell is in the same row, column, or 3x3 box as the selected cell
  const isRelatedToSelected = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    
    const [selectedRow, selectedCol] = selectedCell;
    
    // Same row
    if (row === selectedRow) return true;
    
    // Same column
    if (col === selectedCol) return true;
    
    // Same 3x3 box
    const selectedBoxRow = Math.floor(selectedRow / 3);
    const selectedBoxCol = Math.floor(selectedCol / 3);
    const cellBoxRow = Math.floor(row / 3);
    const cellBoxCol = Math.floor(col / 3);
    
    return selectedBoxRow === cellBoxRow && selectedBoxCol === cellBoxCol;
  };

  // Return JSX
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Sudoku Game</h1>
      
      {/* Game controls */}
      <div className="mb-4 flex items-center space-x-4">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="p-2 border rounded"
          disabled={gameStarted && !completed}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </select>
        
        <button
          onClick={startNewGame}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {gameStarted ? 'New Game' : 'Start Game'}
        </button>
        
        {gameStarted && !completed && (
          <button
            onClick={showHint}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Hint
          </button>
        )}
        
        {gameStarted && (
          <div className="text-xl font-mono">
            Time: {formatTime(timer)}
          </div>
        )}
      </div>
      
      {/* Game board */}
      {gameStarted && (
        <div className="bg-white p-1 rounded-lg shadow-lg">
          <div className="grid grid-cols-9 gap-0 border-2 border-black">
            {Array(9).fill(null).map((_, rowIndex) => (
              Array(9).fill(null).map((_, colIndex) => {
                const value = gameBoard[rowIndex][colIndex];
                const isOriginal = originalBoard[rowIndex][colIndex] !== 0;
                const isInvalid = isInvalidCell(rowIndex, colIndex);
                const isSelected = isSelectedCell(rowIndex, colIndex);
                const isRelated = isRelatedToSelected(rowIndex, colIndex);
                
                // Determine border styles
                const borderRight = (colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-r-2 border-r-black' : 'border-r border-gray-300';
                const borderBottom = (rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-b-2 border-b-black' : 'border-b border-gray-300';
                
                // Determine background color
                let bgColor = 'bg-white';
                if (isSelected) {
                  bgColor = 'bg-blue-200';
                } else if (isRelated) {
                  bgColor = 'bg-blue-50';
                }
                
                // Text color
                let textColor = isOriginal ? 'text-black font-bold' : 'text-blue-600';
                if (isInvalid) {
                  textColor = 'text-red-600';
                }
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-10 h-10 flex items-center justify-center ${borderRight} ${borderBottom} ${bgColor} ${textColor} text-xl cursor-pointer`}
                    onClick={() => handleCellSelect(rowIndex, colIndex)}
                  >
                    {value !== 0 ? value : ''}
                  </div>
                );
              })
            ))}
          </div>
        </div>
      )}
      
      {/* Number pad */}
      {gameStarted && selectedCell && (
        <div className="mt-4 grid grid-cols-9 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xl font-semibold hover:bg-gray-300"
              onClick={() => handleNumberInput(num)}
            >
              {num}
            </button>
          ))}
        </div>
      )}
      
      {/* Game completion message */}
      {completed && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center">
          <h2 className="text-2xl font-bold">Congratulations!</h2>
          <p>You completed the Sudoku puzzle in {formatTime(timer)}!</p>
        </div>
      )}
      
      {/* Game instructions */}
      {!gameStarted && (
        <div className="mt-8 max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">How to Play:</h2>
          <ol className="text-left space-y-2">
            <li>1. Select a difficulty and click "Start Game"</li>
            <li>2. Click on an empty cell to select it</li>
            <li>3. Click a number from the number pad to fill the cell</li>
            <li>4. Fill all cells correctly to complete the puzzle</li>
            <li>5. Use the "Hint" button if you get stuck</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default SudokuGame;
