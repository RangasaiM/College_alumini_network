"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
      
      toast({
        title: "Verification email sent",
        description: "Please check your email (including spam folder) for the verification link.",
      });
      setShowVerification(false);
    } catch (err) {
      console.error('Error resending verification:', err);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      console.log('Attempting to sign in...');
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
          toast({
            title: "Email not verified",
            description: "Please verify your email address before signing in.",
            variant: "destructive",
          });
          return;
        }

        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
          return;
        }

        // Handle other errors
        toast({
          title: "Sign in failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        throw new Error("No user data found");
      }

      console.log('Authentication successful, checking user data...');

      // Get user role and approval status
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, is_approved")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      // If no user data found, they might be a new signup
      if (!userData) {
        console.log('No user profile found, redirecting to signup');
        toast({
          title: "Account setup incomplete",
          description: "Please complete your profile setup.",
          variant: "destructive",
        });
        router.push("/auth/signup");
        return;
      }

      console.log('User data found:', userData);

      if (!userData.is_approved) {
        console.log('User not approved, redirecting to pending approval');
        router.push("/pending-approval");
        return;
      }

      console.log('User is approved, proceeding with sign in');
      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      });

      // Redirect based on role
      const dashboardPath = `/${userData.role}/dashboard`;
      console.log('Redirecting to dashboard:', dashboardPath);
      router.push(dashboardPath);
      
      // Force a router refresh to ensure the middleware picks up the new session
      router.refresh();
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
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