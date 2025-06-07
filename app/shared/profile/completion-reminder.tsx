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
    const fields = userRole === 'student' 
      ? ['github_url', 'linkedin_url', 'leetcode_url', 'codechef_url', 'codeforces_url', 'skills', 'bio'] as const
      : ['current_company', 'current_role', 'experience_years', 'linkedin_url', 'github_url', 'portfolio_url', 'skills', 'bio'] as const;

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

  // Return early if no profile data
  if (!profileData) {
    return null;
  }

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