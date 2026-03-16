
"use client"

import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Search, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function MessagesPage() {
  const { firestore, user } = useFirebase();
  const router = useRouter();

  const isAnonymous = !user || user.isAnonymous;

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(20));
  }, [firestore]);

  const { data: chats, isLoading } = useCollection(usersQuery);

  if (isAnonymous) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-right">
      <Navbar />
      
      <main className="container mx-auto max-xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b">
          <div className="flex items-center justify-between flex-row-reverse">
            <h1 className="text-sm font-bold text-primary">الرسائل</h1>
            <Badge variant="outline" className="text-[8px] h-4 px-1.5 bg-primary/5 border-primary/20 text-primary rounded-none">الرسائل الخاصة قيد التطوير</Badge>
          </div>
          <div className="relative mt-3">
            <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن محادثة..." 
              className="h-8 pr-9 text-[10px] rounded-full bg-secondary/50 border-none text-right"
              disabled
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : chats && chats.length > 0 ? (
          <div className="divide-y divide-muted opacity-60">
            {chats.filter(u => u.id !== user.uid).map((chat: any) => {
              const isVerified = chat.email === 'adelbenmaza8@gmail.com' || chat.role === 'admin';
              return (
                <div key={chat.id} className="p-4 flex items-center gap-3 hover:bg-muted/10 cursor-not-allowed transition-colors group flex-row-reverse">
                  <Avatar className="h-12 w-12 border border-muted/20">
                    <AvatarImage src={chat.profilePictureUrl} alt={chat.username} />
                    <AvatarFallback>{chat.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex flex-col gap-0.5 text-right">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <div className="flex items-center gap-1 leading-tight justify-end">
                        {isVerified && <BadgeCheck size={14} className="text-accent fill-current" />}
                        <span className="text-xs font-bold text-primary">{chat.username}</span>
                      </div>
                      <span className="text-[8px] text-muted-foreground">الآن</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 italic">سيتم تفعيل الدردشة المباشرة قريباً...</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 px-10 flex flex-col items-center">
            <MessageSquare size={40} className="text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-xs font-bold">لا توجد محادثات بعد.</p>
            <p className="text-[9px] text-muted-foreground mt-1">تواصل مع أصدقائك لبدء الدردشة.</p>
          </div>
        )}
      </main>
    </div>
  );
}
