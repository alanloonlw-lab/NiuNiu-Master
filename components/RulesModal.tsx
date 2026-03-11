
import React from 'react';

interface RulesModalProps {
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in">
      <div className="relative bg-stone-900 border-2 border-yellow-500/30 rounded-[2rem] max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        <header className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="cinzel text-xl font-black gold-text uppercase tracking-widest">Mastering the Bull</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-stone-400 transition-colors">
            <i className="fa-solid fa-x"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <section>
            <h3 className="text-yellow-500 font-black text-xs uppercase tracking-[0.2em] mb-3">The Objective</h3>
            <p className="text-stone-300 text-sm leading-relaxed">
              Divide your 5 cards into two groups: a group of <strong className="text-white">3 cards</strong> that must sum to a multiple of 10 (10, 20, 30), and a group of <strong className="text-white">2 cards</strong> that determine your "Bull" score.
            </p>
          </section>

          <section>
            <h3 className="text-yellow-500 font-black text-xs uppercase tracking-[0.2em] mb-3">Hand Rankings & Multipliers</h3>
            <div className="space-y-2">
              {[
                { name: 'Niu King', desc: 'All face cards (J, Q, K, Joker)', mult: '15x' },
                { name: 'Niu Mushroom', desc: 'Point pair: Spades A + J/Q/K', mult: '10x' },
                { name: 'Niu Pair', desc: 'The 2-card group is a pair', mult: '5x' },
                { name: 'Joker Bull', desc: 'Niu Niu achieved with a Joker', mult: '4x' },
                { name: 'Niu Niu', desc: 'The 2-card group sums to 10/20', mult: '3x' },
                { name: 'Niu 1-9', desc: 'The 2-card group remainder (1-9)', mult: '1x' },
                { name: 'No Bull', desc: 'No 3-card combo sums to 10/20/30', mult: '0x' },
              ].map((h) => (
                <div key={h.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <div className="text-white font-bold text-sm">{h.name}</div>
                    <div className="text-stone-500 text-[10px] uppercase font-bold">{h.desc}</div>
                  </div>
                  <div className="text-yellow-500 font-black text-sm">{h.mult}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-yellow-500 font-black text-xs uppercase tracking-[0.2em] mb-3">Special Mechanics</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fa-solid fa-hat-wizard text-indigo-400"></i>
                  <span className="text-indigo-200 font-bold text-xs uppercase">Joker (Wild Card)</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-snug italic">
                  The Joker is a chameleon. It can take any value from 1 to 10 to help you find the best possible Bull. Winning with a Joker adds a <span className="text-white">50% bonus</span> to your payout.
                </p>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fa-solid fa-shuffle text-red-400"></i>
                  <span className="text-red-200 font-bold text-xs uppercase">The 3-6 Switch</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-snug italic">
                  In this arena, <span className="text-white">3 can be 6</span> and <span className="text-white">6 can be 3</span>. The Master automatically selects the value that grants you the highest hand.
                </p>
              </div>
            </div>
          </section>

          <section className="pb-4">
            <h3 className="text-yellow-500 font-black text-xs uppercase tracking-[0.2em] mb-3">How to Play</h3>
            <ol className="text-sm text-stone-300 space-y-3 list-decimal pl-4">
              <li>Place your <strong className="text-white">bet</strong> using the increments at the bottom.</li>
              <li>Tap <strong className="text-white">DEAL</strong> to receive your 5 cards.</li>
              <li>You have <strong className="text-white">10 seconds</strong> to select exactly 3 cards that sum to a multiple of 10.</li>
              <li>Tap <strong className="text-white">SHOW BULL</strong> to compare your hand against the Banker.</li>
            </ol>
          </section>
        </div>

        <footer className="p-6 border-t border-white/5 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-4 gold-gradient text-stone-900 font-black rounded-xl cinzel uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
          >
            I Ready to Win
          </button>
        </footer>
      </div>
    </div>
  );
};

export default RulesModal;
