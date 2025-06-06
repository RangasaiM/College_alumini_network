"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/lib/supabase/database.types";

// Common schema fields
const baseSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  name: z.string().min(2, { message: "Please enter your name" }),
});

// Student-specific schema
const studentSchema = baseSchema.extend({
  role: z.literal("student"),
  batch_year: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Please enter a valid year",
  }),
  department: z.string().min(1, { message: "Department is required" }),
  github_url: z.string().optional(),
  leetcode_url: z.string().optional(),
});

// Alumni-specific schema
const alumniSchema = baseSchema.extend({
  role: z.literal("alumni"),
  graduation_year: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Please enter a valid year",
  }),
  current_job: z.string().min(1, { message: "Current job is required" }),
  linkedin_url: z.string().min(1, { message: "LinkedIn URL is required" }),
  is_mentorship_available: z.boolean().optional(),
});

// Combined schema with discriminated union
const formSchema = z.discriminatedUnion("role", [
  studentSchema,
  alumniSchema,
]);

type FormValues = z.infer<typeof formSchema>;

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

export default function SignUpPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"student" | "alumni" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    } as FormValues,
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("No user returned from sign up");
      }

      // Prepare user data for profile table
      const userData = {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
        is_approved: false,
      };

      // Add role-specific fields
      if (data.role === "student") {
        Object.assign(userData, {
          batch_year: parseInt(data.batch_year),
          department: data.department,
          github_url: data.github_url || null,
          leetcode_url: data.leetcode_url || null,
        });
      } else if (data.role === "alumni") {
        Object.assign(userData, {
          graduation_year: parseInt(data.graduation_year),
          current_job: data.current_job,
          linkedin_url: data.linkedin_url,
          is_mentorship_available: data.is_mentorship_available || false,
        });
      }

      // Insert into users table
      const { error: profileError } = await supabase
        .from("users")
        .insert([userData]);

      if (profileError) throw profileError;

      toast({
        title: "Account created",
        description:
          "Your account has been created and is pending approval. You'll be notified via email once approved.",
      });

      router.push("/signup-success");
    } catch (error) {
      console.error("Error during signup:", error);
      toast({
        title: "Error",
        description:
          "There was an error creating your account. Please try again.",
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
              className="space-y-6"
              id="signup-form"
            >
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <Select
                      onValueChange={(value: "student" | "alumni") => {
                        field.onChange(value);
                        setSelectedRole(value);
                      }}
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === "student" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="batch_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Year</FormLabel>
                          <FormControl>
                            <Input placeholder="2020" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                <SelectValue placeholder="Select your department" />
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="github_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub URL (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://github.com/yourusername"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="leetcode_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LeetCode URL (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://leetcode.com/yourusername"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {selectedRole === "alumni" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="graduation_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Graduation Year</FormLabel>
                          <FormControl>
                            <Input placeholder="2020" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="current_job"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Job/Position</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Software Engineer at Google"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://linkedin.com/in/yourusername"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_mentorship_available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Available for Mentorship</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            I am willing to mentor students and provide guidance
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
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
            <Link href="/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}