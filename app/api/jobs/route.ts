import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { jobPostSchema } from '@/lib/validations/schema';
import { getServerUserDetails } from '@/lib/supabase/auth-helpers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobType = searchParams.get('job_type') as any;
  const location = searchParams.get('location') as any;
  const skills = searchParams.get('skills')?.split(',') || [];
  const eligibility = searchParams.get('eligibility') as any;
  const search = searchParams.get('search');
  const postedBy = searchParams.get('posted_by') as any;
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

    let query = supabase
      .from('job_posts')
      .select(`
        *,
        posted_by_profile:users(id, name, role, current_company, avatar_url),
        job_applications(count)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    if (location) {
      query = query.eq('location', location);
    }

    if (eligibility) {
      query = query.eq('eligibility', eligibility);
    }

    if (postedBy) {
      query = query.eq('users.role', postedBy);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Handle skills filtering (array overlap)
    if (skills.length > 0) {
      query = query.overlaps('required_skills', skills);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching job posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job posts' },
        { status: 500 }
      );
    }

    // Transform data to include application counts
    const jobPosts = data?.map((post: any) => ({
      ...post,
      application_count: post.job_applications?.[0]?.count || 0,
      job_applications: undefined // Remove the raw count data
    })) || [];

    return NextResponse.json({
      data: jobPosts,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Error in GET /api/jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('POST /api/jobs endpoint hit');
  try {
    const supabase = await createClient();
    const user = await getServerUserDetails();
    console.log('User details:', user);

    if (!user) {
      console.log('No user found, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Checking user permissions for user:', user.id);
    // Check if user is admin or alumni
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role, is_approved')
      .eq('id', user.id)
      .single();
    
    console.log('User profile query result:', { data: userProfile, error: userError });

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (userProfile.role !== 'admin' && userProfile.role !== 'alumni') {
      return NextResponse.json(
        { error: 'Only admins and alumni can post jobs' },
        { status: 403 }
      );
    }

    if (!userProfile.is_approved) {
      return NextResponse.json(
        { error: 'Account not approved' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Received body:', body);
    
    console.log('Raw body received:', body);
    let validatedData;
    try {
      validatedData = jobPostSchema.parse(body);
      console.log('Validated data:', validatedData);
    } catch (validationError: any) {
      console.error('Validation error details:', validationError.errors);
      return NextResponse.json(
        { error: 'Validation error', details: validationError.errors },
        { status: 400 }
      );
    }

    console.log('Attempting to insert job post with data:', {
      ...validatedData,
      posted_by: user.id,
      application_deadline: validatedData.application_deadline ? 
        new Date(validatedData.application_deadline).toISOString() : null
    });
    
    const { data, error } = await supabase
      .from('job_posts')
      .insert({
        ...validatedData,
        posted_by: user.id,
        application_deadline: validatedData.application_deadline ? 
          new Date(validatedData.application_deadline instanceof Date ? validatedData.application_deadline : new Date(validatedData.application_deadline)).toISOString() : null
      })
      .select()
      .single();
    
    console.log('Insert result:', { data, error });

    if (error) {
      console.error('Error creating job post:', error);
      return NextResponse.json(
        { error: 'Failed to create job post' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    // Zod validation errors are now handled before this point
    console.error('Error in POST /api/jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}