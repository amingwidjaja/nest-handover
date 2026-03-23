-- Anti-Chaos: allow GPS as receive_method for location-only rows; optional proof columns
begin;

alter table receive_event
  drop constraint if exists receive_event_receive_method_check;

alter table receive_event
  add constraint receive_event_receive_method_check
  check (
    receive_method in (
      'direct_qr',
      'direct_photo',
      'proxy_qr',
      'proxy_photo',
      'GPS'
    )
  );

alter table receive_event add column if not exists address text;
alter table receive_event add column if not exists distance_m numeric;
alter table receive_event add column if not exists is_valid boolean;

commit;
