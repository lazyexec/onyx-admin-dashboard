'use server';

import { createAdminClient } from '../../lib/supabase/server';
import { dispatchCampaign } from '../../lib/notifications/dispatcher';
import { requireAdminUser } from '../../lib/auth/admin';

type Audience = 'all' | 'active_members' | 'push_enabled' | 'purchasers';
type Channel = 'push' | 'in_app' | 'all';

const IMAGE_BUCKET = 'site-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

function clean(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length ? text : null;
}

function isMissingTable(error: any) {
  return error?.code === '42P01' || /does not exist|schema cache/i.test(error?.message ?? '');
}

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'notification';
}

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  if (file.type === 'image/avif') return 'avif';
  return 'jpg';
}

async function uploadNotificationImage(supabaseAdmin: any, file: File | null, title: string) {
  if (!file || file.size === 0) return { url: null as string | null };

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: 'Use a JPG, PNG, WebP, GIF, or AVIF image.' };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { error: 'Notification image must be 5 MB or smaller.' };
  }

  const path = `notifications/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFilePart(title)}.${extensionFor(file)}`;
  const { error } = await supabaseAdmin.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) {
    return { error: `Image upload failed: ${error.message}` };
  }

  const { data } = supabaseAdmin.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
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
  const imageFile = formData.get('imageFile') instanceof File ? formData.get('imageFile') as File : null;
  const deepLink = clean(formData.get('deepLink'));
  const ctaLabel = clean(formData.get('ctaLabel'));
  const promoCode = clean(formData.get('promoCode'));
  const scheduledFor = clean(formData.get('scheduledFor'));
  const channel = (clean(formData.get('channel')) ?? 'all') as Channel;
  const audience = (clean(formData.get('audience')) ?? 'all') as Audience;
  const priority = clean(formData.get('priority')) ?? 'normal';

  const adminUser = await requireAdminUser().catch(() => null);
  if (!adminUser) {
    return { error: 'Admin access required.' };
  }

  if (!title || !message) {
    return { error: 'Title and message are required.' };
  }

  const supabaseAdmin = await createAdminClient();
  const imageUpload = await uploadNotificationImage(supabaseAdmin, imageFile, title);
  if (imageUpload.error) {
    return { error: imageUpload.error };
  }

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
    image_url: imageUpload.url,
    deep_link: deepLink,
    cta_label: ctaLabel,
    promo_code: promoCode,
    channel,
    audience,
    priority,
    status: scheduledFor ? 'scheduled' : 'ready',
    scheduled_for: scheduledFor,
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

  let dispatched = null;
  if (!scheduledFor && campaign?.id) {
    dispatched = await dispatchCampaign(supabaseAdmin, campaign.id);
    if (dispatched.status === 'failed') {
      return { error: dispatched.error || 'Notification dispatch failed.' };
    }
  }

  return {
    success: true,
    campaignId: campaign?.id,
    recipientCount: ids.size,
    scheduled: Boolean(scheduledFor),
    inAppCreated: dispatched?.inAppCreated ?? 0,
    pushQueued: dispatched?.pushSent ?? 0,
    pushSent: dispatched?.pushSent ?? 0,
  };
}
