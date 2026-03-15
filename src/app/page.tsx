'use client';

import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirestore, useAuth, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { firestore } = useFirestore() ? { firestore: useFirestore() } : { firestore: null };
  const auth = useAuth();

  // Auto sign-in anonymously for the demo
  useEffect(() => {
    if (auth) {
      signInAnonymously(auth).catch(console.error);
    }
  }, [auth]);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection(postsQuery);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-0 md:px-4 pt-10 flex gap-6">
        {/* Left column - Hidden on small screens */}
        <div className="hidden md:block w-64 pt-4 h-fit sticky top-14">
          <LeftSidebar />
        </div>

        {/* Middle column - Feed */}
        <div className="flex-1 w-full max-w-full md:max-w-2xl mx-auto">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">جاري تحميل التحديثات...</p>
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-20 bg-card">
                <p className="text-muted-foreground">لا توجد منشورات بعد. كن أول من ينشر!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Hidden on small screens */}
        <div className="hidden lg:block w-80 pt-4 h-fit sticky top-14">
          <RightSidebar />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
