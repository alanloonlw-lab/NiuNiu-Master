import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Submission {
  uid: string;
  displayName: string;
  chips: number;
  totalScore: number;
  email: string;
  source: string;
  timestamp: any;
}

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'analytics'>('submissions');

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!auth.currentUser) return;
      
      const path = 'submissions';
      try {
        const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        const fetchedSubmissions = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as any[];
        setSubmissions(fetchedSubmissions);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSubmissions();
      }
    });

    fetchSubmissions();
    return () => unsubscribe();
  }, []);

  const stats = submissions.reduce((acc: any, curr) => {
    acc.sources[curr.source] = (acc.sources[curr.source] || 0) + 1;
    acc.totalEarnings += curr.chips;
    return acc;
  }, { sources: {}, totalEarnings: 0 });

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950 text-white flex flex-col animate-in fade-in">
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black cinzel text-yellow-500">BACKDOOR DASHBOARD</h1>
          <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest">Confidential Game Analytics</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </header>

      <nav className="flex border-b border-white/10 bg-black/20">
        <button 
          onClick={() => setActiveTab('submissions')}
          className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'submissions' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-white/5' : 'text-stone-500 hover:text-white'}`}
        >
          Submissions
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-white/5' : 'text-stone-500 hover:text-white'}`}
        >
          Traffic Analytics
        </button>
      </nav>

      <main className="flex-1 overflow-auto p-6">
        {activeTab === 'submissions' ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Total Players</div>
                <div className="text-3xl font-black text-white">{submissions.length}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Total Payouts</div>
                <div className="text-3xl font-black text-green-500">${stats.totalEarnings.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Avg Score</div>
                <div className="text-3xl font-black text-blue-500">
                  {submissions.length ? Math.floor(stats.totalEarnings / submissions.length).toLocaleString() : 0}
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 text-[10px] font-black uppercase tracking-widest text-stone-500">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4">Total Score</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Source</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {submissions.map((s, i) => (
                    <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-stone-500 font-mono text-xs">
                        {s.timestamp?.toDate ? s.timestamp.toDate().toLocaleString() : new Date(s.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-black">{s.displayName}</td>
                      <td className="px-6 py-4 text-stone-400 font-black">{s.chips.toLocaleString()}</td>
                      <td className="px-6 py-4 text-yellow-500 font-black">{s.totalScore?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 text-blue-400">{s.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                          s.source === 'TikTok' ? 'bg-pink-500/20 text-pink-500' :
                          s.source === 'Facebook' ? 'bg-blue-500/20 text-blue-500' :
                          s.source === 'Instagram' ? 'bg-purple-500/20 text-purple-500' :
                          'bg-stone-500/20 text-stone-400'
                        }`}>
                          {s.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-stone-600 font-black uppercase tracking-widest">No submissions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-black cinzel mb-8 text-stone-400">Traffic Distribution</h2>
            <div className="space-y-6">
              {Object.entries(stats.sources).map(([source, count]: any) => (
                <div key={source} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-2xl font-black text-white">{source}</div>
                      <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest">Referral Source</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-yellow-500">{count}</div>
                      <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest">Visits</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all duration-1000" 
                      style={{ width: `${(count / submissions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {Object.keys(stats.sources).length === 0 && (
                <div className="text-center py-20 text-stone-600 font-black uppercase tracking-widest">No traffic data available</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
