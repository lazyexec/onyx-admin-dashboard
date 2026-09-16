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
  const url = new URL(request.url);
  const authError = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (authError) {
    const redirectUrl = new URL("/login", url.origin);
    redirectUrl.searchParams.set("error", authError);
    return browserRedirect(redirectUrl.toString());
  }

  const confirmUrl = new URL("/auth/confirm", url.origin);
  for (const [key, value] of url.searchParams) {
    confirmUrl.searchParams.set(key, value);
  }

  if (!confirmUrl.searchParams.has("code")) {
    const redirectUrl = new URL("/login", url.origin);
    redirectUrl.searchParams.set("error", "No authorization code received");
    return browserRedirect(redirectUrl.toString());
  }

  return browserRedirect(confirmUrl.toString());
}
