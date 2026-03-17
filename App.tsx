
import React, { Component, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, Card, HandResult, HandType, LeaderboardEntry, UserProfile, VisitorInfo } from './types';
import { createDeck, shuffle, findBestNiu, evaluatePlayerSelection, sounds, HAND_CATEGORY_VALUE, recordPath, addScore, fetchLeaderboard, getVisitorInfo } from './utils';
import { getGameTip } from './gemini';
import CardUI from './components/CardUI';
import ShareModal from './components/ShareModal';
import Leaderboard from './components/Leaderboard';
import RulesModal from './components/RulesModal';
import Logo from './components/Logo';
import AdminDashboard from './components/AdminDashboard';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
// Removed Facebook service import

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsedError = JSON.parse(this.state.error.message);
        if (parsedError.error) {
          errorMessage = `Database Error: ${parsedError.error} (Operation: ${parsedError.operationType})`;
        }
      } catch (e) {
        errorMessage = this.state.error.message || "An unexpected error occurred.";
      }

      return (
       <ErrorBoundary>
        {/* 1. OVERLAYS (Modals & Alerts) - Render first so they sit on top */}
        {showShareRequired && ( /* ... existing share required modal code ... */ )}

        {/* 2. MAIN CONTAINER - Fixed Height to prevent scroll */}
        <div className={`h-screen w-full overflow-hidden flex flex-col bg-casino-felt text-white font-sans relative ${isCriticalTimer ? 'animate-shake vignette-critical' : ''}`}>
        
         {/* --- HEADER (Compact) --- */}
         <header className="shrink-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5 px-2 py-2 sm:py-4">
          <div className="max-w-5xl mx-auto grid grid-cols-3 items-center">
            
            {/* Left: Wallet & Menu */}
            <div className="flex items-center gap-2 justify-self-start">
              <div className="bg-stone-900/80 rounded-lg px-2 py-1 sm:px-4 sm:py-2 border border-white/10 shadow-inner">
                <div className="text-[8px] sm:text-[10px] text-stone-400 font-bold">CHIPS</div>
                <div className="text-sm sm:text-xl font-black gold-text leading-none">{balance.toLocaleString()}</div>
              </div>
              <button onClick={() => setIsLeaderboardOpen(true)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-yellow-500 active:scale-90">
                <i className="fa-solid fa-trophy text-sm sm:text-base"></i>
              </button>
            </div>

            {/* Center: Logo & Round */}
            <div className="flex flex-col items-center justify-self-center pointer-events-none">
              <div className="text-[8px] sm:text-xs font-bold text-stone-500 tracking-widest">ROUND {round}/{MAX_ROUNDS}</div>
              {/* You can replace this text with your <Logo /> component if desired, set scale small */}
              <div className="cinzel text-lg sm:text-2xl font-black gold-text">NIU NIU</div>
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-2 justify-self-end">
              <button onClick={() => setShowShareModal(true)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg active:scale-90">
                 <i className="fa-solid fa-share-nodes text-sm sm:text-base text-white"></i>
              </button>
              {user ? (
                 <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-white/20" alt="User" />
              ) : (
                <button onClick={() => setIsLoginSelectionOpen(true)} className="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 rounded-lg text-[10px] sm:text-xs font-bold">Login</button>
              )}
            </div>
          </div>
        </header>

        {/* --- MAIN GAME AREA (Grows to fill space) --- */}
        <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden px-2 py-4 gap-4">
          
          {/* Dealer Section (Top of Middle) */}
          <div className="w-full flex flex-col items-center shrink-0">
             <div className="text-[10px] sm:text-xs font-bold text-stone-500 tracking-widest mb-2">BANKER</div>
             <div className="flex gap-1 sm:gap-2">
                {/* Dealer Cards Logic Here */}
                {dealerHand.length > 0 ? dealerHand.map((c) => <CardUI key={c.id} card={c} isFlipped={phase === GamePhase.RESULT} />) : /* Placeholder cards */}
             </div>
             {phase === GamePhase.RESULT && dealerResult && (
               <div className="mt-2 px-4 py-1 bg-red-600 rounded-full text-xs sm:text-sm font-bold border border-white/20 shadow-lg">{dealerResult.type}</div>
             )}
          </div>

          {/* Center Status (Timer / Result / Message) */}
          <div className="flex flex-col items-center justify-center text-center py-4">
             {phase === GamePhase.SELECTING ? (
                <div className="text-5xl sm:text-7xl font-black text-yellow-400 drop-shadow-lg">{timeLeft}s</div>
             ) : phase === GamePhase.RESULT ? (
                <div className="animate-in zoom-in">
                   <div className="text-2xl sm:text-4xl font-black cinzel gold-text mb-2">{message}</div>
                   {payout > 0 && <div className="text-xl sm:text-3xl text-green-400 font-bold">+{payout}</div>}
                </div>
             ) : (
                <div className="text-stone-500 text-sm font-bold uppercase tracking-widest animate-pulse">Place Your Bet</div>
             )}
          </div>

          {/* Player Section (Bottom of Middle) */}
          <div className="w-full flex flex-col items-center shrink-0">
             <div className="flex gap-1 sm:gap-2">
                {/* Player Cards Logic Here */}
                {playerHand.length > 0 ? playerHand.map((c, i) => ( 
                   <CardUI key={c.id} card={c} isFlipped={true} isSelected={selectedIndices.includes(i)} onClick={() => { /* selection logic */ }} /> 
                )) : /* Placeholder cards */}
             </div>
             <div className="text-[10px] sm:text-xs font-bold text-stone-500 tracking-widest mt-2">
                {user?.displayName || 'PLAYER'}
             </div>
             {phase === GamePhase.RESULT && playerResult && (
               <div className="mt-2 px-4 py-1 bg-yellow-500 text-black rounded-full text-xs sm:text-sm font-bold shadow-lg">{playerResult.type}</div>
             )}
          </div>

        </main>

        {/* --- FOOTER (Fixed at Bottom) --- */}
        <footer className="shrink-0 z-40 bg-stone-900/80 backdrop-blur-xl border-t border-white/10 px-2 py-4 sm:py-6">
          <div className="max-w-lg mx-auto">
            {phase === GamePhase.BETTING ? (
               <div className="flex flex-col gap-3">
                  {/* Betting Chips Horizontal Scroll */}
                  <div className="flex justify-center gap-2 flex-wrap">
                    {BET_INCREMENTS.map(val => (
                       <button key={val} onClick={() => setBet(b => b + val)} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 border border-white/20 rounded-xl text-xs sm:text-base font-bold active:scale-90">
                         +{val}
                       </button>
                    ))}
                  </div>
                  <button onClick={handleDeal} className="w-full py-3 sm:py-4 red-gradient rounded-xl text-lg sm:text-2xl font-black uppercase shadow-lg active:scale-95 disabled:opacity-30" disabled={bet <= 0}>
                    DEAL {bet > 0 && <span className="text-yellow-300">({bet})</span>}
                  </button>
               </div>
            ) : phase === GamePhase.SELECTING ? (
               <button onClick={handleConfirm} className="w-full py-4 gold-gradient rounded-xl text-lg sm:text-2xl font-black uppercase shadow-lg active:scale-95">
                 {selectedIndices.length === 3 ? 'CONFIRM' : 'SELECT 3'}
               </button>
            ) : (
               <button onClick={nextRound} className="w-full py-4 gold-gradient rounded-xl text-lg sm:text-2xl font-black uppercase shadow-lg active:scale-95">
                 NEXT ROUND
               </button>
            )}
          </div>
        </footer>

      </div>
    </ErrorBoundary>
);
const INITIAL_BALANCE = 3000;
const MAX_ROUNDS = 20;
const BET_INCREMENTS = [10, 50, 100, 500, 1000, 5000, 10000, 50000];

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [bet, setBet] = useState(0);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.BETTING);
  const [round, setRound] = useState(1);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [playerResult, setPlayerResult] = useState<HandResult | null>(null);
  const [dealerResult, setDealerResult] = useState<HandResult | null>(null);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [payout, setPayout] = useState(0);
  const [bankerWinAmount, setBankerWinAmount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [lastSharedAt, setLastSharedAt] = useState<number>(() => {
    const saved = localStorage.getItem('niu_niu_last_shared');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showShareRequired, setShowShareRequired] = useState(false);
  const [shareCount, setShareCount] = useState<number>(() => {
    const saved = localStorage.getItem('niu_niu_share_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [isGameOver, setIsGameOver] = useState(false); 
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState(localStorage.getItem('niu_player_name') || '');
  const [playerEmail, setPlayerEmail] = useState(localStorage.getItem('niu_player_email') || '');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isRareWin, setIsRareWin] = useState(false);
  const [showSpeedAlert, setShowSpeedAlert] = useState(false);
  const [aiTip, setAiTip] = useState('');
  const [isFetchingTip, setIsFetchingTip] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isLoginSelectionOpen, setIsLoginSelectionOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  const [visitorInfo] = useState<VisitorInfo>(getVisitorInfo());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRegistered = playerEmail.includes('@') && playerEmail.includes('.');

  const getRoundTimeLimit = (r: number) => {
    if (r <= 10) return 10;
    if (r <= 17) return 6;
    return 4;
  };

  useEffect(() => {
    recordPath('App Launched');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setUserProfile(data);
            // Ensure player has at least 10 chips to play
            const initialChips = data.chips < 10 ? INITIAL_BALANCE : data.chips;
            setBalance(initialChips);
            setCustomName(data.displayName || firebaseUser.displayName || 'Player');
            
            // If we auto-refilled, update the DB
            if (data.chips < 10) {
              await updateDoc(userRef, { chips: INITIAL_BALANCE });
            }
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Player',
              photoURL: firebaseUser.photoURL || '',
              chips: INITIAL_BALANCE,
              totalScore: 0,
              totalWins: 0,
              totalGames: 0,
              createdAt: serverTimestamp(),
              lastPlayedAt: serverTimestamp()
            };
            setCustomName(newProfile.displayName);
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
            setBalance(INITIAL_BALANCE);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUserProfile(null);
        setBalance(INITIAL_BALANCE);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      sounds.playSelect();
      await signInWithPopup(auth, googleProvider);
      setIsLoginSelectionOpen(false);
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage = error.message || "";
      const errorCode = error.code || "";
      
      if (errorCode === 'auth/popup-closed-by-user' || errorMessage.includes('auth/popup-closed-by-user')) {
        setLoginError("Login window was closed. Please try again and keep the window open.");
      } else if (errorCode === 'auth/cancelled-popup-request' || errorMessage.includes('auth/cancelled-popup-request')) {
        // Ignore, this happens if multiple popups are triggered
      } else if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('auth/operation-not-allowed')) {
        setLoginError(`Google login is not enabled in the Firebase Console. Please enable it in the Authentication > Sign-in method tab.`);
      } else {
        setLoginError(`Login failed: ${errorMessage || "Please check your internet connection or try again later."}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      sounds.playSelect();
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const loadLeaderboardData = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    const entries = await fetchLeaderboard();
    setLeaderboard(entries);
    setIsLoadingLeaderboard(false);
  }, []);

  useEffect(() => {
    if (isLeaderboardOpen) loadLeaderboardData();
  }, [isLeaderboardOpen, loadLeaderboardData]);

  const handleTimeUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const actualDealerResult = findBestNiu(dealerHand);
    setDealerResult(actualDealerResult);
    setPlayerResult({ type: HandType.NO_BULL, score: -1, multiplier: 0, bestCombo: [] });
    
    sounds.playLose();
    const multiplier = actualDealerResult.multiplier || 1;
    const totalLoss = bet * multiplier;
    const newBalance = Math.max(0, balance - (totalLoss - bet));
    setBalance(newBalance);
    setBankerWinAmount(totalLoss);
    setMessage('TOO SLOW! LOSS');
    setPhase(GamePhase.RESULT);

    if (newBalance < 10) {
      setIsBankrupt(true);
      setIsGameOver(true);
    } else if (round >= MAX_ROUNDS) {
      setIsGameOver(true);
    }
  }, [dealerHand, bet, balance, round]);

  useEffect(() => {
    if (phase === GamePhase.SELECTING && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleTimeUp();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft, handleTimeUp]);

  useEffect(() => {
    if (round === 11 || round === 18) {
      setShowSpeedAlert(true);
      const timer = setTimeout(() => setShowSpeedAlert(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [round]);

  const handleDeal = () => {
    if (bet <= 0 || balance < bet) return;
    sounds.playDeal();
    setBalance(prev => prev - bet);
    const deck = shuffle(createDeck());
    const dHand = deck.slice(0, 5);
    const pHand = deck.slice(5, 10);
    setDealerHand(dHand);
    setPlayerHand(pHand);
    setSelectedIndices([]);
    setPhase(GamePhase.SELECTING);
    setMessage('Match 3 Cards');
    setBankerWinAmount(0);
    setPayout(0);
    setIsRareWin(false);
    setTimeLeft(getRoundTimeLimit(round));
    setAiTip('');
    
    // Fetch AI Tip
    const pHandStr = pHand.map(c => `${c.rank}${c.suit}`).join(', ');
    const dHandStr = dHand.slice(0, 2).map(c => `${c.rank}${c.suit}`).join(', '); // Only show 2 dealer cards to AI for "visible" context
    setIsFetchingTip(true);
    getGameTip(pHandStr, dHandStr).then(tip => {
      setAiTip(tip);
      setIsFetchingTip(false);
    });
  };

  const handleConfirm = useCallback(() => {
    if (selectedIndices.length !== 3) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const pResult = evaluatePlayerSelection(playerHand, selectedIndices);
    const dResult = findBestNiu(dealerHand);
    setDealerResult(dResult);
    setPlayerResult(pResult);

    const pVal = HAND_CATEGORY_VALUE[pResult.type];
    const dVal = HAND_CATEGORY_VALUE[dResult.type];

    let newBalance = balance;
    let isWin = false;
    let isTie = false;

    if (pVal > dVal) {
      isWin = true;
    } else if (pVal === dVal && pVal > 0) {
      isTie = true; 
    } else if (pVal === 0 && dVal === 0) {
        if (pResult.score > dResult.score) isWin = true;
        else if (pResult.score === dResult.score) isTie = true;
        else isWin = false;
    } else {
        isWin = false;
    }

    if (isWin) {
      sounds.playWin();
      const hasJoker = playerHand.some(c => c.rank === 'Joker');
      let baseWinnings = bet * pResult.multiplier;
      if (hasJoker) baseWinnings = Math.floor(baseWinnings * 1.5);
      
      setPayout(baseWinnings);
      newBalance = balance + bet + baseWinnings;
      setTotalEarnings(prev => prev + baseWinnings);
      setMessage(hasJoker ? `WILD ${pResult.type}!` : `${pResult.type.toUpperCase()}`);
      
      if ([HandType.NIU_PAIR, HandType.NIU_MUSHROOM, HandType.NIU_KING].includes(pResult.type)) {
        setIsRareWin(true);
      }
    } else if (isTie) {
      sounds.playSelect();
      setMessage('TIE!');
      newBalance = balance + bet;
    } else {
      sounds.playLose();
      const mult = dResult.multiplier || 1;
      const totalLoss = bet * mult;
      newBalance = Math.max(0, balance - (totalLoss - bet));
      setBankerWinAmount(totalLoss);
      setMessage('BANKER WINS');
    }

    setBalance(newBalance);
    setPhase(GamePhase.RESULT);

    if (round >= MAX_ROUNDS) {
      setIsGameOver(true);
    } else if (newBalance < 10) {
      setIsBankrupt(true);
      setIsGameOver(true);
    }
  }, [selectedIndices, playerHand, dealerHand, bet, round, balance]);

  const nextRound = () => {
    sounds.playSelect();
    setRound(prev => prev + 1);
    setPhase(GamePhase.BETTING);
    setBet(0);
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerResult(null);
    setDealerResult(null);
    setIsRareWin(false);
  };

  const handleSubmitScore = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    setIsSubmittingScore(true);
    
    // Save to Firestore via utility
    await addScore(user.uid, customName || user.displayName || 'Player', balance, totalEarnings, user.email || undefined);
    
    setIsSubmittingScore(false);
    setShowNameModal(false);
    
    // Unlimited play logic: if registered (email provided), skip share modal
    if (user.email) {
      resetGame();
    } else {
      setShowShareModal(true); 
    }
  };

  const resetGame = async () => {
    // Guest logic: require share or login
    if (!user) {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      if (now - lastSharedAt > oneHour) {
        setShowShareRequired(true);
        return;
      }
    }

    setBalance(INITIAL_BALANCE);
    setTotalEarnings(0);
    setRound(1);
    setPhase(GamePhase.BETTING);
    setBet(0);
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerResult(null);
    setDealerResult(null);
    setIsGameOver(false);
    setIsBankrupt(false);
    setIsRareWin(false);
    setBankerWinAmount(0);
    setPayout(0);

    // Sync reset to Firestore if logged in
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          chips: INITIAL_BALANCE,
          lastPlayedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Failed to sync reset:", error);
      }
    }
  };

  const isCriticalTimer = phase === GamePhase.SELECTING && timeLeft > 0 && timeLeft <= 3;
  const isExtremeIntensity = round > 17;

  const handleLogoClick = () => {
    setLogoClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdminOpen(true);
        return 0;
      }
      return next;
    });
    // Reset click count after 2 seconds of inactivity
    setTimeout(() => setLogoClickCount(0), 2000);
  };

  const handleShareSuccess = () => {
    const now = Date.now();
    setLastSharedAt(now);
    localStorage.setItem('niu_niu_last_shared', now.toString());
    
    // Increment share count
    const newCount = shareCount + 1;
    setShareCount(newCount);
    localStorage.setItem('niu_niu_share_count', newCount.toString());

    setShowShareRequired(false);
    resetGame();
  };

  return (
    <ErrorBoundary>
      {showShareRequired && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="max-w-md w-full bg-stone-900 border-2 border-yellow-500/30 rounded-[2.5rem] p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.1)]">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
              <i className="fa-solid fa-share-nodes text-3xl text-yellow-500"></i>
            </div>
            <h2 className="cinzel text-3xl text-white mb-2">Share to Continue</h2>
            <p className="text-stone-400 text-sm mb-8 leading-relaxed">
              Guests can play for 1 hour after sharing. 
              <br/>
              <span className="text-yellow-500/80 font-bold">Login to unlock unlimited play forever!</span>
            </p>
            
            <div className="space-y-4">
              <button 
                disabled={isLoggingIn}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl text-lg hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl" 
                onClick={() => setIsLoginSelectionOpen(true)}
              >
                <i className="fa-solid fa-right-to-bracket"></i> 
                LOGIN FOR UNLIMITED PLAY
              </button>
              
              <button 
                onClick={() => setShowShareModal(true)}
                className="w-full gold-gradient py-4 rounded-2xl text-stone-900 font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
              >
                Share to Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-screen h-screen overflow-hidden flex flex-col items-center bg-casino-felt text-white font-sans transition-all duration-700 ${isCriticalTimer ? 'animate-shake vignette-critical' : ''}`}>
      <header className="game-header w-full bg-black/60 backdrop-blur-2xl border-b border-white/5 shrink-0 z-50 relative px-2 sm:px-4 py-1.5 sm:py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-1">
          {/* Left: Bank Info */}
          <div className="flex items-center gap-1 sm:gap-2 justify-self-start">
            <div className="bg-stone-900/80 border border-white/10 rounded-lg sm:rounded-2xl px-2 py-1 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[6px] sm:text-[10px] font-black text-stone-500 uppercase tracking-widest">Wallet</span>
                <span className="text-[10px] sm:text-lg font-black gold-text leading-none">{balance.toLocaleString()}</span>
              </div>
              <div className="w-[1px] h-3 sm:h-6 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-[6px] sm:text-[10px] font-black text-yellow-500/50 uppercase tracking-widest">Earned</span>
                <span className="text-[10px] sm:text-lg font-black text-yellow-400 leading-none">{totalEarnings.toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={() => { sounds.playSelect(); setIsLeaderboardOpen(true); }} 
              className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg sm:rounded-xl hover:bg-yellow-500/20 transition-all active:scale-90"
            >
              <i className="fa-solid fa-trophy text-[10px] sm:text-base"></i>
            </button>
          </div>

          {/* Center: Logo & Round */}
          <div className="flex flex-col items-center justify-self-center pointer-events-none">
            <Logo onClick={handleLogoClick} className="scale-[0.35] sm:scale-75 md:scale-90 pointer-events-auto" />
            <div className={`text-[6px] sm:text-[10px] font-black tracking-[0.2em] uppercase transition-colors -mt-2 sm:mt-0 ${isExtremeIntensity ? 'text-red-500 animate-pulse' : 'text-yellow-500/40'}`}>
              R{round}/{MAX_ROUNDS}
            </div>
          </div>

          {/* Right: User & Actions */}
          <div className="flex items-center gap-1 sm:gap-3 justify-self-end">
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                  <button onClick={handleLogout} className="text-[10px] font-black text-stone-500 uppercase hover:text-white">Logout</button>
                </div>
              ) : (
                <button 
                  disabled={isLoggingIn}
                  onClick={() => setIsLoginSelectionOpen(true)} 
                  className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-lg hover:bg-blue-700 transition-all uppercase disabled:opacity-50"
                >
                  Login
                </button>
              )}
            </div>

            <button 
              onClick={() => { sounds.playSelect(); setShowShareModal(true); }}
              className="px-1.5 sm:px-4 h-7 sm:h-10 flex items-center justify-center bg-white/5 text-white border border-white/10 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all active:scale-90 gap-1 sm:gap-2"
            >
              <i className="fa-solid fa-share-nodes text-[10px] sm:text-sm"></i>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest hidden lg:inline">Share</span>
              <div className="bg-white/10 px-1 rounded text-[7px] sm:text-[9px] font-black">{shareCount}</div>
            </button>

            <button 
              onClick={() => { sounds.playSelect(); setIsRulesOpen(true); }}
              className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 text-stone-400 border border-white/10 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all active:scale-90"
            >
              <i className="fa-solid fa-circle-info text-[10px] sm:text-base"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Persistent Floating Rules Button - High Visibility */}
      <button 
        onClick={() => { sounds.playSelect(); setIsRulesOpen(true); }}
        className="fixed left-2 top-16 sm:left-4 sm:top-28 z-[60] flex items-center gap-2 bg-black/40 border border-yellow-500/50 text-yellow-500 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full backdrop-blur-md shadow-lg hover:bg-yellow-500/20 hover:scale-105 transition-all animate-pulse duration-[3s]"
      >
        <i className="fa-solid fa-circle-info text-xs sm:text-lg"></i>
        <span className="text-[8px] sm:text-xs font-black uppercase tracking-widest hidden sm:inline">How to Play</span>
      </button>

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col justify-center gap-2 sm:gap-4 items-center px-2 sm:px-8 relative py-2 sm:py-4 overflow-y-auto no-scrollbar">
        {showSpeedAlert && (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-md animate-in fade-in zoom-in duration-300">
             <div className="text-center p-6 sm:p-10 bg-stone-900/95 rounded-[2rem] sm:rounded-[4rem] border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                <div className="cinzel text-3xl sm:text-7xl font-black text-red-500 animate-bounce tracking-tighter drop-shadow-2xl">SPEED UP!</div>
             </div>
          </div>
        )}

        {/* Banker Section */}
        <div className="w-full flex flex-col items-center relative group shrink-0 py-2">
          <div className="text-[8px] sm:text-[12px] font-black text-stone-500 uppercase tracking-[0.4em] mb-2 sm:mb-6 flex items-center gap-3 sm:gap-6">
            <span className="w-6 sm:w-16 h-[1px] bg-stone-800"></span>
            BANKER
            <span className="w-6 sm:w-16 h-[1px] bg-stone-800"></span>
          </div>
          {phase === GamePhase.RESULT && dealerResult && (
             <div className="absolute -top-4 sm:-top-10 bg-red-600 text-white px-4 py-1 sm:px-6 sm:py-2.5 rounded-full text-[10px] sm:text-[14px] font-black cinzel z-20 animate-in zoom-in shadow-2xl border border-white/20 ring-4 ring-black/50">{dealerResult.type}</div>
          )}
          <div className="flex gap-1.5 sm:gap-4 justify-center items-center">
            {dealerHand.length > 0 ? dealerHand.map((c) => <CardUI key={c.id} card={c} isFlipped={phase === GamePhase.RESULT} />) : [...Array(5)].map((_, i) => <CardUI key={i} isFlipped={false} className="opacity-10 scale-90" />)}
          </div>
        </div>

        {/* Center Info Section */}
        <div className="center-info-section h-20 sm:h-32 flex flex-col items-center justify-center text-center z-20 shrink-0">
          {phase === GamePhase.SELECTING ? (
            <div className={`flex flex-col items-center transition-transform duration-300 ${timeLeft <= 2 ? 'scale-110 sm:scale-125' : ''}`}>
              <div className={`text-4xl sm:text-8xl font-black tabular-nums drop-shadow-[0_0_30px_rgba(0,0,0,0.6)] ${timeLeft <= 2 ? 'text-red-600 animate-pulse' : 'text-yellow-400'}`}>{timeLeft}s</div>
              <div className="text-[10px] sm:text-sm font-black uppercase tracking-[0.3em] mt-1 text-stone-400">Match 3 Cards</div>
              {aiTip && (
                <div className="mt-1 sm:mt-3 px-4 py-1.5 sm:px-8 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 shadow-2xl max-w-[240px] sm:max-w-xl">
                  <span className="text-[8px] sm:text-[12px] font-bold text-blue-300 italic leading-tight sm:leading-relaxed">Coach: {aiTip}</span>
                </div>
              )}
              {isFetchingTip && !aiTip && (
                <div className="mt-2 sm:mt-6 text-[8px] sm:text-[12px] text-blue-400/40 animate-pulse uppercase font-black tracking-widest">Consulting Coach...</div>
              )}
            </div>
          ) : phase === GamePhase.RESULT ? (
            <div className="animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-500 flex flex-col items-center">
              <div className="text-xl sm:text-5xl font-black cinzel gold-text uppercase drop-shadow-[0_5px_20px_rgba(0,0,0,0.8)] leading-tight mb-1 tracking-tighter">{message}</div>
              {payout > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-6xl font-black text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]">+{payout.toLocaleString()}</div>
                  <button 
                    onClick={() => {
                      sounds.playSelect();
                      setShowShareModal(true);
                    }}
                    className="mt-2 sm:mt-4 px-5 py-2 sm:px-8 sm:py-3 bg-white/10 text-white rounded-full font-black text-[9px] sm:text-xs uppercase flex items-center gap-2 hover:bg-white/20 transition-all shadow-xl active:scale-95"
                  >
                    <i className="fa-solid fa-share-nodes"></i>
                    Share Win
                  </button>
                </div>
              ) : bankerWinAmount > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-6xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">-{bankerWinAmount.toLocaleString()}</div>
                  {isBankrupt && (
                    <button 
                      onClick={() => {
                        sounds.playSelect();
                        setShowNameModal(true);
                      }}
                      className="mt-2 sm:mt-4 px-5 py-2 sm:px-8 sm:py-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-full font-black text-[9px] sm:text-xs uppercase flex items-center gap-2 hover:bg-red-500/30 transition-all shadow-xl active:scale-95 animate-pulse"
                    >
                      <i className="fa-solid fa-trophy"></i>
                      Save Record & Restart
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:gap-8">
              <Logo className="opacity-10 scale-75 sm:scale-150 grayscale" />
              <div className="text-[10px] sm:text-sm font-black text-stone-600 uppercase tracking-[0.4em] sm:tracking-[0.6em] animate-pulse">Place your bet to begin</div>
            </div>
          )}
        </div>

        {/* Player Section */}
        <div className="w-full flex flex-col items-center relative group shrink-0 py-2">
          {phase === GamePhase.RESULT && playerResult && (
             <div className="absolute -top-4 sm:-top-10 bg-yellow-500 text-black px-4 py-1 sm:px-6 sm:py-2.5 rounded-full text-[10px] sm:text-[14px] font-black cinzel z-20 animate-in zoom-in shadow-2xl border border-black/10 ring-4 ring-black/50">{playerResult.type}</div>
          )}
          <div className="flex gap-1.5 sm:gap-4 justify-center items-center">
            {playerHand.length > 0 ? playerHand.map((c, i) => (
              <CardUI key={c.id} card={c} isFlipped={true} isSelected={selectedIndices.includes(i)}
                onClick={() => { if (phase === GamePhase.SELECTING) { sounds.playSelect(); setSelectedIndices(prev => prev.includes(i) ? prev.filter(x => x !== i) : (prev.length < 3 ? [...prev, i] : prev)); } }} />
            )) : [...Array(5)].map((_, i) => <CardUI key={i} isFlipped={false} className="opacity-10 scale-90" />)}
          </div>
          <div className="text-[8px] sm:text-[12px] font-black text-stone-500 uppercase tracking-[0.4em] mt-3 sm:mt-8 flex items-center gap-3 sm:gap-6">
             <span className="w-6 sm:w-16 h-[1px] bg-stone-800"></span>
             {user?.displayName || 'CHALLENGER'}
             <span className="w-6 sm:w-16 h-[1px] bg-stone-800"></span>
          </div>
        </div>
      </main>

      <footer className="game-footer w-full max-w-5xl mx-auto bg-black/80 px-4 py-4 sm:px-10 sm:py-8 rounded-t-[2rem] sm:rounded-t-[4rem] border-t border-white/10 shrink-0 shadow-[0_-30px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl z-40">
        {phase === GamePhase.BETTING ? (
          <div className="flex flex-col gap-3 sm:gap-6">
            <div className="flex overflow-x-auto sm:flex-wrap justify-start sm:justify-center gap-2 sm:gap-3 pb-2 sm:pb-0 no-scrollbar mask-fade-edges">
              {BET_INCREMENTS.map(val => (
                <button 
                  key={val} 
                  disabled={balance < (bet + val)} 
                  className="shrink-0 px-3 py-2 sm:px-8 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl font-black transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-10 text-[10px] sm:text-base active:scale-90 shadow-2xl" 
                  onClick={() => { sounds.playSelect(); setBet(b => b + val); }}
                >
                  +{val.toLocaleString()}
                </button>
              ))}
              <button 
                className="shrink-0 px-3 py-2 sm:px-8 sm:py-4 bg-red-900/20 text-red-500 border border-red-500/20 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-base active:scale-90 shadow-2xl hover:bg-red-900/30" 
                onClick={() => setBet(0)}
              >
                RESET
              </button>
            </div>
            <button 
              className={`w-full py-3 sm:py-6 text-lg sm:text-3xl font-black rounded-xl sm:rounded-[2rem] hover:brightness-110 active:scale-[0.97] cinzel disabled:grayscale disabled:opacity-30 transition-all red-gradient shadow-[0_10px_40px_rgba(185,28,28,0.4)] tracking-tighter uppercase`} 
              onClick={handleDeal} 
              disabled={bet <= 0 || balance < bet}
            >
              Start Round {bet > 0 && <span className="text-yellow-400 ml-2">({bet.toLocaleString()})</span>}
            </button>
          </div>
        ) : phase === GamePhase.SELECTING ? (
          <button 
            className={`w-full py-4 sm:py-8 text-lg sm:text-3xl font-black rounded-xl sm:rounded-[2rem] cinzel transition-all shadow-[0_10px_40px_rgba(234,179,8,0.3)] tracking-tighter active:scale-[0.97] uppercase ${selectedIndices.length === 3 ? 'gold-gradient text-stone-900' : 'bg-stone-800/50 text-stone-600 cursor-not-allowed'}`} 
            onClick={handleConfirm} 
            disabled={selectedIndices.length !== 3}
          >
            {selectedIndices.length === 3 ? 'Reveal Bull' : `Select ${3 - selectedIndices.length} More`}
          </button>
        ) : (
          <button 
            className={`w-full py-4 sm:py-8 text-lg sm:text-3xl font-black rounded-xl sm:rounded-[2rem] cinzel transition-all shadow-2xl tracking-tighter active:scale-[0.97] uppercase ${isGameOver ? 'gold-gradient text-stone-900' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`} 
            onClick={() => { 
              if (isGameOver) {
                setShowNameModal(true);
              } else {
                nextRound(); 
              }
            }}
          >
            {isGameOver ? (isBankrupt ? 'Save Record' : 'Claim Winnings') : 'Next Round'}
          </button>
        )}
      </footer>

      {isLoginSelectionOpen && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="max-w-xs w-full bg-stone-900 border-2 border-blue-500/30 rounded-[2.5rem] p-8 text-center shadow-2xl relative">
            <button className="absolute top-4 right-4 text-stone-500 hover:text-white" onClick={() => setIsLoginSelectionOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <Logo className="mb-6 scale-75" />
            <h2 className="cinzel text-2xl text-white mb-6 uppercase">Login Required</h2>
            <div className="flex flex-col gap-4">
              <button 
                disabled={isLoggingIn}
                onClick={() => { handleLogin(); }}
                className="w-full bg-white text-stone-900 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-stone-100 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3"
              >
                <i className="fa-brands fa-google text-red-500 text-xl"></i>
                Continue with Google
              </button>
            </div>
            {loginError && <p className="mt-4 text-red-500 text-[10px] font-bold">{loginError}</p>}
          </div>
        </div>
      )}

      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4 animate-in fade-in">
           <div className="relative w-full max-w-sm">
              <button className="absolute -top-12 right-0 text-white text-xl w-10 h-10 flex items-center justify-center bg-black/60 rounded-full border border-white/10" onClick={() => setIsLeaderboardOpen(false)}><i className="fa-solid fa-xmark"></i></button>
              <Leaderboard entries={leaderboard} isLoading={isLoadingLeaderboard} onRefresh={loadLeaderboardData} />
           </div>
        </div>
      )}

      {isRulesOpen && (
        <RulesModal onClose={() => setIsRulesOpen(false)} />
      )}

            {showNameModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-stone-900 border-2 border-yellow-500/50 rounded-[3rem] p-8 sm:p-12 w-full max-w-xs sm:max-w-md text-center shadow-2xl">
              <Logo className="mb-6" />
              <h2 className="text-2xl sm:text-4xl font-black cinzel gold-text mb-2 uppercase">GAME OVER</h2>
              <p className="text-stone-500 text-[10px] sm:text-xs mb-8 font-black uppercase tracking-[0.3em]">Final Chips: {balance.toLocaleString()}</p>
              
              {!user ? (
                // GUEST FLOW: Two Options
                <div className="space-y-4">
                  {/* OPTION 1: LOGIN */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-left">
                    <p className="text-xs text-blue-300 font-bold mb-2 uppercase">Unlimited Play + Save Score</p>
                    <button 
                      disabled={isLoggingIn}
                      onClick={() => { handleLogin(); }} 
                      className="w-full py-3 bg-white text-stone-900 font-black rounded-xl text-sm hover:bg-stone-100 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <i className="fa-brands fa-google text-red-500"></i> LOGIN WITH GOOGLE
                    </button>
                  </div>

                  <div className="flex items-center gap-2 opacity-30">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <span className="text-[10px] text-stone-400">OR</span>
                    <div className="flex-1 h-px bg-white/20"></div>
                  </div>

                  {/* OPTION 2: SHARE */}
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-left">
                    <p className="text-xs text-yellow-300 font-bold mb-2 uppercase">No Registration?</p>
                    <button 
                      onClick={() => { setShowNameModal(false); setShowShareModal(true); }} 
                      className="w-full gold-gradient py-3 rounded-xl text-stone-900 font-black uppercase text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                    >
                      SHARE TO PLAY 1 HOUR
                    </button>
                  </div>
                </div>
              ) : (
                // LOGGED IN FLOW: Just Save
                <div className="space-y-6">
                   <div className="flex flex-col items-center gap-2">
                     <img src={user.photoURL || ''} alt="" className="w-12 h-12 rounded-full border-2 border-yellow-500/50" referrerPolicy="no-referrer" />
                     <p className="text-stone-300 text-sm">Saving score as <span className="text-yellow-400 font-bold">{customName || user.displayName}</span></p>
                   </div>
                   <button disabled={isSubmittingScore} className="w-full py-4 gold-gradient text-stone-900 font-black rounded-2xl text-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50" onClick={handleSubmitScore}>
                    {isSubmittingScore ? 'SAVING...' : 'SAVE & PLAY AGAIN'}
                  </button>
                </div>
              )}
              
              {/* Close Button */}
              <button className="mt-8 text-stone-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors" onClick={() => setShowNameModal(false)}>
                Close
              </button>
           </div>
        </div>
      )}

      {showShareModal && (
        <ShareModal 
          caption={`I just hit ${totalEarnings.toLocaleString()} points in 牛牛Fast! Can you beat my record?`}
          winAmount={totalEarnings}
          onShareSuccess={() => {
            const newCount = shareCount + 1;
            setShareCount(newCount);
            localStorage.setItem('niu_niu_share_count', newCount.toString());
            
            const now = Date.now();
            setLastSharedAt(now);
            localStorage.setItem('niu_niu_last_shared', now.toString());
          }}
          onClose={() => { setShowShareModal(false); resetGame(); }}
          isBankrupt={isBankrupt}
        />
      )}

      {isAdminOpen && (
        <AdminDashboard onClose={() => setIsAdminOpen(false)} />
      )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
