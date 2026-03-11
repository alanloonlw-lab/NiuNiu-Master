import React, { useState } from 'react';
import Logo from './Logo';

interface ShareModalProps {
  winAmount: number;
  onClose: () => void;
  onShareSuccess?: () => void;
  caption: string;
  isBankrupt?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ winAmount, onClose, onShareSuccess, caption, isBankrupt }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const shareToSocial = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const url = `${window.location.origin}${window.location.pathname}?ref=${platform}_share`;
    const text = encodeURIComponent(caption);
    const shareUrl = encodeURIComponent(url);
    
    let finalUrl = '';
    if (platform === 'facebook') {
      finalUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    } else if (platform === 'twitter') {
      finalUrl = `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`;
    } else if (platform === 'whatsapp') {
      finalUrl = `https://api.whatsapp.com/send?text=${text}%20${shareUrl}`;
    }

    if (finalUrl) {
      window.open(finalUrl, '_blank', 'width=600,height=400');
      onShareSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const copyToClipboard = async (type: 'forum' | 'link') => {
    const ref = type === 'forum' ? 'forum' : 'direct_link';
    const url = `${window.location.origin}${window.location.pathname}?ref=${ref}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus(`${type.toUpperCase()} COPIED!`);
      onShareSuccess?.();
      setTimeout(() => {
        setCopyStatus(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    setIsSharing(true);
    const url = `${window.location.origin}${window.location.pathname}?ref=mobile_share`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '牛牛Fast Arena',
          text: caption,
          url: url,
        });
        onShareSuccess?.();
        onClose();
      } catch (err) {
        console.warn('Share cancelled');
      }
    } else {
      shareToSocial('facebook');
    }
    setIsSharing(false);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4">
      <div className="relative bg-stone-900 border-4 border-yellow-500 rounded-[3rem] p-8 sm:p-10 max-w-md w-full shadow-[0_0_80px_rgba(234,179,8,0.5)] text-center overflow-hidden">
        <div className="relative z-10">
          <Logo className="mb-6 scale-75" />
          <div className="cinzel text-lg font-bold text-yellow-500 mb-2 tracking-[0.3em] uppercase">One More Round?</div>
          <h2 className="cinzel text-3xl sm:text-4xl font-black gold-text mb-6 uppercase">
            {isBankrupt ? 'BULL DEFEATED' : 'CONQUEROR'}
          </h2>
          
          <div className="bg-stone-800/40 rounded-[2.5rem] p-8 border border-white/5 mb-8 w-full">
             <div className="text-white text-xs font-black uppercase tracking-widest mb-4 opacity-50">Share to play again</div>
            <p className="text-yellow-500 text-sm sm:text-base font-black italic mb-4 leading-relaxed">
              "{caption}"
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {copyStatus ? (
              <div className="w-full py-5 bg-green-600 text-white font-black rounded-2xl text-xl animate-bounce">
                {copyStatus}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <button 
                    onClick={() => shareToSocial('facebook')}
                    className="aspect-square bg-[#1877F2] text-white rounded-2xl flex items-center justify-center text-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg"
                  >
                    <i className="fa-brands fa-facebook"></i>
                  </button>
                  <button 
                    onClick={() => shareToSocial('twitter')}
                    className="aspect-square bg-black text-white border border-white/10 rounded-2xl flex items-center justify-center text-2xl hover:bg-stone-900 active:scale-95 transition-all shadow-lg"
                  >
                    <i className="fa-brands fa-x-twitter"></i>
                  </button>
                  <button 
                    onClick={() => shareToSocial('whatsapp')}
                    className="aspect-square bg-[#25D366] text-white rounded-2xl flex items-center justify-center text-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg"
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                  </button>
                </div>

                <button 
                  onClick={() => copyToClipboard('link')}
                  className="w-full py-4 bg-stone-700 text-white font-black rounded-2xl text-lg flex items-center justify-center gap-3 hover:bg-stone-600 active:scale-95 transition-all shadow-xl"
                >
                  <i className="fa-solid fa-link"></i>
                  COPY DIRECT LINK
                </button>

                {navigator.share && (
                  <button 
                    onClick={handleNativeShare}
                    className="w-full py-4 bg-white text-stone-900 font-black rounded-2xl text-lg flex items-center justify-center gap-3 hover:bg-stone-100 active:scale-95 transition-all shadow-xl"
                  >
                    <i className="fa-solid fa-share-nodes"></i>
                    OTHER SHARE
                  </button>
                )}
              </>
            )}
          </div>
          
          <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em] mt-8 opacity-60">Tip: Register your email to skip this step next time!</p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
