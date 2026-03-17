
"use client"

import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Search, BadgeCheck, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import TimgadLogo from '@/components/ui/Logo';

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
      
      <main className="container mx-auto max-w-xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-primary">المحادثات</h1>
            <Badge variant="outline" className="text-[8px] h-4 px-1.5 bg-primary/5 border-primary/20 text-primary rounded-none">تجريبي</Badge>
          </div>
        </div>

        {/* مركز دعم تيمقاد - ثابت في الأعلى */}
        <Link href="/support" className="p-4 flex items-center justify-between bg-primary/5 border-b border-primary/10 hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center shadow-md">
              <TimgadLogo size={24} variant="white" />
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-primary">إدارة تيمقاد (الدعم الفني)</span>
                <ShieldCheck size={14} className="text-accent" />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium italic">اضغط هنا لمراسلة الإدارة بخصوص شراء العملات</p>
            </div>
          </div>
          <ChevronLeft size={16} className="text-primary/40" />
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-muted opacity-60">
            {chats?.filter(u => u.id !== user.uid).map((chat: any) => {
              const isVerified = chat.verificationType === 'blue' || chat.verificationType === 'gold';
              return (
                <div key={chat.id} className="p-4 flex items-center gap-3 hover:bg-muted/10 cursor-not-allowed transition-colors group">
                  <Avatar className="h-12 w-12 border border-muted/20">
                    <AvatarImage src={chat.profilePictureUrl} alt={chat.username} />
                    <AvatarFallback>{chat.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex flex-col gap-0.5 text-right">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 leading-tight justify-end">
                        {isVerified && <BadgeCheck size={14} className="text-accent fill-current" />}
                        <span className="text-xs font-bold text-primary">{chat.username}</span>
                      </div>
                      <span className="text-[8px] text-muted-foreground">قريباً</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 italic">المراسلة المباشرة بين الأعضاء قيد التطوير...</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
