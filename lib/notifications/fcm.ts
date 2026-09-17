import crypto from 'node:crypto';
import { env } from 'cloudflare:workers';

type FcmPayload = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string | null;
};

type FirebaseCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function firebaseCredentials(): FirebaseCredentials | null {
  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 300) return cachedToken.accessToken;

  const creds = firebaseCredentials();
  if (!creds) return null;

  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  const unsignedToken = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: creds.clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();

  const assertion = `${unsignedToken}.${signer.sign(creds.privateKey, 'base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { access_token: string; expires_in?: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600),
  };
  return cachedToken.accessToken;
}

export async function sendFcmNotification(payload: FcmPayload) {
  const creds = firebaseCredentials();
  if (!creds) return { success: false, error: 'Firebase credentials are not configured.' };

  const accessToken = await getAccessToken();
  if (!accessToken) return { success: false, error: 'Could not create Firebase access token.' };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${creds.projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: payload.token,
          notification: {
            title: payload.title,
            body: payload.body,
            ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
          },
          data: payload.data ?? {},
          android: {
            priority: 'high',
            notification: { channel_id: 'default' },
          },
          apns: {
            payload: {
              aps: {
                alert: { title: payload.title, body: payload.body },
                sound: 'default',
              },
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  return { success: true };
}
