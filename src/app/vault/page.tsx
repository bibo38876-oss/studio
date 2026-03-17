
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, increment, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import TimgadCoin from '@/components/ui/TimgadCoin';

export default function VaultPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isContributing, setIsContributing] = useState(false);

  // مرجع لبيانات المستخدم
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  // مرجع لبيانات الخزنة الجماعية
  const globalVaultRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'vault', 'global');
  }, [firestore]);

  const { data: vaultData, isLoading: isVaultLoading } = useDoc(globalVaultRef);

  const handleContribute = async () => {
    if (!firestore || !user || !profile) return;

    if ((profile.coins || 0) < 1) {
      toast({
        variant: "destructive",
        title: "لا توجد عملات",
        description: "تحتاج لعملة واحدة على الأقل للمشاركة في ملء الجرة.",
      });
      return;
    }

    setIsContributing(true);
    try {
      // خصم عملة من المستخدم
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: increment(-1)
      });

      // إضافة عملة للخزنة الجماعية
      // إذا لم يكن المستند موجوداً، نقوم بإنشائه
      if (!vaultData) {
        await setDoc(doc(firestore, 'vault', 'global'), { totalCoins: 1 });
      } else {
        updateDocumentNonBlocking(doc(firestore, 'vault', 'global'), {
          totalCoins: increment(1)
        });
      }

      toast({
        title: "شكراً لمساهمتك!",
        description: "لقد وضعت عملة ذهبية في جرة تيمقاد الأثرية.",
      });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل الاتصال بالخزنة." });
    } finally {
      setIsContributing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A0F04] text-[#F3E5AB] flex flex-col items-center justify-center relative overflow-hidden">
      <Navbar />
      
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D1606]/0 via-[#FBBF24]/5 to-[#2D1606]/0 pointer-events-none" />

      <div className="fixed top-12 left-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="h-10 w-10 rounded-full text-[#FBBF24]/50 hover:text-[#FBBF24] hover:bg-white/5 transition-all"
        >
          <ChevronRight size={28} />
        </Button>
      </div>

      <main className="relative z-10 flex flex-col items-center gap-8 select-none py-20">
        {/* The Ancient Jar 🏺 */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <AnimatePresence>
            {isContributing && (
              <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -50, opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center z-50"
              >
                <TimgadCoin size={48} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{ 
              y: [-5, 5, -5],
              rotate: [-0.5, 0.5, -0.5]
            }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="text-[180px] md:text-[240px] drop-shadow-[0_10px_40px_rgba(0,0,0,0.9)] filter brightness-90 saturate-50 hover:brightness-110 transition-all cursor-default"
          >
            🏺
          </motion.div>
        </motion.div>

        {/* Collective Counter */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#FBBF24]/40 mb-2">
              Community Vault Treasure
            </h2>
            <div className="flex items-center gap-4 justify-center">
              <TimgadCoin size={32} className="opacity-50" />
              <motion.div 
                key={vaultData?.totalCoins}
                initial={{ scale: 1.2, color: "#FFF" }}
                animate={{ scale: 1, color: "#FBBF24" }}
                className="text-6xl md:text-8xl font-mono font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
              >
                {isVaultLoading ? "..." : (vaultData?.totalCoins || 0).toLocaleString()}
              </motion.div>
              <TimgadCoin size={32} className="opacity-50" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button 
              className="bg-[#B45309] text-white hover:bg-[#D97706] rounded-full px-8 h-12 font-bold text-xs gap-2 shadow-xl border border-[#FBBF24]/20 transition-all active:scale-95"
              onClick={handleContribute}
              disabled={isContributing}
            >
              {isContributing ? <Loader2 className="animate-spin" /> : <Plus size={16} />}
              وضع عملة في الجرة
            </Button>
            
            <p className="text-[9px] font-medium text-[#F3E5AB]/30 max-w-[250px] leading-relaxed italic">
              "كل عملة توضع في هذه الجرة تزيد من قوة مجتمع تيمقاد العريق. كن جزءاً من الأسطورة."
            </p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 w-full h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      
      <div className="fixed bottom-8 flex flex-col items-center gap-2 opacity-10">
        <div className="h-[1px] w-24 bg-[#FBBF24]" />
        <p className="text-[7px] font-bold uppercase tracking-[0.4em]">Ancient Vault Collective v1.0</p>
      </div>
    </div>
  );
}
