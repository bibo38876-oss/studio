
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Target, Rocket, ShieldCheck, Heart, Sparkles, Globe } from 'lucide-react';
import TimgadLogo from '@/components/ui/Logo';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-2xl pt-8 pb-20 px-4 md:px-0">
        {/* Header Section */}
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-primary">حول تيمقاد</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">الرؤية والرسالة</span>
          </div>
        </div>

        <div className="space-y-12 text-right">
          {/* Intro Hero */}
          <section className="flex flex-col items-center text-center gap-6 py-10 bg-primary/5 border-y border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-accent/5 rounded-full -translate-x-10 -translate-y-10" />
            <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center relative z-10 border-2 border-primary/10">
              <TimgadLogo size={40} className="text-primary" />
            </div>
            <div className="space-y-3 px-6 relative z-10">
              <h2 className="text-xl font-bold text-primary leading-tight">مرحباً بكم في تيمقاد</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                منصة اجتماعية رائدة تهدف إلى تقديم تجربة رقمية فريدة، تمزج بين عراقة الهوية العربية وتطلعات العصر الرقمي الحديث، لتقديم خدمات تواصل تتسم بالبساطة، الفعالية، والسرعة.
              </p>
            </div>
          </section>

          {/* Core Content */}
          <div className="grid gap-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"><Globe size={16} /></div>
                <h3 className="font-bold text-sm uppercase tracking-tighter">فلسفة تيمقاد</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pr-11">
                تأسست تيمقاد انطلاقاً من إيماننا العميق بأن التكنولوجيا يجب أن تكون جسراً يسهل الحياة اليومية ويعزز الروابط الإنسانية. في عصر رقمي متسارع، نسعى لتوفير بيئة آمنة تتيح للمستخدمين الوصول إلى المعلومات والخدمات الاجتماعية بسلاسة، مع الالتزام التام بتطوير الأداء لضمان جودة استثنائية ترقى لتطلعات مجتمعنا.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4 p-5 bg-secondary/20 border-r-4 border-primary">
                <div className="flex items-center gap-3 text-primary">
                  <Target size={18} />
                  <h3 className="font-bold text-sm">رؤيتنا</h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  أن نتبوأ مكانة الصدارة كمنصة رقمية موثوقة، يعتمد عليها المستخدم العربي كمرجع أساسي في تواصله الاجتماعي والحصول على الخدمات الرقمية بكفاءة عالية.
                </p>
              </section>

              <section className="space-y-4 p-5 bg-secondary/20 border-r-4 border-accent">
                <div className="flex items-center gap-3 text-accent">
                  <Rocket size={18} />
                  <h3 className="font-bold text-sm">رسالتنا</h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  تمكين المستخدمين من إنجاز مهامهم التواصلية عبر تطبيق يجمع بين البساطة في الواجهات والقوة في الأداء، مما يحقق أقصى درجات الرضا والفعالية.
                </p>
              </section>
            </div>

            {/* Values Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-primary border-b pb-2">
                <Sparkles size={18} />
                <h3 className="font-bold text-sm">قيمنا الجوهرية</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Heart size={14} />, title: "الاهتمام بالمستخدم", desc: "نضع احتياجات المستخدم في مقدمة أولوياتنا البرمجية." },
                  { icon: <ShieldCheck size={14} />, title: "الجودة والتميز", desc: "الالتزام بأعلى معايير الأداء والأمان الرقمي." },
                  { icon: <Target size={14} />, title: "البساطة المطلقة", desc: "تصميم واجهات بديهية تسهل الاستخدام للجميع." },
                  { icon: <Rocket size={14} />, title: "التطوير المستمر", desc: "ابتكار ميزات دورية تواكب التحولات التكنولوجية." }
                ].map((val, i) => (
                  <div key={i} className="space-y-2 p-4 border hover:bg-muted/5 transition-colors">
                    <div className="flex items-center gap-2 text-primary">
                      {val.icon}
                      <h4 className="text-[11px] font-bold">{val.title}</h4>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-snug">{val.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="pt-16 border-t text-center space-y-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                تيمقاد هي نتاج رؤية تقنية تسعى لخدمة المجتمع العربي.<br />شكراً لكونكم جزءاً من رحلتنا.
              </p>
              <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest mt-2">Designed for the Arabic Digital Future</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full text-[10px] h-8 px-8 font-bold" onClick={() => router.push('/')}>العودة للرئيسية</Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
