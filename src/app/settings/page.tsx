
"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase, initiateSignOut } from '@/firebase';
import { LogOut, User, Bell, Shield, HelpCircle, ChevronLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { auth, user } = useFirebase();
  const router = useRouter();

  const handleLogout = () => {
    if (!auth) return;
    initiateSignOut(auth);
    router.push('/login');
  };

  if (!user || user.isAnonymous) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const settingsOptions = [
    { icon: <User size={16} />, label: 'إعدادات الحساب', desc: 'تغيير البريد الإلكتروني، كلمة المرور' },
    { icon: <Bell size={16} />, label: 'التنبيهات والإشعارات', desc: 'إدارة كيفية وصول التنبيهات إليك' },
    { icon: <Shield size={16} />, label: 'الخصوصية والأمان', desc: 'التحكم في من يشاهد محتواك' },
    { icon: <HelpCircle size={16} />, label: 'المساعدة والدعم', desc: 'مركز المساعدة وقوانين المنصة' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* المستطيل الأزرق العلوي */}
      <div className="bg-primary pt-12 pb-10 px-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 container max-w-xl mx-auto flex flex-col items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="absolute right-0 top-0 text-white/80 hover:text-white transition-colors"
          >
            <ArrowRight size={20} />
          </button>
          
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-white font-headline tracking-tighter">ت</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white font-headline tracking-tighter">تواصل | Tawasul</h1>
            <p className="text-[10px] text-white/60 mt-1 uppercase tracking-widest font-medium">إعدادات المنصة</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-xl -mt-6 px-4 space-y-3 relative z-20">
        {/* مستطيلات الخيارات */}
        <div className="space-y-2">
          {settingsOptions.map((option, i) => (
            <Card key={i} className="border-none shadow-sm rounded-none bg-card hover:bg-secondary/20 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {option.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">{option.label}</span>
                    <span className="text-[9px] text-muted-foreground">{option.desc}</span>
                  </div>
                </div>
                <ChevronLeft size={14} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-[-4px] transition-all" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* مستطيل تسجيل الخروج */}
        <Card className="border-none shadow-sm rounded-none bg-card mt-8 hover:bg-red-50 transition-colors cursor-pointer group border-r-4 border-r-destructive">
          <CardContent className="p-0">
            <button 
              onClick={handleLogout}
              className="w-full p-4 flex items-center justify-between text-destructive"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut size={16} />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold">تسجيل الخروج</span>
                  <span className="text-[9px] opacity-70">الخروج من حسابك الآمن</span>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        <div className="pt-10 text-center space-y-1">
          <p className="text-[10px] font-bold text-primary/40 tracking-tighter uppercase">Tawasul Platform</p>
          <p className="text-[8px] text-muted-foreground/50">إصدار 1.0.0 • صنع بكل فخر للمجتمع العربي</p>
        </div>
      </main>
    </div>
  );
}
