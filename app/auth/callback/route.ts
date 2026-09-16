import { createClient } from "../../../lib/supabase/server";

function browserRedirect(location: string) {
  const safeLocation = JSON.stringify(location);
  const escapedLocation = location.replace(/"/g, "&quot;");

  return new Response(
    `<!doctype html><meta http-equiv="refresh" content="0;url=${escapedLocation}"><script>window.location.replace(${safeLocation});</script>`,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error_description") || searchParams.get("error");

  if (authError) {
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", authError);
    return browserRedirect(redirectUrl.toString());
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (!isLocalEnv && forwardedHost) {
        return browserRedirect("https://" + forwardedHost + "/dashboard");
      }

      return browserRedirect(origin + "/dashboard");
    }

    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", error.message);
    return browserRedirect(redirectUrl.toString());
  }

  const redirectUrl = new URL("/login", origin);
  redirectUrl.searchParams.set("error", "No authorization code received");
  return browserRedirect(redirectUrl.toString());
}
