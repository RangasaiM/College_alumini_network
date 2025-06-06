"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/ui/avatar-upload";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(2, "Department is required"),
  batch_year: z.string().min(4, "Batch year is required"),
  current_company: z.string().min(2, "Current company is required"),
  job_title: z.string().min(2, "Job title is required"),
  github_url: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  leetcode_url: z.string().url("Invalid LeetCode URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  skills: z.string().max(200, "Skills must be less than 200 characters").optional(),
  experience: z.string().max(1000, "Experience must be less than 1000 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AlumniProfilePage() {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (profile) {
          reset({
            name: profile.name || "",
            email: profile.email || "",
            department: profile.department || "",
            batch_year: profile.batch_year || "",
            current_company: profile.current_company || "",
            job_title: profile.job_title || "",
            github_url: profile.github_url || "",
            leetcode_url: profile.leetcode_url || "",
            linkedin_url: profile.linkedin_url || "",
            bio: profile.bio || "",
            skills: profile.skills || "",
            experience: profile.experience || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [supabase, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          department: data.department,
          batch_year: data.batch_year,
          current_company: data.current_company,
          job_title: data.job_title,
          github_url: data.github_url || null,
          leetcode_url: data.leetcode_url || null,
          linkedin_url: data.linkedin_url || null,
          bio: data.bio || null,
          skills: data.skills || null,
          experience: data.experience || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-[200px,1fr]">
        {/* Profile Picture Section */}
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <AvatarUpload />
          </div>
        </div>

        {/* Profile Information Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                {...register("name")}
                placeholder="Enter your full name"
                disabled={isSaving}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                {...register("email")}
                type="email"
                disabled={true}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Input
                {...register("department")}
                placeholder="Enter your department"
                disabled={isSaving}
              />
              {errors.department && (
                <p className="text-sm text-destructive">{errors.department.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Year</label>
              <Input
                {...register("batch_year")}
                placeholder="Enter your batch year"
                disabled={isSaving}
              />
              {errors.batch_year && (
                <p className="text-sm text-destructive">{errors.batch_year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Current Company</label>
              <Input
                {...register("current_company")}
                placeholder="Enter your current company"
                disabled={isSaving}
              />
              {errors.current_company && (
                <p className="text-sm text-destructive">{errors.current_company.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                {...register("job_title")}
                placeholder="Enter your job title"
                disabled={isSaving}
              />
              {errors.job_title && (
                <p className="text-sm text-destructive">{errors.job_title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub URL</label>
              <Input
                {...register("github_url")}
                placeholder="https://github.com/username"
                disabled={isSaving}
              />
              {errors.github_url && (
                <p className="text-sm text-destructive">{errors.github_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">LeetCode URL</label>
              <Input
                {...register("leetcode_url")}
                placeholder="https://leetcode.com/username"
                disabled={isSaving}
              />
              {errors.leetcode_url && (
                <p className="text-sm text-destructive">{errors.leetcode_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn URL</label>
              <Input
                {...register("linkedin_url")}
                placeholder="https://linkedin.com/in/username"
                disabled={isSaving}
              />
              {errors.linkedin_url && (
                <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Skills</label>
              <Input
                {...register("skills")}
                placeholder="Enter your skills (comma-separated)"
                disabled={isSaving}
              />
              {errors.skills && (
                <p className="text-sm text-destructive">{errors.skills.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                {...register("bio")}
                placeholder="Tell us about yourself"
                disabled={isSaving}
                className="min-h-[100px]"
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Professional Experience</label>
              <Textarea
                {...register("experience")}
                placeholder="Share your professional experience"
                disabled={isSaving}
                className="min-h-[150px]"
              />
              {errors.experience && (
                <p className="text-sm text-destructive">{errors.experience.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 