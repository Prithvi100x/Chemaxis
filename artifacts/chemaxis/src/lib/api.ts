const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function requestMaybeNull<T>(path: string, opts: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
      credentials: "include",
      ...opts,
    });
    if (res.status === 401 || res.status === 403 || res.status === 502 || res.status === 503) return null;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function downloadFile(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  const disposition = res.headers.get("Content-Disposition");
  const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? "chemaxis-report.pdf";
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export type User = { id: string; name: string; email: string; company?: string };
export type Report = {
  id: string; title: string; description: string; category: string;
  sourceLanguage: string; priceCents: number; tags: string[] | null;
  pageCount: number; sampleContent: Record<string, unknown> | null;
  createdAt: string; purchased?: boolean;
};
export type ReportMetrics = {
  generationMs?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  retryCount?: number;
  modelUsed?: string | null;
};
export type GeneratedReport = {
  id: string; reportId: string; targetLanguage: string; status: string;
  customNotes?: string; content?: { raw: string; sections: Record<string, string>; reportTitle: string; targetLanguage: string; generatedAt: string } | null;
  createdAt: string; reportTitle?: string; reportCategory?: string;
  metrics?: ReportMetrics | null;
};
export type Purchase = { id: string; reportId: string; amountCents: number; status: string; createdAt: string; reportTitle?: string };

export const api = {
  auth: {
    me: () => requestMaybeNull<User>("/auth/me"),
    login: (email: string, password: string) => request<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (name: string, email: string, password: string, company?: string) =>
      request<User>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, company }) }),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  },
  reports: {
    list: () => request<Report[]>("/reports"),
    get: (id: string) => request<Report>(`/reports/${id}`),
  },
  generate: {
    start: (reportId: string, targetLanguage: string, customNotes?: string) =>
      request<{ id: string; status: string }>(`/reports/${reportId}/generate`, {
        method: "POST", body: JSON.stringify({ targetLanguage, customNotes }),
      }),
    get: (id: string) => request<GeneratedReport>(`/generated/${id}`),
    myReports: () => request<GeneratedReport[]>("/my-reports"),
    download: (id: string) => downloadFile(`/generated/${id}/download`),
  },
  purchase: {
    buy: (reportId: string, generatedReportId?: string) =>
      request<{ ok: boolean; purchaseId: string; alreadyOwned: boolean }>("/purchase", {
        method: "POST", body: JSON.stringify({ reportId, generatedReportId }),
      }),
    list: () => request<Purchase[]>("/purchases"),
  },
  seed: () => requestMaybeNull<{ ok: boolean; message: string }>("/seed", { method: "POST" }),
};
