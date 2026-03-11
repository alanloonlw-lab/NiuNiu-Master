
export type Suit = 'Spades' | 'Hearts' | 'Diamonds' | 'Clubs' | 'None';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'Joker';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  id: string;
}

export enum GamePhase {
  BETTING = 'BETTING',
  DEALING = 'DEALING',
  SELECTING = 'SELECTING',
  SHOWDOWN = 'SHOWDOWN',
  RESULT = 'RESULT'
}

export enum GameMode {
  NORMAL = 'NORMAL',
  EXPERT = 'EXPERT'
}

export enum HandType {
  NO_BULL = 'No Bull',
  NIU_1 = 'Niu 1',
  NIU_2 = 'Niu 2',
  NIU_3 = 'Niu 3',
  NIU_4 = 'Niu 4',
  NIU_5 = 'Niu 5',
  NIU_6 = 'Niu 6',
  NIU_7 = 'Niu 7',
  NIU_8 = 'Niu 8',
  NIU_9 = 'Niu 9',
  NIU_NIU = 'Niu Niu',
  JOKER_WIN = 'Joker Bull',
  NIU_PAIR = 'Niu Pair',
  NIU_MUSHROOM = 'Niu Mushroom',
  NIU_KING = 'Niu King (牛魔王)'
}

export interface HandResult {
  type: HandType;
  score: number;
  multiplier: number;
  bestCombo: number[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  chips: number;
  totalScore: number;
  totalWins: number;
  totalGames: number;
  createdAt: any;
  lastPlayedAt: any;
}

export interface VisitorInfo {
  source: 'Facebook' | 'TikTok' | 'Instagram' | 'Web' | 'Other' | 'Forum';
  pathHistory: string[];
  entryTimestamp: string;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  chips: number;
  totalScore: number;
  rank?: number;
  isPlayer?: boolean;
}
