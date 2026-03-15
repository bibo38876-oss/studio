"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebase, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, limit, doc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RightSidebar() {
  const { firestore, user: currentUser } = useFirebase();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(5));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  // Filter out current user and already followed users (simulated here for brevity)
  const suggestions = users?.filter(u => u.id !== currentUser?.uid) || [];

  const handleFollow = (targetUserId: string, isFollowing: boolean) => {
    if (!firestore || !currentUser) return;

    const currentUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', targetUserId);

    // Follower list subcollection paths as per backend.json
    const followingEntryRef = doc(firestore, 'users', currentUser.uid, 'following', targetUserId);
    const followerEntryRef = doc(firestore, 'users', targetUserId, 'followers', currentUser.uid);

    if (isFollowing) {
      // Unfollow logic
      deleteDocumentNonBlocking(followingEntryRef);
      deleteDocumentNonBlocking(followerEntryRef);
      updateDoc(currentUserRef, { followingIds: arrayRemove(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
    } else {
      // Follow logic
      setDocumentNonBlocking(followingEntryRef, { followedUserId: targetUserId, followedAt: new Date().toISOString() }, { merge: true });
      setDocumentNonBlocking(followerEntryRef, { followerUserId: currentUser.uid, followedAt: new Date().toISOString() }, { merge: true });
      updateDoc(currentUserRef, { followingIds: arrayUnion(targetUserId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
    }
  };

  return (
    <aside className="hidden lg:block w-80 space-y-6">
      <Card className="border-none shadow-none rounded-none bg-card">
        <CardHeader className="pb-3 px-4 pt-4">
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
              return (
                <div key={user.id} className="flex items-center justify-between">
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                      <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary leading-tight group-hover:underline">{user.username}</span>
                      <span className="text-[10px] text-muted-foreground">@{user.id.slice(0, 5)}</span>
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

      <Card className="border-none shadow-none rounded-none bg-card">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-bold text-primary">الأكثر تداولاً</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          {[
            { tag: '#رؤية_2030', posts: '1.2K' },
            { tag: '#تواصل_اجتماعي', posts: '850' },
            { tag: '#تقنية', posts: '2.5K' },
          ].map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <p className="text-xs font-bold text-primary group-hover:text-accent transition-colors">{item.tag}</p>
              <p className="text-[10px] text-muted-foreground">{item.posts} منشور</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="px-4 text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 opacity-70">
        <a href="#" className="hover:underline">عن تواصل</a>
        <a href="#" className="hover:underline">سياسة الخصوصية</a>
        <span>© 2024 تواصل</span>
      </div>
    </aside>
  );
}
