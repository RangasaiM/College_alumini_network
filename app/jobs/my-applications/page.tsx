'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Calendar, ExternalLink, ArrowLeft } from 'lucide-react';
import { JobApplication, ApplicationStatus } from '@/app/types/jobs';
import { useToast } from '@/hooks/use-toast';

export default function MyApplicationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchMyApplications();
  }, [filterStatus, pagination.page]);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filterStatus !== 'all') {
        queryParams.append('status', filterStatus);
      }
      
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/job-applications?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const result = await response.json();
      setApplications(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.count,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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

  const getStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied': return 'Applied';
      case 'shortlisted': return 'Shortlisted';
      case 'rejected': return 'Rejected';
      case 'selected': return 'Selected';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const cancelApplication = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/job-applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel application');
      }

      toast({
        title: 'Success',
        description: 'Application cancelled successfully',
      });

      // Refresh the list
      fetchMyApplications();
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel application',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground mt-2">
            Track the status of your job applications
          </p>
        </div>
        <Button onClick={() => router.push('/jobs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Browse Jobs
        </Button>
      </div>

      <div className="mb-6">
        <Select value={filterStatus || 'all'} onValueChange={(value) => {
          setFilterStatus(value as ApplicationStatus | 'all');
          setPagination(prev => ({ ...prev, page: 1 }));
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">All Applications</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="selected">Selected</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              <Building className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {filterStatus === 'all' ? 'No applications yet' : `No ${filterStatus} applications`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filterStatus === 'all' 
                ? "You haven't applied to any jobs yet."
                : `You don't have any applications with ${filterStatus} status.`
              }
            </p>
            <Button onClick={() => router.push('/jobs')}>
              Browse Job Opportunities
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <CardTitle className="text-xl">{application.job_post?.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Building className="mr-1 h-4 w-4" />
                      {application.job_post?.company_name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(application.status)}>
                      {getStatusText(application.status)}
                    </Badge>
                    {application.status === 'applied' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelApplication(application.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Job Type</p>
                    <p className="font-medium capitalize">{application.job_post?.job_type?.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium capitalize">{application.job_post?.location}</p>
                  </div>
                </div>

                {application.cover_message && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Your Cover Message</p>
                    <p className="mt-1">{application.cover_message}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      Applied {formatDate(application.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(application.resume_url, '_blank')}
                    >
                      <ExternalLink className="mr-1 h-4 w-4" />
                      View Resume
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/jobs/${application.job_post_id}`)}
                    >
                      View Job
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-8">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} applications
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}