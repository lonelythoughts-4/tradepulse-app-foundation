import type { ActionKey } from "./desk-types";
import { localizeApiError, type LanguageCode } from "./desk-i18n";

export class DeskApiError extends Error {
  readonly status: number;
  readonly reference?: string;
  readonly responseMessage: string;

  constructor(
    message: string,
    status: number,
    reference?: string,
    responseMessage = message,
  ) {
    super(message);
    this.name = "DeskApiError";
    this.status = status;
    this.reference = reference;
    this.responseMessage = responseMessage;
  }

  localizedMessage(language: LanguageCode): string {
    return localizeApiError(
      language,
      this.responseMessage,
      this.status,
      this.reference,
    );
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
      const responseMessage = typeof payload === "object" && payload && "error" in payload
        ? String(payload.error)
        : "";
      const message = responseMessage || "The requested action could not be completed.";
      const reference = typeof payload === "object" && payload && "request_id" in payload
        ? String(payload.request_id)
        : response.headers.get("x-tradepulse-request-id") || undefined;
      throw new DeskApiError(message, response.status, reference, responseMessage);
    }

    return payload as T;
  }
}
