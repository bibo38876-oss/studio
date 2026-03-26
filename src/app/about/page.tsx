
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Coins, BadgeCheck, Scale, History, ShieldCheck, Info, Globe, Heart, Coffee, Star, Gavel, AlertCircle, Megaphone, Wallet, LayoutGrid, Sparkles, Clock } from 'lucide-react';
import TimgadLogo from '@/components/ui/Logo';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-[500px] pt-8 pb-20 px-4 text-right">
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-primary hover:bg-primary/5 p-1 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-primary">الميثاق والدليل الشامل</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">منصة تيمقاد الرقمية | تحديث الاقتصاد 2025</span>
          </div>
        </div>

        <div className="space-y-12">
          {/* 1. اقتصاد تيمقاد المحدث */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-accent pr-3">
              <Coins size={20} className="text-accent" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">اقتصاد تيمقاد والتحويل (DGB)</h2>
            </div>
            
            <div className="bg-secondary/10 p-6 space-y-4 rounded-sm border border-primary/5">
              <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                <span className="text-xs font-bold text-primary">معادلة الصرف الملكية</span>
                <span className="text-sm font-bold text-accent">100 عملة تيمقاد = 1 DGB</span>
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/80">
                يعتمد نظام تيمقاد على عملة ذهبية داخلية مرتبطة تقنياً بعملة <span className="font-bold">DGB (DigiByte)</span>. يتم الشحن والسحب يدوياً عبر مركز الدعم لضمان أمان خزانة المنصة.
              </p>
              
              <div className="bg-primary/5 p-4 border border-primary/10 flex items-center gap-3">
                <Clock size={18} className="text-primary" />
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold text-primary uppercase">الدخل السلبي المجاني</h4>
                  <p className="text-[9px] text-muted-foreground">يحصل كل عضو تلقائياً على <span className="text-primary font-bold">0.02 عملة كل ساعة</span> كعائد مشاركة من إيرادات الإعلانات العامة.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-card border text-center">
                  <p className="text-[9px] text-muted-foreground mb-1 uppercase font-bold">الحد الأدنى للسحب</p>
                  <p className="text-xs font-bold text-primary">5 DGB (500 عملة)</p>
                </div>
                <div className="p-3 bg-card border text-center">
                  <p className="text-[9px] text-muted-foreground mb-1 uppercase font-bold">رسوم التحويل</p>
                  <p className="text-xs font-bold text-destructive">3% من إجمالي المبلغ</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. نظام التوثيق وتحقيق الدخل */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-blue-500 pr-3">
              <BadgeCheck size={20} className="text-blue-500" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">التوثيق وشروط الربح الصارمة</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50/30 p-6 border border-red-100 rounded-sm">
                <h4 className="text-xs font-bold text-red-700 mb-3 flex items-center gap-2">
                  <AlertCircle size={14} /> القاعدة الذهبية للربح (العوائد)
                </h4>
                <p className="text-[10px] text-red-900/80 leading-relaxed font-bold">
                  لا يحق لأي عضو في تيمقاد تحقيق أي أرباح (سواء من مشاهدة الإعلانات أو من وضع إعلان على منشوره) إلا إذا استوفى الشرطين معاً: <br/>
                  1. امتلاك <span className="underline">500 متابع حقيقي</span> على الأقل. <br/>
                  2. أن يكون الحساب <span className="underline">موثقاً</span> بالشارة الزرقاء أو الذهبية.
                </p>
              </div>

              <div className="bg-amber-50/30 p-6 border border-amber-100 rounded-sm">
                <h4 className="text-xs font-bold text-amber-700 mb-3 flex items-center gap-2">
                  <Coffee size={14} /> الدعم المفتوح (القهوة)
                </h4>
                <p className="text-[10px] text-amber-900/80 leading-relaxed">
                  على عكس الأرباح الإدارية، نظام "فناجين القهوة" متاح للجميع! يمكن لأي عضو دعم أي مبدع بـ [3، 7، 10، 20] عملة تشجيعاً لإبداعه، وتقتطع المنصة 10% كعمولة صيانة.
                </p>
              </div>
            </div>
          </section>

          {/* 3. سوق الأرباح للمستخدمين */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-green-600 pr-3">
              <LayoutGrid size={20} className="text-green-600" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">مركز الأرباح للمستخدمين</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/20 border-r-2 border-green-600 space-y-2">
                <h4 className="text-[10px] font-bold text-green-700 uppercase">اربح من التفاعل</h4>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  يمكنك زيارة مركز الأرباح للقيام بمهام بسيطة (مشاهدة، روابط ذكية) وجمع عملات تيمقاد بحد يومي يصل لـ 25 عملة.
                </p>
              </div>
              <div className="p-4 bg-secondary/20 border-r-2 border-primary space-y-2">
                <h4 className="text-[10px] font-bold text-primary uppercase">ادعم مجتمعك</h4>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  استخدم أرباحك لدعم المبدعين المفضلين لديك أو توثيق حسابك للحصول على ميزات حصرية وزيادة حد المنشورات.
                </p>
              </div>
            </div>
          </section>

          {/* 4. المساحات الإعلانية الإدارية */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-amber-600 pr-3">
              <Megaphone size={20} className="text-amber-600" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">المساحات الإعلانية المميزة</h2>
            </div>
            
            <div className="overflow-hidden border rounded-none">
              <table className="w-full text-[10px] text-right">
                <thead className="bg-secondary/50 border-b">
                  <tr>
                    <th className="p-4 font-bold border-l">نوع الإعلان</th>
                    <th className="p-4 font-bold border-l">المدة</th>
                    <th className="p-4 font-bold text-amber-600">التكلفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-4 border-l font-medium">مستطيل السوق (بين المنشورات)</td>
                    <td className="p-4 border-l">5 أيام</td>
                    <td className="p-4 font-bold">5 DGB</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-l font-medium">إعلان منشور (فوق التعليقات)</td>
                    <td className="p-4 border-l">3 أيام</td>
                    <td className="p-4 font-bold">5 DGB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <footer className="pt-20 border-t text-center space-y-8">
            <div className="flex flex-col items-center gap-1">
              <TimgadLogo size={32} className="text-primary/20 mb-2" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Institutional Compliance Division</span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Designed for the Arab World | 2024-2025</span>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-[10px] h-9 px-10 border-primary/20 text-primary" onClick={() => router.push('/')}>العودة للرئيسية</Button>
          </footer>
        </div>
      </main>
    </div>
  );
}
