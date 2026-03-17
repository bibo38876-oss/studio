
"use client"

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bookmark, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CommentsDialog from "./CommentsDialog";
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PostData {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  mediaUrls?: string[];
  createdAt: any;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  bookmarksCount?: number;
  viewsCount?: number;
  authorVerificationType?: VerificationType;
}

export default function PostCard({ post, currentUserProfile }: { post: PostData, currentUserProfile?: any }) {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);
  
  const isAnonymous = !user || user.isAnonymous;
  const isOwner = user?.uid === post.authorId;

  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !post.id) return null;
    return doc(firestore, 'posts', post.id, 'likes', user.uid);
  }, [firestore, post.id, user?.uid]);
  const { data: likeData } = useDoc(likeRef);

  const bookmarkRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !post.id) return null;
    return doc(firestore, 'users', user.uid, 'bookmarks', post.id);
  }, [firestore, post.id, user?.uid]);
  const { data: bookmarkData } = useDoc(bookmarkRef);

  useEffect(() => {
    if (!firestore || !post.id || !user?.uid || isOwner) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !viewedRef.current) {
        viewedRef.current = true;
        updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { viewsCount: increment(1) });
      }
    }, { threshold: 0.5 });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [firestore, post.id, user?.uid, isOwner]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !post.id) return;
    if (likeData) {
      deleteDocumentNonBlocking(likeRef!);
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { likesCount: increment(-1) });
    } else {
      setDocumentNonBlocking(likeRef!, { createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { likesCount: increment(1) });
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !post.id) return;
    if (bookmarkData) {
      deleteDocumentNonBlocking(bookmarkRef!);
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { bookmarksCount: increment(-1) });
      toast({ description: "تمت الإزالة من المحفوظات." });
    } else {
      setDocumentNonBlocking(bookmarkRef!, { ...post, createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { bookmarksCount: increment(1) });
      toast({ description: "تم الحفظ بنجاح." });
    }
  };

  const renderContentWithHashtags = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[^\s#]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-accent font-bold hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <Card ref={cardRef} className="border-none shadow-none rounded-none w-full bg-card mb-0 cursor-pointer border-b-[0.5px] border-muted/10 hover:bg-muted/5 transition-all" onClick={() => setIsCommentsOpen(true)}>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-end space-y-0 text-right">
          <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 leading-tight justify-end">
                <VerifiedBadge type={post.authorVerificationType || 'none'} size={14} />
                <span className="text-sm font-bold text-primary">{post.authorName}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
            <Avatar className="h-10 w-10 border border-primary/10">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback className="font-bold">{post.authorName?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
        </CardHeader>

        <CardContent className="px-4 py-1 text-right">
          <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2 font-medium">
            {renderContentWithHashtags(post.content)}
          </div>
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mt-3 rounded-xl overflow-hidden border bg-muted/5">
              <img src={post.mediaUrls[0]} alt="Post" className="w-full h-auto object-cover max-h-[500px]" />
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 py-3 border-t border-muted/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={(e) => { e.stopPropagation(); handleLike(e); }} 
              className={cn("flex items-center gap-1.5 transition-colors", likeData ? "text-red-500" : "text-muted-foreground hover:text-red-500")}
            >
              <Heart size={18} className={likeData ? "fill-current" : ""} />
              <span className="text-[11px] font-bold">{post.likesCount || 0}</span>
            </motion.button>

            <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle size={18} />
              <span className="text-[11px] font-bold">{post.commentsCount || 0}</span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BarChart3 size={18} />
              <span className="text-[11px] font-bold">{post.viewsCount || 0}</span>
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={(e) => { e.stopPropagation(); handleBookmark(e); }} 
            className={cn("flex items-center gap-1.5 transition-colors", bookmarkData ? "text-blue-500" : "text-muted-foreground hover:text-blue-500")}
          >
            <Bookmark size={18} className={bookmarkData ? "fill-current" : ""} />
            <span className="text-[11px] font-bold">{post.bookmarksCount || 0}</span>
          </motion.button>
        </CardFooter>
      </Card>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="sm:max-w-[600px] h-[100dvh] sm:h-[95vh] p-0 border-none bg-background gap-0 overflow-hidden flex flex-col [&>button]:hidden">
          <DialogTitle className="sr-only">تفاصيل المنشور</DialogTitle>
          <CommentsDialog postId={post.id} postAuthorId={post.authorId} post={post} onClose={() => setIsCommentsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
