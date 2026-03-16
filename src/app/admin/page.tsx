"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, limit } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

export default function AdminPage() {
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!currentUser || currentUser.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [currentUser, isUserLoading, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(50));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleUpdateVerification = (userId: string, type: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), {
      verificationType: type,
    });
    toast({ description: "تم تحديث حالة التوثيق بنجاح." });
  };

  if (isUserLoading || !currentUser || currentUser.email !== ADMIN_EMAIL) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-2xl pt-10 pb-20 px-4">
        <div className="flex items-center gap-3 mb-8 bg-primary/5 p-6 border-b border-primary/20">
          <ShieldCheck size={32} className="text-primary" />
          <div>
            <h1 className="text-xl font-bold text-primary">لوحة إدارة تواصل</h1>
            <p className="text-xs text-muted-foreground">تحكم في توثيق الحسابات وصلاحيات المستخدمين</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="ابحث عن مستخدم للتوثيق..." 
            className="pr-10 h-10 rounded-none bg-secondary/30 border-none text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-card p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                    <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-primary">{user.username}</span>
                      <VerifiedBadge type={user.email === ADMIN_EMAIL ? 'blue' : (user.verificationType || 'none')} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select 
                    defaultValue={user.email === ADMIN_EMAIL ? 'blue' : (user.verificationType || 'none')} 
                    onValueChange={(val) => handleUpdateVerification(user.id, val)}
                  >
                    <SelectTrigger className="h-8 text-[10px] w-[120px] rounded-none bg-secondary/50 border-none">
                      <SelectValue placeholder="نوع التوثيق" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون توثيق</SelectItem>
                      <SelectItem value="blue">أزرق (مستخدم)</SelectItem>
                      <SelectItem value="gold">ذهبي (إعلامي)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-muted/20 border-dashed border-2">
              <p className="text-xs text-muted-foreground font-bold">لا يوجد مستخدمين مطابقين للبحث.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
