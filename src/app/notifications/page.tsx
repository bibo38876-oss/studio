
"use client"

import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch, getDocs, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Heart, UserPlus, MessageCircle, Repeat, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NotificationsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const handleMarkAllAsRead = async () => {
    if (!firestore || !user || !notifications) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      unreadNotifications.forEach(notif => {
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'notifications', notif.id), {
          read: true
        });
      });
      toast({ description: "تم تحديد جميع التنبيهات كمقروءة." });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل تحديث التنبيهات." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-2xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b flex justify-between items-center">
          <h1 className="text-sm font-bold text-primary">التنبيهات</h1>
          {notifications && notifications.some(n => !n.read) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] font-bold text-accent gap-1 hover:bg-accent/5"
              onClick={handleMarkAllAsRead}
            >
              <CheckCircle2 size={12} />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y divide-muted">
            {notifications.map((notif: any) => (
              <Link 
                key={notif.id} 
                href={notif.postId ? `/?post=${notif.postId}` : `/profile/${notif.fromUserId}`}
                className={`p-4 flex items-start gap-3 hover:bg-muted/10 transition-colors ${!notif.read ? 'bg-primary/5 border-r-4 border-primary' : ''}`}
                onClick={() => {
                  if (!notif.read && firestore && user) {
                    updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'notifications', notif.id), { read: true });
                  }
                }}
              >
                <div className="mt-1">
                  {notif.type === 'like' && <Heart size={16} className="text-red-500 fill-red-500" />}
                  {notif.type === 'follow' && <UserPlus size={16} className="text-primary" />}
                  {notif.type === 'comment' && <MessageCircle size={16} className="text-accent" />}
                  {notif.type === 'repost' && <Repeat size={16} className="text-green-500" />}
                </div>
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={notif.fromAvatar} alt={notif.fromUsername} />
                  <AvatarFallback>{notif.fromUsername?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col gap-0.5">
                  <p className="text-xs">
                    <span className="font-bold text-primary">{notif.fromUsername}</span>
                    <span className="text-muted-foreground mr-1">
                      {notif.type === 'like' && 'أعجب بمنشورك'}
                      {notif.type === 'follow' && 'بدأ في متابعتك'}
                      {notif.type === 'comment' && 'علّق على منشورك'}
                      {notif.type === 'repost' && 'أعاد نشر محتواك'}
                    </span>
                  </p>
                  <span className="text-[9px] text-muted-foreground">
                    {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: ar }) : 'منذ قليل'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 px-10 flex flex-col items-center">
            <CheckCircle2 size={40} className="text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-xs font-bold">صندوق التنبيهات فارغ.</p>
            <p className="text-[9px] text-muted-foreground mt-1 italic">عندما يتفاعل الآخرون معك، ستظهر التنبيهات هنا.</p>
          </div>
        )}
      </main>
    </div>
  );
}
