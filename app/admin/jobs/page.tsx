'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Building, Calendar, Users, Eye, Edit, Trash2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { JobPost, JobApplication, ApplicationStatus } from '@/app/types/jobs';
import { useToast } from '@/hooks/use-toast';

export default function AdminJobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'posts') {
        await fetchJobs();
      } else {
        await fetchApplications();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: `Failed to load ${activeTab}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    const response = await fetch('/api/jobs?page=1&limit=100');
    if (response.ok) {
      const result = await response.json();
      setJobs(result.data);
    }
  };

  const fetchApplications = async () => {
    const response = await fetch('/api/job-applications?page=1&limit=100');
    if (response.ok) {
      const result = await response.json();
      setApplications(result.data);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      toast({
        title: 'Success',
        description: 'Job post deleted successfully',
      });

      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job post',
        variant: 'destructive'
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    try {
      const response = await fetch(`/api/job-applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      toast({
        title: 'Success',
        description: 'Application status updated successfully',
      });

      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive'
      });
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(app =>
    app.job_post?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.applicant_profile?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'selected': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <Card>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Job Board Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage job postings and applications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Job Posts ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Applications ({applications.length})
          </TabsTrigger>
        </TabsList>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 mb-6"
          />
        </div>

        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Job Posts</CardTitle>
              <CardDescription>
                Manage all job and internship postings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No job posts found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search term' : 'No job posts have been created yet'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Posted By</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.company_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {job.job_type.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{job.posted_by_profile?.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {job.posted_by_profile?.role}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {job.application_count || 0} applications
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(job.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/jobs/${job.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteJob(job.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>
                Review and manage job applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search term' : 'No applications have been submitted yet'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{application.job_post?.title}</p>
                            <p className="text-sm text-muted-foreground">{application.job_post?.company_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{application.applicant_profile?.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {application.applicant_profile?.role}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={application.status || 'applied'}
                            onValueChange={(value) => 
                              updateApplicationStatus(application.id, value as ApplicationStatus)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="selected">Selected</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{formatDate(application.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(application.resume_url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/jobs/${application.job_post_id}`)}
                            >
                              <Building className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}