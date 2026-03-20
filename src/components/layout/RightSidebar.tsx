
"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebase, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, limit, doc, arrayUnion, arrayRemove, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, BadgeCheck, UserRoundPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import AadsUnit from '@/components/ads/AadsUnit';

export default function RightSidebar() {
  const { firestore, user: currentUser } = useFirebase();
  const router = useRouter();

  const isAnonymous = !currentUser || currentUser.isAnonymous;

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(5));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);
  const { data: currentUserProfile } = useDoc(currentUserRef);

  const suggestions = users?.filter(u => u.id !== currentUser?.uid) || [];

  const handleFollow = (targetUserId: string, targetUser: any, isFollowing: boolean) => {
    if (isAnonymous) {
      router.push('/login');
      return;
    }
    if (!firestore || !currentUser) return;

    const curUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', targetUserId);

    if (isFollowing) {
      updateDoc(curUserRef, { followingIds: arrayRemove(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
    } else {
      updateDoc(curUserRef, { followingIds: arrayUnion(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
      
      addDocumentNonBlocking(collection(firestore, 'users', targetUserId, 'notifications'), {
        type: 'follow',
        fromUserId: currentUser.uid,
        fromUsername: currentUserProfile?.username || currentUser.displayName || 'مستكشف تيمقاد',
        fromAvatar: currentUserProfile?.profilePictureUrl || '',
        createdAt: serverTimestamp(),
        read: false
      });
    }
  };

  return (
    <aside className="hidden lg:block w-80 space-y-6">
      <Card className="border-none shadow-none rounded-none bg-card">
        <CardHeader className="pb-3 px-4 pt-4 text-right">
          <CardTitle className="text-sm font-bold text-primary">اقتراحات المتابعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((user) => {
              const isFollowing = (user.followerIds || []).includes(currentUser?.uid);
              const isFollowingMe = (user.followingIds || []).includes(currentUser?.uid);
              const verificationType = user.verificationType || 'none';
              return (
                <div key={user.id} className="flex items-center justify-between">
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                      <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-right">
                      <div className="flex items-center gap-1.5 leading-tight justify-end">
                        <VerifiedBadge type={verificationType} size={12} />
                        <span className="text-xs font-bold text-primary group-hover:underline">{user.username}</span>
                      </div>
                      <span className="text-[8px] text-muted-foreground">{user.email || 'مستخدم تواصل'}</span>
                    </div>
                  </Link>
                  <Button 
                    size="sm" 
                    variant={isFollowing ? "secondary" : "outline"} 
                    className="rounded-full px-4 h-7 text-[10px] font-bold gap-1"
                    onClick={() => handleFollow(user.id, user, isFollowing)}
                  >
                    {!isFollowing && isFollowingMe && <UserRoundPlus size={10} />}
                    {isFollowing ? 'متابع' : isFollowingMe ? 'رد المتابعة' : 'متابعة'}
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-2">لا توجد اقتراحات حالياً.</p>
          )}
        </CardContent>
      </Card>

      {/* إعلان AADS في الشريط الجانبي */}
      <div className="p-4 bg-card rounded-none border border-muted/10 shadow-sm">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-4 text-center">إعلان مميز</h3>
        <AadsUnit />
      </div>
    </aside>
  );
}
