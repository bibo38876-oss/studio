"use client"

import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase, initiateSignOut } from '@/firebase';
import { LogOut, User, Bell, Shield, HelpCircle, ChevronLeft } from 'lucide-react';
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
    { icon: <Bell size={16} />, label: 'التنبيهات', desc: 'إدارة الإشعارات والتنبيهات' },
    { icon: <Shield size={16} />, label: 'الخصوصية والأمان', desc: 'من يستطيع رؤية محتواك' },
    { icon: <HelpCircle size={16} />, label: 'المساعدة والدعم', desc: 'مركز المساعدة، سياسة الخصوصية' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronLeft size={20} className="rotate-180" />
          </Button>
          <h1 className="text-sm font-bold text-primary">الإعدادات</h1>
        </div>

        <div className="mt-2 space-y-1">
          <Card className="border-none shadow-none rounded-none bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">عام</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {settingsOptions.map((option, i) => (
                <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-muted/10 transition-colors text-right border-b last:border-none">
                  <div className="flex items-center gap-3">
                    <div className="text-primary">{option.icon}</div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary">{option.label}</span>
                      <span className="text-[9px] text-muted-foreground">{option.desc}</span>
                    </div>
                  </div>
                  <ChevronLeft size={14} className="text-muted-foreground/30" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-none rounded-none bg-card">
            <CardContent className="p-0">
              <button 
                onClick={handleLogout}
                className="w-full p-4 flex items-center gap-3 hover:bg-red-50 text-destructive transition-colors text-right"
              >
                <LogOut size={16} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold">تسجيل الخروج</span>
                  <span className="text-[9px] opacity-70">الخروج من حسابك الحالي</span>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-muted-foreground">تواصل | Tawasul v1.0.0</p>
          <p className="text-[8px] text-muted-foreground/50 mt-1">صنع بكل فخر للمجتمع العربي</p>
        </div>
      </main>
    </div>
  );
}
