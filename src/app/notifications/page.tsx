
"use client"

import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, arrayUnion, arrayRemove, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Heart, UserPlus, MessageCircle, Repeat, CheckCircle2, Bell, UserRoundPlus, UserCheck, Trophy } from 'lucide-react';
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

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: currentUserProfile } = useDoc(currentUserProfileRef);

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

  const handleFollow = (targetUserId: string, isFollowing: boolean) => {
    if (!firestore || !user) return;

    const curUserRef = doc(firestore, 'users', user.uid);
    const targetUserRef = doc(firestore, 'users', targetUserId);

    if (isFollowing) {
      updateDoc(curUserRef, { followingIds: arrayRemove(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(user.uid) });
    } else {
      updateDoc(curUserRef, { followingIds: arrayUnion(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(user.uid) });
      
      addDocumentNonBlocking(collection(firestore, 'users', targetUserId, 'notifications'), {
        type: 'follow',
        fromUserId: user.uid,
        fromUsername: currentUserProfile?.username || user.displayName || 'مستكشف تيمقاد',
        fromAvatar: currentUserProfile?.profilePictureUrl || '',
        createdAt: serverTimestamp(),
        read: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-xl pt-8 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-8 z-30 p-3 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <h1 className="text-xs font-bold text-primary">التنبيهات</h1>
          </div>
          {notifications && notifications.some(n => !n.read) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[9px] font-bold text-accent gap-1 hover:bg-accent/5 rounded-full"
              onClick={handleMarkAllAsRead}
            >
              <CheckCircle2 size={10} />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary h-6 w-6" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y divide-muted/30">
            {notifications.map((notif: any) => {
              const isFollowing = currentUserProfile?.followingIds?.includes(notif.fromUserId);
              const isVaultWin = notif.type === 'vault_win';
              
              return (
                <div 
                  key={notif.id}
                  className={`p-4 flex items-start gap-3 transition-all duration-300 ${
                    !notif.read 
                      ? 'bg-primary/5 border-r-2 border-primary' 
                      : 'bg-card opacity-70'
                  } hover:bg-secondary/20 group`}
                  onClick={() => {
                    if (!notif.read && firestore && user) {
                      updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'notifications', notif.id), { read: true });
                    }
                  }}
                >
                  <div className="mt-1 shrink-0">
                    {notif.type === 'like' && <Heart size={14} className="text-red-500 fill-red-500" />}
                    {notif.type === 'follow' && <UserPlus size={14} className="text-primary" />}
                    {notif.type === 'comment' && <MessageCircle size={14} className="text-accent" />}
                    {notif.type === 'repost' && <Repeat size={14} className="text-green-500" />}
                    {isVaultWin && <Trophy size={14} className="text-yellow-500 fill-yellow-500" />}
                  </div>
                  
                  {isVaultWin ? (
                    <div className="h-9 w-9 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0 border border-yellow-500/20">
                      <span className="text-lg">🏺</span>
                    </div>
                  ) : (
                    <Link href={`/profile/${notif.fromUserId}`}>
                      <Avatar className="h-9 w-9 border rounded-full">
                        <AvatarImage src={notif.fromAvatar} alt={notif.fromUsername} />
                        <AvatarFallback className="text-[10px]">{notif.fromUsername?.[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                  )}

                  <div className="flex-1 flex flex-col gap-0.5">
                    {isVaultWin ? (
                      <div>
                        <p className="text-[11px] leading-tight font-bold text-primary">مبروك! لقد فزت بكنز تيمقاد</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{notif.message}</p>
                      </div>
                    ) : (
                      <Link href={notif.postId ? `/?post=${notif.postId}` : `/profile/${notif.fromUserId}`}>
                        <p className="text-[11px] leading-tight">
                          <span className="font-bold text-primary">{notif.fromUsername}</span>
                          <span className="text-muted-foreground mr-1">
                            {notif.type === 'like' && 'أعجب بمنشورك'}
                            {notif.type === 'follow' && 'بدأ في متابعتك'}
                            {notif.type === 'comment' && 'علّق على منشورك'}
                            {notif.type === 'repost' && 'أعاد نشر محتواك'}
                          </span>
                        </p>
                      </Link>
                    )}
                    <span className="text-[8px] text-muted-foreground">
                      {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: ar }) : 'منذ قليل'}
                    </span>
                    
                    {notif.type === 'follow' && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          variant={isFollowing ? "outline" : "default"} 
                          className="h-7 text-[9px] rounded-full px-4 font-bold gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(notif.fromUserId, !!isFollowing);
                          }}
                        >
                          {isFollowing ? <UserCheck size={10} /> : <UserRoundPlus size={10} />}
                          {isFollowing ? 'متابع' : 'رد المتابعة'}
                        </Button>
                      </div>
                    )}
                  </div>
                  {!notif.read && (
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 px-10 flex flex-col items-center gap-2">
            <CheckCircle2 size={32} className="text-muted-foreground/20" />
            <p className="text-muted-foreground text-[10px] font-bold">صندوق التنبيهات فارغ.</p>
            <p className="text-[8px] text-muted-foreground italic">تفاعل مع الآخرين لتبدأ باستقبال التنبيهات!</p>
          </div>
        )}
      </main>
    </div>
  );
}
