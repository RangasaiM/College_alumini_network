'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function TestStoragePage() {
  const [status, setStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  const [bucketInfo, setBucketInfo] = useState<any>(null);

  useEffect(() => {
    async function setupStorage() {
      try {
        // First, try to set up the storage bucket
        const response = await fetch('/api/storage/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to set up storage');
        }

        setBucketInfo(result.bucket);
        setStatus('Storage bucket configured successfully');

        // Now test the bucket by uploading a small test file
        const supabase = getSupabaseClient();
        const testData = new Blob(['test'], { type: 'text/plain' });
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload('test.txt', testData, {
            cacheControl: '0',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Upload test failed: ${uploadError.message}`);
        }

        // Clean up the test file
        await supabase.storage
          .from('avatars')
          .remove(['test.txt']);

        setStatus('Storage is working correctly');
      } catch (error: any) {
        console.error('Storage setup error:', error);
        setError(error.message);
        setStatus('Error occurred');
      }
    }

    setupStorage();
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

      {bucketInfo && (
        <div className="mb-4">
          <h2 className="font-semibold">Bucket Configuration:</h2>
          <pre className="bg-gray-100 p-4 rounded mt-2">
            {JSON.stringify(bucketInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 