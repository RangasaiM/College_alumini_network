"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      if (user.is_approved) {
        // If user is approved, redirect to their dashboard
        const dashboardPath = user.role === 'admin' 
          ? '/admin/dashboard' 
          : user.role === 'alumni'
            ? '/alumni/dashboard'
            : '/student/dashboard';
        router.push(dashboardPath);
        return;
      }

      setUserData(user);
    };

    checkStatus();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Awaiting Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your account is currently pending approval from an administrator.
          </p>
          <div className="space-y-2">
            <p className="font-medium">What to expect?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• An administrator will review your account details</li>
              <li>• You'll receive an email once your account is approved</li>
              <li>• After approval, you can sign in and access all features</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This process usually takes 1-2 business days. Thank you for your patience!
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/signin">
            <Button variant="outline">
              Return to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 