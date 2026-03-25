-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.handover (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  share_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'created'::text, 'received'::text, 'accepted'::text])),
  sender_name text,
  receiver_target_name text,
  receiver_target_phone text,
  receiver_target_email text,
  created_at timestamp with time zone DEFAULT now(),
  received_at timestamp with time zone,
  delegate_notified boolean DEFAULT false,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  receipt_url text,
  receipt_generated_at timestamp without time zone,
  receipt_status text DEFAULT 'pending'::text,
  tenant_id text NOT NULL DEFAULT 'public'::text,
  destination_lat numeric,
  destination_lng numeric,
  destination_address text,
  destination_city text,
  destination_postal_code text,
  sender_address_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  record_status text NOT NULL DEFAULT 'active'::text CHECK (record_status = ANY (ARRAY['active'::text, 'archived'::text])),
  user_id uuid NOT NULL,
  serial_number text,
  notes text,
  receiver_whatsapp text,
  receiver_contact text,
  receiver_email text,
  CONSTRAINT handover_pkey PRIMARY KEY (id),
  CONSTRAINT handover_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenant(id),
  CONSTRAINT handover_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.handover_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  handover_id uuid NOT NULL,
  description text NOT NULL,
  photo_url text,
  CONSTRAINT handover_items_pkey PRIMARY KEY (id),
  CONSTRAINT handover_items_handover_id_fkey FOREIGN KEY (handover_id) REFERENCES public.handover(id)
);
CREATE TABLE public.handover_serial_counter (
  user_id uuid NOT NULL,
  yymm text NOT NULL,
  last_seq integer NOT NULL DEFAULT 0,
  CONSTRAINT handover_serial_counter_pkey PRIMARY KEY (user_id, yymm),
  CONSTRAINT handover_serial_counter_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  user_type USER-DEFINED NOT NULL DEFAULT 'personal'::user_type_enum,
  company_name text,
  company_logo_url text,
  updated_at timestamp with time zone DEFAULT now(),
  display_name text,
  company_address text,
  onboarded_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.receive_event (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  handover_id uuid NOT NULL UNIQUE,
  receiver_name text,
  receiver_relation text,
  receive_method text NOT NULL CHECK (receive_method = ANY (ARRAY['direct_qr'::text, 'direct_photo'::text, 'proxy_qr'::text, 'proxy_photo'::text, 'GPS'::text])),
  photo_url text,
  device_id text,
  receiver_type text CHECK (receiver_type = ANY (ARRAY['direct'::text, 'proxy'::text])),
  gps_lat numeric,
  gps_lng numeric,
  gps_accuracy numeric,
  tenant_id text NOT NULL DEFAULT 'public'::text,
  received_at timestamp without time zone DEFAULT now(),
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  address text,
  distance_m integer,
  is_valid boolean,
  device_model text,
  CONSTRAINT receive_event_pkey PRIMARY KEY (id),
  CONSTRAINT receive_event_handover_id_fkey FOREIGN KEY (handover_id) REFERENCES public.handover(id),
  CONSTRAINT receive_event_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenant(id)
);
CREATE TABLE public.tenant (
  id text NOT NULL,
  name text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  logo_url text,
  display_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT tenant_pkey PRIMARY KEY (id)
);