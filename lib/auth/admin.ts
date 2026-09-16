import { createAdminClient, createClient } from '../supabase/server';

export async function getCurrentAdminUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  const supabaseAdmin = await createAdminClient();
  const { data: role, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError || !role) {
    return null;
  }

  return data.user;
}

export async function requireAdminUser() {
  const user = await getCurrentAdminUser();
  if (!user) {
    throw new Error('Admin access required.');
  }
  return user;
}
