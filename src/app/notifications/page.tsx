
"use client"

import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Heart, UserPlus, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationsPage() {
  const { firestore, user } = useFirebase();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-2xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b">
          <h1 className="text-sm font-bold text-primary">التنبيهات</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y divide-muted">
            {notifications.map((notif: any) => (
              <div key={notif.id} className={`p-4 flex items-start gap-3 hover:bg-muted/10 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}>
                <div className="mt-1">
                  {notif.type === 'like' && <Heart size={16} className="text-red-500 fill-red-500" />}
                  {notif.type === 'follow' && <UserPlus size={16} className="text-primary" />}
                  {notif.type === 'mention' && <MessageCircle size={16} className="text-accent" />}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={notif.fromAvatar} alt={notif.fromUsername} />
                  <AvatarFallback>{notif.fromUsername?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col gap-0.5">
                  <p className="text-xs">
                    <span className="font-bold text-primary">{notif.fromUsername}</span>
                    <span className="text-muted-foreground mr-1">
                      {notif.type === 'like' && 'أعجب بمنشورك'}
                      {notif.type === 'follow' && 'بدأ في متابعتك'}
                      {notif.type === 'mention' && 'ذكرك في تعليق'}
                    </span>
                  </p>
                  <span className="text-[9px] text-muted-foreground">
                    {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: ar }) : 'منذ قليل'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 px-10">
            <p className="text-muted-foreground text-xs">لا توجد تنبيهات حالياً.</p>
          </div>
        )}
      </main>
    </div>
  );
}
