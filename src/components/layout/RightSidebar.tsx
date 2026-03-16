
"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebase, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, limit, doc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { Loader2, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RightSidebar() {
  const { firestore, user: currentUser } = useFirebase();
  const router = useRouter();

  const isAnonymous = !currentUser || currentUser.isAnonymous;

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(5));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const suggestions = users?.filter(u => u.id !== currentUser?.uid) || [];

  const handleFollow = (targetUserId: string, isFollowing: boolean) => {
    if (isAnonymous) {
      router.push('/login');
      return;
    }
    if (!firestore || !currentUser) return;

    const currentUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', targetUserId);

    const followingEntryRef = doc(firestore, 'users', currentUser.uid, 'following', targetUserId);
    const followerEntryRef = doc(firestore, 'users', targetUserId, 'followers', currentUser.uid);

    if (isFollowing) {
      deleteDocumentNonBlocking(followingEntryRef);
      deleteDocumentNonBlocking(followerEntryRef);
      updateDoc(currentUserRef, { followingIds: arrayRemove(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
    } else {
      setDocumentNonBlocking(followingEntryRef, { followedUserId: targetUserId, followedAt: new Date().toISOString() }, { merge: true });
      setDocumentNonBlocking(followerEntryRef, { followerUserId: currentUser.uid, followedAt: new Date().toISOString() }, { merge: true });
      updateDoc(currentUserRef, { followingIds: arrayUnion(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
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
              const isVerified = user.email === 'adelbenmaza8@gmail.com' || user.role === 'admin' || user.verificationType === 'blue' || user.verificationType === 'gold';
              return (
                <div key={user.id} className="flex items-center justify-between">
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                      <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-right">
                      <div className="flex items-center gap-1 leading-tight justify-end">
                        <span className="text-xs font-bold text-primary group-hover:underline">{user.username}</span>
                        {isVerified && <BadgeCheck size={12} className="text-accent fill-current" />}
                      </div>
                      <span className="text-[8px] text-muted-foreground">{user.email || 'مستخدم تواصل'}</span>
                    </div>
                  </Link>
                  <Button 
                    size="sm" 
                    variant={isFollowing ? "secondary" : "outline"} 
                    className="rounded-full px-4 h-7 text-[10px] font-bold"
                    onClick={() => handleFollow(user.id, isFollowing)}
                  >
                    {isFollowing ? 'متابع' : 'متابعة'}
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-2">لا توجد اقتراحات حالياً.</p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
