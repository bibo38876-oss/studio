
"use client"

import Link from 'next/link';
import { Compass, Settings, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function LeftSidebar() {
  const { user, firestore } = useFirebase();

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

  return (
    <aside className="hidden md:block w-64 space-y-4">
      <Card className="border-none shadow-none rounded-none overflow-hidden bg-card">
        <div className="h-16 bg-primary/10 w-full" />
        <CardContent className="relative pt-0 px-4 pb-6">
          <Avatar className="h-16 w-16 absolute -top-8 right-4 border-4 border-card">
            <AvatarImage src={profile?.profilePictureUrl} alt={profile?.username} />
            <AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="mt-10 space-y-0.5">
            <h3 className="font-bold text-md text-primary">{profile?.username || 'مستخدم جديد'}</h3>
            <p className="text-[10px] text-muted-foreground">{profile?.email}</p>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {profile?.bio || 'لا يوجد نبذة شخصية بعد.'}
          </p>
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
          { icon: <Compass size={18} />, label: 'استكشف', path: '/explore' },
          { icon: <MessageSquare size={18} />, label: 'المجموعات', path: '/groups' },
          { icon: <Settings size={18} />, label: 'الإعدادات', path: '/settings' },
        ].map((item, i) => (
          <Link 
            key={i} 
            href={item.path} 
            className="flex items-center gap-3 p-3 text-muted-foreground hover:bg-secondary hover:text-primary transition-all rounded-lg"
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
