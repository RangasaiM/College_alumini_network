'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, MapPin, Clock, Calendar, ExternalLink, Upload, User, ArrowLeft } from 'lucide-react';
import { JobPost, ApplicationStatus } from '@/app/types/jobs';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/components/providers/supabase-provider';
import { ApplicationsDialog } from '@/components/jobs/applications-dialog';
import { Users } from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { supabase, session } = useSupabase();
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverMessage, setCoverMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchJobDetails();
      fetchUserRole();
    }
  }, [params.id]);

  const fetchUserRole = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentSession.user.id)
        .single();
      if (data) {
        setUserRole(data.role as string);
      }
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/jobs');
          return;
        }
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      setJob(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive'
      });
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!resumeUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a resume URL',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_post_id: job?.id,
          resume_url: resumeUrl.trim(),
          cover_message: coverMessage.trim() || undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit application');
      }

      toast({
        title: 'Success',
        description: 'Your application has been submitted successfully!',
      });

      setIsApplyDialogOpen(false);
      setResumeUrl('');
      setCoverMessage('');
      router.push('/jobs/my-applications');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'selected': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <Card>
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <Button onClick={() => router.push('/jobs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/jobs')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <Building className="mr-2 h-5 w-5" />
                    <span className="text-lg font-medium">{job.company_name}</span>
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" className="capitalize">
                    {job.job_type.replace('-', ' ')}
                  </Badge>
                  <Badge variant="secondary">
                    {job.location}
                  </Badge>
                  {job.eligibility !== 'both' && (
                    <Badge variant="outline">
                      {job.eligibility} only
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {job.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-base py-2 px-3">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About the Poster</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{job.posted_by_profile?.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {job.posted_by_profile?.role} • {job.posted_by_profile?.current_company || 'College Alumni Network'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{job.location}</span>
              </div>

              <div className="flex items-center text-sm">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Posted {formatDate(job.created_at)}</span>
              </div>

              {job.application_deadline && (
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {formatDate(job.application_deadline)}</span>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {job.application_count || 0} applications received
                </div>
              </div>
            </CardContent>
          </Card>

          {userRole === 'admin' ? (
            <Button className="w-full" onClick={() => setIsApplicationsOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              View Applications
            </Button>
          ) : job.eligibility !== 'both' && job.eligibility !== userRole ? (
            <Button className="w-full" disabled>
              <span className="mr-2">Apply Now</span>
              <Badge variant="destructive" className="ml-auto">Not Eligible</Badge>
            </Button>
          ) : !job.has_applied ? (
            <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Apply Now
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Apply for {job.title}</DialogTitle>
                  <DialogDescription>
                    Submit your application for this position. Make sure your resume is up-to-date.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume-url">Resume URL *</Label>
                    <Input
                      id="resume-url"
                      placeholder="https://drive.google.com/file/..."
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Please provide a direct link to your resume (Google Drive, Dropbox, etc.)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover-message">Cover Message (Optional)</Label>
                    <Textarea
                      id="cover-message"
                      placeholder="Tell us why you're interested in this position..."
                      value={coverMessage}
                      onChange={(e) => setCoverMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsApplyDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={isSubmitting || !resumeUrl.trim()}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-green-600 mb-2">
                  <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Already Applied</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You've already submitted an application for this position.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/jobs/my-applications')}
                  className="w-full"
                >
                  View My Applications
                </Button>
              </CardContent>
            </Card>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/jobs')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse More Jobs
          </Button>
        </div>
      </div>

      {job && (
        <ApplicationsDialog
          jobId={job.id}
          jobTitle={job.title}
          open={isApplicationsOpen}
          onOpenChange={setIsApplicationsOpen}
        />
      )}
    </div>
  );
}