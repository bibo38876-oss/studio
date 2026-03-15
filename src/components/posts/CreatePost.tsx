"use client"

import { useState } from 'react';
import { Sparkles, Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { aiPostEnhancer } from '@/ai/flows/ai-post-enhancer';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';

interface CreatePostProps {
  onSuccess?: () => void;
}

export default function CreatePost({ onSuccess }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ hashtags: string[], summary: string } | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  const handleEnhance = async () => {
    if (!content.trim()) return;
    setIsEnhancing(true);
    try {
      const result = await aiPostEnhancer({ postContent: content });
      setAiSuggestions(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تحسين المنشور. حاول مرة أخرى.",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApplySuggestion = () => {
    if (aiSuggestions) {
      const hashtagsStr = aiSuggestions.hashtags.join(' ');
      setContent(`${content}\n\n${hashtagsStr}`);
      setAiSuggestions(null);
    }
  };

  const handlePost = () => {
    if (!content.trim() || !firestore || !user) return;

    const postData = {
      content,
      authorId: user.uid,
      authorName: profile?.username || 'مستخدم تواصل',
      authorAvatar: profile?.profilePictureUrl || `https://picsum.photos/seed/${user.uid}/200/200`,
      createdAt: serverTimestamp(),
      likesCount: 0,
      hashtags: aiSuggestions?.hashtags || [],
    };

    addDocumentNonBlocking(collection(firestore, 'posts'), postData);

    toast({
      title: "تم النشر!",
      description: "تم نشر منشورك بنجاح.",
    });
    
    setContent('');
    setAiSuggestions(null);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col bg-card w-full animate-in slide-in-from-bottom-full duration-300">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-bold text-sm text-primary">منشور جديد</h3>
        <Button variant="ghost" size="icon" onClick={onSuccess} className="h-8 w-8">
          <X size={18} />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.profilePictureUrl} alt={profile?.username} />
            <AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="ماذا يدور في ذهنك؟" 
              className="min-h-[120px] resize-none border-none focus-visible:ring-0 p-0 text-md bg-transparent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        {aiSuggestions && (
          <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <Sparkles size={12} className="text-accent" />
                مقترح الذكاء الاصطناعي
              </span>
              <button onClick={() => setAiSuggestions(null)} className="text-muted-foreground">
                <X size={12} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground italic line-clamp-2">"{aiSuggestions.summary}"</p>
            <div className="flex flex-wrap gap-1">
              {aiSuggestions.hashtags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="bg-accent/10 text-accent text-[9px] h-5 border-none">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button size="sm" variant="outline" className="h-7 w-full text-[10px] rounded-lg" onClick={handleApplySuggestion}>
              إضافة الهاشتاجات
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
              <ImageIcon size={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-primary gap-1 px-2 rounded-lg"
              onClick={handleEnhance}
              disabled={isEnhancing || !content.trim()}
            >
              {isEnhancing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span className="text-xs">تحسين</span>
            </Button>
          </div>
          <Button onClick={handlePost} disabled={!content.trim() || !user} className="h-9 bg-primary text-white gap-2 px-6 rounded-xl font-bold transition-all shadow-sm">
            <span>نشر</span>
            <Send size={14} className="rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
