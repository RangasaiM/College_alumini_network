'use client';

import UserProfileView from '@/app/shared/profile/user-profile-view';

export default function ProfilePage({ params }: { params: { id: string } }) {
  return <UserProfileView userId={params.id} />;
} 