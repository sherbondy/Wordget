// Standard Wordle word lists
import { VALID_ANSWER_WORDS, OTHER_VALID_GUESS_WORDS } from "./words";

// Game state
interface GameState {
  targetWord: string;
  currentGuess: string;
  guesses: string[];
  gameOver: boolean;
  won: boolean;
  revealedLetters: Set<string>;
  correctPositions: Map<number, string>;
  currentRow: number;
  incorrectGuesses: Set<string>;
  gameCount: number; // Track which game number we're on for the day
}

// Statistics
interface GameStats {
  winCount: number;
  streakCount: number;
  lastPlayedDate: string;
  lastGameWon: boolean;
}

export class WordgetGame {
  private state: GameState;
  private gameBoard: HTMLElement;
  private keyboard: HTMLElement;
  private messageElement: HTMLElement;
  private playAgainButton: HTMLElement | null = null;
  private stats: GameStats = {
    winCount: 0,
    streakCount: 0,
    lastPlayedDate: "",
    lastGameWon: false,
  };

  constructor() {
    // Initialize with default values first
    this.state = {
      targetWord: "",
      currentGuess: "",
      guesses: [],
      gameOver: false,
      won: false,
      revealedLetters: new Set(),
      correctPositions: new Map(),
      currentRow: 0,
      incorrectGuesses: new Set(),
      gameCount: 1,
    };

    // Load stats from localStorage
    this.loadStats();

    // Set the game count based on the last completed round
    this.state.gameCount = this.getGameCount();
    
    // Set the target word based on the game count
    this.state.targetWord = this.getTodaysWord().toLowerCase();

    this.gameBoard = document.getElementById("gameBoard")!;
    this.keyboard = document.getElementById("keyboard")!;
    this.messageElement = document.getElementById("message")!;

    this.initializeGameBoard();
    this.attachEventListeners();
    this.loadGameState();
    this.updateStatsDisplay();
  }

  private loadStats(): void {
    const savedStats = localStorage.getItem("wordget-stats");
    if (savedStats) {
      try {
        this.stats = JSON.parse(savedStats);
      } catch (e) {
        console.error("Failed to load game stats", e);
        this.initializeStats();
      }
    } else {
      this.initializeStats();
    }
  }

  private initializeStats(): void {
    this.stats = {
      winCount: 0,
      streakCount: 0,
      lastPlayedDate: "",
      lastGameWon: false,
    };
  }

  private getGameCount(): number {
    // Get the last completed round from localStorage
    const savedLastCompletedRound = localStorage.getItem("wordget-last-completed-round");
    const today = new Date().toDateString();
    
    if (savedLastCompletedRound) {
      try {
        const lastCompleted = JSON.parse(savedLastCompletedRound);
        // If it's from today, continue from the next round
        if (lastCompleted.date === today) {
          return lastCompleted.round + 1;
        }
      } catch (e) {
        console.error("Failed to parse last completed round", e);
      }
    }
    
    // If no saved round or not from today, start from round 1
    return 1;
  }

  private saveLastCompletedRound(): void {
    try {
      const lastCompleted = {
        round: this.state.gameCount,
        date: new Date().toDateString()
      };
      
      localStorage.setItem("wordget-last-completed-round", JSON.stringify(lastCompleted));
    } catch (e) {
      console.error("Failed to save last completed round", e);
    }
  }


  private updateStatsDisplay(): void {
    const winCountElement = document.getElementById("winCount");
    const streakCountElement = document.getElementById("streakCount");

    if (winCountElement) {
      winCountElement.textContent = this.stats.winCount.toString();
    }

    if (streakCountElement) {
      streakCountElement.textContent = this.stats.streakCount.toString();
    }
  }

  private getTodaysWord(): string {
    // Get today's date as a unique seed
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();

    // Use the game count as part of the seed to ensure different words for each game
    const gameSeed = seed * this.state.gameCount;

    // Use a simple seeded random number generator
    const random = this.seededRandom(gameSeed);
    const index = Math.floor(random * VALID_ANSWER_WORDS.length);

    return VALID_ANSWER_WORDS[index];
  }

