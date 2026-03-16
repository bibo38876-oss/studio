
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, ShieldCheck, Lock, Eye, Database, UserCheck } from 'lucide-react';
import TimgadLogo from '@/components/ui/Logo';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-2xl pt-8 pb-20 px-4 md:px-0">
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-primary">سياسة الخصوصية</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest">تيمقاد | Timgad</span>
          </div>
        </div>

        <div className="space-y-10 text-right">
          <section className="flex flex-col items-center text-center gap-4 py-6 bg-primary/5 border-y border-primary/10">
            <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center">
              <TimgadLogo size={32} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-primary">التزامنا تجاه خصوصيتك</h2>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                في تيمقاد، نؤمن بأن الخصوصية حق أساسي. نحن ملتزمون بحماية بياناتك وتوفير بيئة آمنة للمجتمع العربي.
              </p>
            </div>
          </section>

          <div className="grid gap-8">
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <Database size={18} />
                <h3 className="font-bold text-sm">1. البيانات التي نجمعها</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pr-8">
                نجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء الحساب، مثل اسم المستخدم والبريد الإلكتروني والنبذة الشخصية. كما نجمع المحتوى الذي تنشره (المنشورات، الصور، التعليقات) ومعلومات عن تفاعلاتك داخل المنصة لتحسين تجربتك.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <Eye size={18} />
                <h3 className="font-bold text-sm">2. كيف نستخدم معلوماتك</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pr-8">
                نستخدم البيانات لتخصيص محتوى "لك" (For You)، وإرسال التنبيهات المهمة، وحماية المجتمع من المحتوى المخالف. نحن لا نقوم ببيع بياناتك الشخصية لأي جهات خارجية لأغراض إعلانية.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <Lock size={18} />
                <h3 className="font-bold text-sm">3. حماية وأمن البيانات</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pr-8">
                نستخدم تقنيات تشفير متطورة لحماية بياناتك من الوصول غير المصرح به. يتم تخزين جميع البيانات في خوادم آمنة تابعة لشركة Google (Firebase) لضمان أعلى مستويات الأمان المتاحة عالمياً.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <UserCheck size={18} />
                <h3 className="font-bold text-sm">4. حقوقك كعضو في تيمقاد</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pr-8">
                لديك الحق الكامل في الوصول إلى بياناتك وتعديلها في أي وقت من خلال الإعدادات. كما يمكنك جعل حسابك "خاصاً" للتحكم في من يرى منشوراتك، أو طلب حذف حسابك وبياناتك نهائياً من أنظمتنا.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck size={18} />
                <h3 className="font-bold text-sm">5. التغييرات في السياسة</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pr-8">
                قد نقوم بتحديث سياسة الخصوصية من وقت لآخر لتعكس التغييرات في ممارساتنا أو المتطلبات القانونية. سنقوم بإبلاغك بأي تغييرات جوهرية عبر إشعارات المنصة.
              </p>
            </section>
          </div>

          <footer className="pt-12 border-t text-center space-y-4">
            <p className="text-[10px] text-muted-foreground italic">آخر تحديث: {new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full text-[10px] h-8 px-6 font-bold" onClick={() => router.push('/')}>العودة للرئيسية</Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
