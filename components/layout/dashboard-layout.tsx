"use client";

import { useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CompletionReminder } from "@/app/shared/profile/completion-reminder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";

interface UserData {
  id: string;
  role: "student" | "alumni" | "admin";
  name: string;
  email: string;
  is_approved: boolean;
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
  [key: string]: any;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: "student" | "alumni" | "admin";
}

const getRequiredFields = (role: string): string[] => {
  if (role === 'student') {
    return ['github_url', 'linkedin_url', 'leetcode_url', 'codechef_url', 'codeforces_url', 'skills', 'bio'];
  }
  return ['current_company', 'current_role', 'experience_years', 'linkedin_url', 'github_url', 'portfolio_url', 'skills', 'bio'];
};

export default function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { supabase, session, isLoading: isSessionLoading } = useSupabase();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkProfileStatus = async () => {
      if (!session?.user?.id) {
        if (!isSessionLoading) {
          router.replace('/auth/signin');
        }
        return;
      }

      try {
        // Get user data
        const { data, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('User data error:', userError);
          toast.error('Error fetching user data: ' + userError.message);
          if (mounted) {
            router.replace('/auth/signin');
          }
          return;
        }

        if (!data) {
          if (mounted) {
            router.replace('/signup');
          }
          return;
        }

        // Set user data and handle profile completion
        const typedData = data as UserData;
        
        if (!mounted) return;
        
        setUserData(typedData);

        // Check profile completion
        const requiredFields = getRequiredFields(role);
        const completedFields = requiredFields.filter(field => {
          if (field === 'skills') {
            return Array.isArray(typedData[field]) && typedData[field].length > 0;
          }
          return !!typedData[field];
        }).length;

        const completionPercentage = (completedFields / requiredFields.length) * 100;
        
        // Show reminder if profile is not 100% complete
        if (completionPercentage < 100) {
          setShowReminder(true);
        }

        // Check if user role matches the page role
        if (typedData.role !== role) {
          toast.error('You do not have access to this page');
          if (mounted) {
            router.replace(`/${typedData.role}/dashboard`);
          }
          return;
        }

        // Check if user is approved
        if (!typedData.is_approved && role !== 'admin') {
          if (mounted) {
            router.replace('/pending-approval');
          }
          return;
        }

        // Handle approval status
        if (role === 'admin') {
          setShowPendingDialog(false);
        } else if (!typedData.is_approved) {
          setShowPendingDialog(true);
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error checking profile status:', error);
        toast.error('Error checking profile status: ' + (error.message || 'An unexpected error occurred'));
        if (mounted) {
          router.replace('/auth/signin');
        }
      }
    };

    checkProfileStatus();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id, role, supabase, router, isSessionLoading]);

  const handleEditProfile = () => {
    router.push(`/${role}/profile/edit`);
    setShowPendingDialog(false);
  };

  const handleNotificationsClick = () => {
    router.push(`/${role}/notifications`);
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={handleNotificationsClick}
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
      <CompletionReminder
        userRole={role}
        profileData={userData}
        isOpen={showReminder}
        onOpenChange={setShowReminder}
      />
      {!isLoading && userData && !userData.is_approved && role !== 'admin' && (
        <Dialog 
          open={showPendingDialog} 
          onOpenChange={setShowPendingDialog}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Profile Pending Approval
              </DialogTitle>
              <DialogDescription>
                Your profile is currently pending approval from an administrator. 
                While you wait, you can complete your profile to speed up the approval process.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => setShowPendingDialog(false)}>
                Close
              </Button>
              <Button onClick={handleEditProfile}>
                Complete Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}