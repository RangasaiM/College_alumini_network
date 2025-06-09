'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Database } from '@/lib/database.types';

export default function ProfilePhotoUpload() {
  const supabase = createClientComponentClient<Database>();
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      const file = event.target.files?.[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to upload a photo');
        return;
      }

      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('profile_photos')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl);

      // Update user profile with photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading photo');
    } finally {
      setUploading(false);
    }
  }, [supabase]);

  return (
    <div className="flex flex-col items-center gap-4">
      {photoUrl && (
        <Image
          src={photoUrl}
          alt="Profile photo"
          width={100}
          height={100}
          className="rounded-full"
        />
      )}
      
      <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
        {uploading ? 'Uploading...' : 'Upload Photo'}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={uploadPhoto}
          disabled={uploading}
        />
      </label>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
} 