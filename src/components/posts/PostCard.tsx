
"use client"

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Repeat } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, increment, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

interface PostData {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  createdAt: any;
  likesCount?: number;
  hashtags?: string[];
}

export default function PostCard({ post }: { post: PostData }) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  
  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'posts', post.id, 'likes', user.uid);
  }, [firestore, post.id, user]);

  const { data: likeData } = useDoc(likeRef);
  const isLiked = !!likeData;

  const formattedDate = post.createdAt?.toDate 
    ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ar })
    : 'منذ قليل';

  const handleLike = () => {
    if (!user || !firestore) {
      toast({ title: "عذراً", description: "يجب تسجيل الدخول أولاً" });
      return;
    }

    const postRef = doc(firestore, 'posts', post.id);
    const userLikeRef = doc(firestore, 'posts', post.id, 'likes', user.uid);

    if (isLiked) {
      deleteDocumentNonBlocking(userLikeRef);
      updateDoc(postRef, { likesCount: increment(-1) });
    } else {
      setDocumentNonBlocking(userLikeRef, {
        userId: user.uid,
        likedAt: new Date().toISOString()
      }, { merge: true });
      updateDoc(postRef, { likesCount: increment(1) });
    }
  };

  return (
    <Card className="border-none shadow-none rounded-none w-full bg-card mb-[1px] last:mb-0 transition-colors hover:bg-muted/10">
      <CardHeader className="p-3 pb-1 flex-row items-center justify-between space-y-0">
        <Link href={`/profile/${post.authorId}`} className="flex gap-2.5 group">
          <Avatar className="h-9 w-9 border border-muted/20">
            <AvatarImage src={post.authorAvatar} alt={post.authorName} />
            <AvatarFallback>{post.authorName?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <span className="text-[11px] font-bold text-primary leading-tight group-hover:underline">{post.authorName || 'مستخدم مجهول'}</span>
            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
              {formattedDate}
              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground"></span>
              عام
            </span>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full">
          <MoreHorizontal size={14} />
        </Button>
      </CardHeader>
      
      <CardContent className="px-3 py-2">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap tracking-tight">
          {post.content}
        </p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-accent hover:text-accent/80 cursor-pointer text-[10px] font-bold">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-2 py-0 border-t-0 flex justify-between items-center h-9">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-8 flex-1 gap-1.5 transition-all rounded-none ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
          onClick={handleLike}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-in zoom-in-75" : ""} />
          <span className="text-[11px] font-bold">{post.likesCount || 0}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 flex-1 text-muted-foreground hover:text-primary gap-1.5 rounded-none"
        >
          <MessageCircle size={16} />
          <span className="text-[11px]">3</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 flex-1 text-muted-foreground hover:text-accent gap-1.5 rounded-none"
        >
          <Repeat size={16} />
          <span className="text-[11px]">8</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-10 text-muted-foreground hover:text-primary rounded-none"
        >
          <Share2 size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}
