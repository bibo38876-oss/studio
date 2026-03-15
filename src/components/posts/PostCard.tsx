"use client"

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Repeat } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, increment, updateDoc } from 'firebase/firestore';

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

  const showSoonToast = (action: string) => {
    toast({
      title: "قريباً",
      description: `ميزة ${action} ستتوفر في التحديث القادم.`,
    });
  };

  return (
    <Card className="border-none shadow-none rounded-none w-full bg-card mb-[1px]">
      <CardHeader className="p-3 pb-1 flex-row items-center justify-between space-y-0">
        <div className="flex gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.authorAvatar} alt={post.authorName} />
            <AvatarFallback>{post.authorName?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-bold text-primary leading-tight">{post.authorName || 'مستخدم مجهول'}</span>
            <span className="text-[9px] text-muted-foreground">{formattedDate}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
          <MoreHorizontal size={14} />
        </Button>
      </CardHeader>
      <CardContent className="px-3 py-1">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-accent hover:underline cursor-pointer text-[10px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-3 py-0 border-t-0 flex justify-between items-center h-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-7 px-2 gap-1.5 transition-colors ${isLiked ? 'text-red-500 bg-red-50/50' : 'text-muted-foreground'}`}
          onClick={handleLike}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          <span className="text-[11px] font-bold">{post.likesCount || 0}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-muted-foreground gap-1.5"
          onClick={() => showSoonToast('الرد')}
        >
          <MessageCircle size={16} />
          <span className="text-[11px]">رد</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-muted-foreground gap-1.5"
          onClick={() => showSoonToast('إعادة النشر')}
        >
          <Repeat size={16} />
          <span className="text-[11px]">نشر</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-muted-foreground"
          onClick={() => showSoonToast('المشاركة')}
        >
          <Share2 size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}
