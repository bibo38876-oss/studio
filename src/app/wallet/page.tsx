
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, BadgeCheck, Coins, Trophy, Wallet, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import TimgadCoin from '@/components/ui/TimgadCoin';

const PACKAGES = [
  { id: "pkg_1", amount: 100, price: "1 TRX", label: "حقيبة البداية" },
  { id: "pkg_2", amount: 500, price: "5 TRX", label: "صندوق النشاط" },
  { id: "pkg_3", amount: 1000, price: "10 TRX", label: "خزانة التميز" },
  { id: "pkg_4", amount: 5000, price: "50 TRX", label: "كنز الريادة" }
];

export default function WalletPage() {
  const router = useRouter();
  const { firestore, user } = useFirebase();

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const handlePackageSelect = (pkg: any) => {
    // توجيه لصفحة الدعم مع تفاصيل الباقة
    router.push(`/support?package=${encodeURIComponent(pkg.label)}&amount=${pkg.amount}&price=${encodeURIComponent(pkg.price)}`);
  };

  return (
    <div className="min-h-screen bg-[#2D1606] text-[#F3E5AB]">
      <Navbar />

      <main className="container mx-auto max-w-xl pt-10 pb-20 px-4 md:px-0 relative z-10">
        <div className="bg-[#451A03]/80 backdrop-blur-md sticky top-8 z-30 py-4 border-b border-[#B45309]/30 flex items-center gap-4 mb-10 shadow-2xl text-right">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full text-[#FBBF24] hover:bg-[#78350F]">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col flex-1">
            <h1 className="text-sm font-bold text-[#FBBF24] uppercase tracking-tighter">خزانة تيمقاد الملكية {isInfiniteAdmin && '∞'}</h1>
            <span className="text-[8px] text-[#FBBF24]/60 uppercase tracking-[0.2em] font-medium">نظام شحن العملات اليدوي (100 عملة = 1 TRX)</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-10 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
            <div className="absolute inset-0 bg-[#FBBF24]/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10 p-4 bg-[#451A03] rounded-full border-4 border-[#B45309] shadow-[0_0_50px_rgba(180,83,9,0.5)]">
              <TimgadCoin size={180} />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Card className="bg-[#451A03] border-[#B45309]/40 shadow-xl rounded-none border-r-4 border-r-[#FBBF24]">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#FBBF24]">رصيد الخزانة</CardTitle>
                <Coins size={14} className="text-[#FBBF24]" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-[#FBBF24]">{isInfiniteAdmin ? '∞' : (profile?.coins || 0)}</p>
              </CardContent>
            </Card>

            <Card className="bg-[#451A03] border-[#B45309]/40 shadow-xl rounded-none border-r-4 border-r-blue-500">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-400">رتبة العضوية</CardTitle>
                <Trophy size={14} className="text-blue-400" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-[#F3E5AB]">
                  {profile?.verificationType === 'gold' ? 'نخبة تيمقاد' : profile?.verificationType === 'blue' ? 'عضو موثق' : 'مستكشف'}
                </p>
              </CardContent>
            </Card>
          </div>

          <section className="w-full text-right space-y-6 pt-6">
            <div className="flex items-center justify-end gap-3 text-[#FBBF24] border-r-4 border-[#FBBF24] pr-3">
              <Wallet size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">باقات الشحن عبر فاست باي</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PACKAGES.map((pkg) => (
                <Card key={pkg.id} className="bg-[#451A03] border-[#B45309]/30 rounded-none overflow-hidden hover:border-[#FBBF24] transition-colors group">
                  <CardContent className="p-6 flex flex-col items-center gap-4">
                    <div className="relative">
                      <TimgadCoin size={48} className="group-hover:scale-110 transition-transform" />
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[7px] px-1 rounded-full font-bold">SALE</div>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#FBBF24]">{pkg.amount} عملة</p>
                      <p className="text-[10px] text-[#FBBF24]/60 mt-1">القيمة: {pkg.price} (TRX)</p>
                    </div>
                    <Button className="w-full rounded-none font-bold h-9 bg-primary text-white text-[10px] hover:bg-primary/90" onClick={() => handlePackageSelect(pkg)}>اطلب الباقة الآن</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-2 py-10 opacity-40">
            <ShieldCheck size={14} />
            <span className="text-[8px] font-bold uppercase tracking-widest">جميع المعاملات تتم يدوياً لضمان الأمان</span>
          </div>
        </div>
      </main>
    </div>
  );
}
