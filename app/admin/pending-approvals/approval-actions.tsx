"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ApprovalActionsProps {
  userId: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ApprovalActions({ userId, onApprove, onReject }: ApprovalActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      // First verify the user still exists and isn't already approved
      const { data: user, error: checkError } = await supabase
        .from('users')
        .select('is_approved')
        .eq('id', userId)
        .single();

      if (checkError) {
        throw new Error('Failed to verify user status');
      }

      if (!user) {
        throw new Error('User not found');
      }

      if (user.is_approved) {
        toast.info('User is already approved');
        return;
      }

      // Update the user's approval status
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_approved: true })
        .eq('id', userId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message);
      }

      toast.success('User approved successfully');
      onApprove?.();
      
      // Force a hard refresh of the page
      window.location.reload();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast.error(error.message || 'Failed to approve user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      // First verify the user exists
      const { data: user, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (checkError) {
        throw new Error('Failed to verify user status');
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Delete the user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(deleteError.message);
      }

      toast.success('User rejected successfully');
      onReject?.();
      
      // Force a hard refresh of the page
      window.location.reload();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast.error(error.message || 'Failed to reject user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="default"
        onClick={handleApprove}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Approve'}
      </Button>
      <Button
        variant="destructive"
        onClick={handleReject}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Reject'}
      </Button>
    </div>
  );
}