  private seededRandom(seed: number): number {
    // Simple seeded random number generator (Mulberry32)
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  private initializeGameBoard(): void {
    this.gameBoard.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const row = document.createElement("div");
      row.className = "row";
      row.id = `row-${i}`;

      for (let j = 0; j < 5; j++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.id = `tile-${i}-${j}`;
        row.appendChild(tile);
      }

      this.gameBoard.appendChild(row);
    }
  }

  private attachEventListeners(): void {
    // Physical keyboard events
    document.addEventListener("keydown", (e) => {
      if (this.state.gameOver) return;

      const key = e.key.toLowerCase();
      if (key === "enter") {
        this.submitGuess();
      } else if (key === "backspace") {
        this.deleteLetter();
      } else if (/^[a-z]$/.test(key)) {
        this.addLetter(key);
      }
    });

    // On-screen keyboard events
    this.keyboard.addEventListener("click", (e) => {
      if (this.state.gameOver) return;

      const target = e.target as HTMLElement;
      if (target.classList.contains("key")) {
        const key = target.getAttribute("data-key")!;
        if (key === "Enter") {
          this.submitGuess();
        } else if (key === "Backspace") {
          this.deleteLetter();
        } else {
          this.addLetter(key);
        }
      }
    });
  }

  private loadGameState(): void {
    const savedState = localStorage.getItem("wordget-state");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        const today = new Date().toDateString();

        // Only load state if it's from today
        if (parsedState.date === today) {
        this.state = {
          ...this.state,
          ...parsedState,
          guesses: parsedState.guesses || [],
          revealedLetters: new Set(parsedState.revealedLetters),
          correctPositions: new Map(
            Object.entries(parsedState.correctPositions || {}).map(([k, v]) => [Number(k), v])
          ),
          incorrectGuesses: new Set(parsedState.incorrectGuesses || []),
        };

          // Re-render the board
          this.renderBoard();

          // Check if game was already over and display play again button
          if (this.state.gameOver) {
            if (this.state.won) {
              this.endGame("Congratulations! You won!", true);
            } else {
              this.endGame(`Game over! The word was: ${this.state.targetWord}`);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load game state", e);
      }
    }
  }

  private saveGameState(): void {
    try {
      const stateToSave = {
        ...this.state,
        date: new Date().toDateString(),
        guesses: this.state.guesses,
        revealedLetters: Array.from(this.state.revealedLetters),
        correctPositions: Object.fromEntries(this.state.correctPositions),
        incorrectGuesses: Array.from(this.state.incorrectGuesses),
      };

      localStorage.setItem("wordget-state", JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save game state", e);
    }
  }

  private addLetter(letter: string): void {
    if (this.state.currentGuess.length < 5) {
      this.state.currentGuess += letter;
      this.renderBoard();
    }
  }

  private deleteLetter(): void {
    if (this.state.currentGuess.length > 0) {
      this.state.currentGuess = this.state.currentGuess.slice(0, -1);
      this.renderBoard();
    }
  }

  private submitGuess(): void {
    if (this.state.currentGuess.length !== 5) return;
    if (this.state.gameOver) return;

    // Combine both word lists for valid guesses
    const ALL_VALID_GUESS_WORDS = [...VALID_ANSWER_WORDS, ...OTHER_VALID_GUESS_WORDS];
    
    const guess = this.state.currentGuess.toLowerCase();
    if (!ALL_VALID_GUESS_WORDS.includes(guess)) {
      console.log("Invalid word:", guess);
      this.showMessage("Word not in dictionary!");
      return;
    }

    const row = document.getElementById(`row-${this.state.currentRow}`);
    if (!row) return;

    const targetWord = this.state.targetWord.toLowerCase();

    // Validate that the guess includes all revealed letters and correct positions
    if (!this.includesRevealedLetters(guess)) {
      this.showMessage(
        "Guess must include all revealed letters in correct positions!"
      );
      return;
    }

    this.showMessage('');
    // Track revealed letters and correct positions
    for (let i = 0; i < 5; i++) {
      if (targetWord[i] === guess[i]) {
        this.state.correctPositions.set(i, guess[i]);
        this.state.revealedLetters.add(guess[i]);
      } else if (targetWord.includes(guess[i])) {
        this.state.revealedLetters.add(guess[i]);
      }
    }

    // Add the current guess to guesses array
    this.state.guesses.push(guess);

    // Reset current guess before rendering to prevent duplication
    this.state.currentGuess = "";

    // Update the game board UI
    this.renderBoard();

    if (guess === targetWord) {
      this.state.won = true;
      this.endGame("Congratulations! You won!", true);
      this.animateWin();
    } else {
      // Track incorrect guesses for keyboard disabling
      for (let i = 0; i < 5; i++) {
        const letter = guess[i];
        if (!targetWord.includes(letter)) {
          this.state.incorrectGuesses.add(letter);
        }
      }

      // Update keyboard to reflect incorrect guesses
      this.updateKeyboard();

      this.state.currentRow++;

      if (this.state.currentRow >= 6) {
        this.endGame(`Game over! The word was: ${targetWord}`);
      }
    }

    this.saveGameState();
  }

  private renderBoard(): void {
    // Render previous guesses
    for (let i = 0; i < this.state.guesses.length; i++) {
      const guess = this.state.guesses[i];
      const row = document.getElementById(`row-${i}`)!;

      // Count occurrences of each letter in target word
      const targetLetterCounts: Map<string, number> = new Map();
      for (const letter of this.state.targetWord) {
        targetLetterCounts.set(letter, (targetLetterCounts.get(letter) || 0) + 1);
      }

      // For each guess, we need to determine the color of each letter
      // We'll track how many times we've correctly placed each letter in this guess
      const correctInThisGuess: Map<string, number> = new Map();

      for (let j = 0; j < 5; j++) {
        const tile = document.getElementById(`tile-${i}-${j}`)!;
        tile.textContent = guess[j];

        // Reset classes
        tile.className = "tile flip";

        // Add appropriate color classes
        if (guess[j] === this.state.targetWord[j]) {
          tile.classList.add("correct");
          // Track correctly placed letters in this guess
          const letter = guess[j];
          correctInThisGuess.set(letter, (correctInThisGuess.get(letter) || 0) + 1);
        } else if (this.state.targetWord.includes(guess[j])) {
          // Check if this letter has already been correctly guessed the maximum number of times
          const letter = guess[j];
          const targetCount = targetLetterCounts.get(letter) || 0;
          const correctCount = correctInThisGuess.get(letter) || 0;
          
          // If the letter appears only once in the target word and has already been 
          // correctly guessed in this guess, don't mark it as present (yellow)
          if (targetCount === 1 && correctCount >= 1) {
            tile.classList.add("absent");
          } else {
            tile.classList.add("present");
            // Track present letters in this guess
            correctInThisGuess.set(letter, (correctInThisGuess.get(letter) || 0) + 1);
          }
        } else {
          tile.classList.add("absent");
        }
      }
    }

    // Render current guess
    const currentRow = document.getElementById(
      `row-${this.state.guesses.length}`
    )!;
    if (currentRow) {
      for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(
          `tile-${this.state.guesses.length}-${i}`
        )!;
        tile.textContent =
          i < this.state.currentGuess.length ? this.state.currentGuess[i] : "";
        tile.className = "tile";
      }
    }

    // Update keyboard colors
    this.updateKeyboard();
  }

  private updateKeyboard(): void {
    const keys = this.keyboard.querySelectorAll(".key");
    keys.forEach((key) => {
      const keyData = key.getAttribute("data-key")!;
      if (keyData === "Enter" || keyData === "Backspace") return;
      const letter = keyData.toLowerCase();

      // Reset classes
      key.className = "key";

      // Add appropriate color classes
      if (this.state.revealedLetters.has(letter)) {
        if (this.state.targetWord.includes(letter)) {
            // Find all positions where this letter appears in targetWord
            const letterPositions = Array.from(this.state.targetWord)
              .map((l, i) => l === letter ? i : -1)
              .filter(i => i !== -1);
            
            // Check if any of these positions are in correctPositions
            const isCorrect = letterPositions.some(pos => this.state.correctPositions.has(pos));
            
            // Count occurrences of this letter in target word
            const targetCount = Array.from(this.state.targetWord).filter(l => l === letter).length;
            
            // Count correctly placed occurrences in all guesses
            let correctCount = 0;
            for (const guess of this.state.guesses) {
              for (let pos = 0; pos < 5; pos++) {
                if (guess[pos] === letter && this.state.targetWord[pos] === letter) {
                  correctCount++;
                }
              }
            }
            
            // If the letter appears only once in the target word and has already been 
            // correctly guessed, mark it as correct (green) on the keyboard
            if (targetCount === 1 && correctCount >= 1) {
              key.classList.add("correct");
            } else if (isCorrect) {
              key.classList.add("correct");
            } else {
              key.classList.add("present");
            }
        } else {
          key.classList.add("absent");
        }
      } else if (this.state.incorrectGuesses.has(letter)) {
        key.classList.add("absent");
        key.classList.add("disabled");
        key.setAttribute("disabled", "true");
      }
    });
  }

  private showMessage(text: string): void {
    this.messageElement.textContent = text;
  }

  private endGame(message: string, won: boolean = false): void {
    this.showMessage(message);
    this.state.gameOver = true;
    this.state.won = won;

    // Save the last completed round
    this.saveLastCompletedRound();

    // Update win count
    if (won) {
      this.stats.winCount++;
    }

    // Update streak count - increment on win, reset on loss
    if (won) {
      this.stats.streakCount++;
    } else {
      this.stats.streakCount = 0;
    }

    // Update last game result
    this.stats.lastGameWon = won;
    
    // Update last played date
    this.stats.lastPlayedDate = new Date().toDateString();

    // Save statistics
    this.saveStats();
    this.updateStatsDisplay();

    // Remove existing play again button if it exists
    if (this.playAgainButton) {
      this.playAgainButton.remove();
    }

    // Create and show modal
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "gameEndModal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalTitle = document.createElement("div");
    modalTitle.className = "modal-title";
    modalTitle.classList.add(won ? "win" : "lose");
    modalTitle.textContent = won ? "You Win!" : "You Lose!";

    // Create share button if player won
    let shareButton: HTMLButtonElement | null = null;
    if (won) {
      shareButton = document.createElement("button");
      shareButton.textContent = "Share";
      shareButton.className = "share-button";
      shareButton.addEventListener("click", () => {
        this.shareResults(shareButton!);
      });
    }

    this.playAgainButton = document.createElement("button");
    this.playAgainButton.textContent = "Play Again";
    this.playAgainButton.className = "play-again";
    this.playAgainButton.addEventListener("click", () => {
      modal.remove();
      this.resetGame();
      this.messageElement.textContent = "";
    });

    modalContent.appendChild(modalTitle);
    if (shareButton) {
      modalContent.appendChild(shareButton);
    }
    modalContent.appendChild(this.playAgainButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Show the modal
    modal.style.display = "flex";
  }

  private saveStats(): void {
    try {
      localStorage.setItem("wordget-stats", JSON.stringify(this.stats));
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  }

  private resetGame(): void {
    // Remove play again button
    if (this.playAgainButton) {
      this.playAgainButton.remove();
      this.playAgainButton = null;
    }

    // Clear previous game state references
    this.state.revealedLetters.clear();
    this.state.correctPositions.clear();

    // Update game count
    this.state.gameCount++;

    // Reset game state
    this.state = {
      targetWord: this.getTodaysWord().toLowerCase(),
      currentGuess: "",
      guesses: [],
      gameOver: false,
      won: false,
      revealedLetters: new Set(),
      correctPositions: new Map(),
      currentRow: 0,
      incorrectGuesses: new Set(),
      gameCount: this.state.gameCount,
    };

    // Reset UI
    this.initializeGameBoard();
    this.renderBoard();
    
    // Re-enable all keyboard keys
    const keys = this.keyboard.querySelectorAll(".key");
    keys.forEach((key) => {
      key.classList.remove("disabled");
      key.removeAttribute("disabled");
    });
    
    this.updateKeyboard(); // Ensure keyboard is reset too
    this.saveGameState();
  }

  private animateWin(): void {
    const rowIndex = this.state.guesses.length - 1;
    const row = document.getElementById(`row-${rowIndex}`)!;
    const tiles = row.querySelectorAll(".tile");

    tiles.forEach((tile, i) => {
      setTimeout(() => {
        tile.classList.add("dance");
      }, i * 100);
    });
  }

  public includesRevealedLetters(guess: string): boolean {
    // If no letters have been revealed, any guess is valid
    if (this.state.revealedLetters.size === 0) return true;

    // Check if the guess includes all revealed letters
    const guessLower = guess.toLowerCase();
    const isValidFrequency = Array.from(this.state.revealedLetters).every(
      (letter) => {
        return guessLower.includes(letter);
      }
    );

    // Check if the guess has letters in correct positions
    const isValidPositions = Array.from(this.state.correctPositions).every(
      ([pos, letter]) => {
        return guessLower[pos] === letter;
      }
    );

    return isValidFrequency && isValidPositions;
  }

  private shareResults(shareButton: HTMLButtonElement): void {
    // Generate the share text
    const shareText = this.generateShareText();
    const title = "Today's Wordget";
    const url = "https://wordget.app";

    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title,
        text: shareText,
        url
      })
      .then(() => {
        // Share was successful
        shareButton.textContent = "Shared!";
        setTimeout(() => {
          if (!this.state.gameOver) return;
          shareButton.textContent = "Share";
        }, 2000);
      })
      .catch((error) => {
        // Share failed, fallback to clipboard
        console.error("Sharing failed:", error);
        this.copyToClipboard(shareText, shareButton);
      });
    } else {
      // Web Share API not available, fallback to clipboard
      this.copyToClipboard(shareText, shareButton);
    }
  }

