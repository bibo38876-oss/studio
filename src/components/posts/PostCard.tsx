
"use client"

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Repeat, Bookmark, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, increment, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CommentsDialog from "./CommentsDialog";

interface PostData {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: any;
  likesCount?: number;
  commentsCount?: number;
  hashtags?: string[];
}

export default function PostCard({ post }: { post: PostData }) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  
  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'posts', post.id, 'likes', user.uid);
  }, [firestore, post.id, user]);

  const bookmarkRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'bookmarks', post.id);
  }, [firestore, post.id, user]);

  const { data: likeData } = useDoc(likeRef);
  const { data: bookmarkData } = useDoc(bookmarkRef);
  
  const isLiked = !!likeData;
  const isBookmarked = !!bookmarkData;

  const formattedDate = post.createdAt?.toDate 
    ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ar })
    : 'منذ قليل';

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          fromUsername: 'مستخدم تواصل',
          postId: post.id,
          createdAt: serverTimestamp(),
          read: false
        }, { merge: true });
      }
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firestore) return;
    if (isBookmarked) {
      deleteDocumentNonBlocking(bookmarkRef!);
      toast({ description: "تمت إزالة العلامة المرجعية." });
    } else {
      setDocumentNonBlocking(bookmarkRef!, { ...post, bookmarkedAt: serverTimestamp() }, { merge: true });
      toast({ description: "تم حفظ المنشور في العلامات المرجعية." });
    }
  };

  return (
    <>
      <Card 
        className="border-none shadow-none rounded-none w-full bg-card mb-[1px] last:mb-0 transition-colors hover:bg-muted/5 cursor-pointer"
        onClick={() => setIsCommentsOpen(true)}
      >
        <CardHeader className="p-3 pb-2 flex-row items-center justify-between space-y-0">
          <Link href={`/profile/${post.authorId}`} className="flex gap-2.5 group" onClick={(e) => e.stopPropagation()}>
            <Avatar className="h-9 w-9 border border-muted/20">
              <AvatarImage src={post.authorAvatar} alt={post.authorName} />
              <AvatarFallback>{post.authorName?.[0] || 'ت'}</AvatarFallback>
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
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground rounded-full">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem onClick={handleBookmark} className="gap-2">
                <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
                {isBookmarked ? 'إزالة من العلامات' : 'حفظ المنشور'}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive">
                إبلاغ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className="px-0 py-0">
          <p className="px-3 py-2 text-sm text-foreground leading-relaxed whitespace-pre-wrap tracking-tight">
            {post.content}
          </p>
          
          {post.mediaUrl && (
            <div className="relative w-full aspect-square bg-muted mt-2">
              <Image 
                src={post.mediaUrl} 
                alt="Post media" 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 mt-2">
              {post.hashtags.map((tag, i) => (
                <span key={i} className="text-accent hover:underline cursor-pointer text-[10px] font-bold">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="px-1 py-1 border-t-0 flex justify-around items-center h-9">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 flex-1 gap-1.5 rounded-none ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            onClick={handleLike}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            <span className="text-[10px] font-bold">{post.likesCount || 0}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 flex-1 text-muted-foreground gap-1.5 rounded-none"
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentsOpen(true);
            }}
          >
            <MessageCircle size={16} />
            <span className="text-[10px] font-bold">{post.commentsCount || 0}</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 flex-1 text-muted-foreground gap-1.5 rounded-none" onClick={(e) => e.stopPropagation()}>
            <Repeat size={16} />
          </Button>

          <Button variant="ghost" size="sm" className="h-8 flex-1 text-muted-foreground rounded-none" onClick={(e) => e.stopPropagation()}>
            <Share2 size={16} />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="sm:max-w-full h-[100dvh] p-0 border-none bg-background gap-0 overflow-hidden flex flex-col sm:max-w-[600px] sm:h-[90vh] sm:rounded-lg">
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
