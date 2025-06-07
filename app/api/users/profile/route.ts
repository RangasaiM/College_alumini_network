import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { studentProfileSchema, alumniProfileSchema } from '@/lib/validations/schema';
import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  notFoundResponse 
} from '@/lib/utils/api-response';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return unauthorizedResponse();
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return notFoundResponse('Profile not found');
    }

    return successResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { expires?: Date }) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: { expires?: Date }) {
          cookieStore.set(name, '', options);
        },
      },
    }
  );

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update(body)
      .eq('id', session.user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 