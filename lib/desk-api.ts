import type { ActionKey } from "./desk-types";

export class DeskApiError extends Error {
  readonly status: number;
  readonly reference?: string;
  readonly responseMessage: string;
  readonly responseBody: unknown;

  constructor(
    message: string,
    status: number,
    reference?: string,
    responseMessage = message,
    responseBody?: unknown,
  ) {
    super("");
    this.name = "DeskApiError";
    this.status = status;
    this.reference = reference;
    this.responseMessage = responseMessage;
    this.responseBody = responseBody;
  }
}

export const DASHBOARD_REQUEST_TIMEOUT_MS = 8_000;
export const DASHBOARD_MAX_TRANSIENT_RETRIES = 1;

export function isRetryableDashboardReadError(error: unknown): boolean {
  return (
    (error instanceof DeskApiError && error.status === 503) ||
    (error instanceof Error && (error.name === "TimeoutError" || error.name === "NetworkError"))
  );
}

export function shouldRetryDashboardRead(error: unknown, retriesSoFar: number): boolean {
  return retriesSoFar < DASHBOARD_MAX_TRANSIENT_RETRIES && isRetryableDashboardReadError(error);
}

export function logDeskFailure(operation: string, error: unknown): void {
  console.error("TradeMemo operation failed", {
    operation,
    status: error instanceof DeskApiError ? error.status : undefined,
    reference: error instanceof DeskApiError ? error.reference : undefined,
    errorType: error instanceof Error ? error.name : "UnknownError",
  });
}

export interface DeskApiMutation {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: "DELETE" | "PATCH" | "POST" | "PUT";
}

export class DeskApi {
  private readonly controllers = new Map<string, AbortController>();
  private readonly basePath: string;

  constructor(basePath = "/api") {
    this.basePath = basePath;
  }

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
    let response: Response;
    try {
      response = await fetch(`${this.basePath}${resource}`, {
        ...init,
        cache: "no-store",
        credentials: "same-origin",
      });
    } catch {
      if (init.signal?.aborted) throw new DOMException("", "AbortError");
      console.error("TradeMemo API transport failed", { resource });
      throw new Error("");
    }
    const contentType = response.headers.get("content-type") ?? "";
    let payload: unknown;
    try {
      payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    } catch (error) {
      if (init.signal?.aborted) throw new DOMException("", "AbortError");
      console.error("TradeMemo API response could not be read", {
        resource,
        status: response.status,
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      throw new Error("");
    }

    if (!response.ok) {
      const responseMessage = typeof payload === "object" && payload && "error" in payload
        ? String(payload.error)
        : "";
      const reference = typeof payload === "object" && payload && "request_id" in payload
        ? String(payload.request_id)
        : response.headers.get("x-tradepulse-request-id") || undefined;
      console.error("TradeMemo API request failed", {
        resource,
        status: response.status,
        requestId: reference,
      });
      throw new DeskApiError("", response.status, reference, responseMessage, payload);
    }

    return payload as T;
  }
}
