
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, useDoc, addDocumentNonBlocking } from '@/firebase';
import { collection, query, limit, doc, arrayUnion, arrayRemove, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, UserPlus, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import TimgadLogo from '@/components/ui/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function OnboardingPage() {
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const [followedCount, setFollowedCount] = useState(0);

  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router]);

  // جلب أفضل الحسابات (المسؤولين والموثقين)
  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(50));
  }, [firestore]);

  const { data: allUsers, isLoading } = useCollection(suggestionsQuery);

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);
  
  const { data: profile } = useDoc(currentUserRef);

  // تحديث عدد المتابعات محلياً عند تغير البروفايل
  useEffect(() => {
    if (profile?.followingIds) {
      setFollowedCount(profile.followingIds.length);
    }
  }, [profile?.followingIds]);

  const handleFollow = (targetId: string, isFollowing: boolean) => {
    if (!firestore || !currentUser) return;
    const curUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', targetId);

    if (isFollowing) {
      updateDoc(curUserRef, { followingIds: arrayRemove(targetId) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
    } else {
      updateDoc(curUserRef, { followingIds: arrayUnion(targetId) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
      
      addDocumentNonBlocking(collection(firestore, 'users', targetId, 'notifications'), {
        type: 'follow',
        fromUserId: currentUser.uid,
        fromUsername: profile?.username || currentUser.displayName || 'مستكشف تيمقاد',
        fromAvatar: profile?.profilePictureUrl || '',
        createdAt: serverTimestamp(),
        read: false
      });
    }
  };

  const progress = Math.min((followedCount / 5) * 100, 100);
  const canContinue = followedCount >= 5;

  if (isUserLoading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <header className="w-full bg-card border-b p-6 sticky top-0 z-50">
        <div className="container max-w-xl mx-auto flex flex-col items-center gap-4 text-center">
          <TimgadLogo size={40} className="text-primary" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-primary">مرحباً بك في تيمقاد</h1>
            <p className="text-xs text-muted-foreground">تابع 5 حسابات على الأقل لتبدأ في استكشاف المحتوى.</p>
          </div>
          <div className="w-full max-w-xs space-y-2 mt-2">
            <div className="flex justify-between text-[10px] font-bold text-primary uppercase">
              <span>{followedCount} / 5</span>
              <span>متابعة</span>
            </div>
            <Progress value={progress} className="h-2 rounded-full bg-secondary" />
          </div>
        </div>
      </header>

      <main className="container max-w-xl mx-auto py-6 px-4 flex-1">
        <div className="bg-primary/5 p-4 mb-6 flex items-center gap-3 border border-primary/10">
          <Sparkles className="text-accent" size={20} />
          <p className="text-xs font-medium text-primary text-right">لقد اخترنا لك مجموعة من المبدعين والتقنيين لتبدأ رحلتك معهم.</p>
        </div>

        <div className="space-y-1 divide-y divide-muted">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : allUsers?.filter(u => u.id !== currentUser.uid).map((user) => {
            const isFollowing = profile?.followingIds?.includes(user.id);
            const verificationType = user.email === 'adelbenmaza8@gmail.com' ? 'blue' : (user.verificationType || 'none');
            
            return (
              <div key={user.id} className="p-4 flex items-center justify-between bg-card hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-muted/20">
                    <AvatarImage src={user.profilePictureUrl} />
                    <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <VerifiedBadge type={verificationType} size={14} />
                      <span className="text-sm font-bold text-primary">{user.username}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[150px]">{user.bio || 'مبدع في تيمقاد'}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant={isFollowing ? "outline" : "default"} 
                  className={`h-8 rounded-full px-5 text-[10px] font-bold gap-2 ${isFollowing ? 'border-primary text-primary' : ''}`}
                  onClick={() => handleFollow(user.id, !!isFollowing)}
                >
                  {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                  {isFollowing ? 'متابع' : 'متابعة'}
                </Button>
              </div>
            );
          })}
        </div>
      </main>

      {canContinue && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50 flex justify-center animate-in slide-in-from-bottom duration-500">
          <Button 
            className="w-full max-w-sm rounded-full font-bold text-sm h-11 gap-2 shadow-lg shadow-primary/20"
            onClick={() => router.push('/')}
          >
            استمر إلى تيمقاد
            <ArrowLeft size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
