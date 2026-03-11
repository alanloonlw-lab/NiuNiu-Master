
import { Card, Suit, Rank, HandType, HandResult, LeaderboardEntry, UserProfile, VisitorInfo } from './types';
import { db, serverTimestamp, handleFirestoreError, OperationType } from './firebase';
import { collection, query, orderBy, limit, getDocs, setDoc, doc, getDoc, updateDoc, increment, addDoc } from 'firebase/firestore';

export const SUITS: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const getVisitorInfo = (): VisitorInfo => {
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer.toLowerCase();
  const refParam = urlParams.get('ref')?.toLowerCase();
  
  let source: VisitorInfo['source'] = 'Web';
  
  if (refParam === 'forum') source = 'Forum';
  else if (refParam === 'facebook' || referrer.includes('facebook.com')) source = 'Facebook';
  else if (refParam === 'tiktok' || referrer.includes('tiktok.com')) source = 'TikTok';
  else if (refParam === 'instagram' || referrer.includes('instagram.com')) source = 'Instagram';
  else if (refParam) source = refParam.charAt(0).toUpperCase() + refParam.slice(1) as any;

  const savedHistory = localStorage.getItem('niu_niu_history');
  const pathHistory = savedHistory ? JSON.parse(savedHistory) : [`Enter App from ${source}`];
  return { source, pathHistory, entryTimestamp: new Date().toISOString() };
};

export const addScore = async (uid: string, displayName: string, chips: number, totalScore: number, email?: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const leaderboardRef = doc(db, 'leaderboard', uid);
    const visitor = getVisitorInfo();
    
    // Update user profile
    try {
      await updateDoc(userRef, {
        chips,
        totalScore: increment(totalScore),
        lastPlayedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }

    // Update leaderboard
    try {
      // Get current totalScore from leaderboard to increment it correctly or just use the updated profile value
      // For simplicity and atomicity, we can just set it if we have the final value, 
      // but since we want cumulative "throughout the game", we should probably increment.
      // However, leaderboard entries are often "best" or "cumulative". 
      // The user said "through out the game", which implies cumulative.
      
      const leaderboardSnap = await getDoc(leaderboardRef);
      const currentTotal = leaderboardSnap.exists() ? (leaderboardSnap.data().totalScore || 0) : 0;
      
      await setDoc(leaderboardRef, {
        uid,
        displayName,
        chips,
        totalScore: currentTotal + totalScore,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `leaderboard/${uid}`);
    }

    // Log detailed submission for admin
    try {
      await addDoc(collection(db, 'submissions'), {
        uid,
        displayName,
        email: email || '',
        chips,
        totalScore,
        source: visitor.source,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'submissions');
    }

    return true;
  } catch (error) {
    console.error("Error adding score:", error);
    return false;
  }
};

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const path = 'leaderboard';
  try {
    const q = query(collection(db, path), orderBy('totalScore', 'desc'), limit(15));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as LeaderboardEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

const SUIT_PRIORITY: Record<Suit, number> = {
  'Spades': 4, 'Hearts': 3, 'Clubs': 2, 'Diamonds': 1, 'None': 0, 
};

const RANK_PRIORITY: Record<Rank, number> = {
  'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, 'A': 1, 'Joker': 14
};

export const HAND_CATEGORY_VALUE: Record<HandType, number> = {
  [HandType.NO_BULL]: 0,
  [HandType.NIU_1]: 1, [HandType.NIU_2]: 2, [HandType.NIU_3]: 3,
  [HandType.NIU_4]: 4, [HandType.NIU_5]: 5, [HandType.NIU_6]: 6,
  [HandType.NIU_7]: 7, [HandType.NIU_8]: 8, [HandType.NIU_9]: 9,
  [HandType.NIU_NIU]: 10, [HandType.JOKER_WIN]: 11, [HandType.NIU_PAIR]: 12,
  [HandType.NIU_MUSHROOM]: 13, [HandType.NIU_KING]: 14,
};

export const recordPath = (event: string) => {
  try {
    const savedHistory = localStorage.getItem('niu_niu_history');
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    history.push(`${new Date().toLocaleTimeString()}: ${event}`);
    localStorage.setItem('niu_niu_history', JSON.stringify(history.slice(-20)));
  } catch (e) {}
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } 
      catch (e) {}
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }
  playSelect() {
    this.init(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.1);
  }
  playDeal() {
    this.init(); if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    noise.connect(gain); gain.connect(this.ctx.destination);
    noise.start();
  }
  playWin() {
    this.init(); if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.frequency.setValueAtTime(f, now + i * 0.1);
      g.gain.setValueAtTime(0.1, now + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
      o.connect(g); g.connect(this.ctx!.destination);
      o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.4);
    });
  }
  playLose() {
    this.init(); if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(110, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.5);
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 0.5);
  }
}
export const sounds = new SoundManager();

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      let value = 0;
      if (rank === 'A') value = 1;
      else if (['10', 'J', 'Q', 'K'].includes(rank)) value = 10;
      else value = parseInt(rank);
      deck.push({ suit, rank, value, id: `${rank}-${suit}-${Math.random()}` });
    });
  });
  deck.push({ suit: 'None', rank: 'Joker', value: 10, id: `Joker-${Math.random()}` });
  return deck;
};

