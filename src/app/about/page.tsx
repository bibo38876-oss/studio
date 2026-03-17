
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Zap, Coins, Trophy, BadgeCheck, Scale, History, ShieldCheck } from 'lucide-react';
import TimgadLogo from '@/components/ui/Logo';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl pt-8 pb-20 px-4 md:px-0">
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full"><ChevronRight size={20} /></Button>
          <div className="flex flex-col"><h1 className="text-sm font-bold text-primary">الميثاق والدليل الشامل</h1><span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">منصة تيمقاد الرقمية | الإصدار المؤسسي</span></div>
        </div>

        <div className="space-y-12 text-right">
          <section className="flex flex-col items-center text-center gap-6 py-12 bg-primary/5 border-y border-primary/10">
            <div className="w-20 h-20 bg-white shadow-2xl rounded-full flex items-center justify-center border-4 border-primary/5"><TimgadLogo size={40} className="text-primary" /></div>
            <div className="space-y-3 px-6"><h2 className="text-2xl font-bold text-primary leading-tight">فلسفة تيمقاد: الريادة بالأصالة</h2><p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">تُعد منصة تيمقاد صرحاً تقنياً عربياً يهدف لإعادة صياغة مفاهيم التواصل الرقمي، من خلال دمج الموروث الحضاري مع أحدث الابتكارات البرمجية.</p></div>
          </section>

          <section className="space-y-8 py-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-accent pr-3"><Zap size={20} className="text-accent" /><h3 className="font-bold text-md uppercase">دليل تيمقاد: المنظومة والامتيازات</h3></div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary"><Coins size={16} /><h4 className="text-sm font-bold">1. اقتصاد تيمقاد (العملات)</h4></div>
              <div className="bg-secondary/20 p-5 border-r-2 border-primary space-y-3">
                <p className="text-xs text-foreground/80 leading-relaxed">تعتمد المنصة على "عملة تيمقاد" كوحدة مكافأة داخلية:</p>
                <ul className="text-[11px] text-muted-foreground space-y-2 list-disc pr-5">
                  <li><span className="text-primary font-bold">هدية الانضمام:</span> يحصل كل عضو جديد فور التسجيل على <span className="text-primary">10 عملات</span>.</li>
                  <li><span className="text-primary font-bold">مكافأة الولاء:</span> تمنحك المنصة <span className="text-primary">عملة واحدة</span> تلقائياً كل 24 ساعة عند دخولك.</li>
                  <li><span className="text-primary font-bold">دعم المحتوى:</span> يمكنك إرسال واستقبال العملات من متابعيك كدعم لمحتواك المتميز.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary"><Trophy size={16} className="text-yellow-600" /><h4 className="text-sm font-bold">2. جرة تيمقاد الأثرية (المنافسة اليومية)</h4></div>
              <div className="bg-[#2D1606] text-[#F3E5AB] p-5 space-y-3 shadow-xl">
                <p className="text-xs leading-relaxed opacity-90">الحدث اليومي الأكبر الذي يجمع المجتمع حول كنز واحد:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 border border-[#FBBF24]/10">
                    <h5 className="text-[10px] font-bold text-[#FBBF24] mb-1">الجدول الزمني (بتوقيت الجزائر)</h5>
                    <p className="text-[9px] opacity-70">20:00: انكسار الجرة وتوزيع الكنوز.<br />20:05: بدء دورة جديدة للمساهمة.</p>
                  </div>
                  <div className="bg-black/20 p-3 border border-[#FBBF24]/10">
                    <h5 className="text-[10px] font-bold text-[#FBBF24] mb-1">المشاركة والجوائز</h5>
                    <p className="text-[9px] opacity-70">رسم الدخول: 3 عملات.<br />التوزيع: 30% للمنصة و70% لأعلى 10 مستخدمين من حيث "الأورا" (20% للمركز الأول، 15% للثاني، 10% للثالث).</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary"><BadgeCheck size={16} className="text-blue-500" /><h4 className="text-sm font-bold">3. ميثاق العضوية والتوثيق</h4></div>
              <div className="overflow-hidden border rounded-none">
                <table className="w-full text-[10px] text-right">
                  <thead className="bg-secondary/50 border-b"><tr><th className="p-3 font-bold border-l">الميزة</th><th className="p-3 font-bold text-muted-foreground border-l">المستكشف (عادي)</th><th className="p-3 font-bold text-blue-600">النخبة (موثق)</th></tr></thead>
                  <tbody className="divide-y">
                    <tr><td className="p-3 font-medium bg-muted/10 border-l">طول المنشور</td><td className="p-3 border-l">400 حرف</td><td className="p-3">1500 حرف</td></tr>
                    <tr><td className="p-3 font-medium bg-muted/10 border-l">معرض الصور</td><td className="p-3 border-l">صورة واحدة</td><td className="p-3">3 صور للمنشور</td></tr>
                    <tr><td className="p-3 font-medium bg-muted/10 border-l">استطلاعات الرأي</td><td className="p-3 border-l">تكلفة: 3 عملات</td><td className="p-3">مجاني (واحد/يومياً) ثم عملتين</td></tr>
                    <tr><td className="p-3 font-medium bg-muted/10 border-l">أولوية الظهور</td><td className="p-3 border-l">عادية</td><td className="p-3">أولوية فائقة (أورا أعلى)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <footer className="pt-20 border-t text-center space-y-8">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Institutional Compliance Division</span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Algerian & Arab Jurisdiction | 2024-2025</span>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-[10px] h-9 px-10 border-primary/20 text-primary" onClick={() => router.push('/')}>العودة للرئيسية</Button>
          </footer>
        </div>
      </main>
    </div>
  );
}
