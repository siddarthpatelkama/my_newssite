-- Sample records for local UI work. Safe to skip in production.

insert into public.newsletters (id, sender_email, sender_name)
values
  ('11111111-1111-1111-1111-111111111111', 'editors@example-intel.test', 'Example Intel'),
  ('22222222-2222-2222-2222-222222222222', 'briefing@example-lab.test', 'Example Lab')
on conflict (sender_email) do nothing;
