
"use client"

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ChevronRight, UserPlus, UserCheck, UserRoundPlus, Users } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, arrayUnion, arrayRemove, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import Link from 'next/link';

function ConnectionsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const initialTab = searchParams.get('tab') || 'followers';
  const router = useRouter();
  
  const { firestore, user: currentUser } = useFirebase();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);

  const { data: currentUserProfile } = useDoc(currentUserProfileRef);

  const followersQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.followerIds || profile.followerIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('id', 'in', profile.followerIds.slice(0, 30)), limit(30));
  }, [firestore, profile?.followerIds]);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.followingIds || profile.followingIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('id', 'in', profile.followingIds.slice(0, 30)), limit(30));
  }, [firestore, profile?.followingIds]);

  const { data: followers, isLoading: isFollowersLoading } = useCollection(followersQuery);
  const { data: following, isLoading: isFollowingLoading } = useCollection(followingQuery);

  const handleFollow = (targetId: string, targetUser: any) => {
    if (!currentUser?.uid || !firestore) {
      router.push('/login');
      return;
    }

    const isCurrentlyFollowing = currentUserProfile?.followingIds?.includes(targetId);
    const curUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', targetId);

    if (isCurrentlyFollowing) {
      updateDoc(curUserRef, { followingIds: arrayRemove(targetId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
    } else {
      updateDoc(curUserRef, { followingIds: arrayUnion(targetId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
      
      addDocumentNonBlocking(collection(firestore, 'users', targetId, 'notifications'), {
        type: 'follow',
        fromUserId: currentUser.uid,
        fromUsername: currentUserProfile?.username || currentUser.displayName || 'مستكشف تيمقاد',
        fromAvatar: currentUserProfile?.profilePictureUrl || '',
        createdAt: serverTimestamp(),
        read: false
      });
    }
  };

  if (isProfileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b flex items-center gap-4 h-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary">{profile?.username}</span>
            <span className="text-[8px] text-muted-foreground">قوائم التواصل</span>
          </div>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="w-full bg-background border-b rounded-none h-10 p-0 overflow-x-auto no-scrollbar">
            <TabsTrigger value="followers" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-[11px]">المتابعين</TabsTrigger>
            <TabsTrigger value="following" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-[11px]">يتابعهم</TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-0">
            {isFollowersLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
            ) : followers && followers.length > 0 ? (
              <div className="divide-y divide-muted/30">
                {followers.map((u: any) => (
                  <UserListItem key={u.id} user={u} onFollow={() => handleFollow(u.id, u)} isMe={u.id === currentUser?.uid} followingIds={currentUserProfile?.followingIds || []} followerIds={currentUserProfile?.followerIds || []} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 px-10 flex flex-col items-center">
                <Users size={40} className="text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-[10px] font-bold">لا يوجد متابعين بعد.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {isFollowingLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
            ) : following && following.length > 0 ? (
              <div className="divide-y divide-muted/30">
                {following.map((u: any) => (
                  <UserListItem key={u.id} user={u} onFollow={() => handleFollow(u.id, u)} isMe={u.id === currentUser?.uid} followingIds={currentUserProfile?.followingIds || []} followerIds={currentUserProfile?.followerIds || []} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 px-10 flex flex-col items-center">
                <Users size={40} className="text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-[10px] font-bold">لا يتابع أحداً بعد.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function UserListItem({ user, onFollow, isMe, followingIds, followerIds }: { user: any, onFollow: () => void, isMe: boolean, followingIds: string[], followerIds: string[] }) {
  const isFollowing = followingIds.includes(user.id);
  const isFollowingMe = followerIds.includes(user.id);

  return (
    <div className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
      <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
        <Avatar className="h-10 w-10 border border-muted/20">
          <AvatarImage src={user.profilePictureUrl} alt={user.username} />
          <AvatarFallback>{user.username?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5 leading-tight justify-end">
            <VerifiedBadge type={user.verificationType || 'none'} size={12} />
            <span className="text-xs font-bold text-primary group-hover:underline">{user.username}</span>
          </div>
          <span className="text-[9px] text-muted-foreground">{user.email}</span>
        </div>
      </Link>
      {!isMe && (
        <Button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFollow(); }} 
          variant={isFollowing ? "outline" : "default"} 
          className="rounded-full px-5 h-7 text-[10px] font-bold gap-1"
        >
          {isFollowing ? (
            <>
              <UserCheck size={10} />
              متابع
            </>
          ) : isFollowingMe ? (
            <>
              <UserRoundPlus size={10} />
              رد المتابعة
            </>
          ) : (
            <>
              <UserPlus size={10} />
              متابعة
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <ConnectionsContent />
    </Suspense>
  );
}
