'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function TestStoragePage() {
  const [status, setStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<any[]>([]);

  useEffect(() => {
    async function checkStorage() {
      try {
        // Log environment variables (without sensitive data)
        console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Test authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw new Error(`Auth error: ${authError.message}`);
        
        // Check if user is authenticated
        if (!session) {
          setStatus('Not authenticated. Please sign in first.');
          return;
        }

        // List all buckets
        const { data: bucketsData, error: bucketsError } = await supabase
          .storage
          .listBuckets();

        if (bucketsError) throw new Error(`Buckets error: ${bucketsError.message}`);
        
        setBuckets(bucketsData || []);
        
        // Try to create avatars bucket if it doesn't exist
        const avatarsBucketExists = bucketsData?.some(b => b.name === 'avatars');
        
        if (!avatarsBucketExists) {
          const { data: newBucket, error: createError } = await supabase
            .storage
            .createBucket('avatars', {
              public: true,
              fileSizeLimit: 5242880,
              allowedMimeTypes: [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp'
              ]
            });

          if (createError) throw new Error(`Create bucket error: ${createError.message}`);
          setStatus('Created avatars bucket successfully');
        } else {
          setStatus('Avatars bucket exists');
        }

      } catch (error: any) {
        console.error('Storage test error:', error);
        setError(error.message);
        setStatus('Error occurred');
      }
    }

    checkStorage();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Storage Test Page</h1>
      
      <div className="mb-4">
        <h2 className="font-semibold">Status:</h2>
        <p>{status}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          <h2 className="font-semibold">Error:</h2>
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="font-semibold">Available Buckets:</h2>
        {buckets.length === 0 ? (
          <p>No buckets found</p>
        ) : (
          <ul className="list-disc pl-5">
            {buckets.map(bucket => (
              <li key={bucket.id}>
                {bucket.name} ({bucket.public ? 'public' : 'private'})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 