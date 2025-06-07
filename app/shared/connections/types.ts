export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  message?: string;
}

export interface ConnectionUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'alumni';
  avatar_url?: string;
  current_company?: string;
  current_role?: string;
  batch_year?: number;
  graduation_year?: number;
  skills: string[];
  is_mentorship_available?: boolean;
}

export interface ConnectionWithUser extends Connection {
  requester: ConnectionUser;
  receiver: ConnectionUser;
} 