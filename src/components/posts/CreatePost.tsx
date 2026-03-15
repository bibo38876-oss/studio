
"use client"

import { useState } from 'react';
import { Sparkles, Image as ImageIcon, Send, X, Loader2, Hash, Wand2 } from 'lucide-react';
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
    <div className="flex flex-col bg-background w-full h-full animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-8 w-8 rounded-full p-0">
          <X size={20} className="text-muted-foreground" />
        </Button>
        <span className="font-bold text-sm text-foreground">إنشاء منشور</span>
        <Button 
          onClick={handlePost} 
          disabled={!content.trim() || !user} 
          className="h-8 bg-primary text-white px-5 rounded-full font-bold text-xs"
        >
          نشر
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.profilePictureUrl} alt={profile?.username} />
            <AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="اكتب شيئاً مذهلاً..." 
              className="min-h-[250px] sm:min-h-[150px] resize-none border-none focus-visible:ring-0 p-0 text-lg bg-transparent placeholder:text-muted-foreground/50"
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
                اقتراحات الذكاء الاصطناعي
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
              إضافة الهاشتاجات المقترحة
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="border-t bg-background p-3 pb-safe">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-secondary rounded-full" title="إضافة صورة">
            <ImageIcon size={22} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-10 w-10 rounded-full transition-all ${isEnhancing ? 'text-accent' : 'text-primary hover:bg-secondary'}`}
            onClick={handleEnhance}
            disabled={isEnhancing || !content.trim()}
            title="هاشتاجات ذكية"
          >
            {isEnhancing ? <Loader2 size={22} className="animate-spin" /> : <Hash size={22} />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-primary hover:bg-secondary rounded-full"
            title="تحسين النص"
            onClick={handleEnhance}
          >
            <Sparkles size={22} />
          </Button>
        </div>
      </div>
    </div>
  );
}
