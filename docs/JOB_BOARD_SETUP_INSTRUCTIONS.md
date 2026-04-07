# Job Board Setup Instructions

## Database Tables Required

Since RLS is disabled, you'll need to create the following tables in your Supabase database:

### 1. Custom Types
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create custom types for job board
CREATE TYPE public.job_type AS ENUM ('internship', 'full-time', 'part-time', 'contract');
CREATE TYPE public.job_location AS ENUM ('remote', 'onsite', 'hybrid');
CREATE TYPE public.eligibility_type AS ENUM ('student', 'alumni', 'both');
CREATE TYPE public.application_status AS ENUM ('applied', 'shortlisted', 'rejected', 'selected');
```

### 2. Job Posts Table
```sql
-- Create job_posts table
CREATE TABLE public.job_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_type public.job_type NOT NULL,
    location public.job_location NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    description TEXT NOT NULL,
    eligibility public.eligibility_type NOT NULL DEFAULT 'both',
    application_deadline TIMESTAMP WITH TIME ZONE,
    posted_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Job Applications Table
```sql
-- Create job_applications table
CREATE TABLE public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_post_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    resume_url TEXT NOT NULL,
    cover_message TEXT,
    status public.application_status NOT NULL DEFAULT 'applied',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_post_id, applicant_id)
);
```

### 4. Indexes for Performance
```sql
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
```

## Verification Steps

After creating the tables:

1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Create a new query
4. Run the above SQL commands in order

## Troubleshooting

If you encounter any issues:

1. Make sure you're connected to the right database
2. Ensure your environment variables are correctly set in `.env.local`
3. Check that the Supabase URL and ANON key are correct
4. Verify that your user account has the necessary permissions

## Testing the Feature

Once tables are created:

1. Log in as an alumni account
2. Go to the alumni dashboard
3. Click "Post New Opportunity" 
4. Fill out the form and submit
5. The job should appear in the job board

The Job Board is now fully integrated into:
- Student Dashboard (browse opportunities)
- Alumni Dashboard (browse and post)
- Admin Dashboard (manage all)

Enjoy using the Job & Internship Board feature!