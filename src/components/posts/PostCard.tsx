
"use client"

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Bookmark, Trash2, AlertTriangle, Link as LinkIcon, BarChart3, UserPlus, UserCheck, UserRoundPlus, Rocket, Coffee, Sparkles, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp, arrayUnion, arrayRemove, updateDoc, collection } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import CommentsDialog from "./CommentsDialog";
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  promoted?: boolean;
  impressions_left?: number;
}

export default function PostCard({ post, currentUserProfile }: { post: PostData, currentUserProfile?: any }) {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
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

  const isFollowingUser = currentUserProfile?.followingIds?.includes(post.authorId);

  return (
    <>
      <Card ref={cardRef} className="border-none shadow-none rounded-none w-full bg-card mb-0 cursor-pointer border-b-[0.5px] border-muted/10 hover:bg-muted/5 transition-all" onClick={() => setIsCommentsOpen(true)}>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 text-right">
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleLike(e); }} className={cn("h-8 flex items-center gap-1.5 px-3 rounded-full", likeData ? "text-red-500 bg-red-50" : "text-muted-foreground")}>
              <Heart size={18} className={likeData ? "fill-current" : ""} />
              <span className="text-[11px] font-bold">{post.likesCount || 0}</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleBookmark(e); }} className={cn("h-8 flex items-center gap-1.5 px-3 rounded-full", bookmarkData ? "text-accent bg-accent/5" : "text-muted-foreground")}>
              <Bookmark size={18} className={bookmarkData ? "fill-current" : ""} />
              <span className="text-[11px] font-bold">{post.bookmarksCount || 0}</span>
            </motion.button>
          </div>
          <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1 leading-tight">
                <VerifiedBadge type={post.authorVerificationType || 'none'} size={12} />
                <span className="text-sm font-bold text-primary">{post.authorName}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
            <Avatar className="h-9 w-9"><AvatarImage src={post.authorAvatar} /><AvatarFallback>{post.authorName?.[0]}</AvatarFallback></Avatar>
          </Link>
        </CardHeader>
        <CardContent className="px-4 py-1 text-right">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mt-3 rounded-xl overflow-hidden border">
              <img src={post.mediaUrls[0]} alt="Post" className="w-full h-auto" />
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 py-2 border-t border-muted/5 flex justify-between">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1"><MessageCircle size={16} /><span className="text-[10px] font-bold">{post.commentsCount || 0}</span></div>
            <div className="flex items-center gap-1"><BarChart3 size={16} /><span className="text-[10px] font-bold">{post.viewsCount || 0}</span></div>
          </div>
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
