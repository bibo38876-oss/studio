
"use client"

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Repeat, Trash2, AlertTriangle, Link as LinkIcon, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CommentsDialog from "./CommentsDialog";
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

interface PostData {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video';
  createdAt: any;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  viewsCount?: number;
  hashtags?: string[];
  email?: string;
  authorVerificationType?: VerificationType;
}

export default function PostCard({ post }: { post: PostData }) {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isRepostAnimating, setIsRepostAnimating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);
  
  const isAnonymous = !user || user.isAnonymous;
  const isOwner = user?.uid === post.authorId;

  const centralPostRef = useMemoFirebase(() => {
    if (!firestore || !post.id) return null;
    return doc(firestore, 'posts', post.id);
  }, [firestore, post.id]);

  const { data: centralPost, isLoading: isCentralLoading } = useDoc(centralPostRef);

  const displayPost = centralPost || post;

  const authorRef = useMemoFirebase(() => {
    if (!firestore || !displayPost.authorId) return null;
    return doc(firestore, 'users', displayPost.authorId);
  }, [firestore, displayPost.authorId]);
  
  const { data: authorData } = useDoc(authorRef);

  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user || !displayPost.id) return null;
    return doc(firestore, 'posts', displayPost.id, 'likes', user.uid);
  }, [firestore, displayPost.id, user]);

  const { data: likeData } = useDoc(likeRef);
  const isLiked = !!likeData;

  const repostRef = useMemoFirebase(() => {
    if (!firestore || !user || !displayPost.id) return null;
    return doc(firestore, 'users', user.uid, 'reposts', displayPost.id);
  }, [firestore, displayPost.id, user]);

  const { data: repostData } = useDoc(repostRef);
  const isReposted = !!repostData;

  useEffect(() => {
    if (!firestore || !post.id || viewedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          const postRef = doc(firestore, 'posts', post.id);
          updateDocumentNonBlocking(postRef, {
            viewsCount: increment(1)
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [firestore, post.id]);

  if (!isCentralLoading && centralPost === null) {
    return null;
  }

  const verificationType: VerificationType = displayPost.email === 'adelbenmaza8@gmail.com' 
    ? 'blue' 
    : (authorData?.verificationType || displayPost.authorVerificationType || 'none');

  const formattedDate = displayPost.createdAt?.toDate 
    ? formatDistanceToNow(displayPost.createdAt.toDate(), { addSuffix: true, locale: ar })
    : 'منذ قليل';

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) {
      router.push('/login');
      return;
    }
    if (!user || !firestore) return;

    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 500);

    const postRef = doc(firestore, 'posts', displayPost.id);
    const userLikeRef = doc(firestore, 'posts', displayPost.id, 'likes', user.uid);
    const personalLikeRef = doc(firestore, 'users', user.uid, 'likedPosts', displayPost.id);

    if (isLiked) {
      deleteDocumentNonBlocking(userLikeRef);
      deleteDocumentNonBlocking(personalLikeRef);
      updateDocumentNonBlocking(postRef, { likesCount: increment(-1) });
    } else {
      const timestamp = new Date().toISOString();
      setDocumentNonBlocking(userLikeRef, { userId: user.uid, likedAt: timestamp }, { merge: true });
      setDocumentNonBlocking(personalLikeRef, { 
        ...displayPost, 
        likedAt: timestamp,
        createdAt: displayPost.createdAt?.toDate ? displayPost.createdAt.toDate().toISOString() : displayPost.createdAt
      }, { merge: true });
      updateDocumentNonBlocking(postRef, { likesCount: increment(1) });
      
      if (displayPost.authorId !== user.uid) {
        const notifRef = doc(collection(firestore, 'users', displayPost.authorId, 'notifications'));
        setDocumentNonBlocking(notifRef, {
          type: 'like',
          fromUserId: user.uid,
          fromUsername: user.displayName || 'مستخدم تيمقاد',
          fromAvatar: user.photoURL || '',
          postId: displayPost.id,
          createdAt: serverTimestamp(),
          read: false
        }, { merge: true });
      }
    }
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) {
      router.push('/login');
      return;
    }
    if (!user || !firestore) return;

    setIsRepostAnimating(true);
    setTimeout(() => setIsRepostAnimating(false), 500);

    const postRef = doc(firestore, 'posts', displayPost.id);
    const userRepostRef = doc(firestore, 'users', user.uid, 'reposts', displayPost.id);

    if (isReposted) {
      deleteDocumentNonBlocking(userRepostRef);
      updateDocumentNonBlocking(postRef, { repostsCount: increment(-1) });
    } else {
      setDocumentNonBlocking(userRepostRef, { 
        postId: displayPost.id, 
        repostedAt: serverTimestamp(),
        originalAuthorId: displayPost.authorId,
        postData: { ...displayPost, createdAt: displayPost.createdAt?.toDate ? displayPost.createdAt.toDate().toISOString() : displayPost.createdAt }
      }, { merge: true });
      updateDocumentNonBlocking(postRef, { repostsCount: increment(1) });
      
      if (displayPost.authorId !== user.uid) {
        const notifRef = doc(collection(firestore, 'users', displayPost.authorId, 'notifications'));
        setDocumentNonBlocking(notifRef, {
          type: 'repost', 
          fromUserId: user.uid,
          fromUsername: user.displayName || 'مستخدم تيمقاد',
          postId: displayPost.id,
          createdAt: serverTimestamp(),
          read: false
        }, { merge: true });
      }
    }
  };

  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'posts', displayPost.id));
    toast({ title: "تم الحذف", description: "تم حذف المنشور بنجاح." });
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "شكراً لك", description: "تم استلام بلاغك وسنقوم بمراجعته قريباً." });
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${displayPost.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "تم النسخ", description: "تم نسخ رابط المنشور إلى الحافظة." });
  };

  const renderContent = (content: string) => {
    if (!content) return null;

    const isLong = content.length > 250;
    const displayContent = isLong && !isExpanded ? content.slice(0, 250) + "..." : content;

    const parts = displayContent.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <Link 
            key={i} 
            href={`/explore?q=${encodeURIComponent(part)}`}
            className="text-accent font-bold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return part;
    });

    return (
      <div className="flex flex-col text-right">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap tracking-tight text-right">
          {parts}
        </p>
        {isLong && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-accent text-[10px] font-bold mt-1 text-right hover:underline"
          >
            {isExpanded ? 'عرض أقل' : 'اقرأ المزيد'}
          </button>
        )}
      </div>
    );
  };

  const allMedia = displayPost.mediaUrls || (displayPost.mediaUrl ? [displayPost.mediaUrl] : []);

  return (
    <>
      <Card 
        ref={cardRef}
        className="border-none shadow-none rounded-none w-full bg-card mb-0 cursor-pointer border-b-[0.5px] border-muted/10 hover:bg-muted/5 transition-colors"
        onClick={() => setIsCommentsOpen(true)}
      >
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground rounded-full hover:bg-secondary">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                <LinkIcon size={12} />
                نسخ الرابط
              </DropdownMenuItem>
              {isOwner ? (
                <DropdownMenuItem onClick={handleDeletePost} className="gap-2 text-destructive cursor-pointer">
                  <Trash2 size={12} />
                  حذف المنشور
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleReport} className="gap-2 cursor-pointer">
                  <AlertTriangle size={12} />
                  إبلاغ
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href={`/profile/${displayPost.authorId}`} className="flex flex-row gap-3 group items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 leading-tight justify-end">
                <span className="text-sm font-bold text-primary group-hover:underline">{displayPost.authorName || 'مستخدم تيمقاد'}</span>
                <VerifiedBadge type={verificationType} size={13} />
              </div>
              <span className="text-[9px] text-muted-foreground text-right">
                {formattedDate}
              </span>
            </div>
            <Avatar className="h-9 w-9 border border-muted/20 rounded-full bg-primary/5 shrink-0">
              {displayPost.authorAvatar ? <AvatarImage src={displayPost.authorAvatar} alt={displayPost.authorName} /> : null}
              <AvatarFallback className="text-[10px] font-bold">{displayPost.authorName?.[0] || 'ت'}</AvatarFallback>
            </Avatar>
          </Link>
        </CardHeader>
        
        <CardContent className="px-4 py-1 text-right">
          {displayPost.content && renderContent(displayPost.content)}
          
          {allMedia.length > 0 && (
            <div className="w-full mt-2 mb-2 rounded-lg overflow-hidden border border-muted/10">
              <Carousel className="w-full" opts={{ direction: 'rtl' }}>
                <CarouselContent className="-ml-0">
                  {allMedia.map((url: string, index: number) => (
                    <CarouselItem key={index} className="pl-0">
                      <div className="relative w-full aspect-auto bg-black/5">
                        <img 
                          src={url} 
                          alt={`Post media ${index + 1}`} 
                          className="w-full h-auto block object-cover"
                          loading="lazy"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-4 py-1 border-t-0 flex flex-row justify-between items-center h-9">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-7 flex items-center gap-1.5 rounded-full px-2 transition-all duration-200 active:scale-90 border-none bg-transparent group",
              isLiked ? "text-red-500 hover:bg-red-500/10" : "text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
            )}
            onClick={handleLike}
          >
            <Heart 
              size={16} 
              className={cn(
                "transition-all duration-300", 
                isLiked ? "fill-current scale-110" : "",
                isLikeAnimating ? "animate-icon-pop" : ""
              )} 
            />
            <span className="text-[10px] font-bold">{displayPost.likesCount || 0}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 flex items-center text-muted-foreground gap-1.5 rounded-full px-2 border-none bg-transparent hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentsOpen(true);
            }}
          >
            <MessageCircle size={16} />
            <span className="text-[10px] font-bold">{displayPost.commentsCount || 0}</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-7 flex items-center gap-1.5 rounded-full px-2 transition-all duration-200 active:scale-90 border-none bg-transparent",
              isReposted ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground hover:bg-green-500/10 hover:text-green-500"
            )}
            onClick={handleRepost}
          >
            <Repeat 
              size={16} 
              className={cn(
                "transition-all duration-300", 
                isReposted ? "stroke-[2.5px] scale-110" : "",
                isRepostAnimating ? "animate-icon-pop" : ""
              )} 
            />
            <span className="text-[10px] font-bold">{displayPost.repostsCount || 0}</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 flex items-center text-muted-foreground gap-1.5 rounded-full px-2 border-none bg-transparent hover:bg-secondary hover:text-foreground transition-all active:scale-95"
            onClick={(e) => e.stopPropagation()}
          >
            <BarChart3 size={16} />
            <span className="text-[10px] font-bold">{displayPost.viewsCount || 0}</span>
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="sm:max-w-full h-[100dvh] p-0 border-none bg-background gap-0 overflow-hidden flex flex-col sm:max-w-[600px] sm:h-[95vh] animate-in fade-in zoom-in-95 duration-200">
          <DialogTitle className="sr-only">تفاصيل المنشور</DialogTitle>
          <CommentsDialog 
            postId={displayPost.id} 
            postAuthorId={displayPost.authorId} 
            post={displayPost}
            onClose={() => setIsCommentsOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
