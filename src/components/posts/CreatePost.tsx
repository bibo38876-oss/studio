
"use client"

import { useState } from 'react';
import { Sparkles, Image as ImageIcon, Send, X, Loader2, Wand2 } from 'lucide-react';
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
    <div className="flex flex-col bg-card w-full h-full sm:h-auto animate-in slide-in-from-bottom-full duration-300">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-bold text-sm text-primary">إنشاء منشور</h3>
        <Button variant="ghost" size="icon" onClick={onSuccess} className="h-8 w-8">
          <X size={18} />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.profilePictureUrl} alt={profile?.username} />
            <AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="ماذا يدور في ذهنك؟" 
              className="min-h-[150px] resize-none border-none focus-visible:ring-0 p-0 text-md bg-transparent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        {aiSuggestions && (
          <div className="bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                <Wand2 size={14} className="text-accent animate-pulse" />
                لمسة ذكاء اصطناعي
              </span>
              <button onClick={() => setAiSuggestions(null)} className="text-muted-foreground hover:text-primary">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed italic">"{aiSuggestions.summary}"</p>
            <div className="flex flex-wrap gap-1.5">
              {aiSuggestions.hashtags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 border-none">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button size="sm" className="h-8 w-full text-[11px] rounded-xl bg-accent hover:bg-accent/90 text-white font-bold" onClick={handleApplySuggestion}>
              تطبيق الهاشتاجات
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-secondary rounded-full">
              <ImageIcon size={20} />
            </Button>
            <Button 
              variant="ghost" 
              className={`h-9 gap-1.5 px-3 rounded-full transition-all ${isEnhancing ? 'text-accent' : 'text-primary hover:bg-secondary'}`}
              onClick={handleEnhance}
              disabled={isEnhancing || !content.trim()}
            >
              {isEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span className="text-xs font-bold">تحسين</span>
            </Button>
          </div>
          <Button 
            onClick={handlePost} 
            disabled={!content.trim() || !user} 
            className="h-9 bg-primary text-white gap-2 px-8 rounded-full font-bold transition-all shadow-md active:scale-95"
          >
            <span>نشر</span>
            <Send size={16} className="rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
