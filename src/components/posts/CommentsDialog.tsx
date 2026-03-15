
"use client"

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CommentsDialogProps {
  postId: string;
  postAuthorId: string;
  onClose: () => void;
}

export default function CommentsDialog({ postId, postAuthorId, onClose }: CommentsDialogProps) {
  const [commentText, setCommentText] = useState('');
  const { firestore, user } = useFirebase();

  // Get current user profile for comment data
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
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
    if (!commentText.trim() || !user || !firestore) return;

    const commentData = {
      authorId: user.uid,
      authorName: profile?.username || 'مستخدم تواصل',
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
      const notifRef = doc(collection(firestore, 'users', postAuthorId, 'notifications'));
      addDocumentNonBlocking(collection(firestore, 'users', postAuthorId, 'notifications'), {
        type: 'comment',
        fromUserId: user.uid,
        fromUsername: profile?.username || 'مستخدم تواصل',
        fromAvatar: profile?.profilePictureUrl || '',
        postId: postId,
        createdAt: serverTimestamp(),
        read: false
      });
    }

    setCommentText('');
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-background z-10">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 rounded-full p-0">
          <X size={18} />
        </Button>
        <span className="text-xs font-bold text-primary">التعليقات</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary h-6 w-6" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
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
          <div className="text-center py-20">
            <p className="text-muted-foreground text-xs">كن أول من يعلق على هذا المنشور.</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-background pb-safe sticky bottom-0">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-3 py-1">
          <Input 
            placeholder="أضف تعليقاً..." 
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-8 p-0"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7 text-primary hover:text-accent"
            onClick={handleAddComment}
            disabled={!commentText.trim()}
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
