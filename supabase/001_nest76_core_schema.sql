-- =========================================
-- NEST76 CORE SCHEMA
-- Mode 0 Architecture
-- =========================================

-- enable uuid
create extension if not exists "uuid-ossp";



-- =========================================
-- TABLE: handover
-- =========================================

create table handover (

    id uuid primary key default uuid_generate_v4(),

    share_token text unique not null,

    status text not null default 'draft'
        check (status in ('draft','created','received')),

    sender_name text,

    receiver_target_name text,
    receiver_target_phone text,
    receiver_target_email text,

    created_at timestamptz default now(),
    received_at timestamptz

);



-- index for token lookup
create index idx_handover_share_token
on handover(share_token);



-- =========================================
-- TABLE: handover_items
-- =========================================

create table handover_items (

    id uuid primary key default uuid_generate_v4(),

    handover_id uuid not null
        references handover(id)
        on delete cascade,

    description text not null,

    photo_url text

);



create index idx_items_handover
on handover_items(handover_id);



-- =========================================
-- TABLE: receive_event
-- =========================================

create table receive_event (

    id uuid primary key default uuid_generate_v4(),

    handover_id uuid not null unique
        references handover(id)
        on delete cascade,

    receiver_name text,
    receiver_relation text,

    receive_method text not null
        check (
            receive_method in (
                'direct_qr',
                'direct_photo',
                'proxy_qr',
                'proxy_photo'
            )
        ),

    photo_proof text,

    device_id text,

    gps_location text,

    timestamp timestamptz default now()

);



-- =========================================
-- SAFETY TRIGGER
-- auto mark handover as received
-- =========================================

create or replace function mark_handover_received()
returns trigger as $$
begin

    update handover
    set
        status = 'received',
        received_at = now()
    where id = new.handover_id;

    return new;

end;
$$ language plpgsql;



create trigger trg_receive_event_update_handover
after insert on receive_event
for each row
execute function mark_handover_received();