export type ImmersionGameId = "wordle" | "word-ladder" | "lyrics-training";

export type CellState = "correct" | "present" | "absent" | "empty";
export type FinishedState = null | "win" | "lose";

export interface LearnedWord {
  id: string;
  word: string;
  type: "item" | "structure";
  lang?: string;
}

export interface WordleState {
  target: LearnedWord | null;
  guesses: string[];
  current: string;
  finished: FinishedState;
  selectedLang: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface WordLadderState {
  startWord: string;
  goalWord: string;
  solution: string[] | null;
  steps: string[];
  current: string;
  finished: boolean;
  learningMode: boolean;
  selectedLang: string;
  length: 5;
  difficulty?: Difficulty;
}

export interface LyricsTrainingState {
  selectedLang: string;
  videoUrl: string;
  track: string;
  artist: string;
  lrc: string;
  pauseEvery: 1 | 2;
  currentIndex: number;
  score: number;
  streak: number;
}

export type ImmersionState = WordleState | WordLadderState | LyricsTrainingState;

export interface PlayedEntry {
  word: string;
  ts: number;
  success: boolean;
  attempts: number;
  lang: string;
  length: number;
  metadata?: Record<string, unknown>;
}

export interface WordDetails {
  definitions: string[];
  synonyms: string[];
  examples: string[];
}
