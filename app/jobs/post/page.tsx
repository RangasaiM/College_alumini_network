'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { jobPostSchema } from '@/lib/validations/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateJobPostData } from '@/app/types/jobs';

const formSchema = jobPostSchema;

export default function PostJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [skillInput, setSkillInput] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      company_name: '',
      job_type: 'internship',
      location: 'remote',
      required_skills: [],
      description: '',
      eligibility: 'both',
      application_deadline: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Form submitted with values:', values);
    const formSkills = form.getValues('required_skills') || [];
    console.log('Skills array from form:', formSkills);
    
    try {
      const jobData: CreateJobPostData = {
        ...values,
        required_skills: formSkills,
      };
      
      console.log('Sending job data:', jobData);

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        throw new Error(error.error || 'Failed to create job post');
      }
      
      const responseData = await response.json();
      console.log('Success response:', responseData);

      toast({
        title: 'Success',
        description: 'Job post created successfully!',
      });

      router.push('/jobs');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating job post:', error);
      console.error('Error details:', error.message, error.stack);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create job post',
        variant: 'destructive',
      });
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !form.getValues('required_skills').includes(skillInput.trim())) {
      // Update the form's required_skills field
      const currentSkills = form.getValues('required_skills') || [];
      form.setValue('required_skills', [...currentSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('required_skills') || [];
    form.setValue('required_skills', currentSkills.filter((skill: string) => skill !== skillToRemove));
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Post New Opportunity</h1>
        <p className="text-muted-foreground mt-2">
          Share job or internship opportunities with the community
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => {
          console.log('Form onSubmit triggered');
          console.log('Form is valid:', form.formState.isValid);
          console.log('Form errors:', form.formState.errors);
          form.handleSubmit(onSubmit)(e);
        }} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential details about the opportunity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Software Engineering Intern" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company/Organization *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., TechCorp Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="job_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? 'internship'} defaultValue={'internship'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? 'remote'} defaultValue={'remote'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="onsite">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eligibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eligibility *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? 'both'} defaultValue={'both'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select eligibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Students Only</SelectItem>
                          <SelectItem value="alumni">Alumni Only</SelectItem>
                          <SelectItem value="both">Students & Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
              <CardDescription>
                Add the key skills required for this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (press Enter or click +)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyPress}
                />
                <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {form.watch('required_skills') && form.watch('required_skills').length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(form.watch('required_skills') || []).map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="text-sm py-1 px-2">
                      {skill}
                      <button
                        type="button"
                        className="ml-2 hover:bg-secondary-foreground/20 rounded-full p-1"
                        onClick={() => removeSkill(skill)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {/* Hidden field to manage required_skills in the form */}
              <FormField
                control={form.control}
                name="required_skills"
                render={({ field }) => (
                  <input type="hidden" value={JSON.stringify(field.value || [])} />
                )}
              />
              
              <FormDescription>
                Add at least one required skill for this position
              </FormDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
              <CardDescription>
                Detailed description of the role and responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the role, responsibilities, qualifications, and any other important details..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>
                Optional information about the application process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="application_deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Deadline</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          className="pl-10"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              field.onChange(new Date(e.target.value));
                            } else {
                              field.onChange(undefined);
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Leave blank if there's no deadline
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!form.watch('required_skills') || form.watch('required_skills').length === 0}
              onClick={() => console.log('Post Opportunity button clicked', { skillsCount: form.watch('required_skills')?.length || 0, isDisabled: !form.watch('required_skills') || form.watch('required_skills').length === 0 })}
            >
              Post Opportunity
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}