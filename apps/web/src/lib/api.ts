export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issues?: { path: string; message: string }[],
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch("/api" + path, {
    ...options,
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      "x-relaydesk-request": "1",
      ...options.headers,
    },
  });
  const body = await res
    .json()
    .catch(() => ({ error: "Sunucudan geçerli bir yanıt alınamadı." }));
  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    )
      window.dispatchEvent(new Event("relaydesk:unauthorized"));
    throw new ApiError(
      typeof body.error === "string" ? body.error : "İşlem tamamlanamadı.",
      res.status,
      body.issues,
    );
  }
  return body.data as T;
}
export const send = <T>(path: string, method: string, body: unknown) =>
  api<T>(path, { method, body: JSON.stringify(body) });
export const keys = {
  session: ["session"] as const,
  tickets: ["tickets"] as const,
  dashboard: ["dashboard"] as const,
  reference: ["reference"] as const,
  assets: ["assets"] as const,
  articles: ["articles"] as const,
  changes: ["changes"] as const,
  settings: ["settings"] as const,
};
