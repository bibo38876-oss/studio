
"use client"

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Repeat, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

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
  hashtags?: string[];
  email?: string;
}

export default function PostCard({ post }: { post: PostData }) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  
  const isAnonymous = !user || user.isAnonymous;
  const isOwner = user?.uid === post.authorId;

  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'posts', post.id, 'likes', user.uid);
  }, [firestore, post.id, user]);

  const { data: likeData } = useDoc(likeRef);
  const isLiked = !!likeData;

  const repostRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'reposts', post.id);
  }, [firestore, post.id, user]);

  const { data: repostData } = useDoc(repostRef);
  const isReposted = !!repostData;

  const formattedDate = post.createdAt?.toDate 
    ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ar })
    : 'منذ قليل';

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) {
      router.push('/login');
      return;
    }
    if (!user || !firestore) return;
    const postRef = doc(firestore, 'posts', post.id);
    const userLikeRef = doc(firestore, 'posts', post.id, 'likes', user.uid);

    if (isLiked) {
      deleteDocumentNonBlocking(userLikeRef);
      updateDoc(postRef, { likesCount: increment(-1) });
    } else {
      setDocumentNonBlocking(userLikeRef, { userId: user.uid, likedAt: new Date().toISOString() }, { merge: true });
      updateDoc(postRef, { likesCount: increment(1) });
      
      if (post.authorId !== user.uid) {
        const notifRef = doc(collection(firestore, 'users', post.authorId, 'notifications'));
        setDocumentNonBlocking(notifRef, {
          type: 'like',
          fromUserId: user.uid,
          fromUsername: user.displayName || 'مستخدم تواصل',
          postId: post.id,
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

    const postRef = doc(firestore, 'posts', post.id);
    const userRepostRef = doc(firestore, 'users', user.uid, 'reposts', post.id);

    if (isReposted) {
      deleteDocumentNonBlocking(userRepostRef);
      updateDoc(postRef, { repostsCount: increment(-1) });
      toast({ description: "تم إزالة إعادة النشر" });
    } else {
      setDocumentNonBlocking(userRepostRef, { 
        postId: post.id, 
        repostedAt: serverTimestamp(),
        originalAuthorId: post.authorId,
        // تخزين نسخة من البيانات للعرض السريع في التبويب
        postData: { ...post, createdAt: post.createdAt?.toDate()?.toISOString() || new Date().toISOString() }
      }, { merge: true });
      updateDoc(postRef, { repostsCount: increment(1) });
      toast({ description: "تم إعادة النشر" });
      
      if (post.authorId !== user.uid) {
        const notifRef = doc(collection(firestore, 'users', post.authorId, 'notifications'));
        setDocumentNonBlocking(notifRef, {
          type: 'mention', // سنستخدمها كرمز لإعادة النشر في الوقت الحالي
          fromUserId: user.uid,
          fromUsername: user.displayName || 'مستخدم تواصل',
          postId: post.id,
          createdAt: serverTimestamp(),
          read: false
        }, { merge: true });
      }
    }
  };

  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'posts', post.id));
    toast({ title: "تم الحذف", description: "تم حذف المنشور بنجاح." });
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "شكراً لك", description: "تم استلام بلاغك وسنقوم بمراجعته قريباً." });
  };

  const allMedia = post.mediaUrls || (post.mediaUrl ? [post.mediaUrl] : []);

  return (
    <>
      <Card 
        className="border-none shadow-none rounded-none w-full bg-card mb-2 last:mb-0 transition-all duration-200 cursor-pointer border-b border-muted/50"
        onClick={() => setIsCommentsOpen(true)}
      >
        <CardHeader className="p-3 pb-2 flex-row items-center justify-between space-y-0">
          <Link href={`/profile/${post.authorId}`} className="flex gap-2.5 group" onClick={(e) => e.stopPropagation()}>
            <Avatar className="h-9 w-9 border border-muted/20 transition-transform group-hover:scale-105 rounded-none bg-primary/10 text-primary">
              {post.authorAvatar ? <AvatarImage src={post.authorAvatar} alt={post.authorName} /> : null}
              <AvatarFallback className="text-[10px] font-bold">{post.authorName?.[0] || 'ت'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center">
              <span className="text-[11px] font-bold text-primary leading-tight group-hover:underline">{post.authorName || 'مستخدم مجهول'}</span>
              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                {formattedDate}
              </span>
            </div>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground rounded-full hover:bg-secondary">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs rounded-none border-none shadow-xl">
              {isOwner ? (
                <DropdownMenuItem onClick={handleDeletePost} className="gap-2 text-destructive cursor-pointer">
                  <Trash2 size={14} />
                  حذف المنشور
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleReport} className="gap-2 cursor-pointer">
                  <AlertTriangle size={14} />
                  إبلاغ عن محتوى
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className="px-0 py-0">
          {post.content && (
            <p className="px-3 py-2 text-sm text-foreground leading-relaxed whitespace-pre-wrap tracking-tight">
              {post.content}
            </p>
          )}
          
          {allMedia.length > 0 && (
            <div className="w-full mt-1 bg-black/5 overflow-hidden">
              <Carousel className="w-full">
                <CarouselContent className="-ml-0">
                  {allMedia.map((url, index) => (
                    <CarouselItem key={index} className="pl-0">
                      <div className="relative w-full flex items-center justify-center bg-black/5">
                        <img 
                          src={url} 
                          alt={`Post media ${index + 1}`} 
                          className="w-full h-auto block"
                          style={{ maxHeight: 'none', width: '100%', objectFit: 'contain' }}
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

        <CardFooter className="px-1 py-1 border-t-0 flex justify-around items-center h-9 mt-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 flex-1 gap-1.5 rounded-none transition-colors ${isLiked ? 'text-red-500 bg-red-500/5' : 'text-muted-foreground hover:bg-secondary/50'}`}
            onClick={handleLike}
          >
            <Heart size={16} className={isLiked ? "fill-current" : ""} />
            <span className="text-[10px] font-bold">{post.likesCount || 0}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 flex-1 text-muted-foreground gap-1.5 rounded-none hover:bg-secondary/50"
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentsOpen(true);
            }}
          >
            <MessageCircle size={16} />
            <span className="text-[10px] font-bold">{post.commentsCount || 0}</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 flex-1 gap-1.5 rounded-none transition-colors ${isReposted ? 'text-green-500 bg-green-500/5' : 'text-muted-foreground hover:bg-secondary/50'}`}
            onClick={handleRepost}
          >
            <Repeat size={16} className={isReposted ? "stroke-[3px]" : ""} />
            <span className="text-[10px] font-bold">{post.repostsCount || 0}</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 flex-1 text-muted-foreground rounded-none hover:bg-secondary/50" onClick={(e) => e.stopPropagation()}>
            <Share2 size={16} />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="sm:max-w-full h-[100dvh] p-0 border-none bg-background gap-0 overflow-hidden flex flex-col sm:max-w-[600px] sm:h-[95vh] sm:rounded-none animate-in fade-in zoom-in-95 duration-200">
          <DialogTitle className="sr-only">تفاصيل المنشور والتعليقات</DialogTitle>
          <CommentsDialog 
            postId={post.id} 
            postAuthorId={post.authorId} 
            post={post}
            onClose={() => setIsCommentsOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
