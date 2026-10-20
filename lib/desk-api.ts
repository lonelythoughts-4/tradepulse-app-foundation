import type { ActionKey } from "./desk-types";

export class DeskApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DeskApiError";
    this.status = status;
  }
}

export interface DeskApiMutation {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: "DELETE" | "PATCH" | "POST" | "PUT";
}

export class DeskApi {
  private readonly controllers = new Map<string, AbortController>();

  constructor(private readonly basePath = "/api") {}

  async getResource<T>(resource: string, signal?: AbortSignal): Promise<T> {
    this.controllers.get(resource)?.abort();
    const controller = new AbortController();
    this.controllers.set(resource, controller);
    const linkedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

    try {
      return await this.request<T>(resource, { signal: linkedSignal });
    } finally {
      if (this.controllers.get(resource) === controller) this.controllers.delete(resource);
    }
  }

  mutate<T>(resource: string, mutation: DeskApiMutation = {}): Promise<T> {
    return this.request<T>(resource, {
      body: mutation.body,
      headers: mutation.headers,
      method: mutation.method ?? "POST",
    });
  }

  actionKey(resourceId: string, action: string): ActionKey {
    return `${resourceId}:${action}`;
  }

  private async request<T>(resource: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.basePath}${resource}`, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
    });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text();

    if (!response.ok) {
      const message = typeof payload === "object" && payload && "error" in payload
        ? String(payload.error)
        : "The requested action could not be completed.";
      throw new DeskApiError(message, response.status);
    }

    return payload as T;
  }
}
