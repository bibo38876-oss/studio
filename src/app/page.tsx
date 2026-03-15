import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { MOCK_POSTS } from '@/lib/mock-data';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto px-0 md:px-4 py-12 flex gap-6">
        {/* Left column - Hidden on small screens, shown on desktop */}
        <div className="hidden md:block w-64 pt-4">
          <LeftSidebar />
        </div>

        {/* Middle column - Feed */}
        <div className="flex-1 max-w-2xl w-full border-x-0 md:border-x">
          <div className="space-y-px">
            {MOCK_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Right column - Hidden on small screens */}
        <div className="hidden lg:block w-80 pt-4">
          <RightSidebar />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
