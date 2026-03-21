
"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase, initiateSignOut, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { LogOut, User, Bell, Shield, HelpCircle, ChevronLeft, ArrowRight, Moon, Sun, Lock, Loader2, ShieldCheck, FileText, Info, Sparkles, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import TimgadLogo from '@/components/ui/Logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function SettingsPage() {
  const { auth, user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);
  const isAdmin = user?.email === ADMIN_EMAIL || profile?.role === 'admin';

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    toast({
      description: checked ? "تم تفعيل الوضع الليلي 🌙" : "تم تفعيل الوضع النهاري ☀️",
    });
  };

  const togglePrivateAccount = (checked: boolean) => {
    if (!firestore || !user) return;
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      isPrivate: checked
    });
    toast({
      description: checked ? "حسابك الآن خاص 🔒" : "حسابك الآن عام 🌍",
    });
  };

  const handleLogout = () => {
    if (!auth) return;
    initiateSignOut(auth);
    router.push('/login');
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || newPassword.length < 6) {
      toast({ variant: "destructive", description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast({ title: "تم التحديث", description: "تم تغيير كلمة المرور بنجاح." });
      setIsPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "خطأ", 
        description: error.code === 'auth/requires-recent-login' 
          ? "يجب إعادة تسجيل الدخول لتغيير كلمة المرور." 
          : "فشل تحديث كلمة المرور." 
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user || user.isAnonymous) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary pt-12 pb-10 px-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
        <div className="relative z-10 container max-w-xl mx-auto flex flex-col items-center gap-4">
          <button onClick={() => router.back()} className="absolute right-0 top-0 text-white/80 hover:text-white transition-colors"><ArrowRight size={20} /></button>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mb-2">
            <TimgadLogo size={32} variant="white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white font-headline tracking-tighter">تيمقاد | Timgad</h1>
            <p className="text-[10px] text-white/60 mt-1 uppercase tracking-widest font-medium">إعدادات المنصة</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-xl -mt-6 px-4 space-y-3 relative z-20">
        <Card className="border-none shadow-sm rounded-none bg-card mb-4 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
              <Label htmlFor="dark-mode" className="flex items-center gap-4 flex-1 cursor-pointer">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary shrink-0">
                  {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary">المظهر</span>
                  <span className="text-[9px] text-muted-foreground">{isDarkMode ? 'الوضع الليلي نشط' : 'الوضع النهاري نشط'}</span>
                </div>
              </Label>
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h2 className="text-[10px] font-bold text-primary uppercase px-1 mb-1">فرص تيمقاد</h2>
          {/* تعطيل سوق القصص مع ملصق قريباً بناءً على طلب المستخدم */}
          <div 
            onClick={() => toast({ title: "قريباً جداً! 🚀", description: "سوق الإعلانات في مراحل التجهيز النهائية." })}
            className="opacity-70 grayscale-[50%]"
          >
            <Card className="border-none shadow-sm rounded-none bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group overflow-hidden border-r-4 border-r-primary">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <LayoutGrid size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">سوق القصص والأرباح</span>
                    <span className="text-[9px] text-muted-foreground">شاهد الإعلانات وحقق أرباحاً حقيقية</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-accent text-white text-[8px] h-4 font-bold uppercase">جديد قريباً</Badge>
                  <ChevronLeft size={14} className="text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-2 pt-2">
            <h2 className="text-[10px] font-bold text-accent uppercase px-1 mb-1">لوحة التحكم</h2>
            <Link href="/admin">
              <Card className="border-none shadow-sm rounded-none bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer group overflow-hidden border-r-4 border-r-accent">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-accent">الإدارة</span>
                      <span className="text-[9px] text-muted-foreground">التحكم في المنصة والمستخدمين</span>
                    </div>
                  </div>
                  <ChevronLeft size={14} className="text-accent/30" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-1">الخصوصية والأمان</h2>
          
          <Card className="border-none shadow-sm rounded-none bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                <Label htmlFor="private-account" className="flex items-center gap-4 flex-1 cursor-pointer">
                  <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary shrink-0">
                    <Shield size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">حساب خاص</span>
                    <span className="text-[9px] text-muted-foreground">فقط المتابعون يمكنهم رؤية منشوراتك</span>
                  </div>
                </Label>
                <Switch id="private-account" checked={profile?.isPrivate || false} onCheckedChange={togglePrivateAccount} />
              </div>
            </CardContent>
          </Card>

          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Card className="border-none shadow-sm rounded-none bg-card hover:bg-secondary/20 transition-colors cursor-pointer group overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Lock size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary">أمان الحساب</span>
                      <span className="text-[9px] text-muted-foreground">تغيير كلمة المرور</span>
                    </div>
                  </div>
                  <ChevronLeft size={14} className="text-muted-foreground/30" />
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold">تغيير كلمة المرور</DialogTitle>
                <DialogDescription className="text-[10px]">أدخل كلمة المرور الجديدة.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input type="password" placeholder="كلمة المرور الجديدة..." className="h-9 rounded-none bg-secondary/30 border-none text-xs" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <DialogFooter>
                <Button className="w-full rounded-full text-xs h-9 font-bold" onClick={handleChangePassword} disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? <Loader2 className="animate-spin h-4 w-4" /> : "تحديث كلمة المرور"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <h2 className="text-[10px] font-bold text-muted-foreground uppercase px-1 mt-4 mb-1">معلومات المنصة</h2>
          
          <div className="space-y-2">
            <Link href="/about">
              <Card className="border-none shadow-sm rounded-none bg-card hover:bg-secondary/20 transition-colors cursor-pointer group overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Info size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary">حول تيمقاد</span>
                      <span className="text-[9px] text-muted-foreground">رؤيتنا، رسالتنا، وقيمنا</span>
                    </div>
                  </div>
                  <ChevronLeft size={14} className="text-muted-foreground/30" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/privacy">
              <Card className="border-none shadow-sm rounded-none bg-card hover:bg-secondary/20 transition-colors cursor-pointer group overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <FileText size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary">سياسة الخصوصية</span>
                      <span className="text-[9px] text-muted-foreground">كيفية حماية بياناتك في تيمقاد</span>
                    </div>
                  </div>
                  <ChevronLeft size={14} className="text-muted-foreground/30" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <Card className="border-none shadow-sm rounded-none bg-card mt-8 hover:bg-red-50 transition-colors cursor-pointer border-r-4 border-r-destructive overflow-hidden">
          <CardContent className="p-0">
            <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between text-destructive">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><LogOut size={16} /></div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold">تسجيل الخروج</span>
                  <span className="text-[9px] opacity-70">الخروج من حساب تيمقاد</span>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        <div className="pt-10 text-center space-y-1">
          <p className="text-[10px] font-bold text-primary/40 tracking-tighter uppercase">Timgad Platform</p>
          <p className="text-[8px] text-muted-foreground/50">إصدار 1.0.0 • صُنع بكل فخر للمجتمع العربي</p>
        </div>
      </main>
    </div>
  );
}
