import { env } from 'cloudflare:workers';
import { dispatchDueNotifications } from '../../../../lib/notifications/dispatcher';

function isAuthorized(request: Request) {
  const configured = env.NOTIFICATION_DISPATCH_SECRET;
  if (!configured) return false;
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${configured}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20) || 20, 100);
  const result = await dispatchDueNotifications(limit);
  return Response.json(result);
}
