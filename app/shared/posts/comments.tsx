'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
    role: string;
    current_position?: string;
    current_company?: string;
  };
}

interface CommentsProps {
  postId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onCommentCountChange?: (count: number) => void;
}

export function Comments({ postId, isExpanded, onToggle, onCommentCountChange }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isExpanded) {
      fetchComments();
    }
  }, [isExpanded, postId]);

  const fetchComments = async () => {
    setIsFetching(true);
    const { data: commentsData, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(id, name, avatar_url, role, current_position, current_company)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      setIsFetching(false);
      return;
    }

    setComments(commentsData);
    onCommentCountChange?.(commentsData.length);
    setIsFetching(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please sign in to comment');
      setIsLoading(false);
      return;
    }

    try {
      const { data: newCommentData, error } = await supabase
        .from('comments')
        .insert([
          {
            content: newComment.trim(),
            post_id: postId,
            user_id: session.user.id
          }
        ])
        .select(`
          *,
          user:users(id, name, avatar_url, role, current_position, current_company)
        `)
        .single();

      if (error) throw error;

      setNewComment('');
      setComments(prev => [...prev, newCommentData]);
      onCommentCountChange?.(comments.length + 1);
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  if (!isExpanded) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="px-6 py-4 bg-secondary/10"
    >
      <Separator className="mb-4" />
      
      {/* Add Comment */}
      <div className="flex gap-3 mb-6">
        <Avatar className="h-8 w-8 ring-2 ring-background">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Write a comment..."
            className="min-h-[2.5rem] py-2 resize-none bg-background"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Press Enter to post, Shift + Enter for new line
            </p>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={isLoading || !newComment.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {isFetching ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <AnimatePresence>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                className="flex gap-3 group"
              >
                <Avatar className="h-8 w-8 ring-2 ring-background">
                  {comment.user.avatar_url ? (
                    <AvatarImage src={comment.user.avatar_url} alt={comment.user.name} />
                  ) : (
                    <AvatarFallback>{comment.user.name?.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="bg-background rounded-lg p-3 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{comment.user.name}</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {(comment.user.current_position || comment.user.current_company) && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {comment.user.current_position}
                        {comment.user.current_company && ` at ${comment.user.current_company}`}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
} 