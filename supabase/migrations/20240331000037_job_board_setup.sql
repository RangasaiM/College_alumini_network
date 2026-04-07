-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for job board
CREATE TYPE public.job_type AS ENUM ('internship', 'full-time', 'part-time', 'contract');
CREATE TYPE public.job_location AS ENUM ('remote', 'onsite', 'hybrid');
CREATE TYPE public.eligibility_type AS ENUM ('student', 'alumni', 'both');
CREATE TYPE public.application_status AS ENUM ('applied', 'shortlisted', 'rejected', 'selected');

-- Create job_posts table
CREATE TABLE public.job_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_type public.job_type NOT NULL,
    location public.job_location NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    description TEXT NOT NULL,
    eligibility public.eligibility_type NOT NULL DEFAULT 'both',
    application_deadline TIMESTAMP WITH TIME ZONE,
    posted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create job_applications table
CREATE TABLE public.job_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resume_url TEXT NOT NULL,
    cover_message TEXT,
    status public.application_status NOT NULL DEFAULT 'applied',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(job_post_id, applicant_id)
);

-- Create indexes for better performance
CREATE INDEX idx_job_posts_posted_by ON public.job_posts(posted_by);
CREATE INDEX idx_job_posts_job_type ON public.job_posts(job_type);
CREATE INDEX idx_job_posts_location ON public.job_posts(location);
CREATE INDEX idx_job_posts_eligibility ON public.job_posts(eligibility);
CREATE INDEX idx_job_posts_created_at ON public.job_posts(created_at);
CREATE INDEX idx_job_posts_is_active ON public.job_posts(is_active);

CREATE INDEX idx_job_applications_job_post_id ON public.job_applications(job_post_id);
CREATE INDEX idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_job_applications_created_at ON public.job_applications(created_at);

-- Row Level Security policies
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Job Posts Policies
-- Anyone can view active job posts
CREATE POLICY "Anyone can view active job posts" ON public.job_posts
    FOR SELECT USING (is_active = true);

-- Admins and alumni can create job posts
CREATE POLICY "Admins and alumni can create job posts" ON public.job_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = posted_by 
            AND role IN ('admin', 'alumni')
            AND is_approved = true
        )
    );

-- Post owners and admins can update their posts
CREATE POLICY "Post owners and admins can update posts" ON public.job_posts
    FOR UPDATE USING (
        posted_by = (SELECT auth.uid()) 
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'admin'
        )
    );

-- Post owners and admins can delete their posts
CREATE POLICY "Post owners and admins can delete posts" ON public.job_posts
    FOR DELETE USING (
        posted_by = (SELECT auth.uid()) 
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'admin'
        )
    );

-- Job Applications Policies
-- Users can view their own applications
CREATE POLICY "Users can view their own applications" ON public.job_applications
    FOR SELECT USING (applicant_id = (SELECT auth.uid()));

-- Users can create applications for active jobs
CREATE POLICY "Users can apply to active jobs" ON public.job_applications
    FOR INSERT WITH CHECK (
        applicant_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.job_posts 
            WHERE id = job_post_id 
            AND is_active = true
        )
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = applicant_id 
            AND is_approved = true
        )
    );

-- Applicants and post owners can update application status
CREATE POLICY "Applicants and post owners can update applications" ON public.job_applications
    FOR UPDATE USING (
        applicant_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.job_posts jp
            JOIN public.users u ON jp.posted_by = u.id
            WHERE jp.id = job_post_id
            AND (jp.posted_by = (SELECT auth.uid()) OR u.role = 'admin')
        )
    );

-- Applicants can delete their own applications
CREATE POLICY "Applicants can delete their applications" ON public.job_applications
    FOR DELETE USING (applicant_id = (SELECT auth.uid()));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Allow authenticated users to use the tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;