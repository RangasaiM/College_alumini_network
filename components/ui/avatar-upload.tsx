'use client';

import { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';

interface AvatarUploadProps {
  userId: string;
  url?: string;
  onUploadComplete: (url: string) => void;
  onUploadStart?: () => void;
  className?: string;
}

export function AvatarUpload({ userId, url, onUploadComplete, onUploadStart, className }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(url);
  const [error, setError] = useState<string | null>(null);
  
  // Update local avatar URL when prop changes
  useEffect(() => {
    setAvatarUrl(url);
  }, [url]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const uploadAvatar = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      onUploadStart?.();
      setError(null);

      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError('Please sign in to upload profile pictures');
        return;
      }

      // Verify user is updating their own profile
      if (userId !== session.user.id) {
        throw new Error('You can only update your own profile picture');
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Upload to profile_photos bucket
      const { error: uploadError, data } = await supabase.storage
        .from('profile_photos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(fileName);

      // Update local state and notify parent
      setAvatarUrl(publicUrl);
      onUploadComplete(publicUrl);
      toast.success('Image uploaded successfully. Click Save Changes to update your profile.');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setError(error.message || 'Error uploading profile picture');
      toast.error(error.message || 'Error uploading profile picture');
      onUploadComplete(''); // Notify parent that upload failed
    } finally {
      setIsUploading(false);
    }
  }, [userId, supabase, onUploadComplete, onUploadStart]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = event.target.files?.[0];
        if (!file) return;

        await uploadAvatar(file);
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        toast.error(error.message || 'Error uploading profile picture');
      }
    },
    [uploadAvatar]
  );

  return (
    <div className={className}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar"
          className="rounded-full"
          width={200}
          height={200}
        />
      ) : (
        <div className="w-[200px] h-[200px] bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-500">No image</span>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        onClick={() => document.getElementById('avatar')?.click()}
        className="mt-4"
        disabled={isUploading}
        type="button"
      >
        {isUploading ? 'Uploading...' : error?.includes('sign in') ? 'Please sign in' : 'Change Profile Picture'}
      </Button>

      <input
        type="file"
        id="avatar"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
} 