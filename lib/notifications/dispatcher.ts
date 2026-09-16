import { createAdminClient } from '../supabase/server';

type DispatchResult = {
  campaignId: string;
  recipients: number;
  inAppCreated: number;
  pushQueued: number;
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
      pushQueued: 0,
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
      pushQueued: 0,
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

    return { campaignId, recipients: 0, inAppCreated: 0, pushQueued: 0, status: 'sent' };
  }

  await supabaseAdmin
    .from('admin_notification_campaigns')
    .update({ status: 'sending' })
    .eq('id', campaignId);

  let inAppCreated = 0;
  let pushQueued = 0;
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
      return { campaignId, recipients: rows.length, inAppCreated, pushQueued, status: 'failed', error: error.message };
    }

    if (!error) inAppCreated = notificationRows.length;
  }

  if (wantsPush(campaign.channel)) {
    const pushRows = rows.map((row: any) => ({
      campaign_id: campaignId,
      user_id: row.user_id,
      title: campaign.title,
      message: campaign.message,
      image_url: campaign.image_url,
      deep_link: campaign.deep_link,
      priority: campaign.priority,
      status: 'queued',
      created_at: now,
    }));

    const { error } = await supabaseAdmin
      .from('admin_notification_push_outbox')
      .upsert(pushRows, { onConflict: 'campaign_id,user_id', ignoreDuplicates: true });

    if (error && !isMissingTable(error)) {
      await supabaseAdmin
        .from('admin_notification_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
      return { campaignId, recipients: rows.length, inAppCreated, pushQueued, status: 'failed', error: error.message };
    }

    if (!error) pushQueued = pushRows.length;
  }

  const deliveryIds = rows.map((row: any) => row.id);
  await supabaseAdmin
    .from('admin_notification_deliveries')
    .update({ status: 'sent', sent_at: now })
    .in('id', deliveryIds);

  await supabaseAdmin
    .from('admin_notification_campaigns')
    .update({ status: pushQueued > 0 && inAppCreated === 0 ? 'sent' : 'sent', sent_at: now })
    .eq('id', campaignId);

  return {
    campaignId,
    recipients: rows.length,
    inAppCreated,
    pushQueued,
    status: pushQueued > 0 && inAppCreated === 0 ? 'queued' : 'sent',
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
