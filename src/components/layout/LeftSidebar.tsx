
"use client"

import Link from 'next/link';
import { Compass, Settings, MessageSquare, Loader2, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import TimgadLogo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

export default function LeftSidebar() {
  const { user, firestore } = useFirebase();
  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading } = useDoc(userRef);

  if (isLoading) {
    return (
      <aside className="hidden md:flex w-64 items-center justify-center py-10">
        <Loader2 className="animate-spin text-primary h-6 w-6" />
      </aside>
    );
  }

  const isAdmin = user?.email === ADMIN_EMAIL || profile?.role === 'admin';

  return (
    <aside className="hidden md:block w-64 space-y-4">
      <Card className="border-none shadow-none rounded-none overflow-hidden bg-card">
        <div className="h-16 bg-primary/10 w-full flex items-center justify-center">
          <TimgadLogo size={32} className="text-primary/40" />
        </div>
        <CardContent className="relative pt-0 px-4 pb-6">
          <Avatar className="h-16 w-16 absolute -top-8 right-4 border-4 border-card rounded-full bg-background text-primary">
            {profile?.profilePictureUrl ? <AvatarImage src={profile?.profilePictureUrl} alt={profile?.username} /> : null}
            <AvatarFallback className="font-bold text-lg">{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="mt-10 space-y-0.5 text-right">
            <h3 className="font-bold text-md text-primary">{profile?.username || 'مستكشف تيمقاد'}</h3>
            <p className="text-[10px] text-muted-foreground">{profile?.email}</p>
          </div>
          <div className="mt-5 flex gap-4 border-t pt-4">
            <div className="flex flex-col text-center flex-1">
              <span className="font-bold text-primary text-sm">{profile?.followerIds?.length || 0}</span>
              <span className="text-[9px] text-muted-foreground">متابع</span>
            </div>
            <div className="flex flex-col text-center flex-1 border-r">
              <span className="font-bold text-primary text-sm">{profile?.followingIds?.length || 0}</span>
              <span className="text-[9px] text-muted-foreground">يتابع</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card rounded-none p-1 space-y-0.5">
        {[
          { icon: <Compass size={18} />, label: 'استكشف تيمقاد', path: '/explore' },
          { icon: <TrendingUp size={18} />, label: 'مركز الأرباح', path: '/earn', highlight: true },
          { icon: <MessageSquare size={18} />, label: 'المجموعات', path: '/groups' },
          { icon: <Settings size={18} />, label: 'الإعدادات', path: '/settings' },
        ].map((item, i) => (
          <Link 
            key={i} 
            href={item.path} 
            className={cn(
              "flex items-center gap-3 p-3 transition-all rounded-lg",
              item.highlight ? "text-accent bg-accent/5 font-bold" : "text-muted-foreground hover:bg-secondary hover:text-primary"
            )}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}

        {isAdmin && (
          <Link 
            href="/admin" 
            className="flex items-center gap-3 p-3 text-accent hover:bg-accent/10 transition-all rounded-lg mt-2 border-t border-accent/10"
          >
            <ShieldCheck size={18} />
            <span className="text-sm font-bold">لوحة الإدارة</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
