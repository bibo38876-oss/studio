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
    <Card className="border-none shadow-none rounded-none w-full bg-card mb-0.5">
      <CardHeader className="p-3 pb-2 flex-row items-center justify-between space-y-0">
        <div className="flex gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary hover:underline cursor-pointer leading-none">{user.name}</span>
            <span className="text-[10px] text-muted-foreground mt-1">{user.handle} • {formattedDate}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
          <MoreHorizontal size={14} />
        </Button>
      </CardHeader>
      <CardContent className="px-3 py-0 pb-2">
        <p className="text-sm text-foreground leading-snug whitespace-pre-wrap">
          {post.content}
        </p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-accent hover:underline cursor-pointer text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-1 px-3 border-t-0 flex justify-between items-center h-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-7 px-1.5 gap-1 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
          onClick={handleLike}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          <span className="text-xs font-medium">{likesCount}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-1.5 text-muted-foreground gap-1"
          onClick={() => showSoonToast('التعليق')}
        >
          <MessageCircle size={16} />
          <span className="text-xs">تعليق</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-1.5 text-muted-foreground gap-1"
          onClick={() => showSoonToast('إعادة النشر')}
        >
          <Repeat size={16} />
          <span className="text-xs">نشر</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-1.5 text-muted-foreground"
          onClick={() => showSoonToast('المشاركة')}
        >
          <Share2 size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}
