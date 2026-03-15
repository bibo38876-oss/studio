"use client"

import { useState } from 'react';
import { Sparkles, Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CURRENT_USER } from '@/lib/mock-data';
import { aiPostEnhancer } from '@/ai/flows/ai-post-enhancer';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ hashtags: string[], summary: string } | null>(null);
  const { toast } = useToast();

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
    if (!content.trim()) return;
    toast({
      title: "تم النشر!",
      description: "تم نشر منشورك بنجاح على تواصل.",
    });
    setContent('');
    setAiSuggestions(null);
  };

  return (
    <Card className="mb-0 md:mb-6 overflow-hidden border-none shadow-none rounded-none w-full bg-card">
      <CardContent className="p-4 md:p-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={CURRENT_USER.avatar} alt={CURRENT_USER.name} />
            <AvatarFallback>{CURRENT_USER.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea 
              placeholder="بماذا تفكر؟" 
              className="min-h-[120px] resize-none border-none focus-visible:ring-0 p-0 text-lg bg-transparent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            {aiSuggestions && (
              <div className="bg-secondary/50 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
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
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={handleApplySuggestion}>
                  تطبيق الهاشتاجات
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary hover:text-accent hover:bg-accent/10">
                  <ImageIcon size={20} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-accent hover:bg-accent/10 gap-2 px-3"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !content.trim()}
                >
                  {isEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span className="hidden sm:inline">تحسين بالذكاء الاصطناعي</span>
                </Button>
              </div>
              <Button onClick={handlePost} disabled={!content.trim()} className="bg-primary hover:bg-primary/90 text-white gap-2 px-6 rounded-full transition-all">
                <span>نشر</span>
                <Send size={16} className="rtl:rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
