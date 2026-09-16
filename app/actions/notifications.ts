'use server';

import { createAdminClient } from '../../lib/supabase/server';

type Audience = 'all' | 'active_members' | 'push_enabled' | 'purchasers';
type Channel = 'push' | 'in_app' | 'banner' | 'all';

function clean(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length ? text : null;
}

function isMissingTable(error: any) {
  return error?.code === '42P01' || /does not exist|schema cache/i.test(error?.message ?? '');
}

async function getAudienceUsers(supabaseAdmin: any, audience: Audience) {
  if (audience === 'active_members') {
    return supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .in('status', ['active', 'trialing'])
      .limit(5000);
  }

  if (audience === 'push_enabled') {
    return supabaseAdmin
      .from('push_subscriptions')
      .select('user_id')
      .limit(5000);
  }

  if (audience === 'purchasers') {
    return supabaseAdmin
      .from('purchases')
      .select('user_id')
      .limit(5000);
  }

  return supabaseAdmin
    .from('profiles')
    .select('id')
    .limit(5000);
}

export async function sendNotification(formData: FormData) {
  const title = clean(formData.get('title'));
  const message = clean(formData.get('message'));
  const subtitle = clean(formData.get('subtitle'));
  const bannerUrl = clean(formData.get('bannerUrl'));
  const deepLink = clean(formData.get('deepLink'));
  const ctaLabel = clean(formData.get('ctaLabel'));
  const promoCode = clean(formData.get('promoCode'));
  const scheduledFor = clean(formData.get('scheduledFor'));
  const expiresAt = clean(formData.get('expiresAt'));
  const channel = (clean(formData.get('channel')) ?? 'all') as Channel;
  const audience = (clean(formData.get('audience')) ?? 'all') as Audience;
  const priority = clean(formData.get('priority')) ?? 'normal';

  if (!title || !message) {
    return { error: 'Title and message are required.' };
  }

  const supabaseAdmin = await createAdminClient();
  const audienceResult = await getAudienceUsers(supabaseAdmin, audience);

  if (audienceResult.error) {
    return { error: `Could not load ${audience.replace('_', ' ')} audience: ${audienceResult.error.message}` };
  }

  const ids = new Set<string>();
  for (const row of audienceResult.data ?? []) {
    const id = (row as any).id ?? (row as any).user_id;
    if (id) ids.add(id);
  }

  const payload = {
    title,
    message,
    subtitle,
    banner_url: bannerUrl,
    deep_link: deepLink,
    cta_label: ctaLabel,
    promo_code: promoCode,
    channel,
    audience,
    priority,
    status: scheduledFor ? 'scheduled' : 'ready',
    scheduled_for: scheduledFor,
    expires_at: expiresAt,
    recipient_count: ids.size,
    created_at: new Date().toISOString(),
  };

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('admin_notification_campaigns')
    .insert(payload)
    .select('id')
    .single();

  if (campaignError) {
    if (isMissingTable(campaignError)) {
      return {
        error: 'Notification tables are not installed yet. Run the base repo migration supabase/migrations/20260916170000_admin_notification_campaigns.sql, then try again.',
      };
    }
    return { error: campaignError.message };
  }

  if (campaign?.id && ids.size) {
    const deliveries = Array.from(ids).map((userId) => ({
      campaign_id: campaign.id,
      user_id: userId,
      status: scheduledFor ? 'scheduled' : 'queued',
    }));

    const { error: deliveryError } = await supabaseAdmin
      .from('admin_notification_deliveries')
      .insert(deliveries);

    if (deliveryError && !isMissingTable(deliveryError)) {
      return { error: `Campaign saved, but delivery rows failed: ${deliveryError.message}` };
    }
  }

  return {
    success: true,
    campaignId: campaign?.id,
    recipientCount: ids.size,
    scheduled: Boolean(scheduledFor),
  };
}
