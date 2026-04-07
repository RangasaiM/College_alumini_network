'use client';

import PostsPage from '@/app/posts/page';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AdminPostsPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">Network Posts</h1>
            </div>
            {/* 
        We reuse the main PostsPage component. 
        Ideally, we might want to pass a prop 'adminMode' if we want extra admin powers (like delete any post).
        For now, just showing the feed is what's requested. 
      */}
            <PostsPage />
        </div>
    );
}
