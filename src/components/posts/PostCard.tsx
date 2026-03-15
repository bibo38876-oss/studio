"use client"

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Repeat } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MOCK_USERS, type Post } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

export default function PostCard({ post }: { post: Post }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const { toast } = useToast();

  const user = MOCK_USERS.find(u => u.id === post.userId) || {
    name: 'مستخدم مجهول',
    handle: '@unknown',
    avatar: ''
  };

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
    <Card className="border-x-0 border-t-0 border-b border-border shadow-none rounded-none w-full bg-card transition-colors duration-300">
      <CardHeader className="p-4 flex-row items-center justify-between space-y-0">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary hover:underline cursor-pointer">{user.name}</span>
            <span className="text-[10px] text-muted-foreground">{user.handle} • {post.timestamp}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal size={18} />
        </Button>
      </CardHeader>
      <CardContent className="px-4 py-0 pb-3">
        <p className="text-[15px] text-foreground leading-snug whitespace-pre-wrap">
          {post.content}
        </p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-accent hover:underline cursor-pointer text-[13px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-1 px-4 border-t-0 flex justify-between">
        <div className="flex items-center gap-1 group">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-9 px-2 gap-1.5 ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
            onClick={handleLike}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} className="transition-transform group-active:scale-125" />
            <span className="text-[13px] font-medium">{likesCount}</span>
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-2 text-muted-foreground hover:text-accent gap-1.5"
          onClick={() => showSoonToast('التعليق')}
        >
          <MessageCircle size={18} />
          <span className="text-[13px]">تعليق</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-2 text-muted-foreground hover:text-accent gap-1.5"
          onClick={() => showSoonToast('إعادة النشر')}
        >
          <Repeat size={18} />
          <span className="text-[13px]">نشر</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-2 text-muted-foreground hover:text-accent"
          onClick={() => showSoonToast('المشاركة')}
        >
          <Share2 size={18} />
        </Button>
      </CardFooter>
    </Card>
  );
}
