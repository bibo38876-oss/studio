
"use client"

import { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TimgadLogo from '@/components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPwaOverlay() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsStandalone(true);
      }
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const timer = setTimeout(() => {
        if (!localStorage.getItem('pwa_prompt_dismissed')) {
          setIsVisible(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] p-3 bg-primary text-white shadow-2xl border-b border-accent/30 w-full max-w-[500px]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-lg border border-white/10 shrink-0">
              <TimgadLogo size={20} variant="white" />
            </div>
            <div className="flex flex-col text-right">
              <h3 className="text-[11px] font-bold leading-tight flex items-center gap-1">
                ثبّت تطبيق تيمقاد السيادي
                <Sparkles size={10} className="text-accent" />
              </h3>
              <p className="text-[8px] text-white/60 font-medium">تجربة أسرع وأمان DGB مضاعف</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              className="bg-accent hover:bg-accent/90 text-white font-bold text-[9px] h-7 rounded-full px-4 gap-1.5 shadow-lg shadow-accent/20"
              onClick={handleInstall}
            >
              <Download size={12} />
              تثبيت
            </Button>
            <button 
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/40"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
