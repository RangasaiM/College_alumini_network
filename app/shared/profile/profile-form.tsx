'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateProfile } from '@/app/actions/profile';
import { toast } from 'sonner';
import { X, Plus, Check } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string(),
  batch_year: z.string().optional(),
  graduation_year: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).default([]),
  github_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  leetcode_url: z.string().url().optional().or(z.literal('')),
  codechef_url: z.string().url().optional().or(z.literal('')),
  hackerrank_url: z.string().url().optional().or(z.literal('')),
  codeforces_url: z.string().url().optional().or(z.literal('')),
  internships: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      duration: z.string(),
    })
  ).optional(),
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      url: z.string().optional(),
    })
  ).optional(),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.string(),
    })
  ).optional(),
  academic_achievements: z.array(z.string()).optional(),
  areas_of_interest: z.array(z.string()).optional(),
  career_goals: z.string().optional(),
  current_company: z.string().optional(),
  current_position: z.string().optional(),
  years_of_experience: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProfileFormProps {
  userRole: 'student' | 'alumni' | 'admin';
  initialData?: any;
}

const commonSkills = {
  student: [
    "Python", "Java", "JavaScript", "C++", "HTML/CSS",
    "React", "Node.js", "SQL", "Data Structures",
    "Machine Learning", "Web Development", "Mobile Development",
    "Git", "Problem Solving", "Algorithms",
    "TypeScript", "Docker", "Kubernetes", "AWS", "Azure",
    "MongoDB", "PostgreSQL", "Redis", "GraphQL", "REST API"
  ],
  alumni: [
    "Leadership", "Project Management", "Team Management",
    "Python", "Java", "JavaScript", "React", "Node.js",
    "Cloud Computing", "DevOps", "System Design",
    "Data Science", "Product Management", "Agile",
    "Full Stack Development", "Software Architecture",
    "Team Leadership", "Strategic Planning", "Business Development",
    "Technical Architecture", "Mentoring", "Stakeholder Management"
  ],
  admin: []
};

export function ProfileForm({ userRole, initialData }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [isSkillPopoverOpen, setIsSkillPopoverOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      department: initialData?.department || '',
      batch_year: initialData?.batch_year?.toString() || '',
      graduation_year: initialData?.graduation_year?.toString() || '',
      location: initialData?.location || '',
      bio: initialData?.bio || '',
      skills: initialData?.skills || [],
      github_url: initialData?.github_url || '',
      linkedin_url: initialData?.linkedin_url || '',
      twitter_url: initialData?.twitter_url || '',
      website_url: initialData?.website_url || '',
      leetcode_url: initialData?.leetcode_url || '',
      codechef_url: initialData?.codechef_url || '',
      hackerrank_url: initialData?.hackerrank_url || '',
      codeforces_url: initialData?.codeforces_url || '',
      internships: initialData?.internships || [],
      projects: initialData?.projects || [],
      certifications: initialData?.certifications || [],
      academic_achievements: initialData?.academic_achievements || [],
      areas_of_interest: initialData?.areas_of_interest || [],
      career_goals: initialData?.career_goals || '',
      current_company: initialData?.current_company || '',
      current_position: initialData?.current_position || '',
      years_of_experience: initialData?.years_of_experience?.toString() || ''
    },
  });

  const addSkill = (skillToAdd: string) => {
    if (skillToAdd.trim()) {
      const currentSkills = form.getValues('skills');
      if (!currentSkills.includes(skillToAdd.trim())) {
        form.setValue('skills', [...currentSkills, skillToAdd.trim()]);
      }
      setNewSkill('');
      setIsSkillPopoverOpen(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('skills');
    form.setValue('skills', currentSkills.filter(skill => skill !== skillToRemove));
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const transformedData = {
        ...data,
        years_of_experience: data.years_of_experience ? parseInt(data.years_of_experience) : null,
      };

      const result = await updateProfile(transformedData);
      if (!result.success) {
        throw new Error('Failed to update profile');
      }
      
      toast.success('Profile updated successfully');
      const profileRoute = userRole === 'alumni' ? '/alumni/profile' : '/student/profile';
      router.push(profileRoute);
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {userRole !== 'admin' && (
          <>
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {userRole === 'student' ? (
              <>
                <FormField
                  control={form.control}
                  name="batch_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Coding Profiles</h3>
                  <FormField
                    control={form.control}
                    name="leetcode_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LeetCode Profile</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://leetcode.com/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codechef_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CodeChef Profile</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://codechef.com/users/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hackerrank_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HackerRank Profile</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://hackerrank.com/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codeforces_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codeforces Profile</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://codeforces.com/profile/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Professional Profiles</h3>
                  <FormField
                    control={form.control}
                    name="github_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub Profile</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://github.com/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://linkedin.com/in/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Skills</h3>
                  <div className="flex gap-2 items-center">
                    <Popover open={isSkillPopoverOpen} onOpenChange={setIsSkillPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isSkillPopoverOpen}
                          className="w-full justify-between"
                        >
                          {newSkill || "Select or enter a skill..."}
                          <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search skills..."
                            value={newSkill}
                            onValueChange={setNewSkill}
                            className="h-9"
                          />
                          <CommandEmpty>
                            {newSkill.trim() && (
                              <CommandItem
                                onSelect={() => {
                                  addSkill(newSkill);
                                }}
                              >
                                Add "{newSkill}"
                                <Plus className="ml-auto h-4 w-4" />
                              </CommandItem>
                            )}
                          </CommandEmpty>
                          <CommandGroup heading="Common Skills">
                            {commonSkills[userRole].map((skill) => (
                              <CommandItem
                                key={skill}
                                onSelect={() => {
                                  addSkill(skill);
                                }}
                              >
                                {skill}
                                {form.getValues('skills').includes(skill) && (
                                  <Check className="ml-auto h-4 w-4 text-green-500" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('skills').map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-secondary-foreground/50 hover:text-secondary-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Professional Information</h3>
                  <FormField
                    control={form.control}
                    name="current_company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Company</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="current_position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Position</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="years_of_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Social Links</h3>
                  <FormField
                    control={form.control}
                    name="github_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub URL</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://github.com/yourusername" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://linkedin.com/in/yourusername" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="twitter_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter URL</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://twitter.com/yourusername" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Skills</h3>
                  <div className="flex gap-2 items-center">
                    <Popover open={isSkillPopoverOpen} onOpenChange={setIsSkillPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isSkillPopoverOpen}
                          className="w-full justify-between"
                        >
                          {newSkill || "Select or enter a skill..."}
                          <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search skills..."
                            value={newSkill}
                            onValueChange={setNewSkill}
                            className="h-9"
                          />
                          <CommandEmpty>
                            {newSkill.trim() && (
                              <CommandItem
                                onSelect={() => {
                                  addSkill(newSkill);
                                }}
                              >
                                Add "{newSkill}"
                                <Plus className="ml-auto h-4 w-4" />
                              </CommandItem>
                            )}
                          </CommandEmpty>
                          <CommandGroup heading="Common Skills">
                            {commonSkills[userRole].map((skill) => (
                              <CommandItem
                                key={skill}
                                onSelect={() => {
                                  addSkill(skill);
                                }}
                              >
                                {skill}
                                {form.getValues('skills').includes(skill) && (
                                  <Check className="ml-auto h-4 w-4 text-green-500" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('skills').map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-secondary-foreground/50 hover:text-secondary-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </>
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}