"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/hooks/use-toast";

export default function SignUpSuccessPage() {
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email address not found. Please try signing up again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link.",
      });
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Account Created Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              Important: Email Verification Required
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              You must verify your email address before you can sign in.
            </p>
          </div>
          <p className="text-muted-foreground">
            We've sent a verification link to {email ? <strong>{email}</strong> : "your email address"}.
          </p>
          <div className="space-y-2">
            <p className="font-medium">Next steps:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. <span className="font-medium">Check your email and click the verification link</span></li>
              <li>2. Wait for admin approval of your account</li>
              <li>3. Once approved, you can sign in and access the platform</li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full mt-4"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>
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