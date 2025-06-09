"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleResendVerification = async (email: string) => {
    try {
      setIsLoading(true);
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (resendError) throw resendError;
      
      toast.success("Verification email sent", {
        description: "Please check your email (including spam folder) for the verification link.",
      });
      setShowVerification(false);
    } catch (err) {
      console.error('Error resending verification:', err);
      toast.error("Failed to resend verification email", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      console.log('Starting sign in process...');
      
      // First, check if there's already a session
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession?.session) {
        console.log('Existing session found, signing out first');
        await supabase.auth.signOut();
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('Sign in error details:', error);
        
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          setVerificationEmail(data.email);
          setShowVerification(true);
          toast.error("Email not verified", {
            description: "Please verify your email address before signing in.",
          });
          return;
        }

        if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid credentials", {
            description: "Please check your email and password and try again.",
          });
          return;
        }

        // Handle other errors
        toast.error("Sign in failed", {
          description: error.message || "An unexpected error occurred. Please try again.",
        });
        return;
      }

      if (!authData.user) {
        console.error('No user data returned from authentication');
        toast.error("Sign in failed", {
          description: "No user account found. Please sign up first.",
        });
        return;
      }

      console.log('Authentication successful, checking user data...');
      console.log('User ID:', authData.user.id);

      // Verify session is set
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session after sign in:', {
        exists: !!sessionData?.session,
        userId: sessionData?.session?.user?.id
      });

      if (!sessionData?.session) {
        toast.error("Session error", {
          description: "Failed to establish session. Please try again.",
        });
        return;
      }

      // Get user role and approval status
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        if (userError.code === 'PGRST116') {
          toast.error("Account not found", {
            description: "Please sign up first to create an account.",
          });
          router.push('/signup');
          return;
        }
        throw userError;
      }

      // If no user data found, create a profile
      if (!userData) {
        console.log('No user profile found, creating profile from auth data');
        const userMetadata = authData.user.user_metadata;
        
        const profileData = {
          id: authData.user.id,
          email: authData.user.email,
          name: userMetadata.name || authData.user.email?.split('@')[0] || 'User',
          role: userMetadata.role || 'student',
          department: userMetadata.department,
          is_approved: true, // Set to true by default since they've already signed up
          ...(userMetadata.role === 'alumni' ? {
            graduation_year: userMetadata.year ? parseInt(userMetadata.year) : null
          } : {
            batch_year: userMetadata.year ? parseInt(userMetadata.year) : null
          })
        };

        const { error: createError } = await supabase
          .from('users')
          .insert([profileData]);

        if (createError) {
          console.error('Error creating user profile:', createError);
          toast.error("Profile creation failed", {
            description: "Failed to create your profile. Please try again.",
          });
          return;
        }

        console.log('Created new user profile');
        
        // Redirect to the appropriate dashboard instead of signup
        const dashboardPath = `/${profileData.role}/dashboard`;
        console.log('Redirecting to dashboard:', dashboardPath);
        
        toast.success("Profile created", {
          description: "Welcome to the platform!",
        });

        // Small delay to ensure toast is shown
        await new Promise(resolve => setTimeout(resolve, 500));

        // Perform the redirect
        window.location.href = dashboardPath;
        return;
      }

      console.log('User data found:', userData);

      if (!userData.is_approved) {
        console.log('User not approved, redirecting to pending approval');
        toast.info("Account pending approval", {
          description: "Your account is waiting for admin approval.",
        });
        router.push("/pending-approval");
        return;
      }

      console.log('User is approved, proceeding with sign in');
      console.log('User role:', userData.role);
      
      // Redirect based on role
      const dashboardPath = `/${userData.role}/dashboard`;
      console.log('Redirecting to dashboard:', dashboardPath);

      // Show success message before redirect
      toast.success("Sign in successful", {
        description: "Welcome back!",
      });

      // Small delay to ensure toast is shown
      await new Promise(resolve => setTimeout(resolve, 500));

      // Perform the redirect
      window.location.href = dashboardPath;

    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error("Sign in failed", {
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showVerification ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Email Verification Required
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  We sent a verification link to {verificationEmail}. Please check your email (including spam folder) and click the link to verify your account.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => handleResendVerification(verificationEmail)}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Resend Verification Email"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowVerification(false)}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 