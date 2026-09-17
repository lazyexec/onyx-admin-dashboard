import { createAdminClient } from '../supabase/server';
import { sendFcmNotification } from './fcm';

type DispatchResult = {
  campaignId: string;
  recipients: number;
  inAppCreated: number;
  pushSent: number;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
};

function isMissingTable(error: any) {
  return error?.code === '42P01' || /does not exist|schema cache/i.test(error?.message ?? '');
}

function wantsInApp(channel: string | null | undefined) {
  return channel === 'in_app' || channel === 'all';
}

function wantsPush(channel: string | null | undefined) {
  return channel === 'push' || channel === 'all';
}

export async function dispatchCampaign(supabaseAdmin: any, campaignId: string): Promise<DispatchResult> {
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('admin_notification_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    return {
      campaignId,
      recipients: 0,
      inAppCreated: 0,
      pushSent: 0,
      status: 'failed',
      error: campaignError?.message ?? 'Campaign not found',
    };
  }

  const { data: deliveries, error: deliveriesError } = await supabaseAdmin
    .from('admin_notification_deliveries')
    .select('id,user_id')
    .eq('campaign_id', campaignId)
    .in('status', ['queued', 'scheduled'])
    .limit(10000);

  if (deliveriesError) {
    return {
      campaignId,
      recipients: 0,
      inAppCreated: 0,
      pushSent: 0,
      status: 'failed',
      error: deliveriesError.message,
    };
  }

  const rows = deliveries ?? [];
  if (!rows.length) {
    await supabaseAdmin
      .from('admin_notification_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    return { campaignId, recipients: 0, inAppCreated: 0, pushSent: 0, status: 'sent' };
  }

  await supabaseAdmin
    .from('admin_notification_campaigns')
    .update({ status: 'sending' })
    .eq('id', campaignId);

  let inAppCreated = 0;
  let pushSent = 0;
  const now = new Date().toISOString();

  if (wantsInApp(campaign.channel)) {
    const notificationRows = rows.map((row: any) => ({
      campaign_id: campaignId,
      user_id: row.user_id,
      title: campaign.title,
      subtitle: campaign.subtitle,
      message: campaign.message,
      image_url: campaign.image_url,
      deep_link: campaign.deep_link,
      cta_label: campaign.cta_label,
      promo_code: campaign.promo_code,
      priority: campaign.priority,
      created_at: now,
    }));

    const { error } = await supabaseAdmin
      .from('user_notifications')
      .upsert(notificationRows, { onConflict: 'campaign_id,user_id', ignoreDuplicates: true });

    if (error && !isMissingTable(error)) {
      await supabaseAdmin
        .from('admin_notification_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
      return { campaignId, recipients: rows.length, inAppCreated, pushSent, status: 'failed', error: error.message };
    }

    if (!error) inAppCreated = notificationRows.length;
  }

  if (wantsPush(campaign.channel)) {
    const userIds = rows.map((row: any) => row.user_id);
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, endpoint, platform')
      .in('user_id', userIds);

    if (error && !isMissingTable(error)) {
      await supabaseAdmin
        .from('admin_notification_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
      return { campaignId, recipients: rows.length, inAppCreated, pushSent, status: 'failed', error: error.message };
    }

    for (const subscription of subscriptions ?? []) {
      if (!subscription.endpoint || String(subscription.endpoint).startsWith('http')) continue;

      const result = await sendFcmNotification({
        token: subscription.endpoint,
        title: campaign.title,
        body: campaign.message,
        imageUrl: campaign.image_url,
        data: {
          url: campaign.deep_link || '/my-library',
          campaignId,
        },
      });

      if (result.success) pushSent++;
    }
  }

  const deliveryIds = rows.map((row: any) => row.id);
  await supabaseAdmin
    .from('admin_notification_deliveries')
    .update({ status: 'sent', sent_at: now })
    .in('id', deliveryIds);

  await supabaseAdmin
    .from('admin_notification_campaigns')
    .update({ status: 'sent', sent_at: now })
    .eq('id', campaignId);

  return {
    campaignId,
    recipients: rows.length,
    inAppCreated,
    pushSent,
    status: 'sent',
  };
}

export async function dispatchDueNotifications(limit = 20) {
  const supabaseAdmin = await createAdminClient();
  const now = new Date().toISOString();

  const { data: campaigns, error } = await supabaseAdmin
    .from('admin_notification_campaigns')
    .select('id')
    .in('status', ['ready', 'scheduled'])
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return { error: error.message, processed: 0, results: [] as DispatchResult[] };
  }

  const results: DispatchResult[] = [];
  for (const campaign of campaigns ?? []) {
    results.push(await dispatchCampaign(supabaseAdmin, campaign.id));
  }

  return { processed: results.length, results };
}
