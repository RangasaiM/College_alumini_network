export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionWithProfiles extends Connection {
  requester: {
    id: string;
    name: string;
    role: string;
    department: string;
    current_company?: string;
    current_role?: string;
    batch_year?: number;
    graduation_year?: number;
  };
  receiver: {
    id: string;
    name: string;
    role: string;
    department: string;
    current_company?: string;
    current_role?: string;
    batch_year?: number;
    graduation_year?: number;
  };
} 