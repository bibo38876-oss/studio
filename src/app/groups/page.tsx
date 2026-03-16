
"use client"

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Loader2, Plus, MessageSquare, Users, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GroupsPage() {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'groups'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: groups, isLoading } = useCollection(groupsQuery);

  const handleCreateGroup = () => {
    if (!user || user.isAnonymous) {
      router.push('/login');
      return;
    }
    if (!groupName.trim() || !firestore) return;

    addDocumentNonBlocking(collection(firestore, 'groups'), {
      name: groupName.trim(),
      description: groupDesc.trim(),
      creatorId: user.uid,
      createdAt: serverTimestamp(),
      membersCount: 1
    });

    setIsCreateOpen(false);
    setGroupName('');
    setGroupDesc('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-xl pt-7 pb-20 px-0 md:px-4">
        <div className="bg-background sticky top-7 z-30 p-4 border-b flex justify-between items-center">
          <h1 className="text-sm font-bold text-primary">مجموعات الدردشة</h1>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-[10px] rounded-full gap-1 px-3">
                <Plus size={12} />
                إنشاء مجموعة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold">إنشاء مجموعة جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground">اسم المجموعة</label>
                  <Input 
                    value={groupName} 
                    onChange={(e) => setGroupName(e.target.value)} 
                    placeholder="مثال: محبي التقنية"
                    className="h-9 rounded-none bg-secondary/30 border-none text-xs" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground">وصف المجموعة</label>
                  <Input 
                    value={groupDesc} 
                    onChange={(e) => setGroupDesc(e.target.value)} 
                    placeholder="عن ماذا تتحدث هذه المجموعة؟"
                    className="h-9 rounded-none bg-secondary/30 border-none text-xs" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full rounded-full font-bold text-xs h-9" onClick={handleCreateGroup}>إنشاء الآن</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="divide-y divide-muted">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-none flex items-center justify-center text-primary">
                    <Users size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary group-hover:underline">{group.name}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{group.description || 'لا يوجد وصف.'}</span>
                    <span className="text-[8px] text-muted-foreground mt-1">انشئت {new Date(group.createdAt?.toDate ? group.createdAt.toDate() : Date.now()).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
                <ChevronLeft size={16} className="text-muted-foreground/30" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 px-10 flex flex-col items-center">
            <MessageSquare size={40} className="text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-xs font-bold">لا توجد مجموعات بعد.</p>
            <p className="text-[9px] text-muted-foreground mt-1">كن أول من ينشئ مجموعة دردشة في تواصل.</p>
          </div>
        )}
      </main>
    </div>
  );
}
