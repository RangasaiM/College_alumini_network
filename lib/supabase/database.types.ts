export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: "student" | "alumni" | "admin" | null;
          is_approved: boolean;
          batch_year: number | null;
          github_url: string | null;
          leetcode_url: string | null;
          linkedin_url: string | null;
          current_company: string | null;
          current_position: string | null;
          skills: string[] | null;
          avatar_url: string | null;
          resume_url: string | null;
          department: string | null;
          graduation_year: number | null;
          is_mentorship_available: boolean | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          role?: "student" | "alumni" | "admin" | null;
          is_approved?: boolean;
          batch_year?: number | null;
          github_url?: string | null;
          leetcode_url?: string | null;
          linkedin_url?: string | null;
          current_company?: string | null;
          current_position?: string | null;
          skills?: string[] | null;
          avatar_url?: string | null;
          resume_url?: string | null;
          department?: string | null;
          graduation_year?: number | null;
          is_mentorship_available?: boolean | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: "student" | "alumni" | "admin" | null;
          is_approved?: boolean;
          batch_year?: number | null;
          github_url?: string | null;
          leetcode_url?: string | null;
          linkedin_url?: string | null;
          current_company?: string | null;
          current_position?: string | null;
          skills?: string[] | null;
          avatar_url?: string | null;
          resume_url?: string | null;
          department?: string | null;
          graduation_year?: number | null;
          is_mentorship_available?: boolean | null;
          bio?: string | null;
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: number;
          title: string | null;
          content: string | null;
          created_at: string;
          admin_id: string | null;
        };
        Insert: {
          id?: number;
          title?: string | null;
          content?: string | null;
          created_at?: string;
          admin_id?: string | null;
        };
        Update: {
          id?: number;
          title?: string | null;
          content?: string | null;
          created_at?: string;
          admin_id?: string | null;
        };
      };
      messages: {
        Row: {
          id: number;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string;
          is_read: boolean;
        };
        Insert: {
          id?: number;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string;
          is_read?: boolean;
        };
        Update: {
          id?: number;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          created_at?: string;
          is_read?: boolean;
        };
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          receiver_id: string;
          status: "pending" | "accepted" | "rejected";
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          receiver_id: string;
          status?: "pending" | "accepted" | "rejected";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          receiver_id?: string;
          status?: "pending" | "accepted" | "rejected";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "student" | "alumni" | "admin";
      connection_status: "pending" | "accepted" | "rejected";
    };
  };
}