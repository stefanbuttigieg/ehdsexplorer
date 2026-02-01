import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  RotateCcw, 
  Trophy,
  Search,
  Timer,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { useDefinitions } from "@/hooks/useDefinitions";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FoundWord {
  word: string;
  definition: string;
  cells: number[];
}

interface PlacedWord {
  word: string;
  definition: string;
  startRow: number;
  startCol: number;
  direction: 'horizontal' | 'vertical' | 'diagonal';
  cells: number[];
}

const GRID_SIZE = 12;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const WordSearchGamePage = () => {
  const navigate = useNavigate();
  const { data: definitions, isLoading } = useDefinitions();
  const { checkAndUnlock } = useAchievements();
  
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState<5 | 8 | 10>(5);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);

  // Generate a random letter
  const getRandomLetter = useCallback(() => {
    return LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }, []);

  // Check if a word can be placed at position
  const canPlaceWord = useCallback((
    word: string,
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical' | 'diagonal',
    currentGrid: string[][]
  ): boolean => {
    const len = word.length;
    
    for (let i = 0; i < len; i++) {
      let row = startRow;
      let col = startCol;
      
      if (direction === 'horizontal') {
        col += i;
      } else if (direction === 'vertical') {
        row += i;
      } else {
        row += i;
        col += i;
      }
      
      if (row >= GRID_SIZE || col >= GRID_SIZE) return false;
      if (currentGrid[row][col] !== '' && currentGrid[row][col] !== word[i]) return false;
    }
    return true;
  }, []);

  // Place a word on the grid
  const placeWord = useCallback((
    word: string,
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical' | 'diagonal',
    currentGrid: string[][]
  ): number[] => {
    const cells: number[] = [];
    
    for (let i = 0; i < word.length; i++) {
      let row = startRow;
      let col = startCol;
      
      if (direction === 'horizontal') {
        col += i;
      } else if (direction === 'vertical') {
        row += i;
      } else {
        row += i;
        col += i;
      }
      
      currentGrid[row][col] = word[i];
      cells.push(row * GRID_SIZE + col);
    }
    
    return cells;
  }, []);

  // Initialize the game
  const initializeGame = useCallback(() => {
    if (!definitions || definitions.length === 0) return;

    // Create empty grid
    const newGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill('')
    );

    // Pick random terms (short ones that fit)
    const eligibleDefs = definitions
      .filter(d => {
        const term = d.term.replace(/\s+/g, '').toUpperCase();
        return term.length <= GRID_SIZE - 2 && term.length >= 3 && /^[A-Z]+$/.test(term);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, difficulty);

    const placed: PlacedWord[] = [];
    const directions: ('horizontal' | 'vertical' | 'diagonal')[] = ['horizontal', 'vertical', 'diagonal'];

    for (const def of eligibleDefs) {
      const word = def.term.replace(/\s+/g, '').toUpperCase();
      let wordPlaced = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!wordPlaced && attempts < maxAttempts) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const maxStartRow = direction === 'horizontal' ? GRID_SIZE : GRID_SIZE - word.length;
        const maxStartCol = direction === 'vertical' ? GRID_SIZE : GRID_SIZE - word.length;
        
        if (maxStartRow <= 0 || maxStartCol <= 0) {
          attempts++;
          continue;
        }

        const startRow = Math.floor(Math.random() * maxStartRow);
        const startCol = Math.floor(Math.random() * maxStartCol);

        if (canPlaceWord(word, startRow, startCol, direction, newGrid)) {
          const cells = placeWord(word, startRow, startCol, direction, newGrid);
          placed.push({
            word,
            definition: def.definition,
            startRow,
            startCol,
            direction,
            cells,
          });
          wordPlaced = true;
        }
        attempts++;
      }
    }

    // Fill remaining cells with random letters
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row][col] === '') {
          newGrid[row][col] = getRandomLetter();
        }
      }
    }

    setGrid(newGrid);
    setPlacedWords(placed);
    setFoundWords([]);
    setSelectedCells([]);
    setGameComplete(false);
    setTimer(0);
    setIsPlaying(true);
    setShowHint(false);
    setHintIndex(null);
  }, [definitions, difficulty, canPlaceWord, placeWord, getRandomLetter]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameComplete) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameComplete]);

  // Initialize game when definitions load
  useEffect(() => {
    if (definitions && definitions.length > 0) {
      initializeGame();
    }
  }, [definitions, difficulty, initializeGame]);

  // Handle cell selection
  const handleCellMouseDown = (cellIndex: number) => {
    setIsSelecting(true);
    setSelectedCells([cellIndex]);
  };

  const handleCellMouseEnter = (cellIndex: number) => {
    if (isSelecting && !selectedCells.includes(cellIndex)) {
      // Only allow linear selections
      if (selectedCells.length === 0) {
        setSelectedCells([cellIndex]);
      } else {
        const firstCell = selectedCells[0];
        const firstRow = Math.floor(firstCell / GRID_SIZE);
        const firstCol = firstCell % GRID_SIZE;
        const currentRow = Math.floor(cellIndex / GRID_SIZE);
        const currentCol = cellIndex % GRID_SIZE;
        
        // Determine direction from first to current
        const rowDiff = currentRow - firstRow;
        const colDiff = currentCol - firstCol;
        
        // Check if it's a valid line (horizontal, vertical, or diagonal)
        const isHorizontal = rowDiff === 0;
        const isVertical = colDiff === 0;
        const isDiagonal = Math.abs(rowDiff) === Math.abs(colDiff);
        
        if (isHorizontal || isVertical || isDiagonal) {
          const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
          const rowStep = steps === 0 ? 0 : rowDiff / steps;
          const colStep = steps === 0 ? 0 : colDiff / steps;
          
          const newSelection: number[] = [];
          for (let i = 0; i <= steps; i++) {
            const r = firstRow + i * rowStep;
            const c = firstCol + i * colStep;
            newSelection.push(r * GRID_SIZE + c);
          }
          setSelectedCells(newSelection);
        }
      }
    }
  };

  const handleCellMouseUp = () => {
    if (isSelecting && selectedCells.length > 0) {
      // Check if selected cells form a word
      const selectedWord = selectedCells
        .map(idx => {
          const row = Math.floor(idx / GRID_SIZE);
          const col = idx % GRID_SIZE;
          return grid[row]?.[col] || '';
        })
        .join('');

      // Check both directions
      const reversedWord = selectedWord.split('').reverse().join('');
      
      for (const placed of placedWords) {
        if (!foundWords.some(f => f.word === placed.word)) {
          if (selectedWord === placed.word || reversedWord === placed.word) {
            const newFound: FoundWord = {
              word: placed.word,
              definition: placed.definition,
              cells: selectedCells,
            };
            const updatedFound = [...foundWords, newFound];
            setFoundWords(updatedFound);

            // Check if game complete
            if (updatedFound.length === placedWords.length) {
              setGameComplete(true);
              setIsPlaying(false);
              
              // Track achievements
              checkAndUnlock('wordsearch_games', 1);
              checkAndUnlock('definitions_studied', placedWords.length);
              
              // Speed achievement (under 2 minutes)
              if (timer < 120) {
                checkAndUnlock('wordsearch_speed', 120);
              }
            }
            break;
          }
        }
      }
    }
    
    setIsSelecting(false);
    setSelectedCells([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get all found cell indices for highlighting
  const foundCellIndices = useMemo(() => {
    const indices = new Set<number>();
    foundWords.forEach(fw => {
      fw.cells.forEach(cell => indices.add(cell));
    });
    return indices;
  }, [foundWords]);

  // Handle hint
  const handleHint = () => {
    const unfoundWords = placedWords.filter(
      pw => !foundWords.some(fw => fw.word === pw.word)
    );
    if (unfoundWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * unfoundWords.length);
      const wordToHint = unfoundWords[randomIndex];
      const idx = placedWords.findIndex(pw => pw.word === wordToHint.word);
      setHintIndex(idx);
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        setHintIndex(null);
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading game...</div>
        </div>
      </Layout>
    );
  }

  const progress = placedWords.length > 0 ? (foundWords.length / placedWords.length) * 100 : 0;

  return (
    <Layout>
      <Helmet>
        <title>Word Search | EHDS Explorer</title>
        <meta name="description" content="Find EHDS terms hidden in a letter grid" />
      </Helmet>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Timer className="h-3.5 w-3.5" />
              {formatTime(timer)}
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {foundWords.length}/{placedWords.length}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            EHDS Word Search
          </h1>
          <p className="text-muted-foreground text-sm">
            Find the hidden EHDS terms in the grid. Drag to select letters.
          </p>
        </div>

        {/* Difficulty Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {([5, 8, 10] as const).map((level) => (
            <Button
              key={level}
              variant={difficulty === level ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty(level)}
              disabled={isPlaying && !gameComplete}
            >
              {level} Words
            </Button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Game Complete Screen */}
        {gameComplete && (
          <Card className="p-8 mb-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-muted-foreground mb-4">
              You found all {placedWords.length} words!
            </p>
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div>
                <div className="font-semibold text-lg">{formatTime(timer)}</div>
                <div className="text-muted-foreground">Time</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{placedWords.length}</div>
                <div className="text-muted-foreground">Words Found</div>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={initializeGame} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Play Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/match-game")} className="gap-2">
                Try Match Game
              </Button>
            </div>
          </Card>
        )}

        {/* Game Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div 
              className="grid gap-0.5 select-none touch-none bg-muted/30 p-2 rounded-lg mx-auto"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                maxWidth: '400px'
              }}
              onMouseLeave={() => {
                if (isSelecting) {
                  handleCellMouseUp();
                }
              }}
            >
              {grid.flat().map((letter, idx) => {
                const isSelected = selectedCells.includes(idx);
                const isFound = foundCellIndices.has(idx);
                const isHinted = showHint && hintIndex !== null && 
                  placedWords[hintIndex]?.cells.includes(idx);

                return (
                  <button
                    key={idx}
                    className={cn(
                      "aspect-square flex items-center justify-center text-sm sm:text-base font-bold rounded transition-all",
                      "border border-border/50",
                      isFound && "bg-accent/50 text-accent-foreground border-accent",
                      isSelected && !isFound && "bg-primary/20 text-primary border-primary/50",
                      isHinted && !isFound && "bg-secondary text-secondary-foreground border-secondary animate-pulse",
                      !isSelected && !isFound && !isHinted && "bg-background hover:bg-muted/50"
                    )}
                    onMouseDown={() => handleCellMouseDown(idx)}
                    onMouseEnter={() => handleCellMouseEnter(idx)}
                    onMouseUp={handleCellMouseUp}
                    onTouchStart={() => handleCellMouseDown(idx)}
                    onTouchEnd={handleCellMouseUp}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" onClick={initializeGame} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                New Game
              </Button>
              <Button 
                variant="outline" 
                onClick={handleHint} 
                className="gap-2"
                disabled={foundWords.length === placedWords.length || showHint}
              >
                <HelpCircle className="h-4 w-4" />
                Hint
              </Button>
            </div>
          </div>

          {/* Word List */}
          <Card className="p-4 lg:w-72">
            <h3 className="font-semibold mb-3 text-sm">Words to Find</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {placedWords.map((pw, idx) => {
                const isFound = foundWords.some(fw => fw.word === pw.word);
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "px-3 py-2 rounded text-sm transition-all cursor-help",
                          isFound 
                            ? "bg-accent/30 text-accent-foreground line-through" 
                            : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        {isFound ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {pw.word}
                          </span>
                        ) : (
                          <span>{pw.word.length} letters</span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs">{pw.definition.slice(0, 150)}...</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WordSearchGamePage;
