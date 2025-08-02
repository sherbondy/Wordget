import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { WordgetGame } from "./index";

// Create a more comprehensive mock for DOM elements
const createMockElement = (id: string = "") => {
  const element: any = {
    textContent: "",
    className: "",
    classList: {
      classes: [] as string[],
      add: function(cls: string) { 
        if (!this.classes) this.classes = [];
        if (!this.classes.includes(cls)) this.classes.push(cls); 
      },
      remove: function(cls: string) { 
        if (!this.classes) this.classes = [];
        this.classes = this.classes.filter((c: string) => c !== cls); 
      },
      contains: function(cls: string) { 
        if (!this.classes) this.classes = [];
        return this.classes.includes(cls); 
      }
    },
    id: id,
    innerHTML: "",
    appendChild: () => {},
    querySelectorAll: () => [],
    getAttribute: (name: string) => {
      if (name === "data-key") return "A";
      return null;
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  return element;
};

// Mock localStorage
let localStorageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => localStorageMock[key] || null,
  setItem: (key: string, value: string) => { localStorageMock[key] = value; },
  removeItem: (key: string) => { delete localStorageMock[key]; }
};

describe("WordgetGame", () => {
  let originalDocument: typeof document;
  let originalLocalStorage: typeof localStorage;
  let originalWindow: typeof window;

  beforeEach(() => {
    // Save original objects
    originalDocument = globalThis.document;
    originalLocalStorage = globalThis.localStorage;
    originalWindow = globalThis.window;
    
    // Mock DOM with specific elements for the game
    globalThis.document = {
      getElementById: (id: string) => {
        if (id === "gameBoard" || id === "keyboard" || id === "message") {
          return createMockElement(id);
        }
        // For tile elements, create mock elements with proper IDs
        if (id.startsWith("tile-") || id.startsWith("row-")) {
          return createMockElement(id);
        }
        return null;
      },
      addEventListener: () => {},
      querySelectorAll: () => [],
      createElement: (tagName: string) => {
        const element = createMockElement();
        element.tagName = tagName.toUpperCase();
        return element;
      }
    } as any;
    
    // Mock localStorage
    globalThis.localStorage = mockLocalStorage as any;
    
    // Mock window
    globalThis.window = {
      addEventListener: () => {}
    } as any;
  });

  afterEach(() => {
    // Restore original objects
    globalThis.document = originalDocument;
    globalThis.localStorage = originalLocalStorage;
    globalThis.window = originalWindow;
    localStorageMock = {};
  });

  it("should select a word based on today's date", () => {
    const game1 = new WordgetGame();
    const word1 = game1["state"].targetWord;
    
    // The word should be consistent for the same date
    const game2 = new WordgetGame();
    const word2 = game2["state"].targetWord;
    
    expect(word1).toBe(word2);
  });

  it("should track revealed letters correctly", () => {
    // Create a new game instance
    const game = new WordgetGame();
    
    // Set a known target word for testing
    game["state"].targetWord = "APPLE";
    game["state"].currentRow = 0;
    
    // Mock the game board with rows and tiles
    const mockGameBoard = createMockElement("gameBoard");
    mockGameBoard.querySelectorAll = () => [];
    game["gameBoard"] = mockGameBoard as any;
    
    // Mock keyboard and message elements
    game["keyboard"] = createMockElement("keyboard") as any;
    game["messageElement"] = createMockElement("message") as any;
    
    // Mock getElementById to return proper tile elements
    const originalGetElementById = globalThis.document.getElementById;
    globalThis.document.getElementById = (id: string) => {
      if (id === "gameBoard") return mockGameBoard;
      if (id === "keyboard") return game["keyboard"];
      if (id === "message") return game["messageElement"];
      if (id.startsWith("row-") || id.startsWith("tile-")) {
        return createMockElement(id);
      }
      return null;
    };
    
    // After first guess with no correct letters, no revealed letters
    game["state"].currentGuess = "BBBBB";
    game["submitGuess"]();
    expect(game["state"].revealedLetters.size).toBe(0);
    
    // After guess with some correct letters, those letters should be revealed
    game["state"].currentRow = 1;
    game["state"].currentGuess = "PALEP";
    game["submitGuess"]();
    expect(game["state"].revealedLetters.has("A")).toBe(true);
    expect(game["state"].revealedLetters.has("P")).toBe(true);
    expect(game["state"].revealedLetters.has("L")).toBe(true);
    expect(game["state"].revealedLetters.has("E")).toBe(true);
    
    // Restore original getElementById
    globalThis.document.getElementById = originalGetElementById;
  });

  it("should validate that subsequent guesses include revealed letters", () => {
    // Create a new game instance
    const game = new WordgetGame();
    
    // Set a known target word for testing
    game["state"].targetWord = "APPLE";
    game["state"].currentRow = 0;
    
    // Mock the game board with rows and tiles
    const mockGameBoard = createMockElement("gameBoard");
    mockGameBoard.querySelectorAll = () => [];
    game["gameBoard"] = mockGameBoard as any;
    
    // Mock keyboard and message elements
    game["keyboard"] = createMockElement("keyboard") as any;
    game["messageElement"] = createMockElement("message") as any;
    
    // Mock getElementById to return proper tile elements
    const originalGetElementById = globalThis.document.getElementById;
    globalThis.document.getElementById = (id: string) => {
      if (id === "gameBoard") return mockGameBoard;
      if (id === "keyboard") return game["keyboard"];
      if (id === "message") return game["messageElement"];
      if (id.startsWith("row-") || id.startsWith("tile-")) {
        return createMockElement(id);
      }
      return null;
    };
    
    // First guess reveals some letters
    game["state"].currentGuess = "PALEP";
    game["submitGuess"]();
    
    // Test the includesRevealedLetters method directly
    expect(game.includesRevealedLetters("BBBBB")).toBe(false);
    expect(game.includesRevealedLetters("APPLE")).toBe(true);
    expect(game.includesRevealedLetters("APPLY")).toBe(false);
    
    // Restore original getElementById
    globalThis.document.getElementById = originalGetElementById;
  });

  it("should end the game when the correct word is guessed", () => {
    // Create a new game instance
    const game = new WordgetGame();
    
    // Set a known target word for testing
    game["state"].targetWord = "APPLE";
    game["state"].currentRow = 0;
    
    // Mock the game board with rows and tiles
    const mockGameBoard = createMockElement("gameBoard");
    mockGameBoard.querySelectorAll = () => [];
    game["gameBoard"] = mockGameBoard as any;
    
    // Mock keyboard and message elements
    game["keyboard"] = createMockElement("keyboard") as any;
    game["messageElement"] = createMockElement("message") as any;
    
    // Mock getElementById to return proper tile elements
    const originalGetElementById = globalThis.document.getElementById;
    globalThis.document.getElementById = (id: string) => {
      if (id === "gameBoard") return mockGameBoard;
      if (id === "keyboard") return game["keyboard"];
      if (id === "message") return game["messageElement"];
      if (id.startsWith("row-") || id.startsWith("tile-")) {
        return createMockElement(id);
      }
      return null;
    };
    
    game["state"].currentGuess = "APPLE";
    game["submitGuess"]();
    
    expect(game["state"].won).toBe(true);
    expect(game["state"].gameOver).toBe(true);
    
    // Restore original getElementById
    globalThis.document.getElementById = originalGetElementById;
  });

  it("should end the game after 6 incorrect guesses", () => {
    // Create a new game instance
    const game = new WordgetGame();
    
    // Set a known target word for testing
    game["state"].targetWord = "APPLE";
    
    // Mock the game board with rows and tiles
    const mockGameBoard = createMockElement("gameBoard");
    mockGameBoard.querySelectorAll = () => [];
    game["gameBoard"] = mockGameBoard as any;
    
    // Mock keyboard and message elements
    game["keyboard"] = createMockElement("keyboard") as any;
    game["messageElement"] = createMockElement("message") as any;
    
    // Mock getElementById to return proper tile elements
    const originalGetElementById = globalThis.document.getElementById;
    globalThis.document.getElementById = (id: string) => {
      if (id === "gameBoard") return mockGameBoard;
      if (id === "keyboard") return game["keyboard"];
      if (id === "message") return game["messageElement"];
      if (id.startsWith("row-") || id.startsWith("tile-")) {
        return createMockElement(id);
      }
      return null;
    };
    
    // Make 6 incorrect guesses
    for (let i = 0; i < 6; i++) {
      game["state"].currentRow = i;
      game["state"].currentGuess = "BBBBB";
      game["submitGuess"]();
    }
    
    expect(game["state"].gameOver).toBe(true);
    expect(game["state"].won).toBe(false);
    
    // Restore original getElementById
    globalThis.document.getElementById = originalGetElementById;
  });

  it("should show error and reject guesses not in the dictionary", () => {
    const game = new WordgetGame();
    
    // Set a known target word for testing
    game["state"].targetWord = "APPLE";
    game["state"].currentRow = 0;
    
    // Mock the game board with rows and tiles
    const mockGameBoard = createMockElement("gameBoard");
    mockGameBoard.querySelectorAll = () => [];
    game["gameBoard"] = mockGameBoard as any;
    
    // Mock keyboard and message elements
    game["keyboard"] = createMockElement("keyboard") as any;
    game["messageElement"] = createMockElement("message") as any;
    
    // Mock getElementById to return proper tile elements
    const originalGetElementById = globalThis.document.getElementById;
    globalThis.document.getElementById = (id: string) => {
      if (id === "gameBoard") return mockGameBoard;
      if (id === "keyboard") return game["keyboard"];
      if (id === "message") return game["messageElement"];
      if (id.startsWith("row-") || id.startsWith("tile-")) {
        return createMockElement(id);
      }
      return null;
    };
    
    // Try to submit a word not in the dictionary
    game["state"].currentGuess = "XYZZY";
    game["submitGuess"]();
    
    expect(game["messageElement"].textContent).toBe("Word not in dictionary!");
    expect(game["state"].guesses.length).toBe(0);
    expect(game["state"].currentRow).toBe(0);
    expect(game["state"].currentGuess).toBe("XYZZY");
    
    // Restore original getElementById
    globalThis.document.getElementById = originalGetElementById;
  });
})
