"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define department options
const DEPARTMENT_OPTIONS = [
  "CSE",
  "ECE",
  "Mech",
  "EEE",
  "CSE(AI&ML)",
  "CSE(DS)",
  "CSE(IoT)",
  "Civil"
] as const;

// Simple schema for initial signup
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().min(1, { message: "Name is required" }),
  role: z.enum(["student", "alumni"]),
  department: z.string().min(1, { message: "Department is required" }),
  year: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Please enter a valid year",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "student",
      department: "CSE",
      year: new Date().getFullYear().toString(),
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      // First, check if user exists in auth by trying to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      let userId;

      if (signInData?.user) {
        // User exists in auth, use their ID
        userId = signInData.user.id;
      } else if (!signInError || signInError.message.includes("Invalid login credentials")) {
        // User doesn't exist, create them
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
              role: data.role,
              department: data.department,
              year: parseInt(data.year),
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            // If user is already registered but we couldn't sign in,
            // there might be a password mismatch
            toast({
              title: "Account already exists",
              description: "Please sign in with your existing password or reset it if forgotten.",
              variant: "destructive",
            });
            router.push('/auth/signin');
            return;
          }
          throw signUpError;
        }

        if (!signUpData.user) {
          throw new Error("Failed to create auth user");
        }

        userId = signUpData.user.id;
      }

      if (!userId) {
        throw new Error("Failed to get user ID");
      }

      // Check if user profile already exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileCheckError) {
        console.error('Error checking existing profile:', profileCheckError);
      }

      if (existingProfile) {
        toast({
          title: "Account already exists",
          description: "Please sign in with your existing account.",
          variant: "destructive",
        });
        router.push('/auth/signin');
        return;
      }

      // Create user profile
      const userData = {
        id: userId,
        email: data.email,
        name: data.name,
        role: data.role,
        department: data.department,
        is_approved: false,
        ...(data.role === 'alumni' ? { 
          graduation_year: parseInt(data.year),
          current_company: null,
          current_position: null,
        } : {
          batch_year: parseInt(data.year)
        })
      };

      console.log('Attempting to create user profile:', userData);

      const { error: profileError } = await supabase
        .from('users')
        .insert([userData]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Log the actual data being inserted for debugging
        console.log('Attempted to insert:', userData);
        
        if (profileError.code === '23505') {
          toast({
            title: "Account already exists",
            description: "Please sign in with your existing account.",
            variant: "destructive",
          });
          router.push('/auth/signin');
          return;
        }
        
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('User profile created successfully:', userId);

      toast({
        title: "Account created",
        description:
          "Your account has been created and is pending approval. You'll be notified via email once approved.",
      });

      router.push("/signup-success");
    } catch (error: any) {
      console.error("Error during signup:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/10">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Join our alumni network and connect with other graduates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              id="signup-form"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" {...field} />
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
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="alumni">Alumni</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENT_OPTIONS.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("role") === "student" ? "Batch Year" : "Graduation Year"}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="2020" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            form="signup-form"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}