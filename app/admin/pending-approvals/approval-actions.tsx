"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function ApprovalActions({ userId }: { userId: string }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_approved: true })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User approved",
        description: "The user account has been approved successfully."
      });
      
      router.refresh();
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Approval failed",
        description: "There was an error approving the user account.",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      // In a real application, you might want to:
      // 1. Delete the user from auth.users
      // 2. Delete the user from public.users
      // For this example, we'll just delete from public.users
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User rejected",
        description: "The user account has been rejected."
      });
      
      router.refresh();
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast({
        title: "Rejection failed",
        description: "There was an error rejecting the user account.",
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
      <Button 
        onClick={handleApprove}
        disabled={isApproving || isRejecting}
        className="w-full sm:w-auto"
      >
        <Check className="mr-2 h-4 w-4" />
        {isApproving ? "Approving..." : "Approve"}
      </Button>
      <Button 
        variant="outline"
        onClick={handleReject}
        disabled={isApproving || isRejecting}
        className="w-full sm:w-auto"
      >
        <X className="mr-2 h-4 w-4" />
        {isRejecting ? "Rejecting..." : "Reject"}
      </Button>
    </div>
  );
}