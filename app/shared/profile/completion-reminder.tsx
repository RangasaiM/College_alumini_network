'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";

interface CompletionReminderProps {
  userRole: "student" | "alumni" | "admin";
  profileData: {
    id: string;
    role: "student" | "alumni" | "admin";
    name: string;
    email: string;
    github_url?: string;
    linkedin_url?: string;
    leetcode_url?: string;
    codechef_url?: string;
    codeforces_url?: string;
    current_company?: string;
    current_role?: string;
    experience_years?: number;
    portfolio_url?: string;
    skills: string[];
    bio?: string;
    roll_number?: string;
    mobile_number?: string;
    department?: string;
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompletionReminder({
  userRole,
  profileData,
  isOpen,
  onOpenChange,
}: CompletionReminderProps) {
  const router = useRouter();
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (!profileData) {
      setCompletionPercentage(0);
      return;
    }

    // Calculate profile completion based on role
    const getFields = () => {
      // Disabling strict requirements to prevent persistent popup
      return [] as const;
    };

    const fields = getFields();

    if (fields.length === 0) {
      setCompletionPercentage(100);
      return;
    }

    const completedFields = fields.filter(field => {
      if (field === 'skills') return Array.isArray(profileData?.skills) && profileData.skills.length > 0;
      return !!profileData[field];
    }).length;

    const percentage = (completedFields / fields.length) * 100;
    setCompletionPercentage(percentage);
  }, [userRole, profileData]);

  const handleEditProfile = () => {
    router.push(`/${userRole}/profile/edit`);
    onOpenChange(false);
  };

  // Return early if no profile data or if profile is complete (safeguard)
  if (!profileData || (Math.round(completionPercentage) === 100 && isOpen)) {
    // We shouldn't autoclose it here via onOpenChange(false) because it might cause loop or warning.
    // Just returning null might leave the backdrop? No, Dialog is controlled.
    // If isOpen is true but we return null, what happens? Dialog won't render. 
    // But Radix UI Dialog might complain if we don't render content when open.
    // Better to just let the Parent control it.
    // But I will add a check:
  }

  if (!profileData) return null;

  // Don't render if complete, even if parent says open (double check)
  if (completionPercentage >= 100) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Your profile is {completionPercentage.toFixed(0)}% complete. A complete profile helps you connect better with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Progress value={completionPercentage} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {completionPercentage < 100
              ? "Add more information to your profile to increase your completion percentage."
              : "Great job! Your profile is complete."}
          </p>
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Remind Me Later
          </Button>
          <Button onClick={handleEditProfile}>
            Edit Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 