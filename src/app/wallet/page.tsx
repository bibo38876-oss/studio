
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, ShieldCheck, Package, BadgeCheck, Loader2, Coins, Trophy, Scale, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PACKAGES = [
  { id: "pkg_1", amount: 100, price: "1.00", label: "حقيبة البداية", color: "bg-blue-500/20 text-blue-300" },
  { id: "pkg_2", amount: 500, price: "4.00", label: "صندوق النشاط", color: "bg-green-500/20 text-green-300" },
  { id: "pkg_3", amount: 1000, price: "7.00", label: "خزانة التميز", color: "bg-purple-500/20 text-purple-300" },
  { id: "pkg_4", amount: 5000, price: "30.00", label: "كنز الريادة", color: "bg-amber-500/20 text-[#FBBF24]" }
];

// استخدام الـ Client ID الجديد والمحدث
const PAYPAL_CLIENT_ID = "EOoPoQ5ewKmEjpsXQ5aJ8Hh93_dkemhg3wdTGU5LkkjjJDQ6liKoRZwU1NRgOubcgwEZnMSbpOHfNv-s3fDxw";

export default function WalletPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const handlePaymentSuccess = (amount: number) => {
    if (!firestore || !user) return;
    
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      coins: increment(amount)
    });

    toast({
      title: "تم استلام الكنز! 🏺",
      description: `تمت إضافة ${amount} عملة ذهبية إلى خزانتك بنجاح.`,
    });
    setSelectedPackage(null);
  };

  return (
    <PayPalScriptProvider options={{ "clientId": PAYPAL_CLIENT_ID, currency: "USD" }}>
      <div className="min-h-screen bg-[#2D1606] text-[#F3E5AB]">
        <Navbar />

        <main className="container mx-auto max-w-xl pt-10 pb-20 px-4 md:px-0 relative z-10">
          <div className="bg-[#451A03]/80 backdrop-blur-md sticky top-8 z-30 py-4 border-b border-[#B45309]/30 flex items-center gap-4 mb-10 shadow-2xl text-right">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full text-[#FBBF24] hover:bg-[#78350F]">
              <ChevronRight size={20} />
            </Button>
            <div className="flex flex-col flex-1">
              <h1 className="text-sm font-bold text-[#FBBF24] uppercase tracking-tighter">خزانة تيمقاد الملكية {isInfiniteAdmin && '∞'}</h1>
              <span className="text-[8px] text-[#FBBF24]/60 uppercase tracking-[0.2em] font-medium">Auto-Payment Gateway Active</span>
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
                    {profile?.verificationType === 'gold' ? 'نخبة' : profile?.verificationType === 'blue' ? 'موثق' : 'مستكشف'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <section className="w-full text-right space-y-6 pt-6">
              <div className="flex items-center justify-end gap-3 text-[#FBBF24] border-r-4 border-[#FBBF24] pr-3">
                <BadgeCheck size={18} />
                <h3 className="font-bold text-md uppercase tracking-tighter">باقات الكنوز (PayPal الآلي)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PACKAGES.map((pkg) => (
                  <Card key={pkg.id} className={`bg-[#451A03] border-[#B45309]/30 rounded-none overflow-hidden ${selectedPackage?.id === pkg.id ? 'ring-2 ring-[#FBBF24]' : ''}`}>
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                      <TimgadCoin size={48} />
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#FBBF24]">{pkg.amount} ذهبية</p>
                        <p className="text-[10px] text-[#FBBF24] mt-1">السعر: {pkg.price} USD</p>
                      </div>

                      {selectedPackage?.id === pkg.id ? (
                        <div className="w-full">
                          <PayPalButtons 
                            style={{ layout: "horizontal", height: 35 }}
                            createOrder={(data, actions) => actions.order.create({
                              intent: "CAPTURE",
                              purchase_units: [{ amount: { currency_code: "USD", value: pkg.price }, description: pkg.label }]
                            })}
                            onApprove={async (data, actions) => {
                              const details = await actions.order?.capture();
                              if (details) handlePaymentSuccess(pkg.amount);
                            }}
                          />
                          <Button variant="ghost" className="w-full text-[8px] text-white/40 h-6 mt-2" onClick={() => setSelectedPackage(null)}>إلغاء</Button>
                        </div>
                      ) : (
                        <Button className="w-full rounded-none font-bold h-9 bg-primary text-white text-[10px]" onClick={() => setSelectedPackage(pkg)}>شراء الآن</Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </PayPalScriptProvider>
  );
}
