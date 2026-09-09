create or replace function public.cleanup_expired_auth_sessions()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.auth_sessions where expires_at <= now();
$$;

revoke all on function public.cleanup_expired_auth_sessions() from public;
