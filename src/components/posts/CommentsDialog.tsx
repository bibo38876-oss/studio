
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Image from 'next/image';

interface CommentsDialogProps {
  postId: string;
  postAuthorId: string;
  post?: any;
  onClose: () => void;
}

export default function CommentsDialog({ postId, postAuthorId, post, onClose }: CommentsDialogProps) {
  const [commentText, setCommentText] = useState('');
  const { firestore, user } = useFirebase();
  const router = useRouter();

  const isAnonymous = !user || user.isAnonymous;

  // Get current user profile for comment data
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user || isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user, isAnonymous]);
  const { data: profile } = useDoc(userRef);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return query(
      collection(firestore, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, postId]);

  const { data: comments, isLoading } = useCollection(commentsQuery);

  const handleAddComment = () => {
    if (isAnonymous) {
      router.push('/login');
      return;
    }
    if (!commentText.trim() || !user || !firestore) return;

    const commentData = {
      authorId: user.uid,
      authorName: profile?.username || user.displayName || 'مستخدم تواصل',
      authorAvatar: profile?.profilePictureUrl || '',
      content: commentText.trim(),
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), commentData);
    
    // Update post comment count
    updateDoc(doc(firestore, 'posts', postId), {
      commentsCount: increment(1)
    });

    // Create notification for post owner
    if (user.uid !== postAuthorId) {
      addDocumentNonBlocking(collection(firestore, 'users', postAuthorId, 'notifications'), {
        type: 'comment',
        fromUserId: user.uid,
        fromUsername: profile?.username || user.displayName || 'مستخدم تواصل',
        fromAvatar: profile?.profilePictureUrl || '',
        postId: postId,
        createdAt: serverTimestamp(),
        read: false
      });
    }

    setCommentText('');
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-left duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 p-2 border-b sticky top-0 bg-background/80 backdrop-blur-md z-20 h-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <ChevronRight size={20} />
        </Button>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-primary">المنشور</span>
          <span className="text-[8px] text-muted-foreground">عرض التفاصيل والتعليقات</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {post && (
          <div className="p-4 border-b bg-muted/5">
            <div className="flex gap-3 mb-4">
              <Avatar className="h-10 w-10 border border-muted/20">
                <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                <AvatarFallback>{post.authorName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold text-primary leading-tight">{post.authorName}</span>
                <span className="text-[10px] text-muted-foreground">@{post.authorId?.slice(0, 8)}</span>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-4 tracking-tight">
              {post.content}
            </p>
            {post.mediaUrl && (
              <div className="relative w-full aspect-square bg-muted rounded-none overflow-hidden mb-4">
                <Image src={post.mediaUrl} alt="Post media" fill className="object-cover" />
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquareText size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">التعليقات</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary h-6 w-6" />
            </div>
          ) : comments && comments.length > 0 ? (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 animate-in fade-in duration-500">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                  <AvatarFallback>{comment.authorName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary">{comment.authorName}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { locale: ar }) : 'الآن'}
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-muted/5 rounded-none border border-dashed">
              <p className="text-muted-foreground text-[10px]">لا توجد تعليقات بعد. كن أول من يشارك!</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t bg-background/80 backdrop-blur-md pb-safe sticky bottom-0 z-30">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-10">
          <Input 
            placeholder={isAnonymous ? "سجل الدخول للتعليق..." : "اكتب تعليقاً..."}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full p-0"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            readOnly={isAnonymous}
            onClick={() => isAnonymous && router.push('/login')}
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className={`h-8 w-8 rounded-full transition-all ${commentText.trim() ? 'text-primary scale-110' : 'text-muted-foreground opacity-50'}`}
            onClick={handleAddComment}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
