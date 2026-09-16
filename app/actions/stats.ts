'use server';

import { createAdminClient } from '../../lib/supabase/server';
import { requireAdminUser } from '../../lib/auth/admin';

type StatStatus = 'ok' | 'missing' | 'error';

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
  status: StatStatus;
};

export type DashboardStats = {
  cards: DashboardStat[];
  generatedAt: string;
};

function moneyFromCents(cents: number, currency = 'BRL') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function isMissingTable(error: any) {
  return error?.code === '42P01' || /does not exist|schema cache/i.test(error?.message ?? '');
}

function card(label: string, value: string, detail: string, status: StatStatus = 'ok'): DashboardStat {
  return { label, value, detail, status };
}

async function countRows(client: any, table: string, label: string, detail: string) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  if (!error) return card(label, String(count ?? 0), detail);
  if (isMissingTable(error)) return card(label, '-', `${table} table not found`, 'missing');
  return card(label, '-', error.message, 'error');
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    await requireAdminUser();
    const supabaseAdmin = await createAdminClient();

    const [users, pushTargets, subscriptions, campaigns] = await Promise.all([
      countRows(supabaseAdmin, 'profiles', 'Users', 'Registered profiles'),
      countRows(supabaseAdmin, 'push_subscriptions', 'Push targets', 'Devices opted into reminders'),
      supabaseAdmin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trialing']),
      countRows(supabaseAdmin, 'admin_notification_campaigns', 'Campaigns', 'Promotions created from admin'),
    ]);

    let activeMembers: DashboardStat;
    if (!subscriptions.error) {
      activeMembers = card('Active members', String(subscriptions.count ?? 0), 'Active or trialing subscriptions');
    } else if (isMissingTable(subscriptions.error)) {
      activeMembers = card('Active members', '-', 'subscriptions table not found', 'missing');
    } else {
      activeMembers = card('Active members', '-', subscriptions.error.message, 'error');
    }

    const { data: purchases, error: purchasesError } = await supabaseAdmin
      .from('purchases')
      .select('amount_cents,currency,created_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    let revenue = card('Revenue', '-', 'purchases table not found', 'missing');
    let paidOrders = card('Paid orders', '-', 'purchases table not found', 'missing');
    if (!purchasesError) {
      const rows = purchases ?? [];
      const cents = rows.reduce((sum: number, row: any) => sum + Number(row.amount_cents ?? 0), 0);
      const currency = rows.find((row: any) => row.currency)?.currency ?? 'BRL';
      revenue = card('Revenue', moneyFromCents(cents, currency), `From ${rows.length} purchase rows`);
      paidOrders = card('Paid orders', String(rows.length), 'Program, plan, and bundle unlocks');
    } else if (!isMissingTable(purchasesError)) {
      revenue = card('Revenue', '-', purchasesError.message, 'error');
      paidOrders = card('Paid orders', '-', purchasesError.message, 'error');
    }

    return {
      generatedAt: new Date().toISOString(),
      cards: [users, activeMembers, revenue, paidOrders, pushTargets, campaigns],
    };
  } catch (error: any) {
    return {
      generatedAt: new Date().toISOString(),
      cards: [card('Dashboard status', 'Offline', error?.message ?? 'Could not read admin stats', 'error')],
    };
  }
}