  private generateShareText(): string {
    let shareText = `Wordget ${new Date().toDateString()} #${this.state.gameCount} ${this.state.guesses.length}/6\n\n`;
    
    // Create the emoji grid
    for (let i = 0; i < this.state.guesses.length; i++) {
      const guess = this.state.guesses[i];
      const targetWord = this.state.targetWord.toLowerCase();
      
      // Count occurrences of each letter in target word
      const targetLetterCounts: Map<string, number> = new Map();
      for (const letter of targetWord) {
        targetLetterCounts.set(letter, (targetLetterCounts.get(letter) || 0) + 1);
      }
      
      // For each guess, we need to determine the color of each letter
      // We'll track how many times we've correctly placed each letter in this guess
      const correctInThisGuess: Map<string, number> = new Map();
      
      for (let j = 0; j < 5; j++) {
        if (guess[j] === targetWord[j]) {
          shareText += "🟩";
          // Track correctly placed letters in this guess
          const letter = guess[j];
          correctInThisGuess.set(letter, (correctInThisGuess.get(letter) || 0) + 1);
        } else if (targetWord.includes(guess[j])) {
          // Check if this letter has already been correctly guessed the maximum number of times
          const letter = guess[j];
          const targetCount = targetLetterCounts.get(letter) || 0;
          const correctCount = correctInThisGuess.get(letter) || 0;
          
          // If the letter appears only once in the target word and has already been 
          // correctly guessed in this guess, don't mark it as present (yellow)
          if (targetCount === 1 && correctCount >= 1) {
            shareText += "⬛️";
          } else {
            shareText += "🟨";
            // Track present letters in this guess
            correctInThisGuess.set(letter, (correctInThisGuess.get(letter) || 0) + 1);
          }
        } else {
          shareText += "⬛️";
        }
      }
      shareText += "\n";
    }
    
    // Add empty rows if game wasn't completed in 6 guesses
    const emptyRows = 6 - this.state.guesses.length;
    for (let i = 0; i < emptyRows; i++) {
      shareText += "⬜⬜⬜⬜⬜\n";
    }
    
    // Add the URL at the end of the share text
    shareText += "\nhttps://wordget.app";
    
    return shareText;
  }

  private copyToClipboard(text: string, shareButton: HTMLButtonElement): void {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Copy was successful
        shareButton.textContent = "Copied!";
        setTimeout(() => {
          if (!this.state.gameOver) return;
          shareButton.textContent = "Share";
        }, 2000);
      })
      .catch((error) => {
        // Copy failed
        console.error("Copying failed:", error);
        shareButton.textContent = "Copy failed!";
        setTimeout(() => {
          if (!this.state.gameOver) return;
          shareButton.textContent = "Share";
        }, 2000);
      });
  }
}

// Initialize the game when the page loads, but only in browser environment
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    new WordgetGame();
  });
}
