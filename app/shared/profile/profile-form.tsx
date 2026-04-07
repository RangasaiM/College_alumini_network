'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateProfile } from '@/app/actions/profile';
import { toast } from 'sonner';
import { X, Plus, Check } from 'lucide-react';
import { AvatarUpload } from '@/components/ui/avatar-upload';

const formSchema = z.object({
  avatar_url: z.string().optional(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().optional(),
  mobile_number: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  department: z.string().optional(),
  graduation_year: z.string().optional(),
  bio: z.string().optional(),
  roll_number: z.string().optional(),
  skills: z.array(z.string()).default([]),
  github_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
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
      url: z.string().url().optional().or(z.literal('')),
    })
  ).optional(),
  academic_achievements: z.array(z.string()).optional(),
  areas_of_interest: z.array(z.string()).optional(),
  career_goals: z.string().optional(),
  current_company: z.string().optional(),
  current_position: z.string().optional(),
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
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [hasImageChanged, setHasImageChanged] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      avatar_url: initialData?.avatar_url || '',
      name: initialData?.name || '',
      email: initialData?.email || '',
      mobile_number: initialData?.mobile_number || '',
      gender: initialData?.gender || '',
      date_of_birth: initialData?.date_of_birth || '',
      department: initialData?.department || '',
      graduation_year: initialData?.graduation_year?.toString() || '',
      bio: initialData?.bio || '',
      roll_number: initialData?.roll_number || '',
      skills: initialData?.skills || [],
      github_url: initialData?.github_url || '',
      linkedin_url: initialData?.linkedin_url || '',
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
    },
  });

  const { fields: internshipFields, append: appendInternship, remove: removeInternship } = useFieldArray({
    control: form.control,
    name: "internships"
  });

  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({
    control: form.control,
    name: "certifications"
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
    if (isImageUploading) {
      toast.error('Please wait for the image upload to complete');
      return;
    }

    if (hasImageChanged && pendingImageUrl && data.avatar_url !== pendingImageUrl) {
      data.avatar_url = pendingImageUrl;
    }

    setIsLoading(true);
    try {
      const transformedData = {
        ...data,
        updated_at: new Date().toISOString()
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
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture</FormLabel>
              <FormControl>
                <AvatarUpload
                  userId={initialData?.id}
                  url={hasImageChanged ? pendingImageUrl || field.value : field.value}
                  onUploadComplete={(url) => {
                    setPendingImageUrl(url);
                    setHasImageChanged(true);
                    setIsImageUploading(false);
                  }}
                  onUploadStart={() => {
                    setIsImageUploading(true);
                    setHasImageChanged(false);
                  }}
                  className="mb-4"
                />
              </FormControl>
              <FormMessage />
              {hasImageChanged && pendingImageUrl && (
                <p className="text-sm text-muted-foreground mt-2">
                  New image uploaded. Click Save Changes to update your profile with the new image.
                </p>
              )}
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="+91 9876543210" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {userRole !== 'admin' && (
          <>
            <FormField
              control={form.control}
              name="roll_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your roll number" />
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
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>

              )}
            />

            <FormField
              control={form.control}
              name="graduation_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Graduation Year</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {userRole === 'student' ? (
              <>

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

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="space-y-8 pt-6 border-t mt-6">
              {/* Experience Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Experience</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendInternship({ company: '', position: '', duration: '' })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Experience
                  </Button>
                </div>
                {internshipFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-muted/20">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeInternship(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`internships.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position / Role</FormLabel>
                            <FormControl><Input {...field} placeholder="Software Engineer" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`internships.${index}.company`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl><Input {...field} placeholder="Acme Corp" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`internships.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl><Input {...field} placeholder="Jan 2023 - Present" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Certifications Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Licenses & Certifications</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendCertification({ name: '', issuer: '', date: '' })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Certification
                  </Button>
                </div>
                {certificationFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-muted/20">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeCertification(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input {...field} placeholder="Certification Name" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.issuer`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issuing Organization</FormLabel>
                            <FormControl><Input {...field} placeholder="Coursera, AWS" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date</FormLabel>
                            <FormControl><Input {...field} placeholder="Jan 2024" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.url`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credential URL</FormLabel>
                            <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Button
          type="submit"
          disabled={isLoading || isImageUploading}
          className="w-full"
        >
          {isLoading ? 'Saving...' : isImageUploading ? 'Uploading Image...' : 'Save Changes'}
        </Button>
      </form>
    </Form >
  );
}