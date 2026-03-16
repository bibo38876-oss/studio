
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Info, Sparkles, TrendingUp, Wallet, ShieldCheck, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function WalletPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-xl pt-10 pb-20 px-4 md:px-0">
        {/* Header */}
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col text-right">
            <h1 className="text-sm font-bold text-primary">محفظة تيمقاد الرقمية</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">نظام المكافآت والعملة الموحدة</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-10 text-center">
          {/* Large Coin Section */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <svg width="220" height="220" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-2xl">
              <defs>
                <radialGradient id="gold-wallet" cx="45%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fff7b5"/>
                  <stop offset="30%" stopColor="#f3d34a"/>
                  <stop offset="55%" stopColor="#d4a017"/>
                  <stop offset="80%" stopColor="#a87900"/>
                  <stop offset="100%" stopColor="#6b4f00"/>
                </radialGradient>
                <linearGradient id="rim-wallet" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff2a8"/>
                  <stop offset="50%" stopColor="#c99700"/>
                  <stop offset="100%" stopColor="#6b4f00"/>
                </linearGradient>
                <filter id="shadow-wallet">
                  <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.35"/>
                </filter>
                <path id="circleText-wallet" d="M100,100 m-60,0 a60,60 0 1,1 120,0 a60,60 0 1,1 -120,0"/>
              </defs>
              <ellipse cx="100" cy="178" rx="52" ry="9" fill="black" opacity="0.15"/>
              <circle cx="100" cy="100" r="88" fill="url(#rim-wallet)" filter="url(#shadow-wallet)"/>
              <circle cx="100" cy="100" r="84" fill="none" stroke="#8a6500" strokeWidth="6" strokeDasharray="2 4"/>
              <circle cx="100" cy="100" r="75" fill="url(#gold-wallet)"/>
              <circle cx="100" cy="100" r="60" fill="none" stroke="#a87900" strokeWidth="3"/>
              <text fontSize="10" fill="#6b4f00" fontFamily="Arial" letterSpacing="2">
                <textPath href="#circleText-wallet" startOffset="50%" textAnchor="middle">
                  TIMGAD • COIN •
                </textPath>
              </text>
              <text x="100" y="120" textAnchor="middle" fontFamily="serif" fontSize="65" fontWeight="bold" fill="#6b4f00" stroke="#4a3500" strokeWidth="1.5">
                T
              </text>
            </svg>
          </motion.div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">عملة تيمقاد: اقتصاد المستقبل</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              نحن نبني نظاماً اقتصادياً رقمياً عادلاً يكافئ القيمة الحقيقية للتفاعل. كن جزءاً من النخبة التي ستشكل ملامح تيمقاد المالية.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Card className="border-none shadow-none rounded-none bg-primary/5 border-r-4 border-primary">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">الرصيد الحالي</CardTitle>
                <Wallet size={14} className="text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-primary">0.00</p>
                <p className="text-[8px] text-muted-foreground mt-1 italic">سيتم تفعيل الرصيد عند الإطلاق الرسمي للشبكة.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-none rounded-none bg-accent/5 border-r-4 border-accent">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-accent">مستوى التعدين</CardTitle>
                <TrendingUp size={14} className="text-accent" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-accent">ELITE</p>
                <p className="text-[8px] text-muted-foreground mt-1 italic">تفاعلك اليومي يرفع من فرصك في كسب العملات.</p>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <section className="w-full text-right space-y-6 pt-10">
            <div className="flex items-center gap-3 text-primary border-r-4 border-primary pr-3">
              <Info size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">بروتوكول المكافآت الرقمي</h3>
            </div>
            
            <div className="grid gap-4">
              {[
                { 
                  icon: <Star size={14} />, 
                  title: "التفاعل النوعي", 
                  desc: "خوارزمية تيمقاد تكافئ المنشورات ذات القيمة المعرفية العالية والتعليقات التي تحظى بتفاعل إيجابي." 
                },
                { 
                  icon: <ShieldCheck size={14} />, 
                  title: "نظام التوثيق", 
                  desc: "الحسابات الموثقة (الأزرق والذهبي) ستحصل على معامل ضرب (Multiplier) مضاعف لكل عملية كسب." 
                },
                { 
                  icon: <Sparkles size={14} />, 
                  title: "دعم المبدعين", 
                  desc: "ستتمكن قريباً من إرسال واستقبال عملة تيمقاد كنوع من التقدير للمحتوى المميز داخل المنصة." 
                }
              ].map((item, i) => (
                <div key={i} className="bg-secondary/30 p-4 flex gap-4 items-start border border-transparent hover:border-primary/10 transition-colors">
                  <div className="h-8 w-8 bg-white shadow-sm flex items-center justify-center shrink-0 text-primary">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-primary">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-16 pb-10 opacity-40">
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-primary">Timgad Digital Economy Division</p>
            <p className="text-[8px] text-muted-foreground mt-1">Experimental Feature • 2024-2025</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
