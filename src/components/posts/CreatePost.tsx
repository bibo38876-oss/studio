"use client"

import { useState } from 'react';
import { Sparkles, Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CURRENT_USER } from '@/lib/mock-data';
import { aiPostEnhancer } from '@/ai/flows/ai-post-enhancer';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

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
      createdAt: serverTimestamp(),
      likesCount: 0,
      hashtags: aiSuggestions?.hashtags || [],
    };

    addDocumentNonBlocking(collection(firestore, 'posts'), postData);

    toast({
      title: "تم النشر!",
      description: "تم نشر منشورك بنجاح على تواصل.",
    });
    
    setContent('');
    setAiSuggestions(null);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col bg-card w-full animate-in slide-in-from-bottom-full duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-bold text-lg text-primary">منشور جديد</h3>
        <Button variant="ghost" size="icon" onClick={onSuccess} className="rounded-full h-8 w-8">
          <X size={20} />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={CURRENT_USER.avatar} alt={CURRENT_USER.name} />
            <AvatarFallback>{CURRENT_USER.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="بماذا تفكر؟" 
              className="min-h-[150px] resize-none border-none focus-visible:ring-0 p-0 text-lg bg-transparent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        {aiSuggestions && (
          <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                مقترح الذكاء الاصطناعي
              </span>
              <Button variant="ghost" size="icon" onClick={() => setAiSuggestions(null)} className="h-6 w-6">
                <X size={14} />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground italic">"{aiSuggestions.summary}"</p>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.hashtags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 border-none">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full mt-2 rounded-xl" onClick={handleApplySuggestion}>
              تطبيق الهاشتاجات
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-primary hover:text-accent rounded-full">
              <ImageIcon size={22} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-accent gap-2 px-3 rounded-full"
              onClick={handleEnhance}
              disabled={isEnhancing || !content.trim()}
            >
              {isEnhancing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span className="hidden xs:inline text-sm">تحسين</span>
            </Button>
          </div>
          <Button onClick={handlePost} disabled={!content.trim() || !user} className="bg-primary hover:bg-primary/90 text-white gap-2 px-8 rounded-full py-6 transition-all shadow-md">
            <span className="font-bold">نشر الآن</span>
            <Send size={18} className="rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
