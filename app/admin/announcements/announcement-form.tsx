"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  target_role: z.enum(["all", "student", "alumni"], { required_error: "Target audience is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: string;
  created_at: string;
  user_id: string;
  user?: {
    name: string;
    avatar_url: string;
  };
}

interface AnnouncementFormProps {
  onAnnouncementCreated?: (announcement: Announcement) => void;
}

export function AnnouncementForm({ onAnnouncementCreated }: AnnouncementFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      target_role: "all",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      const { data: newAnnouncement, error: insertError } = await supabase
        .from('announcements')
        .insert([
          {
            title: data.title,
            content: data.content,
            target_role: data.target_role,
            user_id: session.user.id,
          },
        ])
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!newAnnouncement) {
        throw new Error('Failed to create announcement');
      }

      toast.success('Announcement created successfully');
      form.reset();
      
      if (onAnnouncementCreated) {
        onAnnouncementCreated(newAnnouncement);
      }
      
      router.refresh();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter announcement title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter announcement content"
                  className="h-32"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Audience</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                  <SelectItem value="alumni">Alumni Only</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Announcement"}
        </Button>
      </form>
    </Form>
  );
}