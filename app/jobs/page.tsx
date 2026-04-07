'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, MapPin, Clock, Building, Filter } from 'lucide-react';
import { JobPost, JobType, JobLocation, EligibilityType } from '@/app/types/jobs';
import { useToast } from '@/hooks/use-toast';

export default function JobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    job_type: '' as JobType | '',
    location: '' as JobLocation | '',
    eligibility: '' as EligibilityType | '',
    search: '',
    posted_by: '' as 'admin' | 'alumni' | ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/jobs?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const result = await response.json();
      setJobs(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.count,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job postings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      job_type: '',
      location: '',
      eligibility: '',
      search: '',
      posted_by: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getJobTypeColor = (jobType: JobType) => {
    switch (jobType) {
      case 'internship': return 'bg-blue-100 text-blue-800';
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-yellow-100 text-yellow-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationIcon = (location: JobLocation) => {
    switch (location) {
      case 'remote': return '🏠';
      case 'onsite': return '🏢';
      case 'hybrid': return '🔄';
      default: return '📍';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Job & Internship Board</h1>
          <p className="text-muted-foreground mt-2">
            Discover opportunities posted by alumni and administrators
          </p>
        </div>
        <Button onClick={() => router.push('/jobs/post')}>
          <Plus className="mr-2 h-4 w-4" />
          Post Opportunity
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs or companies..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filters.job_type || 'all'} onValueChange={(value) => handleFilterChange('job_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.location || 'all'} onValueChange={(value) => handleFilterChange('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.eligibility || 'all'} onValueChange={(value) => handleFilterChange('eligibility', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Eligibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Eligible</SelectItem>
                <SelectItem value="student">Students Only</SelectItem>
                <SelectItem value="alumni">Alumni Only</SelectItem>
                <SelectItem value="both">Students & Alumni</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.posted_by || 'all'} onValueChange={(value) => handleFilterChange('posted_by', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Posted By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(filters.job_type || filters.location || filters.eligibility || filters.search || filters.posted_by) && (
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Listings */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              <Building className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No job postings found</h3>
            <p className="text-muted-foreground mb-4">
              {Object.values(filters).some(v => v)
                ? 'Try adjusting your filters or search terms'
                : 'Be the first to post an opportunity!'
              }
            </p>
            <Button onClick={() => router.push('/jobs/post')}>
              <Plus className="mr-2 h-4 w-4" />
              Post Opportunity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Building className="mr-1 h-4 w-4" />
                      {job.company_name}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getJobTypeColor(job.job_type)}>
                      {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                    </Badge>
                    <Badge variant="secondary">
                      {getLocationIcon(job.location)} {job.location}
                    </Badge>
                    <Badge variant="outline">
                      {job.application_count || 0} applied
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.required_skills.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {job.required_skills.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{job.required_skills.length - 5} more
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      Posted {formatDate(job.created_at)}
                    </span>
                    <span>
                      {job.posted_by_profile?.role === 'admin' ? 'Posted by Admin' : 'Posted by Alumni'}
                    </span>
                  </div>

                  {job.application_deadline && (
                    <span className="font-medium">
                      Deadline: {formatDate(job.application_deadline)}
                    </span>
                  )}
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
                {pagination.total} results
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