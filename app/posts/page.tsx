"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Trash2, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Comments } from "@/app/shared/posts/comments";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
}

function getCount(count) {
  if (Array.isArray(count)) {
    const firstItem = count[0];
    if (firstItem && typeof firstItem === 'object' && 'count' in firstItem) {
      return firstItem.count;
    }
  }
  return typeof count === 'number' ? count : 0;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPosts();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Fetch all posts with user info and counts
      const { data: allPosts, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          user:users(id, name, avatar_url),
          likes:likes(count),
          comments:comments(count)
        `)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch user's likes
      const { data: userLikes, error: likesError } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (likesError) throw likesError;

      // Create a set of liked post IDs for faster lookup
      const likedPostIds = new Set(userLikes?.map(like => like.post_id));

      // Process posts to add has_liked flag and format counts
      const processedPosts = allPosts?.map(post => ({
        ...post,
        likes_count: [{ count: post.likes?.[0]?.count || 0 }],
        comments_count: [{ count: post.comments?.[0]?.count || 0 }],
        has_liked: likedPostIds.has(post.id)
      })) || [];

      setPosts(processedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !imageFile) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        content: newPost.trim(),
        image_url: imageUrl,
        user_id: user.id,
      });

      if (error) throw error;

      setNewPost("");
      setImageFile(null);
      setImagePreview(null);
      fetchPosts();
      toast.success("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      if (post.has_liked) {
        await supabase
          .from("likes")
          .delete()
          .match({ post_id: postId, user_id: user.id });
      } else {
        await supabase.from("likes").insert({
          post_id: postId,
          user_id: user.id,
        });
      }

      fetchPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      fetchPosts();
      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="image" className="cursor-pointer">
                <div className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                  <ImageIcon className="h-5 w-5" />
                  <span>Add Image</span>
                </div>
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <Button type="submit" disabled={isLoading || (!newPost.trim() && !imageFile)}>
              {isLoading ? "Posting..." : "Post"}
            </Button>
          </div>
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-[300px] rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}
        </form>

        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={post.user.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.user.name
                      ? post.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{post.user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {currentUserId === post.user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && (
                    <div className="mt-4">
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="max-h-[400px] rounded-lg object-cover w-full"
                      />
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={post.has_liked ? "text-red-500" : ""}
                    >
                      <Heart
                        className={`h-4 w-4 mr-2 ${
                          post.has_liked ? "fill-current" : ""
                        }`}
                      />
                      {getCount(post.likes_count)}
                    </Button>
                    <Comments postId={post.id} currentUserId={currentUserId} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 