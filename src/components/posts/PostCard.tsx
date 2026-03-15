"use client"

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Repeat } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MOCK_USERS } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PostData {
  id: string;
  authorId: string;
  content: string;
  createdAt: any;
  likesCount?: number;
  hashtags?: string[];
}

export default function PostCard({ post }: { post: PostData }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const { toast } = useToast();

  const user = MOCK_USERS.find(u => u.id === post.authorId) || {
    name: 'مستخدم مجهول',
    handle: '@unknown',
    avatar: 'https://picsum.photos/seed/unknown/200/200'
  };

  const formattedDate = post.createdAt?.toDate 
    ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ar })
    : 'منذ وقت قليل';

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const showSoonToast = (action: string) => {
    toast({
      title: "قريباً جداً",
      description: `ميزة ${action} ستكون متاحة قريباً في تواصل.`,
    });
  };

  return (
    <Card className="border-none shadow-none rounded-none w-full bg-card mb-[1px]">
      <CardHeader className="p-3 pb-1 flex-row items-center justify-between space-y-0">
        <div className="flex gap-2.5">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-bold text-primary hover:underline cursor-pointer leading-tight">{user.name}</span>
            <span className="text-[9px] text-muted-foreground">{user.handle} • {formattedDate}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground">
          <MoreHorizontal size={12} />
        </Button>
      </CardHeader>
      <CardContent className="px-3 py-1">
        <p className="text-sm text-foreground leading-normal whitespace-pre-wrap">
          {post.content}
        </p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-accent hover:underline cursor-pointer text-[11px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-3 py-1 border-t-0 flex justify-between items-center h-7">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-6 px-1.5 gap-1 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
          onClick={handleLike}
        >
          <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
          <span className="text-[10px] font-medium">{likesCount}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-1.5 text-muted-foreground gap-1"
          onClick={() => showSoonToast('التعليق')}
        >
          <MessageCircle size={14} />
          <span className="text-[10px]">تعليق</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-1.5 text-muted-foreground gap-1"
          onClick={() => showSoonToast('إعادة النشر')}
        >
          <Repeat size={14} />
          <span className="text-[10px]">نشر</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-1.5 text-muted-foreground"
          onClick={() => showSoonToast('المشاركة')}
        >
          <Share2 size={14} />
        </Button>
      </CardFooter>
    </Card>
  );
}
