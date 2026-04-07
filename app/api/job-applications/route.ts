import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { jobApplicationSchema } from '@/lib/validations/schema';
import { getServerUserDetails } from '@/lib/supabase/auth-helpers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');
  const status = searchParams.get('status') as any;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const supabase = await createClient();
    const user = await getServerUserDetails();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or owns the job post
    let isAuthorized = user.role === 'admin';
    
    if (jobId && !isAuthorized) {
      const { data: jobPost } = await supabase
        .from('job_posts')
        .select('posted_by')
        .eq('id', jobId)
        .single();
      
      isAuthorized = jobPost?.posted_by === user.id;
    }

    if (!isAuthorized) {
      // Regular users can only see their own applications
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job_post:job_posts(title, company_name, job_type, location),
          applicant_profile:users(name, email, role, department, batch_year, graduation_year, avatar_url)
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching job applications:', error);
        return NextResponse.json(
          { error: 'Failed to fetch job applications' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data,
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      });
    }

    // Admin or job owner can see all applications for a job
    let query = supabase
      .from('job_applications')
      .select(`
        *,
        job_post:job_posts(title, company_name, job_type, location),
        applicant_profile:users(name, email, role, department, batch_year, graduation_year, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (jobId) {
      query = query.eq('job_post_id', jobId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching job applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Error in GET /api/job-applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getServerUserDetails();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = jobApplicationSchema.parse(body);

    // Check if job post exists and is active
    const { data: jobPost, error: jobError } = await supabase
      .from('job_posts')
      .select('id, eligibility, is_active')
      .eq('id', validatedData.job_post_id)
      .eq('is_active', true)
      .single();

    if (jobError || !jobPost) {
      return NextResponse.json(
        { error: 'Job post not found or inactive' },
        { status: 404 }
      );
    }

    // Check eligibility
    if (jobPost.eligibility === 'student' && user.role !== 'student') {
      return NextResponse.json(
        { error: 'This job is only open to students' },
        { status: 403 }
      );
    }

    if (jobPost.eligibility === 'alumni' && user.role !== 'alumni') {
      return NextResponse.json(
        { error: 'This job is only open to alumni' },
        { status: 403 }
      );
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_post_id', validatedData.job_post_id)
      .eq('applicant_id', user.id)
      .maybeSingle();

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        ...validatedData,
        applicant_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job application:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/job-applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}