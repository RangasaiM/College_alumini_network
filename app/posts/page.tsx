"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { Image as ImageIcon, Send, Search, Users2 } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { PostCard } from "@/app/shared/posts/post-card";
import { UserListItem } from "@/components/shared/user-list-item";


interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  current_position?: string;
  current_company?: string;
  department?: string;
  bio?: string;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
    role: string;
    current_position?: string;
    current_company?: string;
  };
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
}



export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, avatar_url, role, current_position, current_company, department, bio')
      .or(`name.ilike.%${searchQuery}%, department.ilike.%${searchQuery}%, current_company.ilike.%${searchQuery}%`)
      .limit(5);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setSearchResults(data || []);
    setShowSearchResults(true);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      setCurrentUserId(session.user.id);
    };
    checkSession();
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('realtime posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);



  const fetchPosts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:users!posts_user_id_fkey(id, name, avatar_url, role, current_position, current_company)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    // console.log('Raw postsData:', postsData);

    const postIds = postsData?.map(p => p.id) || [];
    let likesData: any[] = [];
    let commentsData: any[] = [];

    if (postIds.length > 0) {
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      const { data: comments } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      if (likes) likesData = likes;
      if (comments) commentsData = comments;
    }

    const processedPosts = (postsData || []).map(post => {
      const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
      const postComments = commentsData?.filter(comment => comment.post_id === post.id) || [];

      const postUser = post.user || {
        id: post.user_id || 'unknown',
        name: 'Unknown User',
        avatar_url: null,
        role: 'member',
        current_position: '',
        current_company: ''
      };

      return {
        ...post,
        user: postUser,
        likes_count: postLikes.length,
        comments_count: postComments.length,
        has_liked: postLikes.some(like => like.user_id === session.user.id)
      };
    });

    setPosts(processedPosts);
    setIsLoading(false);
  };



  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    try {
      setIsUploading(true);

      const { error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message === 'Bucket not found') {
          toast.error('Storage bucket not configured. Please contact administrator.');
        } else {
          toast.error('Failed to upload image: ' + uploadError.message);
        }
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post_images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + (error.message || 'Unknown error'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let imageUrl = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl && !newPost.trim()) return;
    }

    const { error } = await supabase
      .from('posts')
      .insert([
        {
          content: newPost,
          user_id: session.user.id,
          image_url: imageUrl
        }
      ]);

    if (error) {
      console.error('Error creating post:', error);
      return;
    }

    setNewPost('');
    setSelectedImage(null);
    setImagePreview(null);
    fetchPosts();
  };

  // If a post is deleted by PostCard, we remove it from the list
  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-2xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12"
            />
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute w-full mt-2 z-50 shadow-lg">
              <CardContent className="p-2">
                {searchResults.map((user) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    onClick={() => setShowSearchResults(false)}
                    hideRole={true}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>


        {/* Create Post */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
            {imagePreview && (
              <div className="relative mb-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-60 rounded-lg object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  ×
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={handleImageSelect}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={isUploading}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={(!newPost.trim() && !selectedImage) || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Post'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PostCard
                post={post}
                currentUserId={currentUserId}
                onDelete={handlePostDeleted}
              />
            </motion.div>
          ))}
          {!isLoading && posts.length === 0 && (
            <Card className="border-none shadow-md p-8 text-center">
              <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to share something with your network!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}