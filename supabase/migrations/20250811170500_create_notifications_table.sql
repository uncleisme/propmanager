create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  module text not null,
  action text not null,
  entity_id uuid,
  message text,
  created_at timestamp with time zone default now(),
  is_read boolean default false,
  recipients uuid[] not null
);

-- Create indexes for better performance
create index idx_notifications_recipients on notifications using gin(recipients);
create index idx_notifications_created_at on notifications(created_at desc);
create index idx_notifications_module on notifications(module);
create index idx_notifications_is_read on notifications(is_read);
