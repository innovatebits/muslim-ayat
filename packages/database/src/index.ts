export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProfileRow = {
  id: string;
  preferred_language: string;
  reader_preferences: Json;
  created_at: string;
  updated_at: string;
};

type BookmarkRow = {
  id: string;
  user_id: string;
  surah_number: number;
  ayah_number: number;
  created_at: string;
  client_updated_at: string;
  sync_operation_id: string;
  is_deleted: boolean;
};

type ReadingProgressRow = {
  user_id: string;
  surah_number: number;
  ayah_number: number;
  updated_at: string;
  client_updated_at: string;
  sync_operation_id: string;
};

type UserNoteRow = {
  id: string;
  user_id: string;
  surah_number: number;
  ayah_number: number;
  content: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  client_updated_at: string;
  sync_operation_id: string;
  is_deleted: boolean;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        {
          id: string;
          preferred_language?: string;
          reader_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      bookmarks: Table<
        BookmarkRow,
        {
          id?: string;
          user_id: string;
          surah_number: number;
          ayah_number: number;
          created_at?: string;
          client_updated_at?: string;
          sync_operation_id?: string;
          is_deleted?: boolean;
        }
      >;
      reading_progress: Table<
        ReadingProgressRow,
        {
          user_id: string;
          surah_number: number;
          ayah_number: number;
          updated_at?: string;
          client_updated_at?: string;
          sync_operation_id?: string;
        }
      >;
      user_notes: Table<
        UserNoteRow,
        {
          id?: string;
          user_id: string;
          surah_number: number;
          ayah_number: number;
          content: string;
          created_at?: string;
          updated_at?: string;
          client_id?: string;
          client_updated_at?: string;
          sync_operation_id?: string;
          is_deleted?: boolean;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      sync_bookmark: {
        Args: {
          p_owner_id: string;
          p_surah_number: number;
          p_ayah_number: number;
          p_client_updated_at: string;
          p_sync_operation_id: string;
          p_is_deleted: boolean;
        };
        Returns: BookmarkRow;
      };
      sync_note: {
        Args: {
          p_owner_id: string;
          p_client_id: string;
          p_surah_number: number;
          p_ayah_number: number;
          p_content: string;
          p_client_updated_at: string;
          p_sync_operation_id: string;
          p_is_deleted: boolean;
        };
        Returns: UserNoteRow;
      };
      sync_reading_progress: {
        Args: {
          p_owner_id: string;
          p_surah_number: number;
          p_ayah_number: number;
          p_client_updated_at: string;
          p_sync_operation_id: string;
        };
        Returns: ReadingProgressRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};