export const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const getHandScore = (type: HandType, cards: Card[], group2?: Card[]): number => {
  let highRank = 0;
  let highSuit = 0;
  if (type === HandType.NIU_PAIR && group2) {
    highRank = RANK_PRIORITY[group2[0].rank];
    highSuit = Math.max(SUIT_PRIORITY[group2[0].suit], SUIT_PRIORITY[group2[1].suit]);
  } else {
    cards.forEach(c => {
      const r = RANK_PRIORITY[c.rank];
      const s = SUIT_PRIORITY[c.suit];
      if (r > highRank) { highRank = r; highSuit = s; }
      else if (r === highRank && s > highSuit) { highSuit = s; }
    });
  }
  return (HAND_CATEGORY_VALUE[type] * 1000) + (highRank * 10) + highSuit;
};

const getCardValues = (card: Card): number[] => {
  if (card.rank === '3') return [3, 6];
  if (card.rank === '6') return [6, 3];
  if (card.rank === 'Joker') return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return [card.value];
};

const evaluateFixed3And2 = (group3: Card[], group2: Card[], allCards: Card[], values3: number[], values2: number[]): HandResult => {
  const sum3 = values3.reduce((s, v) => s + v, 0);
  if (sum3 % 10 !== 0) return { type: HandType.NO_BULL, score: getHandScore(HandType.NO_BULL, allCards), multiplier: 0, bestCombo: [] };

  const hasJoker = allCards.some(c => c.rank === 'Joker');
  const allFace = allCards.every(c => ['J', 'Q', 'K', 'Joker'].includes(c.rank));
  if (allFace) return { type: HandType.NIU_KING, score: getHandScore(HandType.NIU_KING, allCards), multiplier: 15, bestCombo: [] };

  const isMushroom = (group2.some(c => ['J', 'Q', 'K', 'Joker'].includes(c.rank)) && group2.some(c => c.rank === 'A' && c.suit === 'Spades'));
  if (isMushroom) return { type: HandType.NIU_MUSHROOM, score: getHandScore(HandType.NIU_MUSHROOM, allCards), multiplier: 10, bestCombo: [] };

  const isPair = group2[0].rank === group2[1].rank || group2[0].rank === 'Joker' || group2[1].rank === 'Joker';
  if (isPair) {
    const pairRankCard = group2[0].rank === 'Joker' ? group2[1] : group2[0];
    return { type: HandType.NIU_PAIR, score: getHandScore(HandType.NIU_PAIR, allCards, [pairRankCard, pairRankCard]), multiplier: 5, bestCombo: [] };
  }

  const sum2 = values2.reduce((s, v) => s + v, 0);
  const niuVal = sum2 % 10 === 0 ? 10 : sum2 % 10;
  if (niuVal === 10) {
    const type = hasJoker ? HandType.JOKER_WIN : HandType.NIU_NIU;
    return { type, score: getHandScore(type, allCards), multiplier: hasJoker ? 4 : 3, bestCombo: [] };
  }
  const type = (HandType as any)[`NIU_${niuVal}`];
  return { type, score: getHandScore(type, allCards), multiplier: 1, bestCombo: [] };
};

const evaluateMulti3And2 = (group3: Card[], group2: Card[], allCards: Card[]): HandResult => {
  const possibleValues3 = group3.map(getCardValues);
  const possibleValues2 = group2.map(getCardValues);
  let best: HandResult = { type: HandType.NO_BULL, score: -1, multiplier: 0, bestCombo: [] };
  for (const v1 of possibleValues3[0]) {
    for (const v2 of possibleValues3[1]) {
      for (const v3 of possibleValues3[2]) {
        for (const v4 of possibleValues2[0]) {
          for (const v5 of possibleValues2[1]) {
            const res = evaluateFixed3And2(group3, group2, allCards, [v1, v2, v3], [v4, v5]);
            if (res.score > best.score) best = res;
          }
        }
      }
    }
  }
  return best;
};

export const findBestNiu = (cards: Card[]): HandResult => {
  let best: HandResult = { type: HandType.NO_BULL, score: -1, multiplier: 0, bestCombo: [] };
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      for (let k = j + 1; k < 5; k++) {
        const group3 = [cards[i], cards[j], cards[k]];
        const group2 = cards.filter((_, idx) => idx !== i && idx !== j && idx !== k);
        const res = evaluateMulti3And2(group3, group2, cards);
        if (res.score > best.score) best = { ...res, bestCombo: [i, j, k] };
      }
    }
  }
  if (best.score === -1) return { type: HandType.NO_BULL, score: getHandScore(HandType.NO_BULL, cards), multiplier: 0, bestCombo: [] };
  return best;
};

export const evaluatePlayerSelection = (cards: Card[], selectedIndices: number[]): HandResult => {
  if (selectedIndices.length !== 3) return { type: HandType.NO_BULL, score: getHandScore(HandType.NO_BULL, cards), multiplier: 0, bestCombo: [] };
  const group3 = selectedIndices.map(i => cards[i]);
  const group2 = cards.filter((_, i) => !selectedIndices.includes(i));
  return evaluateMulti3And2(group3, group2, cards);
};

export const getSuitIcon = (suit: Suit) => {
  switch (suit) {
    case 'Spades': return { color: 'text-stone-950' };
    case 'Hearts': return { color: 'text-red-700' };
    case 'Diamonds': return { color: 'text-red-600' };
    case 'Clubs': return { color: 'text-stone-900' };
    default: return { color: 'text-indigo-600' };
  }
};
