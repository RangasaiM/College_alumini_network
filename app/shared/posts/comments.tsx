'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface CommentsProps {
  postId: string;
  currentUserId: string | null;
}

export function Comments({ postId, currentUserId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchComments = async () => {
    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to comment');
        return;
      }

      const { data: comment, error } = await supabase
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
          user:users(id, name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, comment]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOpen(true);
          fetchComments();
        }}
      >
        Show Comments
      </Button>
    );
  }

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <Avatar className="h-8 w-8">
                    {comment.user.avatar_url ? (
                      <AvatarImage src={comment.user.avatar_url} alt={comment.user.name} />
                    ) : (
                      <AvatarFallback>{comment.user.name?.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{comment.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                </div>
                {currentUserId === comment.user.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex justify-between">
          <Button onClick={handleCreateComment} disabled={!newComment.trim()}>
            Comment
          </Button>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Hide Comments
          </Button>
        </div>
      </div>
    </div>
  );
} 