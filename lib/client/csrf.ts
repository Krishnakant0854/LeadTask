let cachedToken: string | null = null;

export async function getClientCsrfToken() {
  if (cachedToken) return cachedToken;

  const response = await fetch("/api/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to initialize secure form token");
  }

  const data = (await response.json()) as { token: string };
  cachedToken = data.token;
  return cachedToken;
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getClientCsrfToken();
  const headers = new Headers(init.headers);
  headers.set("x-csrf-token", token);

  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin"
  });
}
