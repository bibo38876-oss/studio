
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, Trophy, Star, History, Gift, ShieldCheck, Coins, Key, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function VaultPage() {
  const router = useRouter();
  const { firestore, user } = useFirebase();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  return (
    <div className="min-h-screen bg-[#2D1606] text-[#F3E5AB] overflow-x-hidden">
      <Navbar />
      
      {/* Wood texture background overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
      
      <main className="container mx-auto max-w-xl pt-12 pb-20 px-4 relative z-10">
        {/* Header - Ancient Wooden Style */}
        <div className="flex items-center justify-between mb-12">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="h-9 w-9 rounded-full text-[#FBBF24] hover:bg-[#78350F]/50 transition-colors"
          >
            <ChevronRight size={24} />
          </Button>
          <div className="text-right">
            <h1 className="text-lg font-bold text-[#FBBF24] uppercase tracking-wider font-headline">خزانة تيمقاد الأثرية</h1>
            <span className="text-[8px] text-[#FBBF24]/50 uppercase tracking-[0.3em] font-medium">Ancient Heritage Vault Control</span>
          </div>
        </div>

        {/* Central Treasure Focus */}
        <div className="flex flex-col items-center gap-8 mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#FBBF24]/10 rounded-full blur-[100px] animate-pulse" />
            <div className="bg-[#451A03] p-12 rounded-full border-[10px] border-[#B45309] shadow-[0_0_80px_rgba(180,83,9,0.5),inset_0_0_40px_rgba(0,0,0,0.5)] relative z-10 group cursor-pointer">
               <TimgadCoin size={160} className="group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]" />
               
               {/* Decorative floating particles */}
               <motion.div 
                 animate={{ y: [-10, 10, -10] }} 
                 transition={{ repeat: Infinity, duration: 3 }}
                 className="absolute -top-4 -right-2 text-[#FBBF24]"
               >
                 <Sparkles size={20} />
               </motion.div>
            </div>
          </motion.div>
          
          <div className="text-center space-y-3 px-6">
            <h2 className="text-2xl font-bold text-[#FBBF24] font-headline tracking-tight">مرحباً بك في مخدع الأسرار</h2>
            <p className="text-xs text-[#F3E5AB]/70 italic leading-relaxed max-w-[320px] mx-auto">
              "هنا تُحفظ أثمن ما تملكه في تيمقاد؛ من هدايا المتابعين وكنوز العطاء اليومي."
            </p>
          </div>
        </div>

        {/* Vault Categories - Wooden Cards */}
        <div className="grid gap-5">
          <motion.div whileHover={{ x: -5 }} transition={{ type: "spring" }}>
            <Card className="bg-[#451A03]/80 border-[#B45309]/40 rounded-none shadow-2xl backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-[#FBBF24] opacity-50" />
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#2D1606] rounded-sm flex items-center justify-center border border-[#B45309]/30 shadow-inner group-hover:border-[#FBBF24]/50 transition-colors">
                    <Gift className="text-[#FBBF24]" size={28} />
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-[#FBBF24] uppercase tracking-wide">المنح اليومية</h3>
                    <p className="text-[10px] text-[#F3E5AB]/60">عملة تيمقاد المجانية كل 24 ساعة</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">نشط الآن</span>
                  <div className="h-1.5 w-20 bg-[#2D1606] rounded-full overflow-hidden border border-[#B45309]/20">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5 }}
                      className="h-full bg-gradient-to-r from-green-600 to-green-400" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ x: -5 }} transition={{ type: "spring" }}>
            <Card className="bg-[#451A03]/80 border-[#B45309]/40 rounded-none shadow-2xl backdrop-blur-md opacity-70 relative group">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#2D1606] rounded-sm flex items-center justify-center border border-[#B45309]/30 shadow-inner">
                    <Trophy className="text-[#FBBF24]/40" size={28} />
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-[#FBBF24]/60 uppercase tracking-wide">أوسمة الشرف</h3>
                    <p className="text-[10px] text-[#F3E5AB]/40">مكافآت التميز والنشاط المجتمعي</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#B45309]/10 px-2 py-1 border border-[#B45309]/20">
                  <Lock size={10} className="text-[#FBBF24]/40" />
                  <span className="text-[8px] text-[#FBBF24]/40 font-bold">مغلق مؤقتاً</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ x: -5 }} transition={{ type: "spring" }}>
            <Card className="bg-[#451A03]/80 border-[#B45309]/40 rounded-none shadow-2xl backdrop-blur-md relative group cursor-pointer" onClick={() => router.push('/wallet')}>
              <div className="absolute top-0 right-0 w-1 h-full bg-blue-500 opacity-50" />
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#2D1606] rounded-sm flex items-center justify-center border border-[#B45309]/30 shadow-inner group-hover:border-blue-500/50 transition-colors">
                    <History className="text-blue-400" size={28} />
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">سجل الكنوز</h3>
                    <p className="text-[10px] text-[#F3E5AB]/60">تتبع كافة تحركاتك المالية ودعمك</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-[#FBBF24]/30 hover:text-[#FBBF24] hover:bg-transparent">
                  <ChevronRight size={20} className="rotate-180" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Action Button - Return to Surface */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <Button 
            variant="outline" 
            className="rounded-none border-[#B45309] text-[#FBBF24] hover:bg-[#FBBF24] hover:text-[#2D1606] font-bold text-xs px-10 h-10 transition-all uppercase tracking-widest"
            onClick={() => router.push('/')}
          >
            العودة إلى السطح
          </Button>
          
          <div className="flex flex-col items-center gap-2 opacity-30">
            <div className="h-[1px] w-40 bg-gradient-to-r from-transparent via-[#FBBF24] to-transparent" />
            <p className="text-[8px] font-bold uppercase tracking-[0.4em]">Vault Security Alpha • Timgad 2025</p>
          </div>
        </div>
      </main>
    </div>
  );
}
