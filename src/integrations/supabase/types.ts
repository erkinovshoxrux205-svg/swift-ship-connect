export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at: string
          id: string
          permissions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_role?: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          id?: string
          permissions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          id?: string
          permissions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_logs: {
        Row: {
          created_at: string
          id: string
          question: string
          response_time_ms: number | null
          satisfaction_rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          response_time_ms?: number | null
          satisfaction_rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          response_time_ms?: number | null
          satisfaction_rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          firebase_uid: string | null
          id: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          firebase_uid?: string | null
          id?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          firebase_uid?: string | null
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      balance_transactions: {
        Row: {
          admin_id: string | null
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      barcodes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          reference_id: string
          reference_type: string
          type: Database["public"]["Enums"]["barcode_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          reference_id: string
          reference_type: string
          type: Database["public"]["Enums"]["barcode_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          reference_id?: string
          reference_type?: string
          type?: Database["public"]["Enums"]["barcode_type"]
          updated_at?: string
        }
        Relationships: []
      }
      carrier_preferences: {
        Row: {
          carrier_id: string
          created_at: string
          id: string
          max_weight: number | null
          min_weight: number | null
          notify_all: boolean | null
          preferred_cargo_types: string[] | null
          preferred_routes: string[] | null
          updated_at: string
        }
        Insert: {
          carrier_id: string
          created_at?: string
          id?: string
          max_weight?: number | null
          min_weight?: number | null
          notify_all?: boolean | null
          preferred_cargo_types?: string[] | null
          preferred_routes?: string[] | null
          updated_at?: string
        }
        Update: {
          carrier_id?: string
          created_at?: string
          id?: string
          max_weight?: number | null
          min_weight?: number | null
          notify_all?: boolean | null
          preferred_cargo_types?: string[] | null
          preferred_routes?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          agreed_price: number
          carrier_id: string
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          order_id: string
          proof_photo_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["deal_status"]
          updated_at: string
        }
        Insert: {
          agreed_price: number
          carrier_id: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          proof_photo_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Update: {
          agreed_price?: number
          carrier_id?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          proof_photo_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      device_fingerprints: {
        Row: {
          city: string | null
          country: string | null
          fingerprint: string
          first_seen_at: string | null
          id: string
          ip_address: string | null
          is_suspicious: boolean | null
          is_vpn: boolean | null
          last_seen_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          fingerprint: string
          first_seen_at?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          is_vpn?: boolean | null
          last_seen_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          fingerprint?: string
          first_seen_at?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          is_vpn?: boolean | null
          last_seen_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_items: {
        Row: {
          created_at: string
          description: string | null
          document_id: string
          id: string
          item_sequence: number
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_id: string
          id?: string
          item_sequence: number
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_id?: string
          id?: string
          item_sequence?: number
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          document_id: string
          id: string
          ip_address: unknown
          signature_data: Json | null
          signature_type: string
          signed_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          document_id: string
          id?: string
          ip_address?: unknown
          signature_data?: Json | null
          signature_type: string
          signed_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          document_id?: string
          id?: string
          ip_address?: unknown
          signature_data?: Json | null
          signature_type?: string
          signed_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: Json | null
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_hash: string | null
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          order_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          description?: string | null
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_hash?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_hash?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "active_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_operations: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      favorite_carriers: {
        Row: {
          carrier_id: string
          client_id: string
          created_at: string
          id: string
          note: string | null
        }
        Insert: {
          carrier_id: string
          client_id: string
          created_at?: string
          id?: string
          note?: string | null
        }
        Update: {
          carrier_id?: string
          client_id?: string
          created_at?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      firebase_user_roles: {
        Row: {
          created_at: string
          firebase_uid: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          firebase_uid: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          firebase_uid?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      geocode_cache: {
        Row: {
          address: string
          address_normalized: string
          created_at: string
          formatted_address: string | null
          id: string
          lat: number
          lng: number
          provider: string | null
          updated_at: string
        }
        Insert: {
          address: string
          address_normalized: string
          created_at?: string
          formatted_address?: string | null
          id?: string
          lat: number
          lng: number
          provider?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          address_normalized?: string
          created_at?: string
          formatted_address?: string | null
          id?: string
          lat?: number
          lng?: number
          provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gps_locations: {
        Row: {
          carrier_id: string
          deal_id: string
          id: string
          latitude: number
          longitude: number
          recorded_at: string
        }
        Insert: {
          carrier_id: string
          deal_id: string
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
        }
        Update: {
          carrier_id?: string
          deal_id?: string
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_locations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "active_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_locations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          location_id: string
          product_id: string
          stock_available: number | null
          stock_reserved: number | null
          stock_total: number | null
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          location_id: string
          product_id: string
          stock_available?: number | null
          stock_reserved?: number | null
          stock_total?: number | null
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          location_id?: string
          product_id?: string
          stock_available?: number | null
          stock_reserved?: number | null
          stock_total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          from_location_id: string | null
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          to_location_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          to_location_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          to_location_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          address: string | null
          admin_notes: string | null
          auto_verified: boolean | null
          created_at: string
          data_match_score: number | null
          date_of_birth: string | null
          document_authenticity_score: number | null
          extracted_data: Json | null
          face_match_score: number | null
          first_name: string | null
          id: string
          last_name: string | null
          liveness_score: number | null
          middle_name: string | null
          ocr_confidence: number | null
          ocr_extracted_country: string | null
          ocr_extracted_dob: string | null
          ocr_extracted_expiry: string | null
          ocr_extracted_name: string | null
          ocr_extracted_passport_number: string | null
          ocr_extracted_surname: string | null
          ocr_raw_data: Json | null
          passport_back_url: string | null
          passport_country: string | null
          passport_expiry: string | null
          passport_front_url: string | null
          passport_number: string | null
          passport_series: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
          video_selfie_url: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          auto_verified?: boolean | null
          created_at?: string
          data_match_score?: number | null
          date_of_birth?: string | null
          document_authenticity_score?: number | null
          extracted_data?: Json | null
          face_match_score?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          liveness_score?: number | null
          middle_name?: string | null
          ocr_confidence?: number | null
          ocr_extracted_country?: string | null
          ocr_extracted_dob?: string | null
          ocr_extracted_expiry?: string | null
          ocr_extracted_name?: string | null
          ocr_extracted_passport_number?: string | null
          ocr_extracted_surname?: string | null
          ocr_raw_data?: Json | null
          passport_back_url?: string | null
          passport_country?: string | null
          passport_expiry?: string | null
          passport_front_url?: string | null
          passport_number?: string | null
          passport_series?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
          video_selfie_url?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          auto_verified?: boolean | null
          created_at?: string
          data_match_score?: number | null
          date_of_birth?: string | null
          document_authenticity_score?: number | null
          extracted_data?: Json | null
          face_match_score?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          liveness_score?: number | null
          middle_name?: string | null
          ocr_confidence?: number | null
          ocr_extracted_country?: string | null
          ocr_extracted_dob?: string | null
          ocr_extracted_expiry?: string | null
          ocr_extracted_name?: string | null
          ocr_extracted_passport_number?: string | null
          ocr_extracted_surname?: string | null
          ocr_raw_data?: Json | null
          passport_back_url?: string | null
          passport_country?: string | null
          passport_expiry?: string | null
          passport_front_url?: string | null
          passport_number?: string | null
          passport_series?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
          video_selfie_url?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          cell: string | null
          code: string
          created_at: string
          current_volume: number | null
          current_weight: number | null
          id: string
          max_volume: number | null
          max_weight: number | null
          rack: string | null
          shelf: string | null
          status: Database["public"]["Enums"]["location_status"]
          updated_at: string
          zone_id: string
        }
        Insert: {
          cell?: string | null
          code: string
          created_at?: string
          current_volume?: number | null
          current_weight?: number | null
          id?: string
          max_volume?: number | null
          max_weight?: number | null
          rack?: string | null
          shelf?: string | null
          status?: Database["public"]["Enums"]["location_status"]
          updated_at?: string
          zone_id: string
        }
        Update: {
          cell?: string | null
          code?: string
          created_at?: string
          current_volume?: number | null
          current_weight?: number | null
          id?: string
          max_volume?: number | null
          max_weight?: number | null
          rack?: string | null
          shelf?: string | null
          status?: Database["public"]["Enums"]["location_status"]
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          balance: number
          created_at: string
          id: string
          lifetime_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          name: string
          points_cost: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          points_cost: number
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_cost?: number
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          deal_id: string | null
          id: string
          is_system: boolean | null
          order_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deal_id?: string | null
          id?: string
          is_system?: boolean | null
          order_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          is_system?: boolean | null
          order_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "active_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          firebase_uid: string | null
          id: string
          is_read: boolean
          title: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          firebase_uid?: string | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          firebase_uid?: string | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cargo_type: string
          client_id: string
          client_price: number | null
          created_at: string
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_place_id: string | null
          description: string | null
          height: number | null
          id: string
          length: number | null
          photo_urls: string[] | null
          pickup_address: string
          pickup_date: string
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_place_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          weight: number | null
          width: number | null
        }
        Insert: {
          cargo_type: string
          client_id: string
          client_price?: number | null
          created_at?: string
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_place_id?: string | null
          description?: string | null
          height?: number | null
          id?: string
          length?: number | null
          photo_urls?: string[] | null
          pickup_address: string
          pickup_date: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          cargo_type?: string
          client_id?: string
          client_price?: number | null
          created_at?: string
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_place_id?: string | null
          description?: string | null
          height?: number | null
          id?: string
          length?: number | null
          photo_urls?: string[] | null
          pickup_address?: string
          pickup_date?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          max_attempts: number | null
          phone: string | null
          telegram_chat_id: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          max_attempts?: number | null
          phone?: string | null
          telegram_chat_id?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number | null
          phone?: string | null
          telegram_chat_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      partner_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string | null
          request_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string | null
          request_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string | null
          request_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          id: string
          is_active: boolean | null
          partner_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          partner_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          partner_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_webhooks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partner_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          card_number: string
          created_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          plan_id: string
          plan_name: string
          processed_at: string | null
          processed_by: string | null
          status: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          card_number: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id: string
          plan_name: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          card_number?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id?: string
          plan_name?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_income: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      price_negotiations: {
        Row: {
          created_at: string
          id: string
          message: string | null
          order_id: string
          proposed_by: string
          proposed_price: number
          response_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          order_id: string
          proposed_by: string
          proposed_price: number
          response_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string
          proposed_by?: string
          proposed_price?: number
          response_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_negotiations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_negotiations_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          description: string | null
          height: number | null
          id: string
          length: number | null
          min_stock_level: number | null
          name: string
          qr_code: string | null
          sku: string
          updated_at: string
          weight: number | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          length?: number | null
          min_stock_level?: number | null
          name: string
          qr_code?: string | null
          sku: string
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          length?: number | null
          min_stock_level?: number | null
          name?: string
          qr_code?: string | null
          sku?: string
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          address: string | null
          auth_method: string | null
          avatar_url: string | null
          balance: number | null
          carrier_type: Database["public"]["Enums"]["carrier_type"] | null
          company_name: string | null
          created_at: string
          date_of_birth: string | null
          device_fingerprint: string | null
          email: string | null
          email_verified: boolean | null
          firebase_uid: string | null
          fraud_score: number | null
          frozen_balance: number | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          last_ip: string | null
          last_login_at: string | null
          locked_until: string | null
          login_attempts: number | null
          passport_number_hash: string | null
          passport_series: string | null
          phone: string | null
          phone_verified: boolean | null
          referral_code: string | null
          role: string | null
          subscription_plan: string | null
          telegram_id: number | null
          telegram_username: string | null
          telegram_verified: boolean | null
          telegram_verified_at: string | null
          updated_at: string
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          account_status?: string | null
          address?: string | null
          auth_method?: string | null
          avatar_url?: string | null
          balance?: number | null
          carrier_type?: Database["public"]["Enums"]["carrier_type"] | null
          company_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          device_fingerprint?: string | null
          email?: string | null
          email_verified?: boolean | null
          firebase_uid?: string | null
          fraud_score?: number | null
          frozen_balance?: number | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_ip?: string | null
          last_login_at?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          passport_number_hash?: string | null
          passport_series?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          role?: string | null
          subscription_plan?: string | null
          telegram_id?: number | null
          telegram_username?: string | null
          telegram_verified?: boolean | null
          telegram_verified_at?: string | null
          updated_at?: string
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          account_status?: string | null
          address?: string | null
          auth_method?: string | null
          avatar_url?: string | null
          balance?: number | null
          carrier_type?: Database["public"]["Enums"]["carrier_type"] | null
          company_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          device_fingerprint?: string | null
          email?: string | null
          email_verified?: boolean | null
          firebase_uid?: string | null
          fraud_score?: number | null
          frozen_balance?: number | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_ip?: string | null
          last_login_at?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          passport_number_hash?: string | null
          passport_series?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          role?: string | null
          subscription_plan?: string | null
          telegram_id?: number | null
          telegram_username?: string | null
          telegram_verified?: boolean | null
          telegram_verified_at?: string | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_weight: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_weight?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_weight?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      promo_usages: {
        Row: {
          created_at: string
          discount_applied: number
          id: string
          order_id: string | null
          promo_code_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_applied: number
          id?: string
          order_id?: string | null
          promo_code_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_applied?: number
          id?: string
          order_id?: string | null
          promo_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_usages_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          deal_id: string
          id: string
          rated_id: string
          rater_id: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          deal_id: string
          id?: string
          rated_id: string
          rater_id: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          rated_id?: string
          rater_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "active_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          notes: string | null
          order_id: string | null
          product_id: string | null
          quantity_expected: number
          quantity_received: number | null
          received_by: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          order_id?: string | null
          product_id?: string | null
          quantity_expected: number
          quantity_received?: number | null
          received_by?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          order_id?: string | null
          product_id?: string | null
          quantity_expected?: number
          quantity_received?: number | null
          received_by?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receiving_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_paid: boolean | null
          bonus_paid_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_paid?: boolean | null
          bonus_paid_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_paid?: boolean | null
          bonus_paid_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      registration_requests: {
        Row: {
          business_type: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email_verification_token: string | null
          email_verified: boolean | null
          email_verified_at: string | null
          id: string
          onboarding_step: number | null
          privacy_accepted: boolean | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["registration_status"]
          terms_accepted: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_type?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email_verification_token?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          id?: string
          onboarding_step?: number | null
          privacy_accepted?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          terms_accepted?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_type?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email_verification_token?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          id?: string
          onboarding_step?: number | null
          privacy_accepted?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          terms_accepted?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          carrier_id: string
          comment: string | null
          created_at: string
          delivery_time: string | null
          id: string
          is_accepted: boolean | null
          order_id: string
          price: number
        }
        Insert: {
          carrier_id: string
          comment?: string | null
          created_at?: string
          delivery_time?: string | null
          id?: string
          is_accepted?: boolean | null
          order_id: string
          price: number
        }
        Update: {
          carrier_id?: string
          comment?: string | null
          created_at?: string
          delivery_time?: string | null
          id?: string
          is_accepted?: boolean | null
          order_id?: string
          price?: number
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          description: string | null
          device_fingerprint: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          device_fingerprint?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          device_fingerprint?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shipping: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          location_id: string | null
          notes: string | null
          picked_by: string | null
          product_id: string | null
          quantity_picked: number | null
          quantity_requested: number
          quantity_shipped: number | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          picked_by?: string | null
          product_id?: string | null
          quantity_picked?: number | null
          quantity_requested: number
          quantity_shipped?: number | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          picked_by?: string | null
          product_id?: string | null
          quantity_picked?: number | null
          quantity_requested?: number
          quantity_shipped?: number | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "active_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          price_monthly: number
          price_yearly: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      telegram_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used_at?: string | null
        }
        Relationships: []
      }
      telegram_registrations: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string
          role: string | null
          step: string
          telegram_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone: string
          role?: string | null
          step?: string
          telegram_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string
          role?: string | null
          step?: string
          telegram_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          created_at: string | null
          id: string
          is_verified: boolean | null
          phone: string | null
          telegram_first_name: string | null
          telegram_id: string
          telegram_last_name: string | null
          telegram_username: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          telegram_first_name?: string | null
          telegram_id: string
          telegram_last_name?: string | null
          telegram_username?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          telegram_first_name?: string | null
          telegram_id?: string
          telegram_last_name?: string | null
          telegram_username?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_verifications: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          telegram_id: number | null
          verified: boolean
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          telegram_id?: number | null
          verified?: boolean
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          telegram_id?: number | null
          verified?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          auth_method: string | null
          created_at: string
          firebase_uid: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          auth_method?: string | null
          created_at?: string
          firebase_uid?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          auth_method?: string | null
          created_at?: string
          firebase_uid?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payme_subscription_id: string | null
          plan_id: string
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payme_subscription_id?: string | null
          plan_id: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payme_subscription_id?: string | null
          plan_id?: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string
          city: string | null
          code: string
          country: string | null
          created_at: string
          id: string
          manager_id: string | null
          name: string
          status: Database["public"]["Enums"]["warehouse_status"]
          total_area: number | null
          updated_at: string
        }
        Insert: {
          address: string
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          status?: Database["public"]["Enums"]["warehouse_status"]
          total_area?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          status?: Database["public"]["Enums"]["warehouse_status"]
          total_area?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          capacity: number | null
          code: string
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["zone_status"]
          updated_at: string
          warehouse_id: string
          zone_type: string
        }
        Insert: {
          capacity?: number | null
          code: string
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["zone_status"]
          updated_at?: string
          warehouse_id: string
          zone_type: string
        }
        Update: {
          capacity?: number | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["zone_status"]
          updated_at?: string
          warehouse_id?: string
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_deals: {
        Row: {
          agreed_price: number | null
          cargo_type: string | null
          carrier_email: string | null
          carrier_id: string | null
          carrier_name: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          completed_at: string | null
          created_at: string | null
          delivery_address: string | null
          id: string | null
          order_id: string | null
          order_price: number | null
          pickup_address: string | null
          proof_photo_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["deal_status"] | null
          updated_at: string | null
          weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_statistics: {
        Row: {
          active_deals: number | null
          avg_deal_price: number | null
          carrier_id: string | null
          completed_deals: number | null
          completion_rate: number | null
          total_deals: number | null
          total_earnings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_codes: { Args: never; Returns: undefined }
      cleanup_old_gps_data: { Args: { days_to_keep?: number }; Returns: number }
      generate_document_number: {
        Args: { _type: Database["public"]["Enums"]["document_type"] }
        Returns: string
      }
      get_admin_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_carrier_stats: {
        Args: { carrier_user_id: string }
        Returns: {
          active_deals: number
          avg_deal_price: number
          avg_rating: number
          completed_deals: number
          completion_rate: number
          total_deals: number
          total_earnings: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_text: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_warehouse_by_location: {
        Args: { _location_id: string }
        Returns: {
          warehouse_id: string
          warehouse_name: string
          zone_id: string
          zone_name: string
        }[]
      }
      has_admin_permission: {
        Args: { p_permission: string; p_user_id: string }
        Returns: boolean
      }
      has_document_access: {
        Args: { _document_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_text: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_wms_role: {
        Args: { _required_role: string; _user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_ip_address?: string
          p_new_data?: Json
          p_old_data?: Json
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_inventory_after_movement: {
        Args: {
          _from_location_id: string
          _movement_type: Database["public"]["Enums"]["movement_type"]
          _product_id: string
          _quantity: number
          _to_location_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      admin_role: "super_admin" | "manager" | "operator" | "auditor"
      app_role:
        | "client"
        | "carrier"
        | "admin"
        | "warehouse_manager"
        | "storekeeper"
      barcode_type: "product" | "location" | "pallet" | "package"
      carrier_type: "driver" | "company"
      deal_status:
        | "pending"
        | "accepted"
        | "in_transit"
        | "delivered"
        | "cancelled"
      document_status: "draft" | "pending" | "approved" | "final" | "cancelled"
      document_type:
        | "order_confirmation"
        | "shipping_manifest"
        | "receiving_report"
        | "inventory_report"
        | "warehouse_receipt"
        | "delivery_note"
        | "invoice"
        | "customs_declaration"
      kyc_status:
        | "not_started"
        | "pending"
        | "verified"
        | "rejected"
        | "manual_review"
      location_status: "available" | "occupied" | "reserved" | "blocked"
      movement_type: "inbound" | "outbound" | "transfer" | "adjustment"
      order_status: "open" | "in_progress" | "completed" | "cancelled"
      registration_status:
        | "pending"
        | "approved"
        | "rejected"
        | "resubmission_required"
      warehouse_status: "active" | "inactive" | "maintenance"
      zone_status: "active" | "inactive" | "full"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_role: ["super_admin", "manager", "operator", "auditor"],
      app_role: [
        "client",
        "carrier",
        "admin",
        "warehouse_manager",
        "storekeeper",
      ],
      barcode_type: ["product", "location", "pallet", "package"],
      carrier_type: ["driver", "company"],
      deal_status: [
        "pending",
        "accepted",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      document_status: ["draft", "pending", "approved", "final", "cancelled"],
      document_type: [
        "order_confirmation",
        "shipping_manifest",
        "receiving_report",
        "inventory_report",
        "warehouse_receipt",
        "delivery_note",
        "invoice",
        "customs_declaration",
      ],
      kyc_status: [
        "not_started",
        "pending",
        "verified",
        "rejected",
        "manual_review",
      ],
      location_status: ["available", "occupied", "reserved", "blocked"],
      movement_type: ["inbound", "outbound", "transfer", "adjustment"],
      order_status: ["open", "in_progress", "completed", "cancelled"],
      registration_status: [
        "pending",
        "approved",
        "rejected",
        "resubmission_required",
      ],
      warehouse_status: ["active", "inactive", "maintenance"],
      zone_status: ["active", "inactive", "full"],
    },
  },
} as